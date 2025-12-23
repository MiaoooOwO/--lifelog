
import React from 'react';
import { JournalEntry, Language } from '../types';
import { MoodIcon } from './MoodIcon';
import { Calendar, Tag, Clock } from 'lucide-react';
import { ImageGrid } from './ImageGrid';
import { getTranslation } from '../utils/i18n';

interface EntryCardProps {
  entry: JournalEntry;
  onClick: (entry: JournalEntry) => void;
  language: Language;
  onImageClick?: (src: string, index: number, allImages: string[]) => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onClick, language, onImageClick }) => {
  const t = getTranslation(language);
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  const date = new Date(entry.createdAt);
  
  // Apple Journal Style: More verbose date (e.g., "Monday, December 23")
  const dateStr = date.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  // Strip HTML for preview
  const plainText = entry.content.replace(/<[^>]+>/g, '');

  return (
    <div 
      onClick={() => onClick(entry)}
      className="group bg-white/70 backdrop-blur-md rounded-3xl p-5 mb-4 cursor-pointer transition-all duration-300 elevation-1 hover:elevation-3 hover:-translate-y-1 relative overflow-hidden"
    >
      {/* Decorative gradient blob in background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100/30 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-colors duration-500"></div>

      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className="flex items-center space-x-2 text-sm text-gray-500 font-medium tracking-wide">
          <Calendar className="w-4 h-4 text-primary-400" />
          <span className="uppercase text-xs font-bold text-gray-400">{dateStr}</span>
        </div>
        <div className="bg-white/80 p-2 rounded-full shadow-sm">
          <MoodIcon mood={entry.mood} className="w-5 h-5" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2 font-sans group-hover:text-primary-700 transition-colors relative z-10 leading-tight">
        {entry.title || t.untitled}
      </h3>

      <p className="text-gray-600 line-clamp-3 mb-4 font-sans leading-relaxed text-base relative z-10 font-light">
        {plainText}
      </p>

      {entry.images && entry.images.length > 0 && (
        <div className="mb-4 relative z-10">
           <ImageGrid 
             images={entry.images} 
             readonly 
             onImageClick={(src, index) => {
                 if (onImageClick) onImageClick(src, index, entry.images);
             }} 
           />
        </div>
      )}

      <div className="flex justify-between items-end mt-auto relative z-10">
        {entry.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {entry.tags.map(tag => (
              <span key={tag} className="flex items-center text-xs px-2.5 py-1 bg-surface-100/80 text-gray-500 rounded-full font-medium border border-white/50">
                #{tag}
              </span>
            ))}
          </div>
        ) : <div></div>}
        
        <span className="text-xs text-gray-400 flex items-center gap-1 font-medium bg-white/50 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" /> {timeStr}
        </span>
      </div>
    </div>
  );
};
