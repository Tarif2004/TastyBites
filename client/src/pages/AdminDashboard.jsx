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
  getAdminDineInSettings,
  updateAdminDineInSettings,
  getAdminDineInReservations,
  updateAdminDineInReservationStatus,
  getOwnerDiscounts,
  createOwnerDiscount,
  updateOwnerDiscount,
  toggleOwnerDiscountStatus,
  deleteOwnerDiscount,
} from "../services/api";
import Footer from "../components/Footer";
import ImageUpload from "../components/ImageUpload";

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
    { id: "dine-in-bookings", label: "Dine-In Bookings", icon: "🍽️", ownerOnly: false },
    { id: "dine-in-settings", label: "Dine-In Settings", icon: "⚙️", ownerOnly: false },
    { id: "menu", label: "Menu Items", icon: "🍔", ownerOnly: true },
    { id: "discounts", label: "Discounts & Offers", icon: "🏷️", ownerOnly: true },
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
                <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                  Full Access
                </span>
              )}
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight">
              Restaurant Control Deck
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-400 max-w-xl">
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
        {activeTab === "dine-in-bookings" && <DineInBookingsTab />}
        {activeTab === "dine-in-settings" && <DineInSettingsTab />}
        {activeTab === "menu" && isOwner && <MenuTab />}
        {activeTab === "discounts" && isOwner && <DiscountsTab />}
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
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Dish Image
            </label>
            <ImageUpload
              value={form.image}
              onChange={(url) => setForm((prev) => ({ ...prev, image: url }))}
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
   TAB — DISCOUNTS & OFFERS (OWNER ONLY)
========================================= */

const EMPTY_DISCOUNT = {
  name: "",
  code: "",
  type: "percentage",
  value: "",
  minimumOrderAmount: "",
  maximumDiscountAmount: "",
  startDate: new Date().toISOString().slice(0, 16),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  usageLimit: "",
  perUserLimit: 1,
  active: true,
  description: "",
};

