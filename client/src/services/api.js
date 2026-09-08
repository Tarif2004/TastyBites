const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ===============================
// Generic API Request
// ===============================
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = {
    ...(options.body && !isFormData
      ? {
          "Content-Type": "application/json",
        }
      : {}),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(data.message || "Something went wrong. Please try again.");
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
};

// ===============================
// AUTH & OTP
// ===============================

export const registerUser = (userData) =>
  apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });

export const registerAdmin = (adminData) =>
  apiRequest("/auth/register-admin", {
    method: "POST",
    body: JSON.stringify(adminData),
  });

export const loginUser = (userData) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(userData),
  });

export const googleAuth = (payload) =>
  apiRequest("/auth/google", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// Email OTP Endpoints
export const sendEmailOtp = (email, purpose = "email_verification") =>
  apiRequest("/auth/email-otp/send", {
    method: "POST",
    body: JSON.stringify({ email, purpose }),
  });

export const verifyEmailOtp = (email, otp, purpose = "email_verification") =>
  apiRequest("/auth/email-otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, otp, purpose }),
  });

// Mobile OTP Endpoints
export const sendOtp = (phone, purpose = "user_verification") =>
  apiRequest("/auth/otp/send", {
    method: "POST",
    body: JSON.stringify({ phone, purpose }),
  });

export const verifyOtp = (phone, otp, purpose = "user_verification") =>
  apiRequest("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ phone, otp, purpose }),
  });

export const getCurrentUser = () => apiRequest("/auth/me");

// ===============================
// MENU
// ===============================

export const getMenuItems = (query = "") =>
  apiRequest(`/menu-items${query ? `?${query}` : ""}`);

export const getMenuItem = (id) => apiRequest(`/menu-items/${id}`);

export const createMenuItem = (itemData) =>
  apiRequest("/menu-items", {
    method: "POST",
    body: JSON.stringify(itemData),
  });

export const updateMenuItem = (id, itemData) =>
  apiRequest(`/menu-items/${id}`, {
    method: "PUT",
    body: JSON.stringify(itemData),
  });

export const deleteMenuItem = (id) =>
  apiRequest(`/menu-items/${id}`, {
    method: "DELETE",
  });

// ===============================
// ORDERS
// ===============================

export const createOrder = (orderData) =>
  apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });

export const getMyOrders = () => apiRequest("/orders/my-orders");

export const getOrderById = (id) => apiRequest(`/orders/${id}`);

// ===============================
// ADMIN / OWNER - DASHBOARD & USERS
// ===============================

export const getDashboardStats = () => apiRequest("/admin/dashboard");

export const getAllOrders = () => apiRequest("/orders");

export const updateOrderStatus = (id, status) =>
  apiRequest(`/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

export const getUsers = () => apiRequest("/users");

export const getPendingAdmins = () => apiRequest("/users/pending-admins");

export const verifyAdmin = (id, status) =>
  apiRequest(`/users/verify-admin/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

export const deleteUser = (id) =>
  apiRequest(`/users/${id}`, {
    method: "DELETE",
  });

// ===============================
// DINE-IN RESERVATIONS (CUSTOMER)
// ===============================

export const getDineInSettings = () => apiRequest("/dine-in/settings");

export const getDineInAvailability = (date) =>
  apiRequest(`/dine-in/availability?date=${encodeURIComponent(date)}`);

export const createDineInReservation = (reservationData) =>
  apiRequest("/dine-in/reservations", {
    method: "POST",
    body: JSON.stringify(reservationData),
  });

export const getMyDineInReservations = () =>
  apiRequest("/dine-in/my-reservations");

export const getDineInReservationById = (id) =>
  apiRequest(`/dine-in/reservations/${id}`);

export const cancelDineInReservation = (id) =>
  apiRequest(`/dine-in/reservations/${id}/cancel`, {
    method: "PATCH",
  });

// ===============================
// DINE-IN (ADMIN / OWNER)
// ===============================

export const getAdminDineInSettings = () =>
  apiRequest("/admin/dine-in/settings");

export const updateAdminDineInSettings = (settingsData) =>
  apiRequest("/admin/dine-in/settings", {
    method: "PUT",
    body: JSON.stringify(settingsData),
  });

export const getAdminDineInReservations = (params = {}) => {
  const query = new URLSearchParams();
  if (params.date) query.append("date", params.date);
  if (params.status) query.append("status", params.status);
  if (params.search) query.append("search", params.search);
  const qStr = query.toString();
  return apiRequest(`/admin/dine-in/reservations${qStr ? `?${qStr}` : ""}`);
};

export const updateAdminDineInReservationStatus = (id, status) =>
  apiRequest(`/admin/dine-in/reservations/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

// ===============================
// IMAGE UPLOAD (ADMIN / OWNER)
// ===============================

export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);

  return apiRequest("/upload/image", {
    method: "POST",
    body: formData,
  });
};

// ===============================
// DISCOUNTS (CUSTOMER & OWNER)
// ===============================

// Customer: Check & apply coupon
export const applyDiscount = (data) =>
  apiRequest("/discounts/apply", {
    method: "POST",
    body: JSON.stringify(data),
  });

// Public: Get active offers list
export const getActiveDiscounts = () => apiRequest("/discounts/active");

// Owner Only: List all discounts with filters
export const getOwnerDiscounts = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append("status", params.status);
  if (params.search) query.append("search", params.search);
  const qStr = query.toString();
  return apiRequest(`/discounts/owner${qStr ? `?${qStr}` : ""}`);
};

// Owner Only: Create new discount
export const createOwnerDiscount = (discountData) =>
  apiRequest("/discounts/owner", {
    method: "POST",
    body: JSON.stringify(discountData),
  });

// Owner Only: Update discount
export const updateOwnerDiscount = (id, discountData) =>
  apiRequest(`/discounts/owner/${id}`, {
    method: "PUT",
    body: JSON.stringify(discountData),
  });

// Owner Only: Toggle discount active status
export const toggleOwnerDiscountStatus = (id, active) =>
  apiRequest(`/discounts/owner/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });

// Owner Only: Delete discount
export const deleteOwnerDiscount = (id) =>
  apiRequest(`/discounts/owner/${id}`, {
    method: "DELETE",
  });