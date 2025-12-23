
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Sparkles, Image as ImageIcon, Save, Loader2, X, Bell, Trash2 } from 'lucide-react';
import { JournalEntry, Mood, PromptSuggestion, Language, AIConfig } from '../types';
import { analyzeJournalEntry, generateJournalPrompt } from '../services/aiService';
import { MoodIcon } from './MoodIcon';
import { RichEditor } from './RichEditor';
import { ImageGrid } from './ImageGrid';
import { getTranslation } from '../utils/i18n';

interface EditorProps {
  onSave: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  onDelete: (id: string) => void; // New prop for deletion
  existingEntry?: JournalEntry;
  language: Language;
  onImageClick?: (src: string, index: number, allImages: string[]) => void;
  aiConfig: AIConfig;
}

export const Editor: React.FC<EditorProps> = ({ onSave, onCancel, onDelete, existingEntry, language, onImageClick, aiConfig }) => {
  const t = getTranslation(language);
  
  const [content, setContent] = useState(existingEntry?.content || '');
  const [title, setTitle] = useState(existingEntry?.title || '');
  const [mood, setMood] = useState<Mood>(existingEntry?.mood || Mood.Neutral);
  const [tags, setTags] = useState<string[]>(existingEntry?.tags || []);
  const [images, setImages] = useState<string[]>(existingEntry?.images || []);
  const [reminder, setReminder] = useState<string>(existingEntry?.reminder || '');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [prompt, setPrompt] = useState<PromptSuggestion | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
              setImages(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGetPrompt = async () => {
    if (!aiConfig.apiKey) {
        alert("Please configure AI settings first.");
        return;
    }

    setIsGeneratingPrompt(true);
    const hours = new Date().getHours();
    const timeOfDayKey = hours < 12 ? 'morning' : hours < 18 ? 'afternoon' : 'evening';
    const timeOfDay = t[timeOfDayKey as keyof typeof t] as string;

    try {
      const suggestion = await generateJournalPrompt(timeOfDay, language, aiConfig);
      setPrompt(suggestion);
    } catch (e) { 
        // Fallback silently handled in service
    } finally { setIsGeneratingPrompt(false); }
  };

  const handleAnalyze = async () => {
    if (!aiConfig.apiKey) {
        alert("Please configure AI settings first.");
        return;
    }

    const plainText = content.replace(/<[^>]+>/g, '');
    if (!plainText.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeJournalEntry(plainText, language, aiConfig);
      setTitle(result.title);
      setMood(result.mood);
      setTags(result.tags);
    } catch (e) {
      alert(t.analysisError);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!content.replace(/<[^>]+>/g, '').trim() && images.length === 0) return;
    
    if (reminder) {
      const reminderTime = new Date(reminder).getTime();
      const now = new Date().getTime();
      if (reminderTime > now && Notification.permission === "granted") {
        const delay = reminderTime - now;
        setTimeout(() => {
          new Notification(t.appTitle, { body: `${t.notificationBody}${title}` });
        }, delay);
      }
    }

    onSave({
      title: title || t.untitled,
      content,
      mood,
      tags,
      images,
      reminder
    });
  };

  const handleDelete = () => {
      if (window.confirm(t.deleteConfirm)) {
          if (existingEntry) {
              onDelete(existingEntry.id);
          } else {
              onCancel(); // Just close if it's a new unsaved entry
          }
      }
  };

  // Keyboard shortcut for Save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, content, title, mood, tags, images, reminder]);

  const usePrompt = () => {
    if (prompt) {
      setContent(prev => prev + `<p><strong>${prompt.text}</strong></p><p><br></p>`);
      setPrompt(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/90 backdrop-blur-xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500 border border-white/50 elevation-3">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100/50 sticky top-0 z-20 bg-white/80 backdrop-blur-md">
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 no-drag" title="Back (Esc)">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex space-x-2 no-drag">
           <button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all ${
               'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 hover:shadow-md'
            }`}
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {t.analyze}
          </button>
          <button 
            onClick={handleSave} 
            className="flex items-center px-6 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
            title="Save (Ctrl+S)"
          >
            <Save className="w-4 h-4 mr-2" />
            {t.save}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 relative">
        <div className="max-w-4xl mx-auto">
            {/* Title Input */}
            <input 
            type="text" 
            placeholder={t.titlePlaceholder} 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-3xl font-bold placeholder-gray-300 border-none focus:ring-0 p-0 text-gray-800 bg-transparent mb-4"
            />

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="relative group">
                    <button 
                        className="flex items-center space-x-2 bg-surface-100 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-surface-200 transition-colors"
                        onClick={() => {
                            const moods = Object.values(Mood);
                            const currentIndex = moods.indexOf(mood);
                            setMood(moods[(currentIndex + 1) % moods.length]);
                        }}
                    >
                        <MoodIcon mood={mood} className="w-4 h-4" />
                        <span>{mood}</span>
                    </button>
                </div>
                
                <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 bg-surface-100 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-surface-200 transition-colors"
                >
                <ImageIcon className="w-4 h-4" />
                <span>{t.addPhotos}</span>
                </button>
                <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                />

                <div className="flex items-center space-x-2 bg-surface-100 px-3 py-2 rounded-xl text-sm text-gray-700 focus-within:ring-2 ring-primary-200 transition-all">
                    <Bell className="w-4 h-4 text-gray-500" />
                    <input 
                        type="datetime-local" 
                        value={reminder}
                        onChange={(e) => {
                            if (Notification.permission !== "granted") Notification.requestPermission();
                            setReminder(e.target.value);
                        }}
                        className="bg-transparent border-none p-0 text-xs focus:ring-0 text-gray-600"
                    />
                </div>
            </div>

            {/* Prompt Section */}
            {!prompt && !content && (
            <div className="mb-6">
                <button 
                onClick={handleGetPrompt}
                disabled={isGeneratingPrompt}
                className="text-sm text-primary-600 font-medium flex items-center hover:bg-primary-50 px-4 py-2 rounded-full transition-colors border border-primary-100"
                >
                {isGeneratingPrompt ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Sparkles className="w-4 h-4 mr-2"/>}
                {t.needInspiration}
                </button>
            </div>
            )}

            {prompt && (
            <div className="bg-gradient-to-br from-primary-50 to-surface-50 p-6 rounded-2xl relative group border border-primary-100 mb-6 elevation-1">
                <button onClick={() => setPrompt(null)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
                </button>
                <p className="text-gray-700 italic font-serif text-lg mb-3">"{prompt.text}"</p>
                <button onClick={usePrompt} className="text-sm font-bold text-primary-600 hover:underline">
                {t.writeAboutThis}
                </button>
            </div>
            )}

            {/* Images Grid */}
            <ImageGrid 
                images={images} 
                onRemove={removeImage} 
                onImageClick={(src, index) => {
                     if (onImageClick) onImageClick(src, index, images);
                }} 
            />

            {/* Rich Text Editor */}
            <div className="min-h-[400px]">
                <RichEditor 
                    content={content} 
                    onChange={setContent} 
                    placeholder={t.editorPlaceholder}
                />
            </div>
            
            {/* Tags */}
            {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 mt-4">
                {tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-surface-100 text-gray-500 rounded-full text-xs font-medium">#{tag}</span>
                ))}
            </div>
            )}
        </div>
      </div>

       {/* Bottom Actions (Delete) */}
       <div className="p-4 border-t border-gray-100/50 bg-white/50 backdrop-blur-md flex justify-between">
           <button 
              onClick={handleDelete}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 text-sm"
              title="Delete Entry"
           >
               <Trash2 className="w-5 h-5" />
           </button>
       </div>
    </div>
  );
};
