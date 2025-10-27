// pos-backend/src/routes/upload.ts
import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";

const router = express.Router();

// โฟลเดอร์เก็บรูป
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// สร้างโฟลเดอร์หากยังไม่มี
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ตั้งค่า multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const safe = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    cb(null, `${Date.now()}-${safe}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // ≤ 5MB
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(png|jpe?g|gif|webp)/i.test(file.mimetype);
    if (!ok) return cb(new Error("ไฟล์ต้องเป็นรูปภาพเท่านั้น (.png/.jpg/.jpeg/.gif/.webp)"));
    cb(null, true);
  },
});

// ประกอบ base URL จาก request (รองรับ proxy)
function getBaseUrl(req: express.Request) {
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  const host = req.get("host");
  return `${proto}://${host}`;
}

/**
 * POST /api/upload
 * Body: form-data -> key: "image" (File)
 * Response: { url, filename, size, mimetype }
 */
router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "ไม่พบไฟล์" });

  const publicUrl = `${getBaseUrl(req)}/uploads/${req.file.filename}`;
  return res.json({
    url: publicUrl, // ← นำค่านี้ไปเก็บลง DB ที่ฟิลด์ imageUrl
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

export default router;
