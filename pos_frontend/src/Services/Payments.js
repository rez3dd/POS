// src/Services/Payments.js
import api from "./api";

/** ดึงออเดอร์ที่ยังไม่ชำระ */
export async function listUnpaidOrders() {
  // เส้นทางหลัก
  try {
    const { data } = await api.get("/payments/unpaid");
    return Array.isArray(data) ? data : data?.data || [];
  } catch {
    // fallback (โปรเจกต์บางชุดเคยใช้ /orders/unpaid)
    const { data } = await api.get("/orders/unpaid");
    return Array.isArray(data) ? data : data?.data || [];
  }
}

/** ชำระแบบเงินสด – ระบบจะส่งจำนวนเงินรับมาให้ backend */
export async function payCash(orderId, amountReceived) {
  try {
    const { data } = await api.post("/payments/cash", { orderId, amountReceived });
    return data;
  } catch {
    // fallback แบบเก่า
    const { data } = await api.post(`/orders/${orderId}/pay/cash`, { amountReceived });
    return data;
  }
}

/** ชำระแบบ QR/พร้อมเพย์ */
export async function payQR(orderId) {
  try {
    const { data } = await api.post("/payments/qr", { orderId });
    return data;
  } catch {
    // fallback แบบเก่า
    const { data } = await api.post(`/orders/${orderId}/pay/qr`);
    return data;
  }
}
