import express from "express";
import prisma from "../prisma";
import { requireAuth, requireRole } from "../middlewares/auth";
import { OrderStatus } from "@prisma/client";

const router = express.Router();

// ต้องล็อกอิน และอนุญาต STAFF/ADMIN เข้าถึงหน้าเก็บเงิน
router.use(requireAuth, requireRole(["STAFF", "ADMIN"]));

/**
 * GET /api/payments/eligible
 * รายการออเดอร์ที่ "ยังไม่ชำระ" ทั้งหมด (ใช้แทนการหา PENDING/READY เดิม)
 */
router.get("/eligible", async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: OrderStatus.UNPAID },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        customerName: true,
        total: true,
        status: true,
        createdAt: true,
        method: true,
        amountPaid: true,
        change: true,
        items: {
          select: {
            id: true,
            name: true,
            qty: true,
            price: true,
            note: true,
          },
        },
      },
    });
    res.json(orders);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/payments/cash
 * body: { orderId: number, amountPaid: number }
 * ตั้งสถานะเป็น PAID และคำนวณเงินทอน
 */
router.post("/cash", async (req, res, next) => {
  try {
    const orderId = Number(req.body?.orderId);
    const amountPaidNum = Number(req.body?.amountPaid);

    if (!orderId || !Number.isFinite(orderId)) {
      return res.status(400).json({ message: "orderId ไม่ถูกต้อง" });
    }
    if (!Number.isFinite(amountPaidNum)) {
      return res.status(400).json({ message: "จำนวนเงินที่รับมาไม่ถูกต้อง" });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: "ไม่พบออเดอร์" });

    if (order.status === OrderStatus.PAID) {
      // จ่ายแล้ว ไม่ต้องจ่ายซ้ำ
      return res.json(order);
    }
    const total = order.total ?? 0;
    if (amountPaidNum < total) {
      return res.status(400).json({ message: "รับเงินไม่เพียงพอต่อยอดรวม" });
    }

    const change = amountPaidNum - total;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        method: "CASH",
        amountPaid: amountPaidNum,
        change,
      },
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/payments/qr/confirm
 * body: { orderId: number }
 * เคสพร้อมเพย์: ยืนยันการชำระ (สมมติรับยอดครบ) → ตั้งสถานะ PAID, method = "QR"
 */
router.post("/qr/confirm", async (req, res, next) => {
  try {
    const orderId = Number(req.body?.orderId);
    if (!orderId || !Number.isFinite(orderId)) {
      return res.status(400).json({ message: "orderId ไม่ถูกต้อง" });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: "ไม่พบออเดอร์" });

    if (order.status === OrderStatus.PAID) {
      // จ่ายแล้ว ไม่ต้องจ่ายซ้ำ
      return res.json(order);
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        method: "QR",
        amountPaid: order.total ?? 0,
        change: 0,
      },
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

/**
 * (ออปชัน) GET /api/payments/summary
 * Summary ง่าย ๆ ของจำนวนบิลที่ยังไม่ชำระ / ชำระแล้ว
 */
router.get("/summary", async (_req, res, next) => {
  try {
    const [unpaid, paid] = await Promise.all([
      prisma.order.count({ where: { status: OrderStatus.UNPAID } }),
      prisma.order.count({ where: { status: OrderStatus.PAID } }),
    ]);
    res.json({ unpaid, paid });
  } catch (e) {
    next(e);
  }
});

export default router;
