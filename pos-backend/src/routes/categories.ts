// src/routes/categories.ts
import express from "express";
import prisma from "../prisma";

const router = express.Router();

/** GET /api/categories
 *  คืนรายการหมวดหมู่ทั้งหมด
 */
router.get("/", async (_req, res, next) => {
  try {
    const cats = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    res.json(cats);
  } catch (e) {
    next(e);
  }
});

/** POST /api/categories
 *  body: { name: string }
 *  สร้างหมวดหมู่ใหม่ (ถ้าชื่อซ้ำจะ upsert หรือแจ้งเตือนตามต้องการ)
 */
router.post("/", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) {
      return res.status(400).json({ message: "ต้องระบุชื่อหมวดหมู่" });
    }

    // ใช้ upsert เพื่อป้องกันกดซ้ำ/ชื่อซ้ำ (unique ที่ schema)
    const created = await prisma.category.upsert({
      where: { name },
      update: {},         // ถ้าชื่อซ้ำจะไม่แก้อะไร
      create: { name },
    });

    res.status(201).json(created);
  } catch (e: any) {
    // ถ้าอยากบังคับให้ชื่อซ้ำ = 409 แทน upsert ก็จับ P2002 ได้
    if (e?.code === "P2002") {
      return res.status(409).json({ message: "ชื่อหมวดหมู่ซ้ำ" });
    }
    next(e);
  }
});

export default router;
