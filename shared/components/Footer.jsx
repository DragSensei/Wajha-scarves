import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-surface-container/60 mt-20 py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div>
          <h3 className="text-lg font-serif tracking-widest text-primary uppercase font-bold mb-4">Diya</h3>
          <p className="text-xs font-sans leading-relaxed text-outline mb-3">
            A boutique luxury scarf brand dedicated to bringing premium materials, high-fashion modesty, and elegance together.
          </p>
          <Link to="/donation" className="block text-[10px] font-sans text-primary/80 bg-primary/5 p-2.5 border border-primary/20 hover:bg-primary/10 transition-colors">
            ♥ <strong>Charitable Pledge:</strong> A portion of proceeds from every collection is donated to 57357 Hospital & charities. Learn more →
          </Link>
        </div>
        
        <div>
          <h4 className="text-xs font-sans tracking-widest text-on-background uppercase font-bold mb-4">Account & Rewards</h4>
          <ul className="space-y-2 text-xs font-sans text-outline">
            <li><Link to="/rewards" className="hover:text-primary transition-colors text-primary font-medium">Diya Rewards Club</Link></li>
            <li><Link to="/vouchers" className="hover:text-primary transition-colors text-primary font-medium">Digital Gift Vouchers</Link></li>
            <li><Link to="/profile" className="hover:text-primary transition-colors">My Profile & Orders</Link></li>
            <li><Link to="/wishlist" className="hover:text-primary transition-colors">Saved Wishlist</Link></li>
            <li><Link to="/our-story" className="hover:text-primary transition-colors">Our Brand Story</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-sans tracking-widest text-on-background uppercase font-bold mb-4">Customer Care</h4>
          <ul className="space-y-2 text-xs font-sans text-outline">
            <li><Link to="/donation" className="hover:text-primary transition-colors text-primary font-medium">57357 Donation & Giving Back</Link></li>
            <li><Link to="/our-story" className="hover:text-primary transition-colors">About Us</Link></li>
            <li><Link to="/rewards" className="hover:text-primary transition-colors">Tier Benefits & Perks</Link></li>
            <li><a href="mailto:support@diyascarves.com" className="hover:text-primary transition-colors">Contact Support</a></li>
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
            <button className="text-xs font-sans tracking-widest uppercase text-primary font-bold hover:text-primary-container transition-colors pl-2 cursor-pointer">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-surface-container flex flex-col md:flex-row items-center justify-between text-[10px] font-sans text-outline tracking-wider uppercase">
        <div>&copy; {new Date().getFullYear()} Diya Silk Scarves. All rights reserved.</div>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <Link to="/our-story" className="hover:text-primary">Privacy & Terms</Link>
        </div>
      </div>
    </footer>
  );
}
