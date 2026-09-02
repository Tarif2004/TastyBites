import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-24 border-t border-stone-800 bg-stone-950 text-stone-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          
          {/* Brand & Story */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white font-black text-lg">
                🍔
              </span>
              <span className="text-2xl font-extrabold tracking-tight text-white">
                Tasty<span className="text-rose-500">Bites</span>
              </span>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-400">
              Honoring classic American culinary heritage with house-ground Angus beef, daily fresh-baked brioche buns, and hand-cut fries. Scratch cooking meets modern hospitality.
            </p>

            <div className="mt-6 flex items-center gap-4 text-xs font-semibold text-stone-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Kitchen Open Now
              </span>
              <span>•</span>
              <span>11:00 AM – 11:30 PM Daily</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              Navigation
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-stone-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-stone-400 hover:text-white transition-colors">
                  Menu & Specials
                </Link>
              </li>
              <li>
                <Link to="/my-orders" className="text-stone-400 hover:text-white transition-colors">
                  Track Orders
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-stone-400 hover:text-white transition-colors">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Guarantee */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              Our Promise
            </h3>
            <p className="mt-4 text-xs leading-relaxed text-stone-400">
              100% Certified Angus Beef. Never frozen patties. Farm-fresh local produce delivered daily to our diner kitchen.
            </p>

            <div className="mt-5 rounded-xl border border-stone-800 bg-stone-900/60 p-3">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Fast Delivery Hotline</p>
              <p className="text-lg font-extrabold text-white mt-0.5">📞 +1 (800) 555-TASTY</p>
            </div>
          </div>
        </div>

        {/* Sub-footer */}
        <div className="mt-14 border-t border-stone-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© 2026 TastyBites Kitchen & Bar. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-stone-400 cursor-pointer transition">Privacy Policy</span>
            <span className="hover:text-stone-400 cursor-pointer transition">Terms of Service</span>
            <span className="hover:text-stone-400 cursor-pointer transition">Food Allergy Notice</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;