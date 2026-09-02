import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrderById } from "../services/api";
import Footer from "../components/Footer";

const STATUS_STEPS = [
  { key: "Pending", label: "Order Received", desc: "Sent to the kitchen grill" },
  { key: "Confirmed", label: "Confirmed", desc: "Chef reviewed & ingredients prepped" },
  { key: "Preparing", label: "Cooking Fresh", desc: "Sizzling on the flat-top" },
  { key: "Out for Delivery", label: "On The Road", desc: "Handed to courier for delivery" },
  { key: "Delivered", label: "Delivered", desc: "Enjoy your meal!" },
];

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getOrderById(orderId);
        setOrder(data.order);
      } catch (err) {
        console.error("Order details error:", err);
        setError(err.message || "Unable to load order details.");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="animate-pulse text-stone-500 font-bold text-sm">
          Loading order details...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-between">
        <main className="mx-auto flex flex-1 max-w-md flex-col items-center justify-center px-4 py-20 text-center">
          <span className="text-6xl mb-4">🔍</span>
          <h1 className="text-2xl font-bold text-stone-900">Order Not Found</h1>
          <p className="mt-2 text-sm text-stone-500">{error || "This order reference doesn't exist."}</p>
          <Link
            to="/my-orders"
            className="mt-6 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-bold text-white"
          >
            &larr; Back to Order History
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isCancelled = order.status === "Cancelled";

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-between">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 w-full">
        
        {/* BACK BUTTON */}
        <Link
          to="/my-orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition mb-6"
        >
          &larr; Back to All Orders
        </Link>

        {/* ORDER BANNER */}
        <div className="rounded-3xl bg-stone-900 text-white p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-rose-500">
              Live Order Tracker
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
              Order #{order._id.slice(-6).toUpperCase()}
            </h1>
            <p className="text-xs text-stone-400 mt-1">
              Placed on {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>

          <div className="rounded-2xl bg-stone-800/80 border border-stone-700 px-5 py-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Current Status</span>
            <span className="text-base font-extrabold text-white mt-0.5 inline-block">
              {order.status}
            </span>
          </div>
        </div>

        {/* TRACKER TIMELINE */}
        <div className="mt-8 rounded-3xl bg-white border border-stone-200/80 p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-stone-900 tracking-tight mb-6">
            Preparation Progress
          </h2>

          {isCancelled ? (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-800 text-sm font-semibold">
              This order was cancelled. Please contact kitchen support if you have questions.
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-8 border-l-2 border-stone-200">
              {STATUS_STEPS.map((step, idx) => {
                const currentIdx = STATUS_STEPS.findIndex((s) => s.key === order.status);
                const isPassed = currentIdx >= idx;
                const isCurrent = currentIdx === idx;

                return (
                  <div key={step.key} className="relative">
                    <span
                      className={`absolute -left-[31px] sm:-left-[39px] flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                        isCurrent
                          ? "bg-rose-600 border-rose-600 text-white ring-4 ring-rose-100"
                          : isPassed
                          ? "bg-stone-900 border-stone-900 text-white"
                          : "bg-white border-stone-300 text-stone-400"
                      }`}
                    >
                      {isPassed ? "✓" : idx + 1}
                    </span>

                    <div>
                      <p className={`text-sm font-bold ${isCurrent ? "text-rose-600" : isPassed ? "text-stone-900" : "text-stone-400"}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2-COLUMN DETAILS */}
        <div className="mt-8 grid gap-8 lg:grid-cols-12 items-start">
          
          {/* ITEMS */}
          <section className="lg:col-span-7 rounded-3xl bg-white border border-stone-200/80 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-stone-900 tracking-tight pb-3 border-b border-stone-100">
              Ordered Items
            </h2>

            <div className="mt-4 divide-y divide-stone-100">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center text-lg">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        "🍔"
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-stone-900">{item.name}</p>
                      <p className="text-xs text-stone-500">₹{item.price} × {item.quantity}</p>
                    </div>
                  </div>

                  <span className="font-bold text-stone-900">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* BILL & DELIVERY */}
          <aside className="lg:col-span-5 space-y-6">
            {/* Bill summary */}
            <div className="rounded-3xl bg-white border border-stone-200/80 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-stone-900 tracking-tight pb-3 border-b border-stone-100">
                Receipt Breakdown
              </h2>

              <div className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">₹{order.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-stone-900">₹{order.deliveryFee?.toFixed(2)}</span>
                </div>
                <div className="border-t border-stone-200 pt-3 flex justify-between text-base font-black text-stone-900">
                  <span>Total Paid</span>
                  <span className="text-xl text-rose-600">₹{order.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Destination card */}
            <div className="rounded-3xl bg-white border border-stone-200/80 p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
                Delivery Address
              </h3>
              <p className="text-sm font-bold text-stone-900">{order.customer?.name}</p>
              <p className="text-xs text-stone-600 mt-1">{order.customer?.phone}</p>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">{order.customer?.address}</p>
            </div>
          </aside>

        </div>

      </main>

      <Footer />
    </div>
  );
};

export default OrderDetails;