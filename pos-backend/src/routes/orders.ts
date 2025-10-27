import express from "express";
import prisma from "../prisma";

const router = express.Router();

/* ---------- helpers ---------- */
function pad4(n: number) { return n.toString().padStart(4, "0"); }
function yyyymmdd(d = new Date()) {
  const y = d.getFullYear(); const m = (d.getMonth() + 1).toString().padStart(2, "0"); const dd = d.getDate().toString().padStart(2, "0");
  return `${y}${m}${dd}`;
}
function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d = new Date()) { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function buildOrderCode(seq: number, d = new Date()) { return `#ORD-${yyyymmdd(d)}-${pad4(seq)}`; }

const itemMenuInclude = {
  include: {
    menu: { select: { id: true, name: true, price: true, imageUrl: true } }
  }
} as const;

/* ---------- core create ---------- */
async function createOrderWithCodeSafe(rawData: any) {
  const today = new Date();
  const gte = startOfDay(today);
  const lte = endOfDay(today);

  const itemsArray: Array<{ menuId: number; qty: number; price: number }> =
    Array.isArray(rawData?.items?.create) ? rawData.items.create : [];

  const computedTotal =
    itemsArray.reduce((s, it) => s + Number(it.qty || 0) * Number(it.price || 0), 0) || 0;

  const MAX_RETRY = 3;
  let lastErr: any = null;

  for (let i = 0; i < MAX_RETRY; i++) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        const countToday = await tx.order.count({ where: { createdAt: { gte, lte } } });
        const code = buildOrderCode(countToday + 1, today);

        const total = Number(rawData?.total ?? computedTotal);
        const amountPaid = Number(rawData?.amountPaid ?? 0);
        const change = rawData?.change !== undefined ? Number(rawData.change) : Math.max(amountPaid - total, 0);

        // ถ้าไม่ส่ง status มาและจ่ายครบ/เกิน → ตั้งเป็น PAID
        const computedStatus = rawData?.status ?? (amountPaid >= total ? "PAID" : undefined);

        const data: any = {
          name: rawData?.name ?? `Order ${code}`,
          customerName: rawData?.customerName ?? null,
          method: rawData?.method ?? null,
          amountPaid,
          total,
          change,
          code,
          ...(computedStatus ? { status: computedStatus } : {}),
          ...(rawData?.note ? { note: rawData.note } : {}),
          ...(itemsArray.length
            ? {
                items: {
                  create: itemsArray.map((it) => ({
                    menuId: Number(it.menuId),
                    qty: Number(it.qty),
                    price: Number(it.price),
                  })),
                },
              }
            : {}),
        };

        // สร้างก่อน
        const o = await tx.order.create({
          data,
          include: { items: true },
        });

        // แล้วอ่านกลับพร้อมแนบ menu (เพื่อให้ FE มีชื่อเมนูทันที)
        const withMenu = await tx.order.findUnique({
          where: { id: o.id },
          include: { items: itemMenuInclude },
        });

        return withMenu!;
      });
      return created;
    } catch (e: any) {
      lastErr = e;
      if (e?.code === "P2002") continue; // unique code ซ้ำ → ลองใหม่
      throw e;
    }
  }
  throw lastErr || new Error("create order failed");
}

/* ====================== GET /api/orders ====================== */
router.get("/", async (req, res) => {
  try {
    const limitRaw = String(req.query.limit ?? "20");
    const sortRaw = String(req.query.sort ?? "desc").toLowerCase();

    let take = parseInt(limitRaw, 10);
    if (!Number.isFinite(take) || take <= 0) take = 20;
    if (take > 200) take = 200;

    const orderBy =
      sortRaw === "asc" ? { createdAt: "asc" as const } : { createdAt: "desc" as const };

    const orders = await prisma.order.findMany({
      take,
      orderBy,
      include: { items: itemMenuInclude },
    });

    res.json(orders);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GET /orders failed:", err);
    res.status(500).json({ message });
  }
});

/* ====================== GET /api/orders/:id ====================== */
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const where = /^\d+$/.test(id) ? { id: Number(id) } : { code: decodeURIComponent(id) };

    const order = await prisma.order.findFirst({
      where,
      include: { items: itemMenuInclude },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GET /orders/:id failed:", err);
    res.status(500).json({ message });
  }
});

/* ====================== POST /api/orders ====================== */
router.post("/", async (req, res) => {
  try {
    const { items = [], ...rest } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "ต้องมีรายการสินค้าอย่างน้อย 1 รายการ" });
    }

    // ตรวจสอบเมนูมีจริง
    const ids = items.map((it: any) => Number(it.menuId)).filter((n: any) => Number.isFinite(n));
    const uniqueIds = [...new Set(ids)];
    const menus = await prisma.menu.findMany({ where: { id: { in: uniqueIds } }, select: { id: true } });
    const exist = new Set(menus.map((m) => m.id));
    const missing = uniqueIds.filter((id) => !exist.has(id));
    if (missing.length) {
      return res.status(400).json({ message: `menuId ไม่พบในระบบ: ${missing.join(", ")}` });
    }

    // normalize items
    const normalizedItems = items.map((it: any) => ({
      menuId: Number(it.menuId),
      qty: Number(it.qty),
      price: Number(it.price),
    }));

    const baseData: any = {
      ...rest,
      items: { create: normalizedItems },
    };

    const order = await createOrderWithCodeSafe(baseData);
    res.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code = (err as any)?.code || "";
    if (code === "P2003") {
      return res.status(400).json({ message: "อ้างอิงเมนูไม่ถูกต้อง (Foreign key failed)" });
    }
    console.error("❌ Create order failed:", err);
    res.status(500).json({ message, code });
  }
});

export default router;
