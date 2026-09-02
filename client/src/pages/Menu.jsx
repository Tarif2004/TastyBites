import { useEffect, useMemo, useState } from "react";
import { getMenuItems } from "../services/api";
import FoodCard from "../components/FoodCard";
import SectionTitle from "../components/SectionTitle";
import Footer from "../components/Footer";

const Menu = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    let mounted = true;
    const loadMenu = async () => {
      try {
        setLoading(true);
        const data = await getMenuItems();
        if (mounted) {
          setItems(data.menuItems || []);
        }
      } catch (err) {
        console.error("Menu loading error:", err);
        if (mounted) {
          setError(err.message || "Unable to load menu");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMenu();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(items.map((item) => item.category).filter(Boolean)),
    ];
    return ["All", ...uniqueCategories];
  }, [items]);

  const filteredItems = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !searchText ||
        item.name?.toLowerCase().includes(searchText) ||
        item.description?.toLowerCase().includes(searchText) ||
        item.category?.toLowerCase().includes(searchText);

      const matchesCategory =
        category === "All" || item.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [items, search, category]);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      
      {/* HEADER BANNER */}
      <section className="border-b border-stone-200/80 bg-stone-900 text-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block rounded-full bg-rose-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white mb-3">
            Handcrafted To Order
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
            Our Kitchen Menu
          </h1>
          <p className="mt-3 max-w-xl mx-auto text-sm sm:text-base text-stone-300 font-normal">
            Every burger smashed fresh, every roll toasted in butter, and every sauce mixed in-house.
          </p>
        </div>
      </section>

      {/* FILTER & SEARCH BAR */}
      <section className="sticky top-[61px] z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-md py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search burgers, sides, drinks..."
                className="w-full rounded-full border border-stone-200 bg-stone-50/80 py-2.5 pl-10 pr-4 text-sm font-medium text-stone-800 placeholder-stone-400 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900/5"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-700"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((itemCat) => (
                <button
                  key={itemCat}
                  onClick={() => setCategory(itemCat)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs sm:text-sm font-bold tracking-tight transition-all cursor-pointer ${
                    category === itemCat
                      ? "bg-stone-900 text-white shadow-sm"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200/80"
                  }`}
                >
                  {itemCat}
                </button>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* MENU GRID */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Loading State */}
        {loading && (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div
                key={num}
                className="h-96 animate-pulse rounded-2xl bg-white border border-stone-200"
              />
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
            <h2 className="text-xl font-bold text-rose-800">Unable to load menu</h2>
            <p className="mt-2 text-sm text-rose-600">{error}</p>
          </div>
        )}

        {/* Items Found */}
        {!loading && !error && filteredItems.length > 0 && (
          <>
            <div className="mb-6 flex items-center justify-between text-xs sm:text-sm font-semibold text-stone-500">
              <span>
                Showing <strong className="text-stone-900">{filteredItems.length}</strong> {filteredItems.length === 1 ? "dish" : "dishes"}
              </span>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-rose-600 hover:underline font-bold"
                >
                  Clear search query
                </button>
              )}
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <FoodCard key={item._id} item={item} />
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !error && filteredItems.length === 0 && (
          <div className="mx-auto max-w-md rounded-3xl border border-stone-200 bg-white p-12 text-center shadow-sm">
            <span className="text-6xl mb-4 block">🔍</span>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
              No Dishes Found
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              We couldn't find anything matching your search. Try checking your spelling or reset the filter.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
              className="mt-6 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-stone-800 transition"
            >
              Reset All Filters
            </button>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};

export default Menu;