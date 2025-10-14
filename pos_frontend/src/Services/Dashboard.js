// src/Services/Dashboard.js
import { listOrders } from "./Orders";
import { getMenus } from "./Menu";

function pickArray(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
}

export async function getHomeSummaryFromApi() {
  const orders = pickArray(await listOrders({ limit: 500, sort: "desc" }));

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const toUpper = (s) => String(s || "").toUpperCase();
  const isToday = (iso) => {
    if (!iso) return false;
    const d = typeof iso === "string" ? iso : new Date(iso).toISOString();
    return d.slice(0, 10) === todayStr;
    };

  const revenue = orders
    .filter((o) => toUpper(o.status) === "PAID" && isToday(o.createdAt))
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const inProgress = orders.filter((o) => {
    const s = toUpper(o.status);
    return s === "NEW" || s === "PREPARING";
  }).length;

  return { revenue, revenueChangePct: 0, inProgress, inProgressChangePct: 0 };
}

export async function getRecentOrdersFromApi(limit = 5) {
  return pickArray(await listOrders({ limit, sort: "desc" }));
}

export async function getPopularDishesFromApi(limit = 5) {
  const menus = pickArray(await getMenus());
  return menus.slice(0, limit).map((m) => ({
    id: m.id,
    name: m.name,
    price: m.price,
    orders: m.ordersCount || 0,
    image: m.imageUrl || "/noimg.png",
  }));
}
