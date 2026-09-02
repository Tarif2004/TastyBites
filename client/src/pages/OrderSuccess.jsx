import { Link, useParams } from "react-router-dom";
import Footer from "../components/Footer";

const OrderSuccess = () => {
  const { orderId } = useParams();

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-between">
      <main className="mx-auto flex flex-1 max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
        
        {/* Animated Celebration Icon */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-4xl mb-6 shadow-sm ring-8 ring-emerald-50">
          ✓
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-rose-600">
          Order Confirmed
        </span>

        <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-stone-900">
          We're Firing Up the Grill!
        </h1>

        <p className="mt-3 text-sm sm:text-base text-stone-500 leading-relaxed max-w-md">
          Thank you for choosing TastyBites. Your order has been dispatched to our kitchen and our chefs are preparing it fresh.
        </p>

        {/* Order Card Detail */}
        <div className="mt-8 w-full rounded-2xl border border-stone-200 bg-white p-6 shadow-sm text-left">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Order Reference</span>
            <span className="text-sm font-extrabold text-stone-900">#{orderId?.slice(-6).toUpperCase()}</span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-stone-600">
            <span>Estimated Kitchen Time</span>
            <span className="font-bold text-emerald-600">25–35 Mins</span>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-stone-600">
            <span>Payment Method</span>
            <span className="font-semibold text-stone-800">Cash on Delivery (COD)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Link
            to={`/orders/${orderId}`}
            className="rounded-full bg-stone-900 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-stone-800 transition"
          >
            Track Order Live &rarr;
          </Link>

          <Link
            to="/menu"
            className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-bold text-stone-700 shadow-sm hover:bg-stone-50 transition"
          >
            Back to Menu
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default OrderSuccess;