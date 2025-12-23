import React, { useRef, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, Palette } from 'lucide-react';

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const RichEditor: React.FC<RichEditorProps> = ({ content, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync initial content only once to avoid cursor jumping
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      if (content === '' && editorRef.current.innerHTML === '<br>') return;
      editorRef.current.innerHTML = content;
    }
  }, []); // Empty dependency mainly, real sync happens via blur/input if needed but kept simple here

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
    handleInput();
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
        <div className="relative group">
            <button className="p-2 hover:bg-black/5 text-gray-700 rounded-lg transition-colors">
                <Palette className="w-4 h-4 text-primary-600" />
            </button>
            <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-xl shadow-xl hidden group-hover:flex gap-2 z-20 border border-gray-100">
                <button onClick={() => exec('foreColor', '#000000')} className="w-5 h-5 rounded-full bg-black border border-gray-200"></button>
                <button onClick={() => exec('foreColor', '#ef4444')} className="w-5 h-5 rounded-full bg-red-500 border border-gray-200"></button>
                <button onClick={() => exec('foreColor', '#3b82f6')} className="w-5 h-5 rounded-full bg-blue-500 border border-gray-200"></button>
                <button onClick={() => exec('foreColor', '#22c55e')} className="w-5 h-5 rounded-full bg-green-500 border border-gray-200"></button>
            </div>
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
