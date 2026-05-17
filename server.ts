import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";

// Load environment variables early
if (fs.existsSync(".env")) {
    dotenv.config();
} else if (fs.existsSync(".env.example")) {
    const envConfig = dotenv.parse(fs.readFileSync(".env.example"));
    for (const k in envConfig) {
        if (!process.env[k] || process.env[k].includes("MY_")) {
            process.env[k] = envConfig[k];
        }
    }
}

// ES Module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy initialization of Gemini client
  let aiClient: GoogleGenAI | null = null;
  function getAi() {
    const apiKey = process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("MY_") && !process.env.GEMINI_API_KEY.includes("your_") ? process.env.GEMINI_API_KEY : process.env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey.includes("MY_") || apiKey.includes("your_") || apiKey.trim() === '') {
      throw new Error("A valid GEMINI_API_KEY is not defined in the environment variables.");
    }

    if (!aiClient || aiClient.apiKey !== apiKey) {
        aiClient = new GoogleGenAI({ apiKey });
    }
    
    return aiClient;
  }

  // API Routes
  app.post("/api/analyze", async (req, res) => {
    try {
      const ai = getAi();
      const { textOrUrl } = req.body;
      const prompt = `
        Analyze the following news text or URL content for credibility.
        Determine if it is likely fake news or real news.
        Provide a confidence score between 0 and 100.
        Provide a detailed explanation of your reasoning.
        Extract any suspicious, sensationalist, or highly biased words/phrases.
        
        CRITICAL: Return ONLY raw JSON starting with { and ending with }, with NO markdown formatting, NO backticks, and NO additional text before or after the JSON.

        Input: ${textOrUrl}
      `;

      let lastError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  isFake: { type: Type.BOOLEAN, description: "True if the news is likely fake, false if real." },
                  confidence: { type: Type.NUMBER, description: "Confidence score from 0 to 100." },
                  explanation: { type: Type.STRING, description: "Detailed explanation of the analysis." },
                  suspiciousWords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of suspicious or sensationalist words/phrases found in the text."
                  }
                },
                required: ["isFake", "confidence", "explanation", "suspiciousWords"]
              }
            }
          });

          let jsonStr = response.text?.trim() || "{}";
          jsonStr = jsonStr.replace(/^```json/g, '').replace(/```$/g, '').replace(/^```/g, '').trim();
          let parsed;
          try {
             parsed = JSON.parse(jsonStr);
          } catch(e) {
             const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
             if (jsonMatch) {
               parsed = JSON.parse(jsonMatch[0]);
             } else {
               throw new Error("Invalid format returned by AI: " + jsonStr.substring(0, 50));
             }
          }
          res.json(parsed);
          return;
        } catch (error) {
          console.error(`Error analyzing news (attempt ${attempt}):`, error instanceof Error ? error.message : String(error));
          fs.writeFileSync("error_debug.log", "Error analyzing news (attempt " + attempt + "): " + (error instanceof Error ? error.message : String(error)) + "\\n", {flag: 'a'});
          lastError = error;
          const errString = String(error) + (error instanceof Error ? error.message : '');
          if (errString.includes("API key not valid") || errString.includes("API Key not found") || errString.includes("API key expired") || errString.includes("API_KEY_INVALID") || errString.includes("leaked") || errString.includes("PERMISSION_DENIED") || errString.includes("429") || errString.includes("RESOURCE_EXHAUSTED") || errString.includes("Quota")) break; // Stop retries immediately on quota or key issues
          if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Try fallback model if all attempts failed or hit a quota limit
      const errStrFallback = String(lastError) + (lastError instanceof Error ? lastError.message : '');
      if (errStrFallback.includes("429") || errStrFallback.includes("Quota") || errStrFallback.includes("exhausted") || errStrFallback.includes("RESOURCE_EXHAUSTED")) {
         try {
            const response = await ai.models.generateContent({
              model: "gemini-3.1-flash-lite-preview", // Fallback to flash-lite if pro is out of quota
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    isFake: { type: Type.BOOLEAN, description: "True if the news is likely fake, false if real." },
                    confidence: { type: Type.NUMBER, description: "Confidence score from 0 to 100." },
                    explanation: { type: Type.STRING, description: "Detailed explanation of the analysis." },
                    suspiciousWords: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "List of suspicious or sensationalist words/phrases found in the text."
                    }
                  },
                  required: ["isFake", "confidence", "explanation", "suspiciousWords"]
                }
              }
            });
            let jsonStr = response.text?.trim() || "{}";
            jsonStr = jsonStr.replace(/^```json/g, '').replace(/```$/g, '').replace(/^```/g, '').trim();
            let parsed;
            try {
               parsed = JSON.parse(jsonStr);
            } catch(e) {
               const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
               if (jsonMatch) {
                 parsed = JSON.parse(jsonMatch[0]);
               } else {
                 throw new Error("Invalid format returned by AI");
               }
            }
            res.json(parsed);
            return;
         } catch(e) {
             lastError = e;
         }
      }

      const finalErrString = String(lastError) + (lastError instanceof Error ? lastError.message : '');
      if (finalErrString.includes("429") || finalErrString.includes("Quota") || finalErrString.includes("exhausted") || finalErrString.includes("RESOURCE_EXHAUSTED")) {
        throw new Error("The API key is out of quota. Please check your plan and billing details, or enter a new API key in the Settings menu to continue.");
      }
      if (finalErrString.includes("leaked") || finalErrString.includes("PERMISSION_DENIED")) {
        throw new Error("Your API key was reported as leaked or permission was denied. Please enter a new API key in the Settings menu.");
      }
      if (finalErrString.includes("API Key not found") || finalErrString.includes("API key expired") || finalErrString.includes("API_KEY_INVALID") || finalErrString.includes("API key not valid")) {
        throw new Error("API Key is missing, invalid, or expired. Please enter a valid API key in the Settings menu.");
      }
      throw new Error(`Failed to analyze the news. Network or service error.`);
      
    } catch (error) {
      console.error("Backend /api/analyze error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const ai = getAi();
      const { messages } = req.body;
      const contents = messages.map((msg: any) => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      let lastError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
              systemInstruction: "You are an expert fact-checker and journalism assistant. Help the user verify claims, understand media bias, and identify misinformation.",
            }
          });

          res.json({ text: response.text || "I'm sorry, I couldn't process that." });
          return;
        } catch (error) {
          console.error(`Chat error (attempt ${attempt}):`, error instanceof Error ? error.message : String(error));
          lastError = error;
          const errString = String(error) + (error instanceof Error ? error.message : '');
          // If it's a hard API key error or quota error, don't retry standard connection
          if (errString.includes("API key not valid") || errString.includes("API Key not found") || errString.includes("API key expired") || errString.includes("API_KEY_INVALID") || errString.includes("leaked") || errString.includes("PERMISSION_DENIED") || errString.includes("429") || errString.includes("RESOURCE_EXHAUSTED") || errString.includes("Quota")) break;
          if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Try fallback model if all attempts failed or hit a quota limit
      const errStrFallback = String(lastError) + (lastError instanceof Error ? lastError.message : '');
      if (errStrFallback.includes("429") || errStrFallback.includes("Quota") || errStrFallback.includes("exhausted") || errStrFallback.includes("RESOURCE_EXHAUSTED")) {
         try {
            const response = await ai.models.generateContent({
              model: "gemini-3.1-flash-lite-preview", // Fallback to flash-lite if pro is out of quota
              contents: contents,
              config: {
                systemInstruction: "You are an expert fact-checker and journalism assistant. Help the user verify claims, understand media bias, and identify misinformation.",
              }
            });
            res.json({ text: response.text || "I'm sorry, I couldn't process that." });
            return;
         } catch(e) {
             lastError = e;
         }
      }

      const finalErrString = String(lastError) + (lastError instanceof Error ? lastError.message : '');
      if (finalErrString.includes("429") || finalErrString.includes("Quota") || finalErrString.includes("exhausted") || finalErrString.includes("RESOURCE_EXHAUSTED")) {
        throw new Error("The API key is out of quota. Please check your plan and billing details, or enter a new API key in the Settings menu to continue.");
      }
      if (finalErrString.includes("leaked") || finalErrString.includes("PERMISSION_DENIED")) {
        throw new Error("Your API key was reported as leaked or permission was denied. Please enter a new API key in the Settings menu.");
      }
      if (finalErrString.includes("API Key not found") || finalErrString.includes("API key expired") || finalErrString.includes("API_KEY_INVALID") || finalErrString.includes("API key not valid")) {
        throw new Error("API Key is missing, invalid, or expired. Please enter a valid API key in the Settings menu.");
      }
      throw new Error(`Chat error: Network or service error.`);
    } catch (error) {
      console.error("Backend /api/chat error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
