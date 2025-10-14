// src/routes/menus.ts
import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import prisma from "../prisma";

const router = Router();

/* ------------ Multer: เก็บไฟล์ลง /uploads ------------- */
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(process.cwd(), "uploads"));
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "");
      const base = path.basename(file.originalname || "image", ext);
      const safe =
        base.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "image";
      cb(null, `${safe}-${Date.now()}${ext || ".jpg"}`);
    },
  }),
});

/* ------------ helpers ------------- */
function withAbsoluteUrl(base: string, maybe: string | null): string | null {
  if (!maybe) return null;
  if (/^https?:\/\//i.test(maybe)) return maybe; // already absolute
  // เก็บใน DB เป็น "/uploads/xxx" หรือ "uploads/xxx" ก็รองรับ
  const rel = maybe.startsWith("/") ? maybe : `/${maybe}`;
  return `${base}${rel}`;
}
function getBase(req: Request) {
  return `${req.protocol}://${req.get("host")}`;
}
function getFilenameFromUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  // รับทั้ง absolute และ relative
  const idx = imageUrl.lastIndexOf("/uploads/");
  if (idx >= 0) return imageUrl.substring(idx + 9); // หลัง "/uploads/"
  // ถ้าเก็บแบบ "uploads/xxx"
  if (imageUrl.startsWith("uploads/")) return imageUrl.substring(8);
  // ถ้าเก็บแบบ "/uploads/xxx"
  if (imageUrl.startsWith("/uploads/")) return imageUrl.substring(9);
  // ถ้าเก็บเป็นชื่อไฟล์เฉย ๆ
  return imageUrl;
}

/* -------------------- GET: ทั้งหมด -------------------- */
router.get("/", async (req: Request, res: Response) => {
  try {
    const menus = await prisma.menu.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        status: true,
        imageUrl: true, // ✅ ใช้ imageUrl
        createdAt: true,
        updatedAt: true,
      },
    });
    const base = getBase(req);
    const result = menus.map((m) => ({
      ...m,
      imageUrl: withAbsoluteUrl(base, m.imageUrl ? m.imageUrl : null),
    }));
    res.json(result);
  } catch (e: any) {
    console.error("GET /menus error:", e);
    res.status(500).json({ message: e?.message || "Server error" });
  }
});

/* -------------------- GET: ตาม id -------------------- */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const found = await prisma.menu.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        status: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!found) return res.status(404).json({ message: "Menu not found" });
    const base = getBase(req);
    res.json({
      ...found,
      imageUrl: withAbsoluteUrl(base, found.imageUrl ? found.imageUrl : null),
    });
  } catch (e: any) {
    console.error("GET /menus/:id error:", e);
    res.status(500).json({ message: e?.message || "Server error" });
  }
});

/* -------------------- POST: สร้างเมนู -------------------- */
router.post("/", upload.single("image"), async (req: Request, res: Response) => {
  try {
    const { name, price, category } = req.body;
    const status = String(req.body.status || "AVAILABLE").toUpperCase();
    const file = req.file;

    const relPath = file ? `/uploads/${file.filename}` : null; // ✅ เก็บเป็น path ใน DB

    const created = await prisma.menu.create({
      data: {
        name,
        price: Number(price),
        category: category ?? null,
        status,
        imageUrl: relPath,
      },
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        status: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const base = getBase(req);
    res.json({
      ...created,
      imageUrl: withAbsoluteUrl(base, created.imageUrl),
    });
  } catch (e: any) {
    console.error("POST /menus error:", e);
    res.status(500).json({ message: e?.message || "Server error" });
  }
});

/* -------------------- PUT: อัปเดตเมนู -------------------- */
router.put(
  "/:id",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const found = await prisma.menu.findUnique({ where: { id } });
      if (!found) return res.status(404).json({ message: "Menu not found" });

      const { name, price, category } = req.body;
      const status = String(req.body.status || found.status || "AVAILABLE").toUpperCase();

      let newImageUrl = found.imageUrl;

      // ถ้ามีอัปโหลดไฟล์ใหม่ ให้ลบไฟล์เก่า (ถ้ามี) แล้วตั้งค่า imageUrl ใหม่
      if (req.file) {
        const oldName = getFilenameFromUrl(found.imageUrl);
        if (oldName) {
          const oldPath = path.join(process.cwd(), "uploads", oldName);
          try {
            await fs.unlink(oldPath);
          } catch {
            // ไฟล์ไม่อยู่แล้วก็ข้ามไป
          }
        }
        newImageUrl = `/uploads/${req.file.filename}`;
      }

      const updated = await prisma.menu.update({
        where: { id },
        data: {
          name: name ?? found.name,
          price: price != null ? Number(price) : found.price,
          category: category ?? found.category,
          status,
          imageUrl: newImageUrl,
        },
        select: {
          id: true,
          name: true,
          price: true,
          category: true,
          status: true,
          imageUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const base = getBase(req);
      res.json({
        ...updated,
        imageUrl: withAbsoluteUrl(base, updated.imageUrl),
      });
    } catch (e: any) {
      console.error("PUT /menus/:id error:", e);
      res.status(500).json({ message: e?.message || "Server error" });
    }
  }
);

export default router;
