export const CATEGORIES = [
  { value: "pothole", label: "Pothole" },
  { value: "garbage", label: "Garbage" },
  { value: "streetlight", label: "Broken streetlight" },
  { value: "water_leak", label: "Water leak" },
  { value: "other", label: "Other" },
];

export const STATUSES = [
  { value: "reported", label: "Reported", color: "#e5173f" },
  { value: "in-progress", label: "In progress", color: "#ffb400" },
  { value: "resolved", label: "Resolved", color: "#00b86b" },
];

export const categoryLabel = (v) => CATEGORIES.find((c) => c.value === v)?.label || "Other";
export const statusLabel = (v) => STATUSES.find((s) => s.value === v)?.label || v;
export const statusColor = (v) => STATUSES.find((s) => s.value === v)?.color || "#5b6475";

export const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
