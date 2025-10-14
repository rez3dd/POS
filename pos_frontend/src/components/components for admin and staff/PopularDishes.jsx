import React, { useEffect, useState } from "react";
import { getTopDishes } from "../../Services/Stats";

// ทำให้ทนทุกรูปแบบ response
const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const toStr = (v) => (v == null ? "" : String(v));
function normalizeTops(list) {
  if (!Array.isArray(list)) return [];
  return list.map((t, i) => ({
    id: t.id ?? t._id ?? i,
    name: toStr(t.name ?? t.menu ?? t.title),
    orders: toNum(t.orders ?? t.count),
    revenue: toNum(t.revenue ?? t.sales ?? t.amount),
  }));
}

export default function PopularDishes({ limit = 5, title = "เมนูยอดนิยม" }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const raw = await getTopDishes(limit);
        const tops = normalizeTops(raw);
        if (alive) setItems(tops);
      } catch (e) {
        if (alive) {
          setErr(e?.message || "โหลดเมนูยอดนิยมไม่สำเร็จ");
          setItems([]); // กันพัง
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [limit]);

  return (
    <div className="carddark p-4 h-full">
      <div className="mb-3 font-semibold">{title}</div>

      {loading && <div className="text-gray-400 text-sm">กำลังโหลด...</div>}

      {!!err && !loading && (
        <div className="text-red-400 text-sm">{err}</div>
      )}

      {!loading && !err && items.length === 0 && (
        <div className="text-gray-400 text-sm">ยังไม่มีข้อมูลเมนูยอดนิยม</div>
      )}

      {!loading && !err && items.length > 0 && (
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div
              key={it.id ?? idx}
              className="flex items-center justify-between rounded-lg bg-[#1a1b1f] border border-[#2b2d34] px-3 py-2"
            >
              <div>
                <div className="font-medium">{it.name || `เมนู #${idx + 1}`}</div>
                <div className="text-xs text-gray-400">
                  ออเดอร์: {it.orders} · รายได้:{" "}
                  <span className="text-yellow-400">
                    {(it.revenue ?? 0).toLocaleString()} ฿
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-300">#{idx + 1}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
