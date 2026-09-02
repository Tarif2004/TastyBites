import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createOrder } from "../services/api";
import Footer from "../components/Footer";

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, subtotal, clearCart } = useCart();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const deliveryFee = subtotal > 0 ? (subtotal >= 500 ? 0 : 40) : 0;
  const total = subtotal + deliveryFee;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((curr) => ({ ...curr, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your full delivery name.");
      return;
    }

    const cleanPhone = form.phone.replace(/[\s-]/g, "");
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit mobile phone number.");
      return;
    }

    if (form.address.trim().length < 10) {
      setError("Please enter your complete street address and landmark.");
      return;
    }

    try {
      setLoading(true);

      const items = cartItems.map((item) => ({
        menuItem: item._id,
        quantity: item.quantity,
      }));

      const payload = {
        items,
        customer: {
          name: form.name.trim(),
          phone: cleanPhone,
          address: form.address.trim(),
        },
        paymentMethod: "COD",
      };

      const response = await createOrder(payload);
      clearCart();
      navigate(`/order-success/${response.order._id}`);
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message || "Unable to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* Empty Cart Redirect screen */
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-between">
        <main className="mx-auto flex flex-1 max-w-md flex-col items-center justify-center px-4 py-20 text-center">
          <span className="text-6xl mb-4">🍽️</span>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Your Tray is Empty</h1>
          <p className="mt-2 text-sm text-stone-500">Please choose your meals before checking out.</p>
          <Link
            to="/menu"
            className="mt-6 rounded-full bg-rose-600 px-6 py-3 text-sm font-bold text-white hover:bg-rose-700 transition"
          >
            Browse Menu &rarr;
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="mb-10 border-b border-stone-200/80 pb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Final Step</span>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight mt-1">
            Express Checkout
          </h1>
        </div>

        {/* 2-COLUMN GRID */}
        <div className="grid gap-12 lg:grid-cols-12 items-start">
          
          {/* DELIVERY FORM (LEFT) */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="rounded-3xl bg-white border border-stone-200/80 p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-stone-900 tracking-tight mb-6">
                Delivery Details
              </h2>

              {error && (
                <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs sm:text-sm font-semibold text-rose-700">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Alex Morgan"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm font-medium text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900/5"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                    Mobile Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm font-medium text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900/5"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                    Street Address & Landmark
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    required
                    rows={4}
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Apartment / Suite, Building, Street Address, City, PIN"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm font-medium text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900/5 resize-none"
                  />
                </div>

                {/* Payment Selection */}
                <div className="pt-4 border-t border-stone-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                    Payment Method
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border-2 border-stone-900 bg-stone-50 p-4">
                    <span className="text-2xl">💵</span>
                    <div>
                      <p className="text-sm font-bold text-stone-900">Cash On Delivery (COD)</p>
                      <p className="text-xs text-stone-500">Pay conveniently with cash or UPI at your doorstep.</p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full rounded-full bg-rose-600 py-4 text-sm font-bold text-white shadow-sm hover:bg-rose-700 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? "Placing Order..." : `Confirm & Place Order (₹${total.toFixed(2)})`}
                </button>
              </div>
            </form>
          </div>

          {/* ORDER SUMMARY (RIGHT) */}
          <aside className="lg:col-span-5 rounded-3xl bg-white border border-stone-200/80 p-6 sm:p-8 shadow-sm lg:sticky lg:top-28">
            <h2 className="text-xl font-bold text-stone-900 tracking-tight pb-4 border-b border-stone-100">
              Your Order ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)
            </h2>

            <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-stone-100 pr-1">
              {cartItems.map((item) => (
                <div key={item._id} className="py-3 flex justify-between items-center gap-4 text-sm">
                  <div>
                    <p className="font-bold text-stone-900">{item.name}</p>
                    <p className="text-xs text-stone-500">Qty: {item.quantity} × ₹{item.price}</p>
                  </div>
                  <span className="font-bold text-stone-900">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-stone-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery Fee</span>
                <span className="font-semibold text-stone-900">
                  {deliveryFee === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className="border-t border-stone-200 pt-3 flex justify-between text-lg font-black text-stone-900">
                <span>Total Due</span>
                <span className="text-2xl text-rose-600">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </aside>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;