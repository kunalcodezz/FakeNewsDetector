export interface AnalysisResult {
  isFake: boolean;
  confidence: number;
  explanation: string;
  suspiciousWords: string[];
}

export async function analyzeNews(textOrUrl: string): Promise<AnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ textOrUrl })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to analyze the news. HTTP ${response.status}`);
  }

  return response.json();
}

export async function chatWithAssistant(messages: { role: 'user' | 'model', text: string }[]) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Chat error: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.text;
}
