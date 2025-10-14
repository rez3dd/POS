// src/Services/Orders.js
import { api } from "./api";

/**
 * ดึงรายการออเดอร์
 * ใช้ได้ 2 แบบ:
 *   listOrders("?limit=50&sort=desc")
 *   listOrders({ status: "PAID", limit: 50, sort: "desc" })
 */
export async function listOrders(queryOrParams) {
  if (typeof queryOrParams === "string") {
    const { data } = await api.get(`/orders${queryOrParams}`);
    return Array.isArray(data) ? data : data?.data || [];
  }
  const p = {};
  if (queryOrParams?.status)
    p.status = String(queryOrParams.status).toUpperCase(); // PENDING | PAID
  if (queryOrParams?.limit != null) p.limit = queryOrParams.limit;
  if (queryOrParams?.sort) p.sort = queryOrParams.sort;   // "desc" | "asc"

  const { data } = await api.get("/orders", { params: p });
  return Array.isArray(data) ? data : data?.data || [];
}

/** ดึงรายละเอียดออเดอร์ตาม id */
export async function getOrderById(id) {
  const { data } = await api.get(`/orders/${id}`);
  return data;
}
// alias เผื่อบางไฟล์เรียกชื่อ getOrderDetail
export const getOrderDetail = getOrderById;

/** สร้างออเดอร์ใหม่ (payload: { customerName, items: [{menuId, qty, note?}] }) */
export async function createOrder(payload) {
  const { data } = await api.post("/orders", payload);
  return data;
}

/** อัปเดตข้อมูลออเดอร์ (ทั่วไป) */
export async function updateOrder(id, body) {
  const { data } = await api.put(`/orders/${id}`, body);
  return data;
}

/** อัปเดตเฉพาะสถานะออเดอร์ (PENDING | PAID) */
export async function updateOrderStatus(id, status) {
  const { data } = await api.put(`/orders/${id}`, {
    status: String(status).toUpperCase(),
  });
  return data;
}

/** ลบออเดอร์ (ถ้า backend รองรับ) */
export async function deleteOrder(id) {
  const { data } = await api.delete(`/orders/${id}`);
  return data;
}
