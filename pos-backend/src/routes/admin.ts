import { Router } from "express";
import prisma from "../prisma";

const router = Router();

/**
 * ⚠️ Dev-only: รีเซ็ตข้อมูลเมนู “เริ่มใหม่”
 * - ลบ OrderItem -> Order -> Menu (ตามลำดับ ป้องกัน FK)
 * - ควรซ่อน endpoint นี้ไว้ใช้เฉพาะเครื่อง dev/test เท่านั้น
 */
router.post("/reset-menus", async (_req, res, next) => {
  try {
    const delItems = await prisma.orderItem.deleteMany({});
    const delOrders = await prisma.order.deleteMany({});
    const delMenus  = await prisma.menu.deleteMany({});

    res.json({
      ok: true,
      deleted: {
        orderItems: delItems.count,
        orders: delOrders.count,
        menus: delMenus.count,
      },
      message: "ล้างข้อมูลเมนู (และคำสั่งซื้อทั้งหมด) สำเร็จ",
    });
  } catch (e) {
    next(e);
  }
});

export default router;
