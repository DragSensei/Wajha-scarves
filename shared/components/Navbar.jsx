export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-2">
        <span className="text-2xl font-bold tracking-wide text-indigo-600">Wajha Scarves</span>
      </div>
      <div className="flex items-center space-x-6 text-gray-600 font-medium">
        <a href="#" className="hover:text-indigo-600 transition-colors">Home</a>
        <a href="#" className="hover:text-indigo-600 transition-colors">Products</a>
        <a href="#" className="hover:text-indigo-600 transition-colors">About</a>
        <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
      </div>
      <div className="flex items-center space-x-4">
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow">
          Cart (0)
        </button>
      </div>
    </nav>
  );
}
