import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Star, Save, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/shared/lib/api';
import { compressImage } from '@/shared/utils/imageCompressor';

export default function ProductFormAdmin({ mode = 'edit' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isDeleteMode = mode === 'delete';
  const isEditMode = Boolean(id) && !isDeleteMode;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditMode || isDeleteMode);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: 0,
    category_id: '',
    description: ''
  });

  const [images, setImages] = useState([]);
  const [createdProductId, setCreatedProductId] = useState(isEditMode ? parseInt(id, 10) : null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getCategories(),
      (id && !isDeleteMode) ? api.getProduct(id) : (id && isDeleteMode) ? api.getProduct(id) : Promise.resolve(null)
    ]).then(([cats, prod]) => {
      if (!isMounted) return;
      setCategories(cats || []);
      if (prod) {
        setFormData({
          name: prod.name || '',
          price: prod.original_price ?? prod.price ?? '',
          stock: prod.stock ?? 0,
          category_id: prod.category_id ? String(prod.category_id) : '',
          description: prod.description || ''
        });
        setImages(prod.images || []);
      }
      setLoading(false);
    }).catch((err) => {
      if (isMounted) {
        setErrorMsg(err.message || 'Failed to load product details.');
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [id, isDeleteMode]);

  const handleMultipleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingImages(true);
    setErrorMsg('');

    try {
      const activeProdId = createdProductId;
      const uploadedResults = [];

      for (const file of files) {
        // Compress image before upload
        const compressed = await compressImage(file);
        const uploaded = await api.uploadProductImage(compressed, activeProdId);
        if (uploaded) {
          uploadedResults.push(uploaded);
        }
      }

      // Appends newly uploaded images to existing images list in upload order
      setImages((prev) => [...prev, ...uploadedResults]);
    } catch (err) {
      setErrorMsg(err.message || 'Failed uploading compressed images.');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleSetPrimary = async (imageId) => {
    if (!createdProductId) {
      setImages((prev) =>
        prev.map((img) => ({ ...img, is_primary: img.id === imageId }))
      );
      return;
    }

    try {
      await api.setPrimaryImage(createdProductId, imageId);
      setImages((prev) =>
        prev.map((img) => ({ ...img, is_primary: img.id === imageId }))
      );
    } catch (err) {
      setErrorMsg(err.message || 'Failed to set primary image.');
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    const payload = {
      name: formData.name,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10) || 0,
      description: formData.description,
    };

    if (formData.category_id) {
      payload.category_id = parseInt(formData.category_id, 10);
    }

    try {
      if (createdProductId) {
        await api.updateProduct(createdProductId, payload);
      } else {
        const newProd = await api.createProduct(payload);
        setCreatedProductId(newProd.id);

        // Link any pre-uploaded images to newly created product
        if (images.length > 0) {
          for (const img of images) {
            if (img.is_primary) {
              await api.setPrimaryImage(newProd.id, img.id);
            }
          }
        }
      }
      navigate('/admin/products');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!id) return;
    setSaving(true);
    setErrorMsg('');
    try {
      await api.deleteProduct(id);
      navigate('/admin/products');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-32 mb-8"></div>
        <div className="h-10 bg-slate-200 rounded w-1/3 mb-6"></div>
        <div className="h-64 bg-slate-200 rounded w-full"></div>
      </div>
    );
  }

  if (isDeleteMode) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Link to="/admin/products" className="text-xs font-sans tracking-widest uppercase text-outline hover:text-primary flex items-center space-x-2 mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>

        <div className="bg-white border border-red-200 p-8 rounded-sm shadow-xs text-xs font-sans">
          <h1 className="text-2xl font-serif text-red-600 font-bold uppercase tracking-wider mb-3">
            Delete Product
          </h1>
          <p className="text-on-background leading-relaxed mb-6">
            Are you sure you want to permanently delete <strong className="font-serif text-sm">{formData.name}</strong>? This action will remove all product details, images, and inventory records.
          </p>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4 border-t border-surface-container">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-5 py-2.5 text-outline hover:text-on-background font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteProduct}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 uppercase tracking-widest font-semibold cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Deleting...' : 'Confirm Permanent Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-surface-container">
        <div>
          <Link to="/admin/products" className="text-xs font-sans tracking-widest uppercase text-outline hover:text-primary flex items-center space-x-2 mb-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Product Catalog</span>
          </Link>
          <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest">
            {createdProductId ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>

        <button
          type="button"
          onClick={handleSaveProduct}
          disabled={saving}
          className="bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase px-6 py-3 flex items-center space-x-2 font-medium cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Product'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-sans rounded-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveProduct} className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-xs font-sans">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6 bg-white p-6 border border-surface-container rounded-sm shadow-xs">
          <div>
            <label className="block text-outline font-semibold uppercase tracking-wider mb-2">Product Title</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Classic Crimson Bamboo Scarf"
              className="w-full border border-surface-container p-3 text-sm text-on-background focus:outline-none focus:border-primary font-serif"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-outline font-semibold uppercase tracking-wider mb-2">Price ($)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="29.99"
                className="w-full border border-surface-container p-3 text-on-background focus:outline-none focus:border-primary font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-outline font-semibold uppercase tracking-wider mb-2">Stock Level</label>
              <input 
                type="number" 
                min="0"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="10"
                className="w-full border border-surface-container p-3 text-on-background focus:outline-none focus:border-primary text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-outline font-semibold uppercase tracking-wider mb-2">Collection Category</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full border border-surface-container p-3 text-on-background focus:outline-none focus:border-primary bg-white text-sm"
            >
              <option value="">Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-outline font-semibold uppercase tracking-wider mb-2">Product Description</label>
            <textarea 
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed luxury material description, weaving style, and story..."
              className="w-full border border-surface-container p-3 text-on-background focus:outline-none focus:border-primary font-sans leading-relaxed text-sm"
            />
          </div>
        </div>

        {/* Multi Image Upload Sidebar */}
        <div className="space-y-6 bg-white p-6 border border-surface-container rounded-sm shadow-xs h-fit">
          <div>
            <h3 className="font-serif text-base font-bold text-primary uppercase tracking-wider mb-1">
              Product Images
            </h3>
            <p className="text-[11px] text-outline leading-normal mb-4">
              Upload multiple images (automatically compressed). Existing images stay at the top in upload order; new uploads append below. Click star to set primary.
            </p>

            {/* Upload Box */}
            <label className="border-2 border-dashed border-surface-container hover:border-primary p-6 rounded-sm text-center flex flex-col items-center justify-center cursor-pointer transition-colors bg-surface-container/10 mb-6">
              {uploadingImages ? (
                <div className="flex items-center space-x-2 text-primary font-medium py-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Compressing & uploading...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2 text-outline hover:text-primary">
                  <Upload className="w-6 h-6 mb-1 text-primary" />
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Select / Upload Multiple Images</span>
                  <span className="text-[10px] text-outline/80">JPEG, PNG, WEBP</span>
                </div>
              )}
              <input 
                type="file" 
                multiple 
                accept="image/jpeg,image/png,image/webp" 
                disabled={uploadingImages} 
                onChange={handleMultipleImageUpload} 
                className="hidden" 
              />
            </label>

            {/* Uploaded Images List in Upload Order */}
            {images.length > 0 ? (
              <div className="space-y-3">
                <span className="block text-[10px] font-sans text-outline uppercase tracking-wider font-bold">
                  Uploaded Gallery ({images.length} items)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {images.map((img, idx) => (
                    <div 
                      key={img.id || idx} 
                      className={`relative aspect-4/5 border rounded-xs overflow-hidden bg-surface-container/20 group transition-all ${
                        img.is_primary ? 'border-primary ring-2 ring-primary/40' : 'border-surface-container'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(img.id)}
                          className={`p-2 rounded-full cursor-pointer transition-colors ${
                            img.is_primary ? 'bg-primary text-white' : 'bg-white text-on-background hover:bg-primary hover:text-white'
                          }`}
                          title={img.is_primary ? 'Primary Image' : 'Set as Primary'}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      </div>

                      {img.is_primary && (
                        <div className="absolute top-1.5 left-1.5 bg-primary text-white text-[9px] font-sans uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-xs shadow-xs">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-outline text-[11px] border border-surface-container/40 rounded-xs">
                No images uploaded yet.
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
