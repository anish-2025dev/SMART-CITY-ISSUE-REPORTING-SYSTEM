import axios from "axios";

// Vite proxies /api and /uploads to the backend (see vite.config.js)
const api = axios.create({ baseURL: "/api" });

export const createReport = (formData) =>
  api.post("/reports", formData).then((res) => res.data);

export const suggestCategory = (title, description) =>
  api.post("/reports/categorize", { title, description }).then((res) => res.data);

export const fetchReports = (params = {}) =>
  api.get("/reports", { params }).then((res) => res.data);

// Turns an axios error into a message the user can read
export const getErrorMessage = (err) =>
  err.response?.data?.message || "Could not reach the server. Check your connection and try again.";

export default api;
