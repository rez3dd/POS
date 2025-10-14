// src/Services/Stats.js
import { api } from "./api";

/* ---------- helpers ---------- */
function pickArray(x) {
  if (Array.isArray(x)) return x;
  if (x && typeof x === "object") {
    if (Array.isArray(x.data)) return x.data;
    if (Array.isArray(x.items)) return x.items;
    if (Array.isArray(x.results)) return x.results;
    if (Array.isArray(x.list)) return x.list;
  }
  return [];
}

function pickObject(x) {
  if (!x || typeof x !== "object") return x;
  return x.data ?? x.result ?? x.overview ?? x.summary ?? x;
}

async function tryPaths(paths, params) {
  let lastErr;
  for (const p of paths) {
    try {
      const res = await api.get(`/stats${p}`, params ? { params } : undefined);
      return res?.data ?? res;
    } catch (e) {
      const s = e?.response?.status;
      // ถ้าเจอ error 404, 405, 400 ให้ข้าม path ไปลองอันถัดไป
      if (s !== 404 && s !== 405 && s !== 400) {
        lastErr = e;
        break;
      }
      lastErr = e;
    }
  }
  if (lastErr) throw lastErr;
  throw new Error("No matching /stats endpoint");
}

/* ---------- APIs with fallback ---------- */

// 🟡 ภาพรวม KPI วันนี้
export async function getStatsOverview() {
  try {
    const data = await tryPaths(
      ["/overview", "", "/summary", "/report"],
    );
    return pickObject(data);
  } catch (e) {
    console.warn("getStatsOverview failed:", e.message);
    return { revenueToday: 0, ordersToday: 0, avgTicket: 0, inProgress: 0 };
  }
}

// 🟢 ยอดขายรายวัน (chart)
export async function getDaily(days = 14) {
  try {
    const data = await tryPaths(["/daily"], { days });
    return pickArray(data);
  } catch (e) {
    console.warn("getDaily failed:", e.message);
    return [];
  }
}

// 🟠 ยอดขายรายเดือน
export async function getMonthly(months = 6) {
  try {
    const data = await tryPaths(["/monthly"], { months });
    return pickArray(data);
  } catch (e) {
    console.warn("getMonthly failed:", e.message);
    return [];
  }
}

// 🔵 สัดส่วนการชำระเงิน (pie chart)
export async function getPaymentBreakdown() {
  try {
    const data = await tryPaths(["/payments"]);
    return pickArray(data);
  } catch (e) {
    console.warn("getPaymentBreakdown failed:", e.message);
    return [];
  }
}

// 🍽️ เมนูยอดนิยม
export async function getTopDishes(limit = 5) {
  try {
    const data = await tryPaths(["/top-dishes"], { limit });
    return pickArray(data);
  } catch (e) {
    console.warn("getTopDishes failed:", e.message);
    return [];
  }
}
