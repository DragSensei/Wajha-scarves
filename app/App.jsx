import Navbar from '@/shared/components/Navbar';
import ProductGrid from '@/features/products/components/ProductGrid';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-7xl w-full mx-auto py-8 px-4">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            Wajha Scarves Store
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Premium quality scarves styled for elegance.
          </p>
        </header>
        <ProductGrid />
      </main>
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Wajha Scarves. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
