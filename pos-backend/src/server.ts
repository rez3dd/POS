// src/server.ts (DROP-IN PATCH)
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";

// --- routes ของคุณ ---
import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import menusRouter from "./routes/menus";
import ordersRouter from "./routes/orders";
import paymentsRouter from "./routes/payments";
import statsRouter from "./routes/stats";
import usersRouter from "./routes/users";
import categoriesRouter from "./routes/categories";
import uploadRouter from "./routes/upload";

const app = express();

/** ---------- CORS (allowlist + dev fallback) ---------- */
const FRONTEND_ORIGIN_ENV = (process.env.FRONTEND_ORIGIN || "").trim();

// dev fallback: ถ้าไม่ตั้ง FRONTEND_ORIGIN ให้รับ localhost ทั่วไป
const DEV_FALLBACK = ["http://localhost:5173", "http://localhost:3000"];

const ALLOWED = (FRONTEND_ORIGIN_ENV
  ? FRONTEND_ORIGIN_ENV.split(",").map((s) => s.trim()).filter(Boolean)
  : DEV_FALLBACK
).map((u) => u.replace(/\/+$/, "")); // ตัด / ท้าย

function isAllowedOrigin(origin?: string) {
  if (!origin) return true; // อนุญาต non-browser เช่น curl/postman
  try {
    const u = new URL(origin);
    const host = u.hostname;
    if (ALLOWED.includes(u.origin)) return true;
    if (ALLOWED.includes(host)) return true;
    if (/\.netlify\.app$/i.test(host)) return true;
    if (/\.railway\.app$/i.test(host)) return true;
    if (/\.vercel\.app$/i.test(host)) return true;
    return false;
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (isAllowedOrigin(origin || undefined)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  })
);

// (สำคัญ) ตอบ preflight ให้ผ่านทุก path ที่ใช้ CORS
app.options("*", cors({ origin: (o, cb) => cb(null, true), credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/** ---------- Static: /uploads ---------- */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/** ---------- Health check ---------- */
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

/** ---------- Mount routes ---------- */
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/menus", menusRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/users", usersRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/upload", uploadRouter);

/** ---------- Error handler ---------- */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const msg = typeof err === "string" ? err : err?.message || "Server error";
  res.status(err?.status || 500).json({ message: msg });
});

/** ---------- Start ---------- */
const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`API ready on http://localhost:${PORT}`);
  console.log(`CORS ALLOWED: ${ALLOWED.join(", ")}`);
});
