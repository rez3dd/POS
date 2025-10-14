// src/pages/HomeStaff.jsx
import React, { useEffect, useState } from "react";
import AppLayout from "../components/shared/AppLayout";
import SidebarStaff from "../components/components for admin and staff/SidebarStaff";
import ClockBadge from "../components/shared/ClockBadge";

import { getStatsOverview, getTopDishes } from "../Services/Stats";
import { listOrders } from "../Services/Orders";

const LIMIT = 7;
const POLL_MS = 15000;

function KpiCard({ title, value, hint }) {
  return (
    <div className="rounded-2xl bg-[#191a1f] border border-[#282a33] p-5 shadow-sm">
      <div className="text-sm text-gray-300 mb-1">{title}</div>
      <div className="text-3xl font-extrabold text-white tabular-nums">{value}</div>
      {!!hint && <div className="text-xs text-gray-400 mt-2">{hint}</div>}
    </div>
  );
}

function StatusPill({ v }) {
  const s = String(v || "").toUpperCase();
  const cls =
    s === "PAID"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-700/40"
      : "bg-yellow-500/10 text-yellow-300 border-yellow-700/40";
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] border ${cls}`}>
      {s === "PAID" ? "ชำระแล้ว" : "ยังไม่ชำระ"}
    </span>
  );
}

export default function HomeStaff() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    revenueToday: 0,
    inProgress: 0,
    ordersToday: 0,
    avgTicket: 0,
  });
  const [recent, setRecent] = useState([]);
  const [popular, setPopular] = useState([]);

  async function loadAll() {
    const [ov, ro, td] = await Promise.all([
      getStatsOverview(),
      listOrders({ limit: LIMIT, sort: "desc" }),
      getTopDishes(LIMIT),
    ]);
    setOverview(ov || {});
    const r = Array.isArray(ro) ? ro : ro?.data || [];
    const p = Array.isArray(td) ? td : td?.data || [];
    setRecent(r.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, LIMIT));
    setPopular(p.sort((a, b) => (b.orders ?? 0) - (a.orders ?? 0)).slice(0, LIMIT));
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        await loadAll();
      } catch (e) {
        console.error("HomeStaff load error:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    const t = setInterval(loadAll, POLL_MS);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <AppLayout sidebar={<SidebarStaff />}>
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              สวัสดีตอนเช้า, <span className="text-green-400">Staff</span>
            </h1>
            <div className="text-sm text-gray-400 mt-1">
              พร้อมรับออเดอร์และให้บริการลูกค้า
            </div>
          </div>
          <ClockBadge showSeconds className="rounded-lg border border-[#2d2d2d] px-3 py-2" />
        </div>

        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <KpiCard title="รายได้วันนี้" value={`฿${overview.revenueToday || 0}`} hint="เปรียบเทียบเมื่อวาน (กำหนดต่อยอดได้)" />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <KpiCard title="ออเดอร์กำลังดำเนินการ" value={overview.inProgress || 0} hint="รวมสถานะ PENDING และ PREPARING" />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <KpiCard title="จำนวนบิล (วันนี้)" value={overview.ordersToday || 0} hint="เฉพาะออเดอร์ที่ชำระเงินแล้ว" />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <KpiCard title="ค่าเฉลี่ย/บิล (วันนี้)" value={`฿${overview.avgTicket || 0}`} hint="รายได้วันนี้ ÷ จำนวนบิลวันนี้" />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Recent */}
          <div className="col-span-12 lg:col-span-8">
            <div className="rounded-2xl bg-[#16171b] border border-[#24262e] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-white font-semibold">ออเดอร์ล่าสุด (สูงสุด {LIMIT} รายการ)</div>
              </div>

              {loading ? (
                <div className="h-40 rounded-lg bg-[#1e1f25] animate-pulse" />
              ) : (
                <div className="space-y-2">
                  {recent.slice(0, LIMIT).map((o) => (
                    <div key={o.id} className="flex items-center justify-between rounded-xl bg-[#17181d] border border-[#262830] px-4 py-3">
                      <div>
                        <div className="text-white font-medium">{o.code || `ORD-${o.id}`}</div>
                        <div className="text-xs text-gray-400">
                          ลูกค้าหน้าร้าน • {new Date(o.createdAt).toLocaleString("th-TH")}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusPill v={o.status === "PAID" ? "PAID" : "UNPAID"} />
                        <div className="text-yellow-400 font-semibold tabular-nums">฿{o.total ?? 0}</div>
                      </div>
                    </div>
                  ))}
                  {(!recent || recent.length === 0) && (
                    <div className="text-sm text-gray-400">ยังไม่มีออเดอร์</div>
                  )}
                </div>
              )}
            </div>
          </div>

        {/* Popular */}
          <div className="col-span-12 lg:col-span-4">
            <div className="rounded-2xl bg-[#16171b] border border-[#24262e] p-4">
              <div className="text-white font-semibold mb-3">เมนูยอดนิยม (สูงสุด {LIMIT} รายการ)</div>
              {loading ? (
                <div className="h-40 rounded-lg bg-[#1e1f25] animate-pulse" />
              ) : (
                <div className="space-y-2">
                  {popular.slice(0, LIMIT).map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl bg-[#17181d] border border-[#262830] px-4 py-3">
                      <div className="text-gray-200">
                        <span className="text-gray-400 mr-2">#{idx + 1}</span>
                        {it.name || "-"}
                        <span className="text-xs text-gray-400 ml-2">
                          (ออเดอร์: {it.orders ?? 0} • รายได้: {it.revenue ?? 0} ฿)
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!popular || popular.length === 0) && (
                    <div className="text-sm text-gray-400">ยังไม่มีข้อมูลเมนูยอดนิยม</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-10" />
      </div>
    </AppLayout>
  );
}
