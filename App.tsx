
import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, Calendar as CalendarIcon, List as ListIcon, Globe, X, Minus, Square, Sparkles, Settings } from 'lucide-react';
import { JournalEntry, Mood, Language, AIConfig } from './types';
import { EntryCard } from './components/EntryCard';
import { Editor } from './components/Editor';
import { CalendarView } from './components/CalendarView';
import { getTranslation } from './utils/i18n';
import { Lightbox } from './components/Lightbox';
import { SettingsModal } from './components/SettingsModal';

// Safe Electron IPC Renderer Initialization
// This prevents the app from crashing in a standard web browser environment
let ipcRenderer: any = null;
try {
  if ((window as any).require) {
    const electron = (window as any).require('electron');
    ipcRenderer = electron.ipcRenderer;
  }
} catch (e) {
  // We are in a web browser, Electron is not available.
  // console.log('Running in web mode');
}

// Helper to generate palette
function generatePalette(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return {
        50: `rgba(${r},${g},${b}, 0.05)`,
        100: `rgba(${r},${g},${b}, 0.1)`,
        200: `rgba(${r},${g},${b}, 0.2)`,
        300: `rgba(${r},${g},${b}, 0.4)`,
        400: `rgba(${r},${g},${b}, 0.6)`,
        500: `rgba(${r},${g},${b}, 1)`,
        600: `rgba(${r * 0.9},${g * 0.9},${b * 0.9}, 1)`,
        700: `rgba(${r * 0.8},${g * 0.8},${b * 0.8}, 1)`,
        800: `rgba(${r * 0.7},${g * 0.7},${b * 0.7}, 1)`,
        900: `rgba(${r * 0.6},${g * 0.6},${b * 0.6}, 1)`,
        rgb: `${r}, ${g}, ${b}`
    };
}

const THEME_COLORS = [
    '#0ea5e9', // Sky Blue (Default)
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#6366f1', // Indigo
];

const DEFAULT_AI_CONFIG: AIConfig = {
    provider: 'google',
    apiKey: process.env.API_KEY || '', // Fallback to env if available (web)
    modelName: 'gemini-3-flash-preview'
};

