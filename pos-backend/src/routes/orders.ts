// src/routes/orders.ts
import { Router, Request, Response } from "express";
import prisma from "../prisma";

const router = Router();

/**
 * GET /api/orders
 * ?status=PENDING|PAID (ไม่ส่ง = ทั้งหมด)
 * ?limit=จำนวน (default 200)
 * ?sort=desc|asc (default desc)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string | undefined)?.toUpperCase();
    const limit = Number(req.query.limit ?? 200);
    const sort: "asc" | "desc" =
      (req.query.sort as string)?.toLowerCase() === "asc" ? "asc" : "desc";

    const where: any = {};
    if (status === "PENDING" || status === "PAID") where.status = status;

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: sort },
      take: isNaN(limit) ? 200 : limit,
      select: {
        id: true,
        code: true,
        customerName: true,
        status: true,
        total: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(orders);
  } catch (e: any) {
    console.error("GET /api/orders error:", e);
    res.status(500).json({ message: e?.message || "Failed to get orders" });
  }
});

/**
 * GET /api/orders/:id
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menu: { select: { id: true, name: true, price: true, imageUrl: true } },
          },
        },
      },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (e: any) {
    console.error("GET /api/orders/:id error:", e);
    res.status(500).json({ message: e?.message || "Failed to get order detail" });
  }
});

/**
 * POST /api/orders
 * body: { customerName?: string, items: [{ menuId:number, qty:number, note?:string }] }
 * สร้างออเดอร์ใหม่ (คำนวณ total จากราคาของเมนู)
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { customerName, items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items is required" });
    }

    // ดึงราคาเมนู
    const menuIds = [...new Set(items.map((it: any) => Number(it.menuId)))].filter(Boolean);
    const menus = await prisma.menu.findMany({
      where: { id: { in: menuIds } },
      select: { id: true, price: true },
    });
    const priceMap = new Map<number, number>();
    menus.forEach((m) => priceMap.set(m.id, m.price));

    let total = 0;
    const createItems = items.map((it: any) => {
      const mid = Number(it.menuId);
      const qty = Math.max(1, Number(it.qty || 1));
      const price = priceMap.get(mid) ?? 0;
      total += price * qty;
      return { menuId: mid, qty, price, note: it.note ?? null };
    });

    // สร้าง code ง่าย ๆ
    const code = "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase();

    const created = await prisma.order.create({
      data: {
        code,
        customerName: customerName || "ลูกค้าหน้าร้าน",
        status: "PENDING", // เริ่มต้นเป็นยังไม่ชำระ
        total,
        items: { create: createItems },
      },
      include: { items: true },
    });

    res.status(201).json(created);
  } catch (e: any) {
    console.error("POST /api/orders error:", e);
    res.status(500).json({ message: e?.message || "Failed to create order" });
  }
});

/**
 * PUT /api/orders/:id
 * body: สามารถส่ง { status: "PENDING"|"PAID", note?, customerName?, total? }
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

    const data: any = {};
    if (req.body.status) data.status = String(req.body.status).toUpperCase();
    if (req.body.note !== undefined) data.note = req.body.note ?? null;
    if (req.body.customerName !== undefined) data.customerName = req.body.customerName ?? null;
    if (req.body.total !== undefined) data.total = Number(req.body.total);

    const updated = await prisma.order.update({
      where: { id },
      data,
      include: { items: true },
    });

    res.json(updated);
  } catch (e: any) {
    console.error("PUT /api/orders/:id error:", e);
    res.status(500).json({ message: e?.message || "Failed to update order" });
  }
});

export default router;
