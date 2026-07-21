import { useState } from 'react';
import { Upload, Star, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/shared/lib/api';

export default function ProductImageManager({ productId, images = [], onImagesUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setErrorMsg('');

    try {
      for (const file of files) {
        await api.uploadProductImage(file, productId);
      }
      if (onImagesUpdated) onImagesUpdated();
    } catch (err) {
      setErrorMsg(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSetPrimary = async (imageId) => {
    if (!productId) return;
    try {
      await api.setPrimaryImage(productId, imageId);
      if (onImagesUpdated) onImagesUpdated();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to set primary image');
    }
  };

  return (
    <div className="space-y-3 text-xs font-sans">
      <label className="block text-outline font-semibold uppercase tracking-wider">Product Gallery Images</label>
      
      {errorMsg && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-3">
          {images.map((img) => (
            <div key={img.id} className="relative group aspect-square border border-surface-container rounded-xs overflow-hidden bg-surface-container/20">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              
              {/* Primary badge / action */}
              <button
                type="button"
                onClick={() => handleSetPrimary(img.id)}
                title={img.is_primary ? 'Primary Image' : 'Set as Primary'}
                className={`absolute top-1 right-1 p-1 rounded-full text-xs transition-colors cursor-pointer ${
                  img.is_primary ? 'bg-primary text-white' : 'bg-black/60 text-white opacity-70 hover:opacity-100'
                }`}
              >
                <Star className="w-3 h-3 fill-current" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dropzone / Button */}
      <label className="border border-dashed border-surface-container hover:border-primary p-4 rounded-xs text-center flex flex-col items-center justify-center cursor-pointer transition-colors bg-surface-container/10">
        {uploading ? (
          <div className="flex items-center space-x-2 text-primary font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Uploading image(s)...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-1 text-outline hover:text-primary">
            <Upload className="w-5 h-5 mb-1" />
            <span className="font-semibold">Click to upload product image(s)</span>
            <span className="text-[10px] text-outline/70">JPG, PNG, WEBP up to 25MB</span>
          </div>
        )}
        <input 
          type="file" 
          multiple 
          accept="image/jpeg,image/png,image/webp" 
          disabled={uploading} 
          onChange={handleFileUpload} 
          className="hidden" 
        />
      </label>
    </div>
  );
}
