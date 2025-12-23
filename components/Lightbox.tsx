
import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxProps {
  isOpen: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ isOpen, images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset index when opening a new set
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, currentIndex]); // Depend on currentIndex for latest state

  if (!isOpen || !images || images.length === 0) return null;

  const showPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const showNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button 
            onClick={showPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button 
            onClick={showNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}
      
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <img 
            key={currentIndex} // Force re-render for animation
            src={images[currentIndex]} 
            alt={`Image ${currentIndex + 1}`} 
            className="max-w-full max-h-full object-contain rounded-sm shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()} 
        />
        
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-white/80 text-sm backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
};
