import express from "express";
import prisma from "../prisma";

const router = express.Router();

/** GET /api/categories - รายการหมวดหมู่ทั้งหมด */
router.get("/", async (_req, res) => {
  try {
    const cats = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    res.json(cats);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GET /categories failed:", err);
    res.status(500).json({ message });
  }
});

/** POST /api/categories - เพิ่มหมวดหมู่ใหม่ (กันชื่อซ้ำแบบไม่สนตัวพิมพ์) */
router.post("/", async (req, res) => {
  try {
    const raw = String(req.body?.name ?? "").trim();
    if (!raw) return res.status(400).json({ message: "กรุณาระบุชื่อหมวดหมู่" });

    // ดึงทั้งหมดมาเช็คชื่อซ้ำเองแบบ lowercase
    const all = await prisma.category.findMany();
    const existed = all.find((c) => c.name.toLowerCase() === raw.toLowerCase());
    if (existed) {
      return res.status(409).json({ message: "มีหมวดหมู่นี้อยู่แล้ว", category: existed });
    }

    const created = await prisma.category.create({ data: { name: raw } });
    res.status(201).json(created);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /categories failed:", err);
    res.status(500).json({ message });
  }
});

/** PUT /api/categories/:id - แก้ชื่อหมวดหมู่ */
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "id ไม่ถูกต้อง" });

    const raw = String(req.body?.name ?? "").trim();
    if (!raw) return res.status(400).json({ message: "กรุณาระบุชื่อหมวดหมู่" });

    // เช็คชื่อซ้ำกับตัวอื่น
    const all = await prisma.category.findMany();
    const dup = all.find((c) => c.name.toLowerCase() === raw.toLowerCase() && c.id !== id);
    if (dup) {
      return res.status(409).json({ message: "มีหมวดหมู่นี้อยู่แล้ว", category: dup });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name: raw },
    });
    res.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("PUT /categories/:id failed:", err);
    res.status(500).json({ message });
  }
});

/** DELETE /api/categories/:id - ลบหมวดหมู่ (กัน FK error) */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "id ไม่ถูกต้อง" });

    await prisma.category.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err: any) {
    if (err?.code === "P2003") {
      return res.status(400).json({ message: "ลบไม่ได้: หมวดหมู่ถูกใช้งานโดยเมนู" });
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("DELETE /categories/:id failed:", err);
    res.status(500).json({ message });
  }
});

export default router;
