
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';
import { JournalEntry, Language } from '../types';
import { getTranslation } from '../utils/i18n';
import { EntryCard } from './EntryCard';

interface CalendarViewProps {
  entries: JournalEntry[];
  onDateSelect: (date: Date) => void;
  language: Language;
  onImageClick?: (src: string, index: number, allImages: string[]) => void;
  onEntryClick?: (entry: JournalEntry) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ entries, onDateSelect, language, onImageClick, onEntryClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const t = getTranslation(language);

  // Normalize date comparison (ignore time)
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDay }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getEntriesForDay = (date: Date) => {
    return entries.filter(e => {
      const d = new Date(e.createdAt);
      return isSameDay(d, date);
    });
  };

  // Filter entries for the side panel (based on selected date)
  const selectedEntries = getEntriesForDay(selectedDate);

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
      {/* Calendar Grid - Fixed Width to prevent stretching */}
      <div className="shrink-0 w-full md:w-[420px] bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/50 elevation-2 flex flex-col h-max max-h-full">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-bold text-gray-800">
            {t.months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center mb-2 shrink-0">
          {t.weekdaysShort.map(d => (
            <div key={d} className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">{d}</div>
          ))}
        </div>
        
        {/* Calendar Grid Container */}
        <div className="grid grid-cols-7 gap-2 auto-rows-fr">
          {padding.map(i => <div key={`pad-${i}`} />)}
          {days.map(day => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayEntries = getEntriesForDay(date);
            const hasEntry = dayEntries.length > 0;
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            
            return (
              <button
                key={day}
                onClick={() => {
                    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    newDate.setHours(12, 0, 0, 0); 
                    setSelectedDate(newDate);
                    onDateSelect(newDate); // Optional callback for parent logging
                }}
                className={`
                  relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all group
                  ${isSelected ? 'bg-black text-white shadow-lg scale-105 z-10' : 
                    hasEntry ? 'bg-surface-50 hover:bg-white hover:shadow-md cursor-pointer border border-primary-100' : 'hover:bg-gray-50 text-gray-400'}
                  ${isToday && !isSelected ? 'ring-2 ring-primary-400 ring-offset-2' : ''}
                `}
              >
                <span className={`text-sm font-medium ${hasEntry && !isSelected ? 'text-gray-800' : ''}`}>{day}</span>
                
                {/* Dots for entries */}
                {hasEntry && (
                  <div className="flex gap-1 mt-1">
                      {dayEntries.slice(0, 3).map((_, i) => (
                           <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : (i === 0 ? 'bg-primary-400' : i === 1 ? 'bg-purple-400' : 'bg-pink-400')}`}></div>
                      ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Side Panel for Selected Date Entries - Takes remaining space and scrolls independently */}
      <div className="flex-1 flex flex-col h-full min-h-0 bg-white/40 backdrop-blur-md rounded-3xl border border-white/40 shadow-inner overflow-hidden">
         {/* Sidebar Header */}
         <div className="p-4 border-b border-white/50 bg-white/40 shrink-0">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-500" />
                {selectedDate.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', day: 'numeric', weekday: 'long' })}
            </h3>
         </div>
         
         {/* Scrollable Content Area */}
         <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {selectedEntries.length > 0 ? (
                <div className="space-y-4">
                    {selectedEntries.map(entry => (
                        <EntryCard 
                            key={entry.id} 
                            entry={entry} 
                            onClick={(e) => onEntryClick && onEntryClick(e)} 
                            language={language}
                            onImageClick={onImageClick}
                        />
                    ))}
                    {/* Spacer at bottom */}
                    <div className="h-12"></div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                    <Sparkles className="w-10 h-10 mb-3 opacity-50" />
                    <p className="text-base font-medium">{language === 'zh' ? '这一天没有记录' : 'No memories on this day'}</p>
                    <p className="text-xs mt-1 opacity-70">{language === 'zh' ? '享受当下吧' : 'Enjoy the moment'}</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
