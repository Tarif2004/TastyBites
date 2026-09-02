import { useCart } from "../context/CartContext";

const FoodCard = ({ item, onAddToCart }) => {
  const { addToCart } = useCart();

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart(item);
      return;
    }
    addToCart(item);
  };

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-stone-200/80 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-stone-300 hover:-translate-y-1">
      
      {/* MEDIA CONTAINER */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100 text-6xl">
            🍔
          </div>
        )}

        {/* CATEGORY TAG */}
        {item.category && (
          <span className="absolute top-3 left-3 rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[11px] font-bold tracking-wider uppercase text-stone-800 shadow-sm border border-white/60">
            {item.category}
          </span>
        )}

        {/* SOLD OUT OVERLAY */}
        {!item.availability && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-900/60 backdrop-blur-[2px]">
            <span className="rounded-full bg-stone-900 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md border border-stone-700">
              Sold Out For Today
            </span>
          </div>
        )}
      </div>

      {/* BODY CONTENT */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-stone-900 group-hover:text-rose-600 transition-colors">
            {item.name}
          </h3>

          <p className="mt-2 line-clamp-2 text-xs sm:text-sm text-stone-500 leading-relaxed font-normal">
            {item.description || "Handcrafted fresh to order with housemade secret seasonings."}
          </p>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="mt-5 flex items-center justify-between pt-4 border-t border-stone-100">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Price</span>
            <span className="text-2xl font-extrabold tracking-tight text-stone-900">
              ₹{item.price}
            </span>
          </div>

          {item.availability ? (
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-rose-600 hover:shadow-md hover:scale-[1.03] active:scale-[0.97]"
            >
              <span>+</span>
              <span>Add to Order</span>
            </button>
          ) : (
            <span className="rounded-full bg-stone-100 px-3.5 py-1.5 text-xs font-bold text-stone-400">
              Unavailable
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default FoodCard;