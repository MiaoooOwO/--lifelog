
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { JournalEntry, Language } from '../types';
import { getTranslation } from '../utils/i18n';

interface CalendarViewProps {
  entries: JournalEntry[];
  onDateSelect: (date: Date) => void;
  language: Language;
  onImageClick?: (src: string, index: number, allImages: string[]) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ entries, onDateSelect, language, onImageClick }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const t = getTranslation(language);

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

  const getEntriesForDay = (day: number) => {
    return entries.filter(e => {
      const d = new Date(e.createdAt);
      return d.getDate() === day && 
             d.getMonth() === currentDate.getMonth() && 
             d.getFullYear() === currentDate.getFullYear();
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/50 elevation-2 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
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

      <div className="grid grid-cols-7 gap-2 text-center mb-2">
        {t.weekdaysShort.map(d => (
          <div key={d} className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2 auto-rows-fr flex-1">
        {padding.map(i => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const dayEntries = getEntriesForDay(day);
          const hasEntry = dayEntries.length > 0;
          const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
          
          return (
            <button
              key={day}
              onClick={() => {
                  const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  selectedDate.setHours(12, 0, 0, 0); // Avoid timezone rollover issues
                  onDateSelect(selectedDate);
              }}
              className={`
                relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all group
                ${hasEntry ? 'bg-surface-50 hover:bg-white hover:shadow-md cursor-pointer border border-primary-100' : 'hover:bg-gray-50 text-gray-400'}
                ${isToday ? 'ring-2 ring-primary-400 ring-offset-2' : ''}
              `}
            >
              <span className={`text-sm font-medium ${hasEntry ? 'text-gray-800' : ''}`}>{day}</span>
              
              {/* Dots for entries */}
              {hasEntry && (
                <div className="flex gap-1 mt-1">
                    {dayEntries.slice(0, 3).map((_, i) => (
                         <div key={i} className={`w-1 h-1 rounded-full ${
                             i === 0 ? 'bg-primary-400' : 
                             i === 1 ? 'bg-purple-400' : 'bg-pink-400'
                         }`}></div>
                    ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
