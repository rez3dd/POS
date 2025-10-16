import express from "express";
import prisma from "../prisma";
import { requireAuth } from "../middlewares/auth";

const router = express.Router();

/** ✅ helper สร้างรหัสออเดอร์ */
function generateOrderCode() {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${ymd}-${rand}`;
}

/** -------------------- POST: /api/orders -------------------- */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { customerName, items, method, amountPaid } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "ต้องมีรายการอาหารอย่างน้อย 1 รายการ" });
    }

    const total = items.reduce((s, it) => s + Number(it.qty) * Number(it.price || 0), 0);
    const paid = amountPaid && Number(amountPaid) >= total;
    const change = paid ? Number(amountPaid) - total : 0;

    const order = await prisma.order.create({
      data: {
        code: generateOrderCode(),
        customerName: customerName || "ลูกค้าหน้าร้าน",
        status: paid ? "PAID" : "UNPAID",
        method: method || (paid ? "CASH" : null),
        total,
        amountPaid: amountPaid ? Number(amountPaid) : null,
        change,
        items: {
          create: items.map((it) => ({
            menuId: it.menuId,
            name: it.name,
            qty: it.qty,
            price: it.price,
            note: it.note || null,
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json(order);
  } catch (e) {
    next(e);
  }
});

/** -------------------- GET: /api/orders -------------------- */
router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const list = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/** -------------------- GET: /api/orders/:id -------------------- */
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const found = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!found) return res.status(404).json({ message: "ไม่พบออเดอร์" });
    res.json(found);
  } catch (e) {
    next(e);
  }
});

/** -------------------- PUT: /api/orders/:id -------------------- */
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const updated = await prisma.order.update({
      where: { id },
      data: { status },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

export default router;
