// pos-backend/src/routes/payments.ts
import express from "express";
import prisma from "../prisma";

const router = express.Router();

/**
 * GET /api/payments/order/:id
 * ดึงข้อมูลออเดอร์พร้อมรายการสินค้า และชื่อเมนู (menu.name)
 */
router.get("/order/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const where =
      /^\d+$/.test(id) ? { id: Number(id) } : { code: decodeURIComponent(id) };

    const order = await prisma.order.findFirst({
      where,
      include: {
        items: {
          include: {
            menu: {
              select: { id: true, name: true, imageUrl: true, price: true },
            },
          },
        },
      },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GET /payments/order/:id failed:", err);
    res.status(500).json({ message });
  }
});

/**
 * POST /api/payments/pay
 * Body:
 * {
 *   "orderId": 123,             // หรือส่ง "code": "#ORD-..."
 *   "method": "CASH" | "QR" | "CARD" | "...",
 *   "amountPaid": 200,
 *   "note": "ข้อความเพิ่มเติม (optional)"
 * }
 */
router.post("/pay", async (req, res) => {
  try {
    const { orderId, code, method, amountPaid, note } = req.body || {};

    if (!orderId && !code) {
      return res.status(400).json({ message: "กรุณาระบุ orderId หรือ code" });
    }

    const where =
      orderId ? { id: Number(orderId) } : { code: String(code) };

    // ดึงออเดอร์ + รายการสินค้า (เพื่อคำนวณยอด)
    const order = await prisma.order.findFirst({
      where,
      include: {
        items: {
          include: {
            menu: { select: { id: true, name: true, imageUrl: true, price: true } },
          },
        },
      },
    });

    if (!order) return res.status(404).json({ message: "ไม่พบออเดอร์" });
    if (!Array.isArray(order.items) || order.items.length === 0) {
      return res.status(400).json({ message: "ออเดอร์นี้ไม่มีรายการสินค้า" });
    }

    // คำนวณยอดรวมจาก items (qty * price ที่บันทึกไว้ใน OrderItem)
    const computedTotal = order.items.reduce(
      (sum, it) => sum + Number(it.qty) * Number(it.price),
      0
    );

    const total = computedTotal; // ใช้ยอดจากรายการสินค้าเป็นหลัก
    const paid = Number(amountPaid ?? 0);
    const change = Math.max(paid - total, 0);

    // อัปเดตสถานะการชำระเงิน
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID", // ตาม enum OrderStatus ใน schema
        method: method ?? order.method ?? null,
        amountPaid: paid,
        change,
        note: note ?? order.note ?? null,
        total, // sync total ให้เท่ากับยอดจาก items
      },
      include: {
        items: {
          include: {
            menu: { select: { id: true, name: true, imageUrl: true, price: true } },
          },
        },
      },
    });

    res.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /payments/pay failed:", err);
    res.status(500).json({ message });
  }
});

export default router;
