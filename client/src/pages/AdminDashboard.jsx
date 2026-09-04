import { useCallback, useEffect, useState } from "react";
import {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getUsers,
  getPendingAdmins,
  verifyAdmin,
  deleteUser,
  getCurrentUser,
} from "../services/api";
import Footer from "../components/Footer";

/* =========================================
   STATUS CONFIG
========================================= */

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const STATUS_CONFIG = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Confirmed: "bg-sky-50 text-sky-700 border-sky-200",
  Preparing: "bg-orange-50 text-orange-700 border-orange-200",
  "Out for Delivery": "bg-indigo-50 text-indigo-700 border-indigo-200",
  Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

const MENU_CATEGORIES = [
  "Burgers",
  "Pizza",
  "Rolls",
  "Sandwiches",
  "Drinks",
  "Desserts",
  "Sides",
  "Combos",
];

/* =========================================
   ADMIN / OWNER DASHBOARD
========================================= */

const AdminDashboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("orders");
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const data = await getCurrentUser();
      if (data.user) {
        setCurrentUser(data.user);
        if (data.user.role === "owner") {
          setActiveTab("overview");
        } else {
          setActiveTab("orders");
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard user info:", err);
    } finally {
      setLoadingUser(false);
    }
  };

  const isOwner = currentUser?.role === "owner";

  const allTabs = [
    { id: "overview", label: "Overview", icon: "📊", ownerOnly: true },
    { id: "orders", label: "Orders & Live GPS", icon: "🧾", ownerOnly: false },
    { id: "menu", label: "Menu Items", icon: "🍔", ownerOnly: true },
    { id: "users", label: "Customer Accounts", icon: "👥", ownerOnly: false },
    { id: "admin-approvals", label: "Admin Verification", icon: "🔐", ownerOnly: true },
  ];

  const visibleTabs = allTabs.filter((t) => !t.ownerOnly || isOwner);

  if (loadingUser) {
    return <LoadingBox label="Initializing Command Portal..." />;
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-between">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 w-full">
        {/* HEADER */}
        <div className="mb-8 rounded-3xl bg-stone-900 text-white p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                {isOwner ? "👑 System Owner Console" : "🛠️ Admin Operations Console"}
              </span>
              {isOwner && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-900 text-[10px] font-black uppercase">
                  Full Authority
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
              {isOwner ? "Owner Master Dashboard" : "Kitchen & Order Controls"}
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              {isOwner
                ? "Full authorities: Menu dish management, Admin verification, Revenue analytics, and Customer control."
                : "Admin authorities: Restricted to handling customer orders and managing user accounts."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-bold text-stone-300">Logged in as {currentUser?.name} ({currentUser?.role})</span>
          </div>
        </div>

        {/* TABS */}
        <div className="mb-8 flex gap-2 overflow-x-auto border-b border-stone-200 pb-3 scrollbar-none">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs sm:text-sm font-bold tracking-tight transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-stone-900 text-white shadow-sm"
                  : "bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:bg-stone-50"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        {activeTab === "overview" && isOwner && <OverviewTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "menu" && isOwner && <MenuTab />}
        {activeTab === "users" && <UsersTab isOwner={isOwner} />}
        {activeTab === "admin-approvals" && isOwner && <AdminApprovalsTab />}
      </main>

      <Footer />
    </div>
  );
};

/* =========================================
   TAB 1 — OVERVIEW (OWNER ONLY)
========================================= */

const OverviewTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardStats()
      .then((data) => setStats(data.stats))
      .catch((err) => setError(err.message || "Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBox label="Loading dashboard metrics..." />;
  if (error) return <ErrorBox message={error} />;

  const cards = [
    { label: "Total Orders", value: stats.totalOrders, icon: "🧾", bg: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Total Revenue", value: `₹${stats.totalRevenue?.toFixed(2)}`, icon: "💰", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { label: "Menu Catalog", value: stats.totalMenuItems, icon: "🍔", bg: "bg-amber-50 text-amber-700 border-amber-200" },
    { label: "Registered Diners", value: stats.totalUsers, icon: "👥", bg: "bg-purple-50 text-purple-700 border-purple-200" },
  ];

  return (
    <div className="space-y-10">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl bg-white border border-stone-200/80 p-6 shadow-sm flex items-start justify-between"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
                {card.label}
              </span>
              <p className="text-3xl font-black text-stone-900 tracking-tight">
                {card.value ?? "—"}
              </p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-2xl ${card.bg}`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {stats.recentOrders?.length > 0 && (
        <div className="rounded-3xl bg-white border border-stone-200/80 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-stone-900 tracking-tight mb-4">
            Recent Kitchen Orders
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs font-bold uppercase tracking-wider text-stone-400">
                  <th className="pb-3 font-bold">Order Ref</th>
                  <th className="pb-3 font-bold">Customer</th>
                  <th className="pb-3 font-bold">Amount</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold">Placed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {stats.recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3.5 font-extrabold text-stone-900">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3.5 text-stone-700">{order.customer?.name}</td>
                    <td className="py-3.5 font-extrabold text-stone-900">₹{order.total?.toFixed(2)}</td>
                    <td className="py-3.5">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${STATUS_CONFIG[order.status] || "bg-stone-100 text-stone-600"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-xs text-stone-500">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================
   TAB 2 — ORDERS & LIVE GPS LOCATION
========================================= */

const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAllOrders();
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <LoadingBox label="Loading orders list..." />;
  if (error) return <ErrorBox message={error} onRetry={loadOrders} />;

  const filtered =
    statusFilter === "All"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {["All", ...ORDER_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
              statusFilter === s
                ? "bg-stone-900 text-white shadow-xs"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyBox label="No orders match this status." />
      ) : (
        <div className="rounded-3xl bg-white border border-stone-200/80 p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs font-bold uppercase tracking-wider text-stone-400">
                <th className="pb-3 font-bold">Order ID</th>
                <th className="pb-3 font-bold">Customer & Live Location</th>
                <th className="pb-3 font-bold">Items Summary</th>
                <th className="pb-3 font-bold">Total</th>
                <th className="pb-3 font-bold">Update Status</th>
                <th className="pb-3 font-bold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((order) => (
                <tr key={order._id} className="hover:bg-stone-50/60 transition align-top">
                  <td className="py-4 font-extrabold text-stone-900">
                    #{order._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="py-4">
                    <p className="font-bold text-stone-900">{order.customer?.name}</p>
                    <p className="text-xs text-stone-500">📞 {order.customer?.phone}</p>
                    <p className="text-xs text-stone-400 max-w-xs">{order.customer?.address}</p>

                    {/* Live GPS Maps Link */}
                    {order.location?.latitude && (
                      <div className="mt-2 text-xs">
                        <a
                          href={`https://www.google.com/maps?q=${order.location.latitude},${order.location.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-rose-600 hover:underline bg-rose-50 px-2 py-1 rounded-md border border-rose-200"
                        >
                          📍 Live GPS Navigation ↗
                        </a>
                      </div>
                    )}
                  </td>
                  <td className="py-4">
                    <ul className="text-xs text-stone-600 space-y-0.5">
                      {order.items?.map((item, i) => (
                        <li key={i}>
                          <span className="font-bold text-stone-800">{item.name}</span> ×{item.quantity}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-4 font-black text-rose-600 text-base">
                    ₹{order.total?.toFixed(2)}
                  </td>
                  <td className="py-4">
                    <select
                      value={order.status}
                      disabled={updatingId === order._id}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="rounded-xl border border-stone-300 bg-stone-50/80 px-3 py-1.5 text-xs font-bold text-stone-800 outline-none transition focus:border-stone-500 focus:bg-white"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {updatingId === order._id && (
                      <span className="ml-2 text-[10px] text-stone-400 animate-pulse">Saving...</span>
                    )}
                  </td>
                  <td className="py-4 text-xs text-stone-500">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { month: "short", day: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* =========================================
   TAB 3 — MENU MANAGEMENT (OWNER ONLY)
========================================= */

const EMPTY_FORM = {
  name: "",
  description: "",
  category: MENU_CATEGORIES[0],
  price: "",
  image: "",
  availability: true,
};

const MenuTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMenuItems();
      setItems(Array.isArray(data.menuItems) ? data.menuItems : []);
    } catch (err) {
      setError(err.message || "Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setModalMode("add");
  };

  const openEdit = (item) => {
    setForm({
      name: item.name,
      description: item.description,
      category: item.category,
      price: String(item.price),
      image: item.image || "",
      availability: item.availability,
    });
    setEditTarget(item);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditTarget(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
      };

      if (modalMode === "add") {
        const data = await createMenuItem(payload);
        setItems((prev) => [data.menuItem, ...prev]);
      } else {
        const data = await updateMenuItem(editTarget._id, payload);
        setItems((prev) =>
          prev.map((i) => (i._id === editTarget._id ? data.menuItem : i))
        );
      }
      closeModal();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this menu dish?")) return;
    setDeletingId(id);
    try {
      await deleteMenuItem(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingBox label="Loading kitchen menu..." />;
  if (error) return <ErrorBox message={error} onRetry={loadItems} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
          {items.length} Active Catalog Dishes (Owner Management Only)
        </p>

        <button
          onClick={openAdd}
          className="rounded-full bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition"
        >
          + Add New Dish
        </button>
      </div>

      <div className="rounded-3xl bg-white border border-stone-200/80 p-6 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs font-bold uppercase tracking-wider text-stone-400">
              <th className="pb-3 font-bold">Dish</th>
              <th className="pb-3 font-bold">Category</th>
              <th className="pb-3 font-bold">Price</th>
              <th className="pb-3 font-bold">In Stock</th>
              <th className="pb-3 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-stone-50/60 transition">
                <td className="py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center text-base">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        "🍔"
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-stone-900">{item.name}</p>
                      <p className="text-xs text-stone-400 max-w-xs truncate">{item.description}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5">
                  <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                    {item.category}
                  </span>
                </td>
                <td className="py-3.5 font-extrabold text-stone-900">₹{item.price?.toFixed(2)}</td>
                <td className="py-3.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${item.availability ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                    {item.availability ? "Available" : "Sold Out"}
                  </span>
                </td>
                <td className="py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(item)}
                      className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-bold text-stone-700 hover:bg-stone-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      disabled={deletingId === item._id}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      {deletingId === item._id ? "..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalMode && (
        <MenuItemModal
          mode={modalMode}
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
        />
      )}
    </div>
  );
};

/* =========================================
   MENU ITEM MODAL
========================================= */

const MenuItemModal = ({ mode, form, setForm, onSave, onClose, saving }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-stone-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
          <h2 className="text-xl font-bold text-stone-900">
            {mode === "add" ? "Create New Dish" : "Edit Menu Item"}
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-sm font-bold">✕</button>
        </div>

        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Dish Name *</label>
            <input
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Bacon Avocado Burger"
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm font-medium outline-none focus:border-stone-400 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Description *</label>
            <textarea
              name="description"
              required
              rows={3}
              value={form.description}
              onChange={handleChange}
              placeholder="Key ingredients, seasonings, and toppings..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm font-medium outline-none focus:border-stone-400 focus:bg-white resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm font-medium outline-none focus:border-stone-400 focus:bg-white"
              >
                {MENU_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Price (₹) *</label>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.price}
                onChange={handleChange}
                placeholder="199"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm font-medium outline-none focus:border-stone-400 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Photo Image URL</label>
            <input
              name="image"
              type="url"
              value={form.image}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm font-medium outline-none focus:border-stone-400 focus:bg-white"
            />
          </div>

          <label className="flex items-center gap-2 pt-2 cursor-pointer">
            <input
              name="availability"
              type="checkbox"
              checked={form.availability}
              onChange={handleChange}
              className="h-4 w-4 rounded accent-rose-600"
            />
            <span className="text-xs font-bold text-stone-800">Available For Instant Ordering</span>
          </label>

          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-full bg-rose-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : mode === "add" ? "Create Dish" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-stone-300 bg-white px-5 py-3 text-xs font-bold text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================
   TAB 4 — USER MANAGEMENT
========================================= */

const UsersTab = ({ isOwner }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getUsers();
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer account?")) return;
    setDeletingId(id);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      alert(`Failed to delete user: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingBox label="Loading registered users..." />;
  if (error) return <ErrorBox message={error} onRetry={loadUsers} />;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white border border-stone-200/80 p-6 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs font-bold uppercase tracking-wider text-stone-400">
              <th className="pb-3 font-bold">Diner Name</th>
              <th className="pb-3 font-bold">Contact Details</th>
              <th className="pb-3 font-bold">System Role</th>
              <th className="pb-3 font-bold">Joined On</th>
              <th className="pb-3 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-stone-50/60 transition">
                <td className="py-3.5 font-bold text-stone-900">{user.name}</td>
                <td className="py-3.5 text-xs text-stone-600">
                  <p>{user.email}</p>
                  {user.phone && <p className="text-stone-400">📞 {user.phone}</p>}
                </td>
                <td className="py-3.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${user.role === "owner" ? "bg-amber-400 text-stone-900" : user.role === "admin" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700"}`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3.5 text-xs text-stone-500">
                  {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", day: "2-digit", year: "numeric" })}
                </td>
                <td className="py-3.5">
                  {user.role === "user" || (isOwner && user.role !== "owner") ? (
                    <button
                      onClick={() => handleDelete(user._id)}
                      disabled={deletingId === user._id}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      {deletingId === user._id ? "..." : "Remove"}
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-stone-400">Protected</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* =========================================
   TAB 5 — OWNER ADMIN APPROVALS (OWNER ONLY)
========================================= */

const AdminApprovalsTab = () => {
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);

  const loadPendingAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPendingAdmins();
      setPendingAdmins(Array.isArray(data.pendingAdmins) ? data.pendingAdmins : []);
    } catch (err) {
      setError(err.message || "Failed to load pending admin verification applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingAdmins();
  }, [loadPendingAdmins]);

  const handleVerify = async (id, status) => {
    setActionId(id);
    try {
      await verifyAdmin(id, status);
      setPendingAdmins((prev) => prev.filter((a) => a._id !== id));
      alert(`Admin application ${status} successfully.`);
    } catch (err) {
      alert(`Failed to update admin application: ${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <LoadingBox label="Loading pending admin applications..." />;
  if (error) return <ErrorBox message={error} onRetry={loadPendingAdmins} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
          🔐 {pendingAdmins.length} Pending Admin Applications Awaiting Verification
        </p>
      </div>

      {pendingAdmins.length === 0 ? (
        <EmptyBox label="No pending admin applications. All applicants verified." />
      ) : (
        <div className="rounded-3xl bg-white border border-stone-200/80 p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs font-bold uppercase tracking-wider text-stone-400">
                <th className="pb-3 font-bold">Applicant Name</th>
                <th className="pb-3 font-bold">Contact Details</th>
                <th className="pb-3 font-bold">Aadhaar Card No.</th>
                <th className="pb-3 font-bold">Applied Date</th>
                <th className="pb-3 font-bold">Owner Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pendingAdmins.map((admin) => (
                <tr key={admin._id} className="hover:bg-stone-50/60 transition">
                  <td className="py-4 font-bold text-stone-900">{admin.name}</td>
                  <td className="py-4 text-xs text-stone-600">
                    <p className="font-semibold text-stone-800">{admin.email}</p>
                    <p className="text-stone-500">📞 {admin.phone}</p>
                  </td>
                  <td className="py-4 font-mono text-stone-800 font-bold text-xs bg-amber-50/60 px-2 py-1 rounded border border-amber-200 w-max">
                    {admin.aadhaarNumber || "Not Provided"}
                  </td>
                  <td className="py-4 text-xs text-stone-500">
                    {new Date(admin.createdAt).toLocaleDateString("en-IN", { month: "short", day: "2-digit", year: "numeric" })}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVerify(admin._id, "approved")}
                        disabled={actionId === admin._id}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition shadow-xs disabled:opacity-50"
                      >
                        ✓ Approve Admin
                      </button>
                      <button
                        onClick={() => handleVerify(admin._id, "rejected")}
                        disabled={actionId === admin._id}
                        className="rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-1.5 text-xs font-bold transition disabled:opacity-50"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* =========================================
   FEEDBACK BOXES
========================================= */

const LoadingBox = ({ label }) => (
  <div className="py-16 text-center">
    <span className="text-sm font-bold text-stone-500 animate-pulse">{label}</span>
  </div>
);

const ErrorBox = ({ message, onRetry }) => (
  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
    <p className="text-sm font-bold text-rose-700">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="mt-3 rounded-full bg-rose-600 px-4 py-1.5 text-xs font-bold text-white">
        Retry
      </button>
    )}
  </div>
);

const EmptyBox = ({ label }) => (
  <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center shadow-sm">
    <p className="text-stone-500 text-sm font-medium">{label}</p>
  </div>
);

export default AdminDashboard;