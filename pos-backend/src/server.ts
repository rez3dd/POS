import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";

import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import menusRouter from "./routes/menus";
import ordersRouter from "./routes/orders";
import paymentsRouter from "./routes/payments";
import statsRouter from "./routes/stats";
import usersRouter from "./routes/users"; // ถ้ามี

const app = express();

// ตั้งค่า CORS
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3001"], // อนุญาตให้เชื่อมต่อจากทั้ง frontend และ backend
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// เสิร์ฟไฟล์รูป
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// mount routes
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/menus", menusRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/users", usersRouter);

// error handler (ใส่ type ให้ครบ)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const msg =
    typeof err === "string"
      ? err
      : err?.message || "Server error";
  res.status(err?.status || 500).json({ message: msg });
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`API ready on http://localhost:${PORT}`);
});
