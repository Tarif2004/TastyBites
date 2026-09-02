import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMenuItems } from "../services/api";
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
    loadMenu();
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

      {/* VALUE BANNER */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
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