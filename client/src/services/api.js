const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/*
  Generic API request helper.
  Automatically attaches JWT from localStorage.
*/

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
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
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};


/* =========================================
   AUTH
========================================= */

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

export const getCurrentUser = () => apiRequest("/auth/me");


/* =========================================
   MENU
========================================= */

export const getMenuItems = (query = "") =>
  apiRequest(`/menu-items${query ? `?${query}` : ""}`);

export const getMenuItem = (id) => apiRequest(`/menu-items/${id}`);

export const createMenuItem = (data) =>
  apiRequest("/menu-items", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateMenuItem = (id, data) =>
  apiRequest(`/menu-items/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteMenuItem = (id) =>
  apiRequest(`/menu-items/${id}`, {
    method: "DELETE",
  });


/* =========================================
   ORDERS
========================================= */

export const createOrder = (orderData) =>
  apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });

export const getMyOrders = () => apiRequest("/orders/my-orders");

export const getOrderById = (id) => apiRequest(`/orders/${id}`);


/* =========================================
   ADMIN
========================================= */

export const getDashboardStats = () => apiRequest("/admin/dashboard");

export const getAllOrders = () => apiRequest("/orders");

export const updateOrderStatus = (id, status) =>
  apiRequest(`/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

export const getUsers = () => apiRequest("/users");

export const deleteUser = (id) =>
  apiRequest(`/users/${id}`, {
    method: "DELETE",
  });
