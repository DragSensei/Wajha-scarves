import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-surface-container/60 mt-20 py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div>
          <h3 className="text-lg font-serif tracking-widest text-primary uppercase font-bold mb-4">Diya</h3>
          <p className="text-xs font-sans leading-relaxed text-outline">
            A boutique luxury scarf brand dedicated to bringing premium materials, high-fashion modesty, and elegance together.
          </p>
        </div>
        
        <div>
          <h4 className="text-xs font-sans tracking-widest text-on-background uppercase font-bold mb-4">Customer Care</h4>
          <ul className="space-y-2 text-xs font-sans text-outline">
            <li><Link to="/shipping" className="hover:text-primary transition-colors">Shipping & Returns</Link></li>
            <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
            <li><Link to="/care" className="hover:text-primary transition-colors">Product Care Instructions</Link></li>
            <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Support</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-sans tracking-widest text-on-background uppercase font-bold mb-4">Our Brand</h4>
          <ul className="space-y-2 text-xs font-sans text-outline">
            <li><Link to="/our-story" className="hover:text-primary transition-colors">About Us</Link></li>
            <li><Link to="/sustainability" className="hover:text-primary transition-colors">Sustainability</Link></li>
            <li><Link to="/press" className="hover:text-primary transition-colors">Press</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-sans tracking-widest text-on-background uppercase font-bold mb-4">Newsletter</h4>
          <p className="text-xs font-sans text-outline mb-4">Subscribe to receive notifications about new drops and exclusive private sales.</p>
          <div className="flex border-b border-primary py-1">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="w-full text-xs font-sans bg-transparent focus:outline-hidden text-on-background"
            />
            <button className="text-xs font-sans tracking-widest uppercase text-primary font-bold hover:text-primary-container transition-colors pl-2">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-surface-container flex flex-col md:flex-row items-center justify-between text-[10px] font-sans text-outline tracking-wider uppercase">
        <div>&copy; {new Date().getFullYear()} Diya Silk Scarves. All rights reserved.</div>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
