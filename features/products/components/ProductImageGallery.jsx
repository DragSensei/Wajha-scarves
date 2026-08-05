import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductImageGallery({ images = [], primaryImageUrl, productName = '' }) {
  const allImages = images.length > 0 
    ? images 
    : [{ id: 'primary', url: primaryImageUrl || 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=800' }];

  const [selectedIndex, setSelectedIndex] = useState(0);

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % allImages.length);
  };

  return (
    <div>
      {/* Main Image Slider Frame */}
      <div className="relative bg-surface-container/40 aspect-4/5 overflow-hidden mb-6 border border-surface-container/60 rounded-sm group">
        {/* Sliding Track */}
        <div 
          className="flex w-full h-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
        >
          {allImages.map((img, idx) => (
            <div key={img.id || idx} className="w-full h-full shrink-0 flex-none">
              <img 
                src={img.url} 
                alt={`${productName} ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Back and Forth Arrows */}
        {allImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous picture"
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-on-background p-2 rounded-full shadow-md backdrop-blur-xs transition-all opacity-80 hover:opacity-100 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next picture"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-on-background p-2 rounded-full shadow-md backdrop-blur-xs transition-all opacity-80 hover:opacity-100 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {allImages.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`w-20 h-24 bg-surface-container/40 overflow-hidden border transition-all cursor-pointer rounded-xs shrink-0 ${
                selectedIndex === idx ? 'border-primary ring-1 ring-primary' : 'border-surface-container opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

