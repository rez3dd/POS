// src/Services/Staff.js
// Mock service สำหรับ staff (localStorage-backed).
// ใส่ไฟล์นี้แทนของเดิมเพื่อให้ OrderDetailStaff.jsx ทำงานได้

import { getCurrentUser } from "./Auth";

const ORDERS_KEY = "orders";
const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));

// helpers
function loadOrdersRaw() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveOrdersRaw(list) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
}

/**
 * ดึง order ตาม id (สำหรับ staff)
 * คืนค่า object หรือ null
 */
export async function getOrderByIdStaff(id) {
  await wait();
  const list = loadOrdersRaw();
  const o = list.find((x) => String(x.id) === String(id));
  if (!o) return null;
  // คืนค่า (คัดลอก) — หากต้องการ Date ให้แปลงฝั่ง UI
  return { ...o };
}

/**
 * อัปเดตสถานะ order (สำหรับ staff/admin)
 * ตัวอย่างจำกัดให้ staff เปลี่ยนได้เฉพาะ 'กำลังทำ' <-> 'พร้อมเสิร์ฟ'
 */
export async function updateOrderStatusStaff(id, newStatus) {
  await wait();
  const user = getCurrentUser();
  if (!user) throw new Error("ไม่ได้ล็อกอิน");
  if (user.role !== "staff" && user.role !== "admin") {
    throw new Error("สิทธิ์ไม่เพียงพอ");
  }

  const list = loadOrdersRaw();
  const idx = list.findIndex((o) => String(o.id) === String(id));
  if (idx === -1) throw new Error("ไม่พบออเดอร์");

  const allowed = ["กำลังทำ", "พร้อมเสิร์ฟ", "ชำระเงินแล้ว"];
  if (!allowed.includes(newStatus)) throw new Error("สถานะไม่ถูกต้อง");

  list[idx] = { ...list[idx], status: newStatus };
  saveOrdersRaw(list);
  return list[idx];
}

/**
 * ชำระเงินทั้งออเดอร์ (simple)
 * payment: { method, amountPaid, change, ref }
 */
export async function payOrderStaff(orderId, payment) {
  await wait();
  const user = getCurrentUser();
  if (!user) throw new Error("ไม่ได้ล็อกอิน");
  if (user.role !== "staff" && user.role !== "admin") {
    throw new Error("สิทธิ์ไม่พอ");
  }

  const list = loadOrdersRaw();
  const idx = list.findIndex((o) => String(o.id) === String(orderId));
  if (idx === -1) throw new Error("ไม่พบออเดอร์");

  const order = { ...list[idx] };
  order.payment = {
    method: payment.method || "cash",
    amountPaid: Number(payment.amountPaid || order.total || 0),
    change: Number(payment.change || 0),
    ref: payment.ref || null,
    paidAt: new Date().toISOString(),
    paidBy: user?.email || user?.name || "staff",
  };
  order.status = "ชำระเงินแล้ว";

  list[idx] = order;
  saveOrdersRaw(list);
  return order;
}

/**
 * ชำระเฉพาะบางเมนูภายในออเดอร์ (staff only)
 * itemIndexes: array ของ index ใน order.items
 * payment: { method, amountPaid, change, ref }
 *
 * จะบันทึก payment record ลง order.payments[] และติด flag item.paid
 */
export async function payOrderItemsStaff(orderId, itemIndexes = [], payment = {}) {
  await wait();
  const user = getCurrentUser();
  if (!user || (user.role !== "staff" && user.role !== "admin")) {
    throw new Error("สิทธิ์ไม่เพียงพอ");
  }

  const list = loadOrdersRaw();
  const idx = list.findIndex((o) => String(o.id) === String(orderId));
  if (idx === -1) throw new Error("ไม่พบออเดอร์");

  const order = { ...list[idx] };
  order.items = (order.items || []).map((it) => ({ ...it }));

  const validIdx = itemIndexes.filter((i) => i >= 0 && i < order.items.length);
  if (!validIdx.length) throw new Error("ไม่มีเมนูที่เลือก");

  const paidAmount = validIdx.reduce((s, i) => {
    const it = order.items[i];
    return s + (Number(it.price || 0) * Number(it.qty || 0));
  }, 0);

  const paymentRecord = {
    id: `pay_${Date.now()}`,
    items: validIdx.map((i) => ({
      index: i,
      name: order.items[i].name,
      qty: order.items[i].qty,
      amount: order.items[i].price * order.items[i].qty,
    })),
    method: payment.method || "cash",
    amountPaid: Number(payment.amountPaid || paidAmount),
    change: Number(payment.change || 0),
    ref: payment.ref || null,
    paidAt: new Date().toISOString(),
    paidBy: user?.email || user?.name || "staff",
  };

  order.payments = Array.isArray(order.payments) ? order.payments.slice() : [];
  order.payments.push(paymentRecord);

  validIdx.forEach((i) => {
    order.items[i] = { ...order.items[i], paid: true };
  });

  const allPaid = order.items.every((it) => it.paid);
  if (allPaid) order.status = "ชำระเงินแล้ว";

  list[idx] = order;
  saveOrdersRaw(list);
  return order;
}

/**
 * สร้างออเดอร์ (helper สำหรับทดสอบ)
 * payload: { customerName, items: [{name,price,qty}], status }
 */
export async function createOrderStaff(payload) {
  await wait();
  const list = loadOrdersRaw();
  const maxId = list.reduce((m, o) => Math.max(m, Number(o.id) || 0), 0);
  const id = String((maxId || 1000) + 1);
  const items = (payload.items || []).map((it) => ({
    ...it,
    qty: Number(it.qty || 1),
    price: Number(it.price || 0),
    paid: false,
  }));
  const total = items.reduce((s, it) => s + it.qty * it.price, 0);
  const order = {
    id,
    customerName: payload.customerName || "ลูกค้าหน้าร้าน",
    status: payload.status || "กำลังทำ",
    items,
    itemCount: items.reduce((s, it) => s + it.qty, 0),
    total,
    payments: [],
    createdAt: new Date().toISOString(),
  };
  list.unshift(order);
  saveOrdersRaw(list);
  return order;
}

/* Default export (optional) */
export default {
  getOrderByIdStaff,
  updateOrderStatusStaff,
  payOrderStaff,
  payOrderItemsStaff,
  createOrderStaff,
};
