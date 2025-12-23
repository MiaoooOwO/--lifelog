
export enum Mood {
  Happy = 'Happy',
  Calm = 'Calm',
  Sad = 'Sad',
  Anxious = 'Anxious',
  Excited = 'Excited',
  Neutral = 'Neutral',
  Grateful = 'Grateful'
}

export type Language = 'en' | 'zh';

export type AIProvider = 'google' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string; // For custom providers (e.g., https://api.deepseek.com/v1)
  modelName: string; // e.g., gemini-1.5-flash or gpt-4o or deepseek-chat
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string; // Now stores HTML
  createdAt: string; // ISO string
  mood: Mood;
  tags: string[];
  images: string[]; // Array of base64 strings
  summary?: string;
  reminder?: string; // ISO string for reminder time
}

export interface AIAnalysisResult {
  title: string;
  mood: Mood;
  tags: string[];
  summary: string;
}

export interface PromptSuggestion {
  text: string;
  type: 'reflection' | 'creative' | 'memory';
}
