import { useEffect, useState } from 'react';
import { fetchProducts } from '../server/productsApi';

export default function ProductGrid() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading scarves...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      {products.map((product) => (
        <div key={product.id} className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg text-gray-800">{product.name}</h3>
          <p className="text-gray-600 mt-1">${product.price.toFixed(2)}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">Color: {product.color}</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
