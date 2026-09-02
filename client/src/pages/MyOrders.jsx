import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders } from "../services/api";
import Footer from "../components/Footer";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getMyOrders();
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (err) {
        console.error("Orders loading error:", err);
        setError(err.message || "Unable to load orders.");
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-between">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full">
        
        {/* PAGE HEADER */}
        <div className="mb-10 border-b border-stone-200/80 pb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Account</span>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight mt-1">
            Order History & Tracking
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            View live status updates or review previous gourmet meals.
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2">
            {[1, 2].map((n) => (
              <div key={n} className="h-64 animate-pulse rounded-2xl bg-white border border-stone-200" />
            ))}
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && orders.length === 0 && (
          <div className="mx-auto max-w-md rounded-3xl border border-stone-200 bg-white p-12 text-center shadow-sm">
            <span className="text-6xl mb-4 block">🍔</span>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">No Orders Placed Yet</h2>
            <p className="mt-2 text-sm text-stone-500">
              You haven't ordered from our kitchen yet. Your delicious journey begins with our signature burgers!
            </p>
            <Link
              to="/menu"
              className="mt-6 inline-block rounded-full bg-rose-600 px-7 py-3 text-sm font-bold text-white hover:bg-rose-700 transition"
            >
              Explore Menu &rarr;
            </Link>
          </div>
        )}

        {/* ORDERS LIST */}
        {!loading && !error && orders.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};

const OrderCard = ({ order }) => {
  const status = order.status || "Pending";

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Recent";

  return (
    <article className="flex flex-col justify-between rounded-2xl bg-white border border-stone-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Order Ref</span>
            <p className="font-extrabold text-stone-900 text-base">
              #{order._id.slice(-6).toUpperCase()}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">{formattedDate}</p>
          </div>

          <StatusBadge status={status} />
        </div>

        {/* Items */}
        <div className="mt-4 divide-y divide-stone-100">
          {order.items?.map((item, idx) => (
            <div key={idx} className="py-2.5 flex justify-between items-center text-sm">
              <span className="font-medium text-stone-800">
                {item.name} <strong className="text-xs text-stone-400 font-bold">×{item.quantity}</strong>
              </span>
              <span className="font-bold text-stone-900">
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Total */}
      <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Paid</span>
          <p className="text-xl font-black text-rose-600">₹{order.total?.toFixed(2)}</p>
        </div>

        <Link
          to={`/orders/${order._id}`}
          className="rounded-full bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 transition"
        >
          View Details &rarr;
        </Link>
      </div>
    </article>
  );
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Confirmed: "bg-sky-50 text-sky-700 border-sky-200",
    Preparing: "bg-orange-50 text-orange-700 border-orange-200",
    "Out for Delivery": "bg-indigo-50 text-indigo-700 border-indigo-200",
    Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  }[status] || "bg-stone-100 text-stone-600 border-stone-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold tracking-tight ${statusConfig}`}>
      {status}
    </span>
  );
};

export default MyOrders;