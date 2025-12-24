
import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, List, ListOrdered, Palette, ChevronDown } from 'lucide-react';

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const PRESET_COLORS = [
    '#000000', // Black
    '#64748b', // Slate
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    '#84cc16', // Lime
    '#22c55e', // Green
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#d946ef', // Fuchsia
    '#ec4899', // Pink
];

export const RichEditor: React.FC<RichEditorProps> = ({ content, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Sync initial content only once
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      if (content === '' && editorRef.current.innerHTML === '<br>') return;
      editorRef.current.innerHTML = content;
    }
  }, []); 

  // Handle clicking outside to close picker
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
              setShowColorPicker(false);
          }
      };
      if (showColorPicker) {
          document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, [showColorPicker]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
    handleInput();
    if (command === 'foreColor') setShowColorPicker(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Floating Toolbar */}
      <div className="flex items-center gap-1 mb-2 bg-white/50 p-1.5 rounded-xl border border-white/60 shadow-sm backdrop-blur-sm w-max">
        <button onClick={() => exec('bold')} className="p-2 hover:bg-black/5 text-gray-700 rounded-lg transition-colors" title="Bold">
          <Bold className="w-4 h-4" />
        </button>
        <button onClick={() => exec('italic')} className="p-2 hover:bg-black/5 text-gray-700 rounded-lg transition-colors" title="Italic">
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button onClick={() => exec('insertUnorderedList')} className="p-2 hover:bg-black/5 text-gray-700 rounded-lg transition-colors" title="Bullet List">
          <List className="w-4 h-4" />
        </button>
        <button onClick={() => exec('insertOrderedList')} className="p-2 hover:bg-black/5 text-gray-700 rounded-lg transition-colors" title="Numbered List">
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        
        {/* Color Picker */}
        <div className="relative" ref={colorPickerRef}>
            <button 
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${showColorPicker ? 'bg-black/10' : 'hover:bg-black/5'}`}
            >
                <Palette className="w-4 h-4 text-primary-600" />
                <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            
            {showColorPicker && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-xl shadow-xl z-50 border border-gray-100 animate-in slide-in-from-top-2 w-48">
                     <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Presets</div>
                     <div className="grid grid-cols-7 gap-2 mb-3">
                         {PRESET_COLORS.map(color => (
                             <button 
                                key={color}
                                onClick={() => exec('foreColor', color)} 
                                className="w-5 h-5 rounded-full border border-gray-200 hover:scale-125 transition-transform"
                                style={{ backgroundColor: color }}
                                title={color}
                             />
                         ))}
                     </div>
                     <div className="h-px bg-gray-100 my-2"></div>
                     <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 shadow-inner group cursor-pointer hover:scale-105 transition-transform">
                             {/* Rainbow Gradient BG */}
                             <div className="absolute inset-0 bg-gradient-to-br from-red-400 via-green-400 to-blue-400"></div>
                             {/* Native Color Input hidden on top */}
                             <input 
                                type="color" 
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                onChange={(e) => exec('foreColor', e.target.value)}
                             />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">Custom</span>
                     </div>
                </div>
            )}
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="w-full h-full resize-none text-lg leading-relaxed text-gray-700 focus:outline-none focus:ring-0 bg-transparent font-sans rich-text-content empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300"
        data-placeholder={placeholder}
        style={{ minHeight: '300px' }}
      >
      </div>
    </div>
  );
};
