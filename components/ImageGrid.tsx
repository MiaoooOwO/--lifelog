
import React from 'react';
import { X } from 'lucide-react';

interface ImageGridProps {
  images: string[];
  onRemove?: (index: number) => void;
  readonly?: boolean;
  onImageClick?: (src: string, index: number) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ images, onRemove, readonly = false, onImageClick }) => {
  if (!images || images.length === 0) return null;

  const getGridClass = () => {
    switch (images.length) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-2 grid-rows-2';
      default: return 'grid-cols-2 grid-rows-2';
    }
  };

  const getImageStyle = (index: number, total: number) => {
    if (total === 3 && index === 0) return 'row-span-2'; // Hero image on left
    if (total >= 4) return ''; // 2x2 grid
    return '';
  };

  return (
    <div className={`grid gap-2 w-full h-64 rounded-2xl overflow-hidden ${getGridClass()}`}>
      {images.slice(0, 4).map((img, index) => (
        <div 
          key={index} 
          className={`relative group overflow-hidden ${getImageStyle(index, images.length)} h-full`}
        >
          <img 
            src={img} 
            alt={`Memory ${index + 1}`} 
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${onImageClick ? 'cursor-pointer' : ''}`}
            onClick={(e) => {
              if (onImageClick) {
                e.stopPropagation();
                // Pass the index so Lightbox knows where to start
                onImageClick(img, index);
              }
            }}
          />
          {!readonly && onRemove && (
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(index); }}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          {index === 3 && images.length > 4 && (
             <div 
                className={`absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl backdrop-blur-sm ${onImageClick ? 'cursor-pointer' : 'pointer-events-none'}`}
                onClick={(e) => {
                    if (onImageClick) {
                        e.stopPropagation();
                        // Clicking the "+N" overlay opens the 4th image (index 3) but allows scrolling to the rest
                        onImageClick(images[3], 3);
                    }
                }}
             >
               +{images.length - 4}
             </div>
          )}
        </div>
      ))}
    </div>
  );
};
