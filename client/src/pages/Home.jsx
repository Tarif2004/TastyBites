import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMenuItems, getActiveDiscounts } from "../services/api";
import RetroButton from "../components/RetroButton";
import SectionTitle from "../components/SectionTitle";
import FoodCard from "../components/FoodCard";
import CategoryCard from "../components/CategoryCard";
import Footer from "../components/Footer";

const categories = [
  { emoji: "🍔", title: "Burgers" },
  { emoji: "🍕", title: "Pizza" },
  { emoji: "🍟", title: "Sides" },
  { emoji: "🥤", title: "Drinks" },
  { emoji: "🍰", title: "Desserts" },
];

const Home = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const data = await getMenuItems();
        setItems(data.menuItems || []);
      } catch (error) {
        console.error("Home menu error:", error);
      } finally {
        setLoading(false);
      }
    };

    const loadOffers = async () => {
      try {
        const data = await getActiveDiscounts();
        setOffers(data.discounts || []);
      } catch {
        // Silently ignore — don't block the page if offers fail
        setOffers([]);
      } finally {
        setOffersLoading(false);
      }
    };

    loadMenu();
    loadOffers();
  }, []);

  const featuredItems = items
    .filter((item) => item.availability)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-100/80 via-[#fafaf9] to-[#fafaf9] border-b border-stone-200/60 pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-stone-900 text-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
                <span>🔥</span>
                <span>Craft Burgers & American Comfort</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-stone-900 leading-[1.08]">
                Real Ingredients. <br />
                <span className="text-rose-600">Uncompromising</span> Taste.
              </h1>

              <p className="mt-6 max-w-xl text-base sm:text-lg text-stone-600 leading-relaxed font-normal">
                Welcome to TastyBites — an artisanal American kitchen serving chef-crafted smash burgers, hand-spun shakes, and crispy scratch sides made fresh to order.
              </p>

              {/* Highlights badge row */}
              <div className="mt-6 flex flex-wrap items-center gap-5 text-xs font-semibold text-stone-700">
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-rose-600 font-bold">✓</span> 100% Angus Beef
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-rose-600 font-bold">✓</span> Brioche Baked Daily
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-rose-600 font-bold">✓</span> Fast Express Delivery
                </span>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/menu">
                  <RetroButton variant="primary" className="px-8 py-4 text-base">
                    Order Online Now &rarr;
                  </RetroButton>
                </Link>
                <Link to="/menu">
                  <RetroButton variant="outline" className="px-7 py-4 text-base">
                    View Full Menu
                  </RetroButton>
                </Link>
              </div>
            </div>

            {/* Hero Right Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-3xl bg-white p-6 shadow-2xl shadow-stone-900/10 border border-stone-200/80">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 via-amber-50 to-stone-100 flex flex-col items-center justify-center text-center p-8">
                  <span className="text-8xl sm:text-9xl drop-shadow-md hover:scale-110 transition-transform duration-300">
                    🍔
                  </span>
                  <div className="mt-6">
                    <span className="inline-block rounded-full bg-rose-600 text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1">
                      Chef's Special
                    </span>
                    <h3 className="mt-2 text-2xl font-black text-stone-900 tracking-tight">
                      Double Truffle Smash
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Aged cheddar, caramelized onions, truffle aioli on toasted potato roll.
                    </p>
                  </div>
                </div>

                {/* Floating Rating Pill */}
                <div className="absolute -bottom-4 -left-4 rounded-2xl bg-white p-4 shadow-xl border border-stone-200/80 flex items-center gap-3">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <p className="text-xs font-black text-stone-900">4.9 / 5 Rating</p>
                    <p className="text-[10px] text-stone-500">From 1,200+ food lovers</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Curated Flavors"
          title="Browse By Craving"
          description="From sizzling double smash burgers to hand-cut parmesan sides and creamy thick shakes."
        />

        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 sm:grid sm:grid-cols-5 sm:overflow-visible">
          {categories.map((category) => (
            <Link key={category.title} to="/menu" className="flex-1">
              <CategoryCard emoji={category.emoji} title={category.title} />
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED BESTSELLERS */}
      <section className="bg-stone-100/60 border-y border-stone-200/70 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <SectionTitle
              eyebrow="Signature Kitchen"
              title="Guest Favorites"
              description="The dishes that earned our diner its reputation across the neighborhood."
            />
            <Link to="/menu" className="hidden sm:inline-block pb-10">
              <span className="text-sm font-bold text-rose-600 hover:text-rose-700 transition underline underline-offset-4">
                Explore Full Menu &rarr;
              </span>
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((num) => (
                <div key={num} className="h-96 animate-pulse rounded-2xl bg-white border border-stone-200" />
              ))}
            </div>
          ) : featuredItems.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-sm">
              <p className="text-lg font-bold text-stone-800">Fresh specials cooking up right now!</p>
              <Link to="/menu" className="mt-4 inline-block text-sm font-bold text-rose-600 underline">
                Browse our complete menu
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featuredItems.map((item) => (
                <FoodCard key={item._id} item={item} />
              ))}
            </div>
          )}

          <div className="mt-12 text-center sm:hidden">
            <Link to="/menu">
              <RetroButton variant="secondary" className="w-full">
                View Full Menu &rarr;
              </RetroButton>
            </Link>
          </div>
        </div>
      </section>

      {/* OFFERS & DEALS SECTION — shown only when there are active discounts */}
      {(offersLoading || offers.length > 0) && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="🏷️ Limited Time"
            title="Diner Deals & Offers"
            description="Use these exclusive promo codes at checkout to save on your next order."
          />

          {offersLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-10">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-40 animate-pulse rounded-3xl bg-stone-100 border border-stone-200" />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-10">
              {offers.map((offer) => (
                <CouponCard key={offer._id} offer={offer} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* DINE IN CTA SECTION */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-stone-100 border border-amber-200/80 p-8 sm:p-12 shadow-sm">
          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 border border-amber-300 text-amber-900 px-3.5 py-1 text-xs font-black uppercase tracking-wider mb-3">
                <span>🍽️</span>
                <span>Dine In With Us</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
                Grab a table. Enjoy the vibe.
              </h2>
              <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-xl leading-relaxed">
                Experience TastyBites 90 in person. Reserve your booth in advance with live seating availability for solo diners, couples, or family groups up to 10 people.
              </p>
            </div>
            <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col justify-center md:items-end gap-3">
              <Link to="/dine-in" className="w-full sm:w-auto">
                <RetroButton variant="primary" className="w-full sm:w-auto px-8 py-4 text-base shadow-lg shadow-rose-600/20">
                  Book A Table 🍽️
                </RetroButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE BANNER */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-900 to-stone-950 px-6 py-16 sm:px-12 sm:py-20 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block rounded-full bg-rose-600 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white mb-4">
              Dine In Or Deliver
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Hot, fresh, and delivered right to your door.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-stone-300 leading-relaxed font-normal">
              Skip the wait. Order online in 60 seconds with live order tracking from our kitchen grill to your hands.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/menu">
                <RetroButton variant="primary" className="px-8 py-3.5">
                  Order For Delivery
                </RetroButton>
              </Link>
            </div>
          </div>

          <div className="pointer-events-none absolute -bottom-10 -right-10 text-[14rem] opacity-10 select-none">
            🍟
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;

/* =========================================
   COUPON CARD — User-facing deal display
========================================= */

const CouponCard = ({ offer }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(offer.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const expiresOn = new Date(offer.endDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border-2 border-dashed border-amber-300 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition group">
      {/* Top strip */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 ${
          offer.type === "percentage" ? "bg-rose-500" : "bg-amber-500"
        }`}
      />

      {/* Offer Value */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-rose-700 mb-3">
          🏷️ Limited Time Offer
        </span>
        <h3 className="text-2xl font-black text-stone-900 tracking-tight leading-tight">
          {offer.type === "percentage"
            ? `${offer.value}% OFF`
            : `₹${offer.value} FLAT OFF`}
        </h3>
        <p className="text-xs font-semibold text-stone-700 mt-1">{offer.name}</p>
        {offer.description && (
          <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">{offer.description}</p>
        )}
      </div>

      {/* Fine print */}
      <div className="text-[11px] text-stone-500 space-y-1 mb-4 border-t border-dashed border-stone-200 pt-3">
        {offer.minimumOrderAmount > 0 && (
          <p>Min. order: <span className="font-bold text-stone-700">₹{offer.minimumOrderAmount}</span></p>
        )}
        {offer.type === "percentage" && offer.maximumDiscountAmount && (
          <p>Max savings: <span className="font-bold text-stone-700">₹{offer.maximumDiscountAmount}</span></p>
        )}
        <p>Expires: <span className="font-bold text-stone-700">{expiresOn}</span></p>
      </div>

      {/* Coupon code + copy button */}
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-xl bg-stone-900 px-4 py-2.5 text-center font-mono text-sm font-black tracking-widest text-amber-300 select-all">
          {offer.code}
        </div>
        <button
          onClick={handleCopy}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition cursor-pointer ${
            copied
              ? "bg-emerald-500 text-white"
              : "bg-stone-900 text-white hover:bg-rose-600"
          }`}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>

      <Link
        to="/checkout"
        className="mt-3 block text-center text-[11px] font-bold text-rose-600 hover:text-rose-700 underline underline-offset-2"
      >
        Apply at Checkout →
      </Link>
    </div>
  );
};