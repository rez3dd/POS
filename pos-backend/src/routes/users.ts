// src/routes/users.ts
import { Router } from "express";
import prisma from "../prisma";
import { requireAuth, requireRole } from "../middlewares/auth";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";

const router = Router();

// ต้อง login + เป็น ADMIN เท่านั้น
router.use(requireAuth, requireRole(["ADMIN"]));

/**
 * GET /api/users
 * ตอบกลับ { users: [...] } (เฉพาะ ADMIN/STAFF)
 */
router.get("/", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: [Role.ADMIN, Role.STAFF] } },
      orderBy: { id: "asc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users
 * body: { name, email, role, password }
 */
router.post("/", async (req, res, next) => {
  try {
    const { name, email, role, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password จำเป็น" });
    }

    // แปลงค่า role จาก string → Prisma Enum
    const normalizedRole =
      String(role || "").toUpperCase() === "ADMIN" ? Role.ADMIN : Role.STAFF;

    // เช็คซ้ำ email
    const dup = await prisma.user.findUnique({ where: { email } });
    if (dup) {
      return res.status(409).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    // แฮชรหัสผ่าน
    const hashed = await bcrypt.hash(String(password), 10);

    const created = await prisma.user.create({
      data: {
        name: String(name),
        email: String(email),
        role: normalizedRole,
        password: hashed,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

export default router;