const DiscountsTab = () => {
  const [discounts, setDiscounts] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, active: 0, totalRedemptions: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (filterStatus !== "all") params.status = filterStatus;
      if (search.trim()) params.search = search.trim();
      const res = await getOwnerDiscounts(params);
      setDiscounts(res.discounts || []);
      if (res.metrics) setMetrics(res.metrics);
    } catch (err) {
      setError(err.message || "Failed to load discounts");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    loadDiscounts();
  }, [loadDiscounts]);

  const handleToggleStatus = async (item) => {
    try {
      setActionLoadingId(item._id);
      await toggleOwnerDiscountStatus(item._id, !item.active);
      setDiscounts((prev) =>
        prev.map((d) => (d._id === item._id ? { ...d, active: !item.active } : d))
      );
      loadDiscounts();
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${item.code}"?`)) {
      return;
    }
    try {
      setActionLoadingId(item._id);
      await deleteOwnerDiscount(item._id);
      setDiscounts((prev) => prev.filter((d) => d._id !== item._id));
      loadDiscounts();
    } catch (err) {
      alert(`Failed to delete coupon: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const openAdd = () => {
    setSelectedDiscount(null);
    setModalMode("add");
  };

  const openEdit = (item) => {
    setSelectedDiscount(item);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedDiscount(null);
  };

  const getStatusBadge = (d) => {
    const now = new Date();
    const start = new Date(d.startDate);
    const end = new Date(d.endDate);

    if (!d.active) {
      return (
        <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Inactive
        </span>
      );
    }
    if (end < now) {
      return (
        <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-stone-100 text-stone-600 border border-stone-300">
          Expired
        </span>
      );
    }
    if (start > now) {
      return (
        <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          Scheduled
        </span>
      );
    }
    return (
      <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Live Active
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-stone-900">
            Owner Discount Center 🏷️
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Create and manage percentage & flat discount codes with live limits and customer validation.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-full bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span>+</span> Create New Coupon
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-stone-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Total Coupons
            </span>
            <span className="text-xl">🎟️</span>
          </div>
          <p className="text-2xl font-black text-stone-900 mt-2">{metrics.total || 0}</p>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Active Offers
            </span>
            <span className="text-xl">✨</span>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{metrics.active || 0}</p>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Total Redemptions
            </span>
            <span className="text-xl">🔥</span>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">
            {metrics.totalRedemptions || 0}
          </p>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="rounded-2xl bg-white border border-stone-200/80 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Coupons" },
            { id: "active", label: "Active" },
            { id: "scheduled", label: "Scheduled" },
            { id: "expired", label: "Expired" },
            { id: "inactive", label: "Inactive" },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setFilterStatus(chip.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                filterStatus === chip.id
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search code or offer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-xs font-medium outline-none focus:border-stone-400 focus:bg-white"
          />
        </div>
      </div>

      {/* Discount Cards Grid */}
      {loading ? (
        <LoadingBox label="Loading coupons and discounts..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={loadDiscounts} />
      ) : discounts.length === 0 ? (
        <EmptyBox label="No discount coupons found matching your criteria. Create your first diner offer!" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {discounts.map((d) => (
            <div
              key={d._id}
              className={`rounded-3xl bg-white border ${
                d.active ? "border-amber-300 shadow-sm" : "border-stone-200 opacity-80"
              } p-6 flex flex-col justify-between relative overflow-hidden transition hover:shadow-md`}
            >
              {/* Top Accent Strip */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  d.type === "percentage" ? "bg-rose-500" : "bg-amber-500"
                }`}
              />

              <div>
                {/* Header: Code badge & status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-black tracking-wider bg-stone-900 text-amber-300 px-3 py-1 rounded-xl shadow-inner select-all">
                      {d.code}
                    </span>
                  </div>
                  {getStatusBadge(d)}
                </div>

                {/* Offer Highlight */}
                <div className="mb-2">
                  <h3 className="text-xl font-black text-stone-900 tracking-tight">
                    {d.type === "percentage" ? `${d.value}% OFF` : `₹${d.value} FLAT OFF`}
                  </h3>
                  <p className="text-xs font-bold text-stone-700 mt-0.5">{d.name}</p>
                  {d.description && (
                    <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">
                      {d.description}
                    </p>
                  )}
                </div>

                {/* Rules List */}
                <div className="space-y-1.5 py-3 border-y border-dashed border-stone-200 my-3 text-[11px] text-stone-600">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Min Order:</span>
                    <span className="font-bold">₹{d.minimumOrderAmount || 0}</span>
                  </div>
                  {d.type === "percentage" && (
                    <div className="flex justify-between">
                      <span className="text-stone-400">Max Discount:</span>
                      <span className="font-bold">
                        {d.maximumDiscountAmount ? `₹${d.maximumDiscountAmount}` : "No Limit"}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-stone-400">Total Usage:</span>
                    <span className="font-bold">
                      {d.usageCount || 0} / {d.usageLimit ? d.usageLimit : "∞"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Per Customer:</span>
                    <span className="font-bold">{d.perUserLimit || 1} time(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Valid Till:</span>
                    <span className="font-bold">
                      {new Date(d.endDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 gap-2">
                <button
                  onClick={() => handleToggleStatus(d)}
                  disabled={actionLoadingId === d._id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    d.active
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {d.active ? "Active ✓" : "Paused"}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(d)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(d)}
                    disabled={actionLoadingId === d._id}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {modalMode && (
        <DiscountModal
          mode={modalMode}
          discount={selectedDiscount}
          onClose={closeModal}
          onSuccess={() => {
            closeModal();
            loadDiscounts();
          }}
        />
      )}
    </div>
  );
};

/* =========================================
   DISCOUNT MODAL (OWNER ONLY)
========================================= */

const DiscountModal = ({ mode, discount, onClose, onSuccess }) => {
  const [form, setForm] = useState(() => {
    if (mode === "edit" && discount) {
      return {
        name: discount.name || "",
        code: discount.code || "",
        type: discount.type || "percentage",
        value: discount.value ?? "",
        minimumOrderAmount: discount.minimumOrderAmount ?? "",
        maximumDiscountAmount: discount.maximumDiscountAmount ?? "",
        startDate: discount.startDate
          ? new Date(discount.startDate).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        endDate: discount.endDate
          ? new Date(discount.endDate).toISOString().slice(0, 16)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        usageLimit: discount.usageLimit ?? "",
        perUserLimit: discount.perUserLimit ?? 1,
        active: discount.active ?? true,
        description: discount.description || "",
      };
    }
    return { ...EMPTY_DISCOUNT };
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "code"
          ? value.toUpperCase().replace(/[^A-Z0-9_-]/g, "")
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter a discount name.");
      return;
    }
    if (!form.code.trim()) {
      setError("Please enter a coupon code.");
      return;
    }
    const val = Number(form.value);
    if (isNaN(val) || val <= 0) {
      setError("Discount value must be greater than 0.");
      return;
    }
    if (form.type === "percentage" && val > 100) {
      setError("Percentage discount cannot exceed 100%.");
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setError("Expiry date must be after start date.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: val,
        minimumOrderAmount:
          form.minimumOrderAmount === "" ? 0 : Number(form.minimumOrderAmount),
        maximumDiscountAmount:
          form.type === "percentage" && form.maximumDiscountAmount !== ""
            ? Number(form.maximumDiscountAmount)
            : undefined,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        usageLimit: form.usageLimit === "" ? undefined : Number(form.usageLimit),
        perUserLimit: form.perUserLimit === "" ? 1 : Number(form.perUserLimit),
        active: form.active,
        description: form.description.trim(),
      };

      if (mode === "add") {
        await createOwnerDiscount(payload);
      } else {
        await updateOwnerDiscount(discount._id, payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to save discount");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
          <div>
            <h2 className="text-xl font-bold text-stone-900">
              {mode === "add" ? "Create New Diner Coupon" : "Edit Coupon"}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Configure promo codes, percentage or flat values, and limits.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Coupon Name / Title *
            </label>
            <input
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. 90s Vintage Weekend Special"
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm font-medium outline-none focus:border-stone-400 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Coupon Code *
              </label>
              <input
                name="code"
                required
                value={form.code}
                onChange={handleChange}
                placeholder="TASTY50"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm font-mono font-bold tracking-wider uppercase outline-none focus:border-stone-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Discount Type *
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm font-medium outline-none focus:border-stone-400 focus:bg-white"
              >
                <option value="percentage">Percentage (% OFF)</option>
                <option value="fixed">Fixed Amount (₹ FLAT)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                {form.type === "percentage" ? "Percentage (1-100%) *" : "Flat Amount (₹) *"}
              </label>
              <input
                name="value"
                type="number"
                min="0.1"
                max={form.type === "percentage" ? 100 : undefined}
                step="any"
                required
                value={form.value}
                onChange={handleChange}
                placeholder={form.type === "percentage" ? "20" : "100"}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm font-medium outline-none focus:border-stone-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Min Order Amount (₹)
              </label>
              <input
                name="minimumOrderAmount"
                type="number"
                min="0"
                step="any"
                value={form.minimumOrderAmount}
                onChange={handleChange}
                placeholder="e.g. 299 (0 for none)"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm font-medium outline-none focus:border-stone-400 focus:bg-white"
              />
            </div>
          </div>

          {form.type === "percentage" && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Max Discount Cap (₹){" "}
                <span className="text-stone-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                name="maximumDiscountAmount"
                type="number"
                min="1"
                step="any"
                value={form.maximumDiscountAmount}
                onChange={handleChange}
                placeholder="e.g. 150 (leave empty for unlimited %)"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm font-medium outline-none focus:border-stone-400 focus:bg-white"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Valid From
              </label>
              <input
                name="startDate"
                type="datetime-local"
                required
                value={form.startDate}
                onChange={handleChange}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs font-medium outline-none focus:border-stone-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Valid Till
              </label>
              <input
                name="endDate"
                type="datetime-local"
                required
                value={form.endDate}
                onChange={handleChange}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs font-medium outline-none focus:border-stone-400 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Total Usage Limit
              </label>
              <input
                name="usageLimit"
                type="number"
                min="1"
                value={form.usageLimit}
                onChange={handleChange}
                placeholder="e.g. 100 (empty = ∞)"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm font-medium outline-none focus:border-stone-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Per-User Limit
              </label>
              <input
                name="perUserLimit"
                type="number"
                min="1"
                required
                value={form.perUserLimit}
                onChange={handleChange}
                placeholder="1"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm font-medium outline-none focus:border-stone-400 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Description / Notes
            </label>
            <textarea
              name="description"
              rows={2}
              value={form.description}
              onChange={handleChange}
              placeholder="Internal or customer notes about this promo..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-xs font-medium outline-none focus:border-stone-400 focus:bg-white resize-none"
            />
          </div>

          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              name="active"
              type="checkbox"
              checked={form.active}
              onChange={handleChange}
              className="h-4 w-4 rounded accent-rose-600"
            />
            <span className="text-xs font-bold text-stone-800">
              Coupon is Active for Redemptions
            </span>
          </label>

          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-full bg-rose-600 hover:bg-rose-700 py-3 text-xs font-bold text-white shadow transition disabled:opacity-50 cursor-pointer"
            >
              {saving
                ? "Saving Coupon..."
                : mode === "add"
                ? "Create Coupon"
                : "Update Coupon"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-stone-300 bg-white px-5 py-3 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
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
   TAB — DINE-IN BOOKINGS (ADMIN & OWNER)
========================================= */

const DINE_IN_STATUS_CONFIG = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-sky-50 text-sky-700 border-sky-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

const DineInBookingsTab = () => {
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (selectedDate) params.date = selectedDate;
      if (selectedStatus && selectedStatus !== "all") params.status = selectedStatus;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await getAdminDineInReservations(params);
      setReservations(data.reservations || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error("Failed to load dine-in reservations:", err);
      setError(err.message || "Unable to fetch reservations.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedStatus, searchTerm]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      setActionLoading(id);
      await updateAdminDineInReservationStatus(id, newStatus);
      await fetchReservations();
    } catch (err) {
      alert(err.message || "Failed to update reservation status.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* STATS BAR */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">
              Today's Bookings
            </span>
            <span className="text-2xl font-black text-stone-900 mt-1 block">
              {stats.totalToday}
            </span>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">
              Guests Today
            </span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {stats.guestsToday}
            </span>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
              Confirmed
            </span>
            <span className="text-2xl font-black text-emerald-800 mt-1 block">
              {stats.confirmedToday}
            </span>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 block">
              Completed
            </span>
            <span className="text-2xl font-black text-sky-800 mt-1 block">
              {stats.completedToday}
            </span>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
              Cancelled
            </span>
            <span className="text-2xl font-black text-rose-800 mt-1 block">
              {stats.cancelledToday}
            </span>
          </div>
        </div>
      )}

      {/* FILTER CONTROLS */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Quick Date Chips */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                selectedDate === todayStr
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDate(tomorrow.toISOString().split("T")[0]);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                selectedDate && selectedDate !== todayStr
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate("")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                selectedDate === ""
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              All Dates
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1 text-xs font-bold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white outline-none"
            />
          </div>

          {/* Status and Search */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <input
              type="text"
              placeholder="Search by name, phone, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 md:w-60 px-3 py-1.5 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white outline-none"
            />

            <button
              type="button"
              onClick={fetchReservations}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition"
            >
              Refresh
            </button>
          </div>

        </div>
      </div>

      {/* RESERVATIONS TABLE */}
      {loading ? (
        <LoadingBox label="Loading Dine-In table bookings..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={fetchReservations} />
      ) : reservations.length === 0 ? (
        <EmptyBox label="No reservations found matching your criteria." />
      ) : (
        <div className="rounded-3xl border border-stone-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="py-3.5 px-4">Pass Code</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Guest Details</th>
                  <th className="py-3.5 px-4">Party Size</th>
                  <th className="py-3.5 px-4">Notes</th>
                  <th className="py-3.5 px-4 text-right">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {reservations.map((r) => {
                  const statusBadgeClass =
                    DINE_IN_STATUS_CONFIG[r.status] || "bg-stone-100 text-stone-700";

                  return (
                    <tr key={r._id} className="hover:bg-stone-50/70 transition">
                      {/* Pass Code */}
                      <td className="py-3.5 px-4 font-mono font-black text-stone-900">
                        {r.reservationCode}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-stone-900 block">
                          📅 {r.date}
                        </span>
                        <span className="text-rose-600 font-extrabold text-[11px]">
                          🕐 {r.displayTime || r.time}
                        </span>
                      </td>

                      {/* Guest Details */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-stone-900 block text-sm">
                          {r.customerName}
                        </span>
                        <span className="text-stone-500 block text-[11px]">
                          📞 {r.phone}
                        </span>
                        {r.email && (
                          <span className="text-stone-400 block text-[10px] truncate max-w-[160px]">
                            ✉️ {r.email}
                          </span>
                        )}
                      </td>

                      {/* Party Size */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 font-extrabold text-stone-800 text-xs">
                          <span>👥</span>
                          <span>{r.numberOfPeople} Guests</span>
                        </span>
                        <span className="text-[10px] font-bold text-stone-400 capitalize block mt-0.5">
                          {r.partyType} table
                        </span>
                      </td>

                      {/* Notes */}
                      <td className="py-3.5 px-4 text-stone-600 max-w-xs">
                        {r.notes ? (
                          <span className="line-clamp-2 italic text-[11px]">"{r.notes}"</span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>

                      {/* Status Action Dropdown */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <select
                            disabled={actionLoading === r._id}
                            value={r.status}
                            onChange={(e) => handleStatusChange(r._id, e.target.value)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase border cursor-pointer outline-none transition ${statusBadgeClass}`}
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================
   TAB — DINE-IN SETTINGS (ADMIN & OWNER)
========================================= */

const DineInSettingsTab = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    enabled: true,
    openingTime: "11:00",
    closingTime: "22:00",
    maxCapacity: 30,
    slotInterval: 30,
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminDineInSettings();
      if (data?.settings) {
        setSettings(data.settings);
        setFormData({
          enabled: Boolean(data.settings.enabled),
          openingTime: data.settings.openingTime || "11:00",
          closingTime: data.settings.closingTime || "22:00",
          maxCapacity: data.settings.maxCapacity || 30,
          slotInterval: data.settings.slotInterval || 30,
        });
      }
    } catch (err) {
      console.error("Settings load error:", err);
      setError(err.message || "Failed to load dine-in settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    // Front-end sanity check
    const [oh, om] = formData.openingTime.split(":").map(Number);
    const [ch, cm] = formData.closingTime.split(":").map(Number);
    if (oh * 60 + om >= ch * 60 + cm) {
      return setError("Opening time must be earlier than closing time.");
    }

    if (parseInt(formData.maxCapacity, 10) <= 0) {
      return setError("Maximum capacity must be at least 1 person.");
    }

    try {
      setSaving(true);
      const res = await updateAdminDineInSettings(formData);
      setSuccessMsg(res.message || "Dine-In settings saved successfully!");
      if (res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.error("Save settings error:", err);
      setError(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBox label="Loading Dine-In configuration..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* HEADER CARD */}
      <div className="rounded-3xl bg-white border border-stone-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between pb-6 border-b border-stone-100">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-600 block">
              Floor & Hours Management
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-0.5">
              Dine-In Configuration
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Control Dine-In table booking availability, hours, and seating limit.
            </p>
          </div>

          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase border ${
              formData.enabled
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-rose-50 text-rose-700 border-rose-300"
            }`}>
              {formData.enabled ? "🟢 Dine-In Enabled" : "🔴 Dine-In Disabled"}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            ✅ {successMsg}
          </div>
        )}

        {/* SETTINGS FORM */}
        <form onSubmit={handleSave} className="mt-6 space-y-6">
          
          {/* 1. Dine-In Enabled Toggle */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-sm font-black text-stone-900 block">
                Dine-In Status
              </span>
              <p className="text-xs text-stone-500">
                Turn OFF to temporarily stop accepting table reservations.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleChange("enabled", !formData.enabled)}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors cursor-pointer ${
                formData.enabled ? "bg-emerald-600" : "bg-stone-300"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow ${
                  formData.enabled ? "translate-x-9" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* 2. Opening & Closing Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Available From (Opening Time)
              </label>
              <input
                type="time"
                required
                value={formData.openingTime}
                onChange={(e) => handleChange("openingTime", e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-bold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white outline-none"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                24-Hour Format (e.g. 11:00 AM)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Available Until (Closing Time)
              </label>
              <input
                type="time"
                required
                value={formData.closingTime}
                onChange={(e) => handleChange("closingTime", e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-bold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white outline-none"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                24-Hour Format (e.g. 22:00 = 10:00 PM)
              </span>
            </div>
          </div>

          {/* 3. Max Seating Capacity & Slot Interval */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Maximum Floor Capacity (Seats)
              </label>
              <input
                type="number"
                min={1}
                max={500}
                required
                value={formData.maxCapacity}
                onChange={(e) => handleChange("maxCapacity", parseInt(e.target.value, 10) || "")}
                className="w-full px-4 py-2.5 text-sm font-bold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white outline-none"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Total diners accepted per slot (Default: 30)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Slot Interval (Minutes)
              </label>
              <select
                value={formData.slotInterval}
                onChange={(e) => handleChange("slotInterval", parseInt(e.target.value, 10))}
                className="w-full px-4 py-2.5 text-sm font-bold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white outline-none"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes (Recommended)</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes (1 Hour)</option>
              </select>
              <span className="text-[11px] text-stone-400 mt-1 block">
                Spacing between booking timeslots
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-stone-100">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white font-black text-sm rounded-2xl shadow transition disabled:opacity-50"
            >
              {saving ? "Saving Settings..." : "Save Dine-In Settings ⚙️"}
            </button>
          </div>
        </form>
      </div>

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