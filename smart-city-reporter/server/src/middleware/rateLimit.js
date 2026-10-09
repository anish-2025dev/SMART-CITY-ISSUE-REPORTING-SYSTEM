import rateLimit from "express-rate-limit";

const make = (windowMs, limit, message) =>
  rateLimit({ windowMs, limit, standardHeaders: true, legacyHeaders: false, message: { message } });

export const apiLimiter = make(15 * 60 * 1000, 600, "Too many requests. Try again later.");
export const loginLimiter = make(15 * 60 * 1000, 10, "Too many login attempts. Try again in 15 minutes.");
export const createReportLimiter = make(60 * 60 * 1000, 20, "Report limit reached. Try again in an hour.");
