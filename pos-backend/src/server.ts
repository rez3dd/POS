// src/server.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";

import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import menusRouter from "./routes/menus";
import ordersRouter from "./routes/orders";
import paymentsRouter from "./routes/payments";
import statsRouter from "./routes/stats";
import usersRouter from "./routes/users";
import categoriesRouter from "./routes/categories";

const app = express();

/** CORS: อนุญาต frontend (Vite 5173) เรียก API และโหลดรูปจาก /uploads ได้ */
app.use(
  cors({
    origin: ["http://localhost:5173"], // ถ้าคุณมีที่อยู่อื่น เพิ่มได้ใน array
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/** ✅ เสิร์ฟไฟล์รูปจากโฟลเดอร์ /uploads
 *  ตัวอย่าง URL: http://localhost:3001/uploads/filename.jpg
 *  หมายเหตุ: เส้นนี้อยู่นอก /api นะครับ
 */
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    // ช่วยเรื่องเบราว์เซอร์บล็อค cross-origin resource
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

/** health check */
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

/** API routes */
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/menus", menusRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/users", usersRouter);
app.use("/api/categories", categoriesRouter);

/** error handler */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const msg = typeof err === "string" ? err : err?.message || "Server error";
  res.status(err?.status || 500).json({ message: msg });
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`API ready on http://localhost:${PORT}`);
  console.log(`Serving uploads from http://localhost:${PORT}/uploads`);
});
