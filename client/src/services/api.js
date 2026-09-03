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

  // Attach JWT token to every protected request
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.log("API REQUEST:", endpoint);
  console.log("TOKEN EXISTS:", Boolean(token));

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
// AUTH
// ===============================

export const registerUser = (userData) =>
  apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });

export const loginUser = (userData) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(userData),
  });

export const getCurrentUser = () =>
  apiRequest("/auth/me");

// ===============================
// MENU
// ===============================

export const getMenuItems = (query = "") =>
  apiRequest(`/menu-items${query ? `?${query}` : ""}`);

export const getMenuItem = (id) =>
  apiRequest(`/menu-items/${id}`);

// ===============================
// ORDERS
// ===============================

export const createOrder = (orderData) =>
  apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });

export const getMyOrders = () =>
  apiRequest("/orders/my-orders");

export const getOrderById = (id) =>
  apiRequest(`/orders/${id}`);

// ===============================
// ADMIN - DASHBOARD
// ===============================

export const getDashboardStats = () =>
  apiRequest("/admin/dashboard");

// ===============================
// ADMIN - ORDERS
// ===============================

export const getAllOrders = () =>
  apiRequest("/orders");

export const updateOrderStatus = (id, status) =>
  apiRequest(`/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

// ===============================
// ADMIN - USERS
// ===============================

export const getUsers = () =>
  apiRequest("/users");

export const deleteUser = (id) =>
  apiRequest(`/users/${id}`, {
    method: "DELETE",
  });