import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, Mood, PromptSuggestion, Language } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini client only if key exists to avoid immediate errors
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const MODEL_FLASH = 'gemini-3-flash-preview';

/**
 * Generates a journaling prompt based on the time of day.
 */
export const generateJournalPrompt = async (timeOfDay: string, language: Language): Promise<PromptSuggestion> => {
  if (!ai) throw new Error("API Key is missing");

  const langInstruction = language === 'zh' ? 'Output must be in Simplified Chinese.' : 'Output must be in English.';

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `Generate a single, thoughtful, short journaling prompt suitable for the ${timeOfDay}. It should encourage reflection or creativity. ${langInstruction} Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['reflection', 'creative', 'memory'] }
          },
          required: ['text', 'type']
        }
      }
    });

    const json = JSON.parse(response.text || '{}');
    return json as PromptSuggestion;
  } catch (error) {
    console.error("Gemini Prompt Error:", error);
    return {
      text: language === 'zh' ? "今天有什么小确幸吗？" : "What is something small that brought you joy today?",
      type: "reflection"
    };
  }
};

/**
 * Analyzes journal content to suggest a title, mood, and tags.
 */
export const analyzeJournalEntry = async (content: string, language: Language): Promise<AIAnalysisResult> => {
  if (!ai) throw new Error("API Key is missing");

  const langInstruction = language === 'zh' ? 'Output title, tags and summary in Simplified Chinese.' : 'Output in English.';

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `Analyze the following journal entry. 
      1. Provide a short, poetic title (max 5 words). 
      2. Identify the dominant mood (Happy, Calm, Sad, Anxious, Excited, Neutral, Grateful). 
      3. Suggest 3 relevant tags. 
      4. Write a one-sentence summary.
      ${langInstruction}
      
      Entry: "${content.substring(0, 1000)}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            mood: { type: Type.STRING, enum: Object.values(Mood) },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING }
          },
          required: ['title', 'mood', 'tags', 'summary']
        }
      }
    });

    const text = response.text || '{}';
    return JSON.parse(text) as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback
    return {
      title: language === 'zh' ? "无题" : "Untitled Entry",
      mood: Mood.Neutral,
      tags: ["journal"],
      summary: content.substring(0, 50) + "..."
    };
  }
};
