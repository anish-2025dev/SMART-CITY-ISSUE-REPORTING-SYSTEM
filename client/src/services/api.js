import axios from "axios";

// Empty in development (Vite proxies /api and /uploads). In production, set VITE_API_URL
// to your backend origin, e.g. https://smart-city-api.onrender.com
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "sc_token";

const api = axios.create({ baseURL: `${API_URL}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Photos are stored as "/uploads/x.jpg"; prefix the API origin when it differs from the site
export const photoUrl = (path) => (path?.startsWith("http") ? path : `${API_URL}${path || ""}`);

// Turns an axios error into a message the user can read
export const getErrorMessage = (err) =>
  err.response?.data?.message || "Could not reach the server. Check your connection and try again.";

// Reports
export const createReport = (formData) => api.post("/reports", formData).then((r) => r.data);
export const suggestCategory = (title, description) =>
  api.post("/reports/categorize", { title, description }).then((r) => r.data);
export const fetchReports = (params = {}) => api.get("/reports", { params }).then((r) => r.data);
export const fetchReport = (id) => api.get(`/reports/${id}`).then((r) => r.data);

// Admin
export const login = (email, password) => api.post("/auth/login", { email, password }).then((r) => r.data);
export const fetchMe = () => api.get("/auth/me").then((r) => r.data.user);
export const fetchStats = () => api.get("/reports/stats").then((r) => r.data);
export const updateReport = (id, body) => api.patch(`/reports/${id}`, body).then((r) => r.data);
export const deleteReport = (id) => api.delete(`/reports/${id}`).then((r) => r.data);

export default api;
