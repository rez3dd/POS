// src/routes/users.ts
import { Router } from "express";
import prisma from "../prisma";
import { requireAuth, requireRole } from "../middlewares/auth";
import bcrypt from "bcrypt";

const router = Router();

// ต้อง login ทุก role ก่อน
router.use(requireAuth);

/**
 * GET /api/users
 * - ADMIN และ STAFF ดูได้
 */
router.get("/", requireRole(["ADMIN", "STAFF"]), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "STAFF"] } },
      orderBy: { id: "asc" },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users
 * - ADMIN เท่านั้นที่สร้างได้
 */
router.post("/", requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const { name, email, role = "STAFF", password } = req.body ?? {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password จำเป็น" });
    }
    const normalizedRole = String(role).toUpperCase();
    if (!["ADMIN", "STAFF"].includes(normalizedRole)) {
      return res.status(400).json({ message: "role ต้องเป็น ADMIN หรือ STAFF" });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: { name, email, role: normalizedRole, password: hashed },
      select: { id: true, name: true, email: true, role: true },
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

export default router;
