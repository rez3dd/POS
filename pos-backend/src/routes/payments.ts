// src/routes/payments.ts
import { Router } from "express";
import prisma from "../prisma";

const router = Router();

/** map order ให้ payload เบา ๆ */
function mapOrder(o: any) {
  return {
    id: o.id,
    code: o.code,
    customerName: o.customerName,
    status: o.status,
    total: o.total ?? 0,
    createdAt: o.createdAt,
    items: (o.items || []).map((it: any) => ({
      id: it.id,
      menuId: it.menuId,
      name: it.menu?.name || "",
      qty: it.qty,
      price: it.price ?? 0,
    })),
  };
}

/** GET /api/payments/unpaid : ออเดอร์ที่ยังไม่ชำระ */
router.get("/unpaid", async (_req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { in: ["PENDING", "PREPARING", "READY"] } },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { menu: true } } },
    });
    res.json(orders.map(mapOrder));
  } catch (e: any) {
    console.error("payments/unpaid error:", e);
    res.status(500).json({ message: e?.message || "Unable to load unpaid orders" });
  }
});

/** POST /api/payments/cash { orderId, amountReceived }
 *  - อัปเดตสถานะเป็น PAID
 *  - คำนวณเงินทอน และส่งกลับ
 */
router.post("/cash", async (req, res) => {
  try {
    const { orderId, amountReceived } = req.body as {
      orderId: number;
      amountReceived?: number;
    };
    if (!orderId) return res.status(400).json({ message: "orderId is required" });

    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "PAID") return res.status(400).json({ message: "Order already paid" });

    const total = order.total ?? 0;
    const received = Number(amountReceived ?? total);
    if (received < total)
      return res.status(400).json({ message: "Received amount is less than total" });

    const change = received - total;

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID" },
      include: { items: true },
    });

    res.json({ ok: true, order: mapOrder(updated), amountReceived: received, change });
  } catch (e: any) {
    console.error("payments/cash error:", e);
    res.status(500).json({ message: e?.message || "Cash payment failed" });
  }
});

/** POST /api/payments/qr { orderId }
 *  - อัปเดตสถานะเป็น PAID
 *  - ถือว่ารับครบตามยอด (amountReceived = total)
 */
router.post("/qr", async (req, res) => {
  try {
    const { orderId } = req.body as { orderId: number };
    if (!orderId) return res.status(400).json({ message: "orderId is required" });

    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "PAID") return res.status(400).json({ message: "Order already paid" });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID" },
      include: { items: true },
    });

    const total = order.total ?? 0;
    res.json({ ok: true, order: mapOrder(updated), amountReceived: total, change: 0 });
  } catch (e: any) {
    console.error("payments/qr error:", e);
    res.status(500).json({ message: e?.message || "QR payment failed" });
  }
});

export default router;
