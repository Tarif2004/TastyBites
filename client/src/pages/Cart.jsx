import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Footer from "../components/Footer";

const Cart = () => {
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    subtotal,
  } = useCart();

  const deliveryFee = subtotal > 0 ? (subtotal >= 500 ? 0 : 40) : 0;
  const total = subtotal + deliveryFee;

  /* Empty cart */
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-between">
        <main className="mx-auto flex flex-1 max-w-xl flex-col items-center justify-center px-4 py-20 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-stone-100 text-5xl mb-6">
            🛒
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
            Your Cart is Empty
          </h1>
          <p className="mt-3 text-sm sm:text-base text-stone-500 max-w-sm">
            Looks like you haven't added any artisanal burgers or sides to your tray yet.
          </p>
          <Link
            to="/menu"
            className="mt-8 rounded-full bg-rose-600 px-8 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Explore Kitchen Menu &rarr;
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* TOP BAR */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200/80 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Review Items</span>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight mt-1">
              Your Food Tray
            </h1>
          </div>

          <button
            onClick={clearCart}
            className="text-xs font-bold text-stone-400 hover:text-rose-600 transition"
          >
            Clear Entire Tray
          </button>
        </div>

        {/* 2-COLUMN LAYOUT */}
        <div className="grid gap-10 lg:grid-cols-12 items-start">
          
          {/* ITEMS LIST (LEFT) */}
          <section className="lg:col-span-7 space-y-4">
            {cartItems.map((item) => (
              <article
                key={item._id}
                className="flex items-center gap-4 sm:gap-6 rounded-2xl bg-white border border-stone-200/80 p-4 sm:p-5 shadow-sm"
              >
                {/* Image */}
                <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl">
                      🍔
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                        {item.name}
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        ₹{item.price} each
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="text-stone-400 hover:text-rose-600 transition text-sm p-1"
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Quantity Stepper & Subtotal */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-stone-200 bg-stone-50 p-1">
                      <button
                        onClick={() => decreaseQuantity(item._id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-stone-700 hover:bg-white transition text-xs font-black shadow-xs"
                      >
                        –
                      </button>
                      <span className="w-8 text-center text-xs font-extrabold text-stone-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increaseQuantity(item._id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-stone-700 hover:bg-white transition text-xs font-black shadow-xs"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-base sm:text-lg font-extrabold text-stone-900">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </article>
            ))}

            <div className="pt-4">
              <Link
                to="/menu"
                className="inline-flex items-center text-sm font-bold text-rose-600 hover:text-rose-700 transition"
              >
                &larr; Add more dishes from menu
              </Link>
            </div>
          </section>

          {/* CHECKOUT SUMMARY CARD (RIGHT) */}
          <aside className="lg:col-span-5 rounded-3xl bg-white border border-stone-200/80 p-6 sm:p-8 shadow-sm lg:sticky lg:top-28">
            <h2 className="text-xl font-black text-stone-900 tracking-tight pb-4 border-b border-stone-100">
              Order Summary
            </h2>

            <div className="mt-6 space-y-3.5 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-900">₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-stone-600">
                <span>Estimated Delivery</span>
                <span className="font-semibold text-stone-900">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600 font-bold">FREE</span>
                  ) : (
                    `₹${deliveryFee.toFixed(2)}`
                  )}
                </span>
              </div>

              {subtotal < 500 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-3 text-xs text-amber-800 font-medium">
                  Add <strong className="font-bold">₹{(500 - subtotal).toFixed(2)}</strong> more for free express delivery!
                </div>
              )}

              <div className="border-t border-stone-200 pt-4 flex justify-between text-lg font-black text-stone-900">
                <span>Total Due</span>
                <span className="text-2xl text-rose-600">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="mt-8 flex w-full items-center justify-center rounded-full bg-stone-900 py-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-rose-600 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
            >
              Continue to Checkout &rarr;
            </Link>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-stone-400">
              <span>🔒 Guaranteed Safe & Fresh</span>
            </div>
          </aside>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;