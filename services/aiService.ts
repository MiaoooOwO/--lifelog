
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, Mood, PromptSuggestion, Language, AIConfig } from "../types";

/**
 * Parses JSON from a potential Markdown code block response.
 */
function cleanAndParseJSON(text: string): any {
  try {
    // 1. Try parsing directly
    return JSON.parse(text);
  } catch (e) {
    // 2. Try removing markdown code blocks ```json ... ```
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {
        throw new Error("Failed to parse JSON from markdown block");
      }
    }
    // 3. Try finding the first '{' and last '}'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        try {
            return JSON.parse(text.substring(firstBrace, lastBrace + 1));
        } catch (e3) {
            throw new Error("Failed to extract JSON object");
        }
    }
    throw e;
  }
}

/**
 * Generic function to call OpenAI-compatible APIs (DeepSeek, ChatGPT, Ollama, etc.)
 */
async function callOpenAICompatible(config: AIConfig, systemPrompt: string, userPrompt: string) {
    if (!config.apiKey || !config.baseUrl) throw new Error("Missing API Key or Base URL");

    const payload = {
        model: config.modelName,
        messages: [
            { role: "system", content: systemPrompt + " You must respond with valid JSON only." },
            { role: "user", content: userPrompt }
        ],
        temperature: 0.7
    };

    try {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`API Error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "{}";
        return cleanAndParseJSON(content);
    } catch (error) {
        console.error("Custom AI API Error:", error);
        throw error;
    }
}

/**
 * Google GenAI Implementation
 */
async function callGoogleGenAI(config: AIConfig, prompt: string, schema?: any) {
    if (!config.apiKey) throw new Error("Missing API Key");
    
    // We instantiate here to allow dynamic API key changes
    const ai = new GoogleGenAI({ apiKey: config.apiKey });
    
    const options: any = {
        model: config.modelName || 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
        }
    };

    if (schema) {
        options.config.responseSchema = schema;
    }

    const response = await ai.models.generateContent(options);
    return JSON.parse(response.text || '{}');
}


// --- Public Exported Methods ---

export const testAIConnection = async (config: AIConfig): Promise<boolean> => {
    try {
        if (config.provider === 'google') {
            const ai = new GoogleGenAI({ apiKey: config.apiKey });
            await ai.models.generateContent({
                model: config.modelName || 'gemini-3-flash-preview',
                contents: "Test connection. Reply with 'OK'.",
            });
            return true;
        } else {
             const payload = {
                model: config.modelName,
                messages: [{ role: "user", content: "Test connection. Reply with 'OK'." }],
                max_tokens: 5
            };
            const response = await fetch(`${config.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify(payload)
            });
            return response.ok;
        }
    } catch (e) {
        console.error("Connection Test Failed:", e);
        throw e;
    }
};

export const generateJournalPrompt = async (
    timeOfDay: string, 
    language: Language, 
    config: AIConfig
): Promise<PromptSuggestion> => {
  
  const langInstruction = language === 'zh' ? 'Output must be in Simplified Chinese.' : 'Output must be in English.';
  const systemPrompt = `You are a thoughtful journaling assistant. Generate a single, short prompt for the ${timeOfDay}. It should encourage reflection or creativity. ${langInstruction}`;
  const userPrompt = `Generate a journaling prompt. Return JSON in this format: { "text": "...", "type": "reflection" | "creative" | "memory" }`;

  try {
    if (config.provider === 'google') {
        return await callGoogleGenAI(config, `${systemPrompt}\n${userPrompt}`, {
            type: Type.OBJECT,
            properties: {
                text: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['reflection', 'creative', 'memory'] }
            },
            required: ['text', 'type']
        });
    } else {
        return await callOpenAICompatible(config, systemPrompt, userPrompt);
    }
  } catch (error) {
    console.error("Generate Prompt Error", error);
    return {
      text: language === 'zh' ? "今天有什么值得记录的事吗？" : "What is something worth remembering today?",
      type: "reflection"
    };
  }
};

export const analyzeJournalEntry = async (
    content: string, 
    language: Language,
    config: AIConfig
): Promise<AIAnalysisResult> => {

  const langInstruction = language === 'zh' ? 'Output title, tags and summary in Simplified Chinese.' : 'Output in English.';
  const systemPrompt = `Analyze the journal entry. 1. Provide a short, poetic title (max 5 words). 2. Identify mood. 3. Suggest 3 tags. 4. One-sentence summary. ${langInstruction}`;
  const userPrompt = `Entry: "${content.substring(0, 1000)}". \nReturn JSON: { "title": "...", "mood": "Happy"|"Calm"|"Sad"|"Anxious"|"Excited"|"Neutral"|"Grateful", "tags": ["..."], "summary": "..." }`;

  try {
    if (config.provider === 'google') {
        return await callGoogleGenAI(config, `${systemPrompt}\n${userPrompt}`, {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                mood: { type: Type.STRING, enum: Object.values(Mood) },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                summary: { type: Type.STRING }
            },
            required: ['title', 'mood', 'tags', 'summary']
        });
    } else {
        return await callOpenAICompatible(config, systemPrompt, userPrompt);
    }
  } catch (error) {
    console.error("Analysis Error", error);
    return {
      title: language === 'zh' ? "无题" : "Untitled Entry",
      mood: Mood.Neutral,
      tags: ["journal"],
      summary: content.substring(0, 50) + "..."
    };
  }
};