const App: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [language, setLanguage] = useState<Language>(() => {
      return (localStorage.getItem('app_language') as Language) || 'en';
  });

  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
      const saved = localStorage.getItem('ai_config');
      return saved ? JSON.parse(saved) : DEFAULT_AI_CONFIG;
  });

  const [view, setView] = useState<'list' | 'calendar' | 'editor'>('list');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [themeColor, setThemeColor] = useState(THEME_COLORS[0]);
  
  // New Lightbox State
  const [lightboxState, setLightboxState] = useState<{
      isOpen: boolean;
      images: string[];
      index: number;
  }>({ isOpen: false, images: [], index: 0 });

  const [showSettings, setShowSettings] = useState(false);

  const t = getTranslation(language);

  // Load Data from File System (Electron) or LocalStorage (Web)
  useEffect(() => {
    async function loadData() {
      if (ipcRenderer) {
        try {
          const data = await ipcRenderer.invoke('load-journal');
          if (Array.isArray(data) && data.length > 0) {
            setEntries(data);
          } else {
            setEntries([]);
          }
        } catch (e) {
          console.error("Failed to load data from file system", e);
          setEntries([]);
        }
      } else {
        // Fallback for browser testing
        const saved = localStorage.getItem('journal_entries');
        setEntries(saved ? JSON.parse(saved) : []);
      }
      setIsLoaded(true);
    }
    loadData();
  }, []);

  // Save Data
  useEffect(() => {
    if (!isLoaded) return; // Don't save empty state while loading

    const saveData = async () => {
      if (ipcRenderer) {
        await ipcRenderer.invoke('save-journal', entries);
      } else {
        localStorage.setItem('journal_entries', JSON.stringify(entries));
      }
    };

    // Debounce saving slightly to prevent thrashing disk
    const timeout = setTimeout(saveData, 500);
    return () => clearTimeout(timeout);
  }, [entries, isLoaded]);

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  // Save AI Config
  useEffect(() => {
    localStorage.setItem('ai_config', JSON.stringify(aiConfig));
  }, [aiConfig]);

  // Apply Theme
  useEffect(() => {
    const palette = generatePalette(themeColor);
    const root = document.documentElement;
    root.style.setProperty('--color-primary-50', palette[50]);
    root.style.setProperty('--color-primary-100', palette[100]);
    root.style.setProperty('--color-primary-200', palette[200]);
    root.style.setProperty('--color-primary-300', palette[300]);
    root.style.setProperty('--color-primary-400', palette[400]);
    root.style.setProperty('--color-primary-500', palette[500]);
    root.style.setProperty('--color-primary-600', palette[600]);
    root.style.setProperty('--color-primary-700', palette[700]);
    root.style.setProperty('--color-primary-800', palette[800]);
    root.style.setProperty('--color-primary-900', palette[900]);
    root.style.setProperty('--shadow-color', palette.rgb);
  }, [themeColor]);

  const handleSaveEntry = (newEntryData: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    if (editingEntry) {
      const updatedEntries = entries.map(e => 
        e.id === editingEntry.id ? { ...e, ...newEntryData } : e
      );
      setEntries(updatedEntries);
    } else {
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        ...newEntryData
      };
      setEntries([newEntry, ...entries]);
    }
    setView('list');
    setEditingEntry(undefined);
  };

  const handleDeleteEntry = (id: string) => {
      setEntries(prev => prev.filter(e => e.id !== id));
      setView('list');
      setEditingEntry(undefined);
  };

  const openEditor = (entry?: JournalEntry) => {
    setEditingEntry(entry);
    setView('editor');
  };

  const handleImageClick = (src: string, index: number, allImages: string[]) => {
    // If no specific array passed (e.g. from single view), use just the one image
    const imgs = allImages && allImages.length > 0 ? allImages : [src];
    const idx = index >= 0 ? index : 0;
    setLightboxState({ isOpen: true, images: imgs, index: idx });
  };

  // Window Controls
  const handleWindowControl = (action: 'minimize' | 'maximize' | 'close') => {
      if (ipcRenderer) {
          ipcRenderer.send(`window-${action}`);
      } else {
          console.log(`Window action: ${action} (Not in Electron)`);
      }
  };

  const filteredEntries = entries.filter(e => {
    const term = searchTerm.toLowerCase();
    const dateStr = e.createdAt.split('T')[0]; // Format: YYYY-MM-DD
    
    return (
      e.title.toLowerCase().includes(term) || 
      e.content.toLowerCase().includes(term) ||
      e.tags.some(t => t.toLowerCase().includes(term)) ||
      dateStr.includes(term)
    );
  });

  const toggleLanguage = () => {
      setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="h-screen bg-stripes-animated flex justify-center text-gray-800 font-sans selection:bg-primary-200 selection:text-primary-900 transition-colors duration-500 overflow-hidden">
       {/* Lightbox for full screen images */}
       <Lightbox 
          isOpen={lightboxState.isOpen} 
          images={lightboxState.images}
          initialIndex={lightboxState.index}
          onClose={() => setLightboxState(prev => ({ ...prev, isOpen: false }))} 
        />
        
       {/* Settings Modal */}
       <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
          config={aiConfig}
          onSave={setAiConfig}
       />

        {/* Main Desktop Container with Mesh Gradient Background */}
      <div className="w-full h-full bg-gradient-to-br from-white via-surface-50 to-primary-50 shadow-2xl relative flex flex-col max-w-7xl border-x border-gray-200 animate-gradient-xy z-10">
        
        {/* Ambient background blobs inside the main frame */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        {/* Title Bar (Simulated for Electron Frameless Window) */}
        <div className="h-8 bg-transparent z-50 flex items-center justify-between px-3 titlebar-drag-region shrink-0">
            <div className="text-xs font-semibold text-gray-500/80 flex items-center gap-2">
                <BookOpen className="w-3 h-3 text-primary-500" />
                Lumière Journal
            </div>
            {/* Window Controls */}
            <div className="flex items-center gap-2 no-drag opacity-0 hover:opacity-100 transition-opacity p-1">
                <button 
                    onClick={() => handleWindowControl('minimize')} 
                    className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-500 shadow-sm transition-colors border border-yellow-500/20"
                    title="Minimize"
                ></button>
                <button 
                    onClick={() => handleWindowControl('maximize')}
                    className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-500 shadow-sm transition-colors border border-green-500/20"
                    title="Maximize"
                ></button>
                <button 
                    onClick={() => handleWindowControl('close')}
                    className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 shadow-sm transition-colors border border-red-500/20"
                    title="Close"
                ></button>
            </div>
        </div>
        
        {view !== 'editor' && (
          <>
            {/* Header */}
            <header className="bg-white/40 backdrop-blur-md px-6 py-6 flex flex-col border-b border-white/50 elevation-1 shrink-0 relative z-10">
               <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-br from-primary-400 to-primary-600 text-white p-2.5 rounded-2xl shadow-lg shadow-primary-500/30 transition-transform duration-500 hover:rotate-3">
                          <BookOpen className="w-6 h-6" />
                      </div>
                      <h1 className="text-3xl font-bold tracking-tight text-gray-900 drop-shadow-sm">{t.appTitle}</h1>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex items-center gap-3 no-drag">
                     {/* Theme Picker */}
                     <div className="flex -space-x-2 mr-4">
                        {THEME_COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setThemeColor(c)}
                                className={`w-5 h-5 rounded-full border-2 border-white transition-transform hover:z-10 hover:scale-125 cursor-pointer shadow-sm ${themeColor === c ? 'z-10 scale-110 shadow-md ring-1 ring-offset-1 ring-gray-300' : ''}`}
                                style={{ backgroundColor: c }}
                                title="Change Theme"
                            />
                        ))}
                     </div>

                     <div className="bg-white/60 backdrop-blur-md rounded-full p-1 shadow-sm border border-white/60 flex items-center">
                        <button 
                            onClick={toggleLanguage}
                            className="p-2 rounded-full text-gray-500 hover:text-gray-800 transition-colors font-bold text-xs w-9"
                            title="Toggle Language"
                        >
                            {language === 'en' ? 'EN' : '中'}
                        </button>
                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                        <button 
                            onClick={() => setShowSettings(true)}
                            className="p-2 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                            title="AI Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                        <button 
                            onClick={() => setView('list')}
                            className={`p-2 rounded-full transition-all ${view === 'list' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                            title="List View"
                        >
                            <ListIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setView('calendar')}
                            className={`p-2 rounded-full transition-all ${view === 'calendar' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Calendar View"
                        >
                            <CalendarIcon className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
               </div>

               {view === 'list' && (
                   <div className="relative animate-in fade-in slide-in-from-top-4 duration-500 max-w-xl mx-auto w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder={t.searchPlaceholder} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/60 border-none rounded-2xl py-3 pl-10 pr-4 text-sm shadow-inner focus:ring-2 focus:ring-primary-300 transition-all placeholder-gray-400 backdrop-blur-md no-drag ring-1 ring-white/50"
                    />
                   </div>
               )}
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-hidden w-full relative z-10 flex flex-col">
              <div className="max-w-5xl mx-auto w-full h-full">
              {view === 'calendar' ? (
                  <div className="animate-in zoom-in-95 duration-500 h-full">
                        <CalendarView 
                            entries={entries} 
                            onDateSelect={() => {}} // Handled internally in CalendarView
                            language={language}
                            onImageClick={handleImageClick}
                            onEntryClick={openEditor}
                        />
                  </div>
              ) : (
                  <div className="h-full overflow-y-auto pb-24 scroll-smooth">
                    {filteredEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary-200 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                                <div className="w-32 h-32 bg-white/50 backdrop-blur-xl rounded-full flex items-center justify-center mb-8 shadow-xl ring-1 ring-white relative z-10">
                                    <Sparkles className="w-12 h-12 text-primary-300" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{t.noMemories}</h3>
                            <p className="text-gray-500 font-medium max-w-xs mx-auto leading-relaxed">{t.startWriting}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-min pb-10">
                            {filteredEntries.map(entry => (
                                <EntryCard 
                                    key={entry.id} 
                                    entry={entry} 
                                    onClick={openEditor}
                                    language={language}
                                    onImageClick={handleImageClick}
                                />
                            ))}
                        </div>
                    )}
                  </div>
              )}
              </div>
            </main>

            {/* FAB */}
            <div className="fixed bottom-10 right-10 z-30 no-drag">
              <button 
                onClick={() => openEditor()}
                className="group flex items-center justify-center w-16 h-16 bg-black text-white rounded-[20px] shadow-2xl hover:scale-110 hover:shadow-primary-500/40 transition-all duration-300 active:scale-95 elevation-3 hover:-rotate-3 ring-4 ring-white/20"
                title="New Memory"
              >
                <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </>
        )}

        {view === 'editor' && (
          <div className="absolute inset-0 z-50 flex justify-center items-center bg-transparent backdrop-blur-sm p-4">
             <div className="w-full h-full flex flex-col max-w-5xl mx-auto">
               <Editor 
                 onSave={handleSaveEntry} 
                 onCancel={() => setView('list')} 
                 onDelete={handleDeleteEntry}
                 existingEntry={editingEntry}
                 language={language}
                 onImageClick={handleImageClick}
                 aiConfig={aiConfig}
               />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
