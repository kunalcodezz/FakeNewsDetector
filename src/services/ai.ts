const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface AnalysisResult {
  isFake: boolean;
  confidence: number;
  explanation: string;
  suspiciousWords: string[];
}

export async function analyzeNews(
  textOrUrl: string
): Promise<AnalysisResult> {
  const prompt = `
Analyze the following news/text and determine whether it is fake or real.

Return ONLY valid raw JSON.
Do not use markdown.
Do not use triple backticks.

Format:
{
  "isFake": boolean,
  "confidence": number,
  "explanation": "string",
  "suspiciousWords": ["word1", "word2"]
}

News:
${textOrUrl}
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  const rawText =
    data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  const cleanedText = rawText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch {
    return {
      isFake: false,
      confidence: 50,
      explanation: cleanedText,
      suspiciousWords: [],
    };
  }
}

export async function chatWithAssistant(
  messages: { role: "user" | "model"; text: string }[]
) {
  const prompt = messages
    .map((m) => `${m.role}: ${m.text}`)
    .join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Chat error HTTP ${response.status}`);
  }

  const data = await response.json();

  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "No response"
  );
}
