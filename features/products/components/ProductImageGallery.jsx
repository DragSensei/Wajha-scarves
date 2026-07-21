import { useState } from 'react';

export default function ProductImageGallery({ images = [], primaryImageUrl, productName = '' }) {
  const allImages = images.length > 0 
    ? images 
    : [{ id: 'primary', url: primaryImageUrl || 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=800' }];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeImage = allImages[selectedIndex] || allImages[0];

  return (
    <div>
      <div className="bg-surface-container/40 aspect-4/5 overflow-hidden mb-6 border border-surface-container/60 rounded-sm">
        <img 
          src={activeImage.url} 
          alt={productName}
          className="w-full h-full object-cover transition-all duration-300"
        />
      </div>

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
