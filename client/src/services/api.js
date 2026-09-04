const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ===============================
// Generic API Request
// ===============================
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.body
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
    throw new Error(
      data.message || "Something went wrong. Please try again."
    );
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
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const deleteUser = (id) =>
  apiRequest(`/users/${id}`, {
    method: "DELETE",
  });