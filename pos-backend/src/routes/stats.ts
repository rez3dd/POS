// pos-backend/src/routes/stats.ts
import { Router, Request, Response, NextFunction } from "express";
import prisma from "../prisma";

const router = Router();

/* ---------- helpers ---------- */
function startOfDay(d: Date = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d: Date = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1, 0, 0, 0, 0);
}

/** -------------------- GET: /api/stats/overview -------------------- */
router.get(
  "/overview",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const today0 = startOfDay();

      const paidToday = await prisma.order.findMany({
        where: { status: "PAID", createdAt: { gte: today0 } },
        select: { total: true },
      });
      const revenueToday = paidToday.reduce((s, o) => s + (o.total ?? 0), 0);
      const ordersToday = paidToday.length;
      const avgTicket = ordersToday
        ? Math.round(revenueToday / ordersToday)
        : 0;

      const inProgress = await prisma.order.count({
        where: { status: { in: ["PENDING", "PREPARING"] } },
      });

      res.json({ revenueToday, ordersToday, avgTicket, inProgress });
    } catch (e) {
      next(e);
    }
  }
);

/** -------------------- GET: /api/stats/daily?days=14 -------------------- */
router.get(
  "/daily",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = Math.max(1, Number(req.query.days ?? 14));
      const from = startOfDay(addDays(new Date(), -days + 1));

      const orders = await prisma.order.findMany({
        where: { status: "PAID", createdAt: { gte: from } },
        select: { createdAt: true, total: true },
        orderBy: { createdAt: "asc" },
      });

      const buckets = new Map<
        string,
        { date: string; revenue: number; orders: number }
      >();
      for (let i = 0; i < days; i++) {
        const d = addDays(from, i);
        const key = d.toISOString().slice(0, 10);
        buckets.set(key, { date: key, revenue: 0, orders: 0 });
      }

      for (const o of orders) {
        const key = startOfDay(o.createdAt).toISOString().slice(0, 10);
        const b = buckets.get(key);
        if (b) {
          b.revenue += o.total ?? 0;
          b.orders += 1;
        }
      }

      res.json(Array.from(buckets.values()));
    } catch (e) {
      next(e);
    }
  }
);

/** -------------------- GET: /api/stats/monthly?months=6 -------------------- */
router.get(
  "/monthly",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const months = Math.max(1, Number(req.query.months ?? 6));
      const from = startOfMonth(addMonths(new Date(), -months + 1));

      const orders = await prisma.order.findMany({
        where: { status: "PAID", createdAt: { gte: from } },
        select: { createdAt: true, total: true },
        orderBy: { createdAt: "asc" },
      });

      const buckets = new Map<
        string,
        { month: string; revenue: number; orders: number }
      >();
      for (let i = 0; i < months; i++) {
        const d = addMonths(from, i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        buckets.set(key, { month: key, revenue: 0, orders: 0 });
      }

      for (const o of orders) {
        const d = o.createdAt;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        const b = buckets.get(key);
        if (b) {
          b.revenue += o.total ?? 0;
          b.orders += 1;
        }
      }

      res.json(Array.from(buckets.values()));
    } catch (e) {
      next(e);
    }
  }
);

/** -------------------- GET: /api/stats/payments -------------------- */
router.get(
  "/payments",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // ตอนนี้ยังไม่มีการเก็บช่องทางจ่ายจริง → ส่งว่างไว้ก่อน
      res.json([]);
    } catch (e) {
      next(e);
    }
  }
);

/** -------------------- GET: /api/stats/top-dishes?limit=5 --------------- */
router.get(
  "/top-dishes",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.max(1, Number(req.query.limit ?? 5));

      const paidOrders = await prisma.order.findMany({
        where: { status: "PAID" },
        select: {
          id: true,
          items: { select: { menuId: true, qty: true, price: true } },
        },
      });

      const agg = new Map<
        number,
        { menuId: number; qty: number; revenue: number }
      >();
      for (const o of paidOrders) {
        for (const it of o.items) {
          const cur =
            agg.get(it.menuId) || { menuId: it.menuId, qty: 0, revenue: 0 };
          cur.qty += it.qty;
          // ✅ กัน price เป็น null
          cur.revenue += it.qty * (it.price ?? 0);
          agg.set(it.menuId, cur);
        }
      }

      const menuIds = Array.from(agg.keys());
      if (menuIds.length === 0) return res.json([]);

      const menus = await prisma.menu.findMany({
        where: { id: { in: menuIds } },
        select: { id: true, name: true },
      });
      const nameById = new Map(menus.map((m) => [m.id, m.name]));

      const list = Array.from(agg.values())
        .map((x) => ({
          name: nameById.get(x.menuId) || `#${x.menuId}`,
          orders: x.qty,
          revenue: x.revenue,
        }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, limit);

      res.json(list);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
