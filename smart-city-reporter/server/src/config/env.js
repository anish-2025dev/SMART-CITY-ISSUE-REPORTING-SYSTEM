// Validates environment variables on startup so mistakes fail fast with a clear message.
const required = ["MONGO_URI", "JWT_SECRET"];

export const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    console.error("Copy server/.env.example to server/.env and fill in the values.");
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production") {
    const secret = process.env.JWT_SECRET;
    if (secret.length < 32 || secret.includes("change_this")) {
      console.error("JWT_SECRET is too weak for production. Use at least 32 random characters.");
      process.exit(1);
    }
  }
};

// CLIENT_URL may hold several origins separated by commas
export const allowedOrigins = () =>
  (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
