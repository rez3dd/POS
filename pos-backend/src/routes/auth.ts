import express from "express";
import prisma from "../prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const TOKEN_TTL = "7d";

// แปลงสตริงเป็น enum Role อย่างปลอดภัย
function toRole(x?: string | null): Role {
  const s = (x || "").toUpperCase();
  if (s === "ADMIN") return Role.ADMIN;
  if (s === "CASHIER") return Role.STAFF;
  return Role.STAFF;
}

function signToken(u: { id: number; email: string; role: Role }) {
  return jwt.sign({ sub: u.id, email: u.email, role: u.role }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// บูตสแตรปแอดมินเริ่มต้น ถ้ายังไม่มี
async function ensureDefaultAdmin() {
  const email = "admin@pos.local";
  const exists = await prisma.user.findUnique({ where: { email } });
  if (!exists) {
    const hash = await bcrypt.hash("1234", 10);
    await prisma.user.create({
      data: {
        name: "Admin",
        email,
        password: hash,
        role: Role.ADMIN, // ✅ ใช้ enum
      },
    });
  }
}
ensureDefaultAdmin().catch(() => { /* ignore */ });

/** POST /api/auth/register */
router.post("/register", async (req, res) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").toLowerCase().trim();
    const password = String(req.body?.password ?? "");
    const role = toRole(req.body?.role);

    if (!email || !password) {
      return res.status(400).json({ message: "กรุณาระบุ email และ password" });
    }

    const existed = await prisma.user.findUnique({ where: { email } });
    if (existed) return res.status(409).json({ message: "อีเมลนี้ถูกใช้แล้ว" });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hash, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role as Role });
    res.status(201).json({ user, token });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message });
  }
});

/** POST /api/auth/login */
router.post("/login", async (req, res) => {
  try {
    const email = String(req.body?.email ?? "").toLowerCase().trim();
    const password = String(req.body?.password ?? "");

    if (!email || !password) {
      return res.status(400).json({ message: "กรุณาระบุ email และ password" });
    }

    await ensureDefaultAdmin();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "ไม่พบผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "ไม่พบผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });

    const payload = { id: user.id, email: user.email, role: user.role as Role };
    const token = signToken(payload);

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message });
  }
});

/** GET /api/auth/me */
router.get("/me", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const me = await prisma.user.findUnique({
      where: { id: Number(decoded.sub) },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!me) return res.status(401).json({ message: "Unauthorized" });

    res.json(me);
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

export default router;
