// src/routes/menus.ts
import { Router } from "express";
import prisma from "../prisma";
import type { Request } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = Router();

/** ---------- เตรียมโฟลเดอร์ uploads ---------- */
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

/** ---------- ตั้งค่า multer ---------- */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const base = path.basename(file.originalname || "img", ext).replace(/\s+/g, "_");
    const fname = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${base}${ext}`;
    cb(null, fname);
  },
});
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!/^image\//.test(file.mimetype)) return cb(new Error("รองรับเฉพาะไฟล์รูปภาพ"));
  cb(null, true);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

/** ---------- ตัวช่วย normalize status ---------- */
function normStatus(s?: string) {
  const v = String(s || "").toUpperCase();
  return v === "UNAVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
}

/** ---------- GET /api/menus (ดึงทั้งหมด) ---------- */
router.get("/", async (_req, res, next) => {
  try {
    const list = await prisma.menu.findMany({
      orderBy: { id: "asc" },
      include: { category: true },
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/** ---------- GET /api/menus/:id (ดึงรายการเดียว) ---------- */
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const found = await prisma.menu.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!found) return res.status(404).json({ message: "ไม่พบเมนู" });
    res.json(found);
  } catch (e) {
    next(e);
  }
});

/** ---------- POST /api/menus (สร้างใหม่) ----------
 * รองรับทั้ง multipart/form-data (มีไฟล์ 'image') และ JSON ปกติ (imageUrl เป็น URL)
 */
router.post("/", upload.single("image"), async (req: Request, res, next) => {
  try {
    const { name, price, categoryId, status, imageUrl } = req.body as any;

    // เลือก image จากไฟล์ถ้ามี ไม่งั้นใช้ imageUrl จาก body (URL ภายนอก)
    const finalImageUrl = req.file ? req.file.filename : (imageUrl ? String(imageUrl).trim() : null);

    const created = await prisma.menu.create({
      data: {
        name: String(name || "").trim(),
        price: Number(price || 0),
        categoryId: categoryId ? Number(categoryId) : null,
        status: normStatus(status),         // "AVAILABLE" | "UNAVAILABLE"
        imageUrl: finalImageUrl,           // เก็บชื่อไฟล์ หรือ URL
      },
      include: { category: true },
    });

    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

/** ---------- PUT /api/menus/:id (แก้ไข) ----------
 * รองรับอัปเดตรูป: ถ้ามีไฟล์ใหม่ → ใช้ไฟล์ใหม่ (ลบไฟล์เก่าได้ถ้าต้องการ)
 * ถ้าไม่มีไฟล์ใหม่แต่ส่ง imageUrl มาก็อัปเดตตามนั้น
 * ถ้าไม่ส่งทั้งคู่ จะคงรูปเดิมไว้
 */
router.put("/:id", upload.single("image"), async (req: Request, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, price, categoryId, status } = req.body as any;

    const found = await prisma.menu.findUnique({ where: { id } });
    if (!found) return res.status(404).json({ message: "ไม่พบเมนู" });

    // ตัดสินใจ imageUrl ใหม่
    let newImageUrl: string | null | undefined = undefined;
    if (req.file) {
      // ถ้าอยากลบไฟล์เก่า (กรณีเก็บเป็นไฟล์ใน uploads) ทำได้แบบนี้
      if (found.imageUrl && !/^https?:\/\//i.test(found.imageUrl)) {
        const oldPath = path.join(uploadDir, found.imageUrl.replace(/^\/?uploads\/?/i, ""));
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch { /* ignore */ }
        }
      }
      newImageUrl = req.file.filename;
    } else if (typeof (req.body as any).imageUrl === "string") {
      const raw = (req.body as any).imageUrl.trim();
      newImageUrl = raw || null; // อนุญาตให้เคลียร์เป็น null ได้
    }

    const updated = await prisma.menu.update({
      where: { id },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        price: price !== undefined ? Number(price) : undefined,
        categoryId: categoryId !== undefined ? (categoryId ? Number(categoryId) : null) : undefined,
        status: status !== undefined ? normStatus(status) : undefined,
        imageUrl: newImageUrl, // undefined = ไม่แตะ, string/null = อัปเดต
      },
      include: { category: true },
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

/** ---------- POST /api/menus/reset (ล้างเมนูทั้งหมด) ---------- */
router.post("/reset/all", async (_req, res, next) => {
  try {
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.menu.deleteMany({});
    res.json({ message: "ล้างเมนูทั้งหมดแล้ว" });
  } catch (e) {
    next(e);
  }
});

export default router;
