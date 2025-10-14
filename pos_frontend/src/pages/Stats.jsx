// src/pages/Stats.jsx
import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/shared/AppLayout";
import SidebarAdmin from "../components/components for admin and staff/SidebarAdmin";
import {
  getStatsOverview,
  getDaily,
  getMonthly,
  getPaymentBreakdown,
  getTopDishes,
} from "../Services/Stats";

import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

/* ---------- helpers ---------- */
const COLORS = ["#facc15", "#22c55e", "#60a5fa", "#f472b6", "#34d399", "#f59e0b"];
const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const toStr = (v) => (v == null ? "" : String(v));

function normalizeDaily(list) {
  if (!Array.isArray(list)) return [];
  return list.map((d) => ({
    date: toStr(d.date ?? d.day ?? d.label),
    revenue: toNum(d.revenue ?? d.sales ?? d.amount),
    orders: toNum(d.orders ?? d.count),
  }));
}
function normalizeMonthly(list) {
  if (!Array.isArray(list)) return [];
  return list.map((m) => ({
    month: toStr(m.month ?? m.label),
    revenue: toNum(m.revenue ?? m.sales ?? m.amount),
    orders: toNum(m.orders ?? m.count),
  }));
}
function normalizePayments(list) {
  if (!Array.isArray(list)) return [];
  return list.map((p) => ({
    name: toStr(p.name ?? p.method ?? p.type),
    value: toNum(p.value ?? p.count ?? p.amount),
  }));
}
function normalizeTops(list) {
  if (!Array.isArray(list)) return [];
  return list.map((t) => ({
    name: toStr(t.name ?? t.menu ?? t.title),
    orders: toNum(t.orders ?? t.count),
    revenue: toNum(t.revenue ?? t.sales ?? t.amount),
  }));
}

export default function Stats() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [ov, setOv] = useState({});
  const [daily, setDaily] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [pay, setPay] = useState([]);
  const [tops, setTops] = useState([]);

  const [dailyRange, setDailyRange] = useState(14);
  const [monthlyRange, setMonthlyRange] = useState(6);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [overview, d, m, p, t] = await Promise.all([
        getStatsOverview(),
        getDaily(dailyRange),
        getMonthly(monthlyRange),
        getPaymentBreakdown(),
        getTopDishes(5),
      ]);
      setOv(overview || {});
      setDaily(normalizeDaily(d));
      setMonthly(normalizeMonthly(m));
      setPay(normalizePayments(p));
      setTops(normalizeTops(t));
    } catch (e) {
      setError(e?.message || "โหลดข้อมูลสถิติไม่สำเร็จ");
      setOv({});
      setDaily([]);
      setMonthly([]);
      setPay([]);
      setTops([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyRange, monthlyRange]);

  const totalRevenueMonthly = useMemo(
    () => monthly.reduce((s, i) => s + (i.revenue || 0), 0),
    [monthly]
  );

  return (
    <AppLayout sidebar={<SidebarAdmin />}>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold">สถิติ</h1>
        <div className="flex gap-2 text-sm">
          <span className="text-gray-400">ช่วงรายวัน:</span>
          <select
            className="bg-[#1f1f1f] border border-[#3a3a3a] rounded px-2 py-1"
            value={dailyRange}
            onChange={(e) => setDailyRange(+e.target.value)}
          >
            <option value={7}>7 วัน</option>
            <option value={14}>14 วัน</option>
            <option value={30}>30 วัน</option>
          </select>

          <span className="ml-4 text-gray-400">ช่วงรายเดือน:</span>
          <select
            className="bg-[#1f1f1f] border border-[#3a3a3a] rounded px-2 py-1"
            value={monthlyRange}
            onChange={(e) => setMonthlyRange(+e.target.value)}
          >
            <option value={3}>3 เดือน</option>
            <option value={6}>6 เดือน</option>
            <option value={12}>12 เดือน</option>
          </select>

          <button
            onClick={load}
            className="ml-3 px-3 py-1 rounded border border-[#3a3a3a] bg-[#23232a] hover:bg-[#30303a]"
          >
            รีโหลด
          </button>
        </div>
      </div>

      {loading && <div className="text-gray-300">กำลังโหลด...</div>}
      {!!error && (
        <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* KPI Overview */}
          <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="carddark p-4">
              <div className="text-gray-400 text-sm">รายได้วันนี้</div>
              <div className="text-2xl font-extrabold text-yellow-400 mt-1">
                {(ov?.revenueToday ?? 0).toLocaleString()} ฿
              </div>
            </div>
            <div className="carddark p-4">
              <div className="text-gray-400 text-sm">ออเดอร์วันนี้</div>
              <div className="text-2xl font-extrabold">{ov?.ordersToday ?? 0}</div>
            </div>
            <div className="carddark p-4">
              <div className="text-gray-400 text-sm">ค่าเฉลี่ย/บิล</div>
              <div className="text-2xl font-extrabold">{(ov?.avgTicket ?? 0).toLocaleString()} ฿</div>
            </div>
            <div className="carddark p-4">
              <div className="text-gray-400 text-sm">กำลังดำเนินการ</div>
              <div className="text-2xl font-extrabold">{ov?.inProgress ?? 0}</div>
            </div>
          </section>

          {/* กราฟรายวัน */}
          <section className="carddark p-4 mb-6">
            <div className="mb-3 font-semibold">ยอดขายรายวัน (Revenue / Orders)</div>
            {daily.length === 0 ? (
              <div className="text-gray-400 text-sm">ยังไม่มีข้อมูลรายวัน</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={daily}>
                    <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#aaa" />
                    <YAxis yAxisId="left" stroke="#aaa" />
                    <YAxis yAxisId="right" orientation="right" stroke="#aaa" />
                    <Tooltip contentStyle={{ background: "#1f1f1f", border: "1px solid #3a3a3a", color: "#fff" }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#facc15" strokeWidth={2} dot={false} name="รายได้ (฿)" />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#60a5fa" strokeWidth={2} dot={false} name="จำนวนออเดอร์" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* กราฟรายเดือน + Breakdown การชำระเงิน */}
          <div className="grid lg:grid-cols-3 gap-4 mb-6">
            <section className="carddark p-4 lg:col-span-2">
              <div className="mb-3 font-semibold">ยอดขายรายเดือน</div>
              {monthly.length === 0 ? (
                <div className="text-gray-400 text-sm">ยังไม่มีข้อมูลรายเดือน</div>
              ) : (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthly}>
                        <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                        <XAxis dataKey="month" stroke="#aaa" />
                        <YAxis stroke="#aaa" />
                        <Tooltip contentStyle={{ background: "#1f1f1f", border: "1px solid #3a3a3a", color: "#fff" }} />
                        <Legend />
                        <Bar dataKey="revenue" name="รายได้ (฿)" fill="#facc15" />
                        <Bar dataKey="orders" name="ออเดอร์ (ชุด)" fill="#60a5fa" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-right text-sm text-gray-400 mt-2">
                    รวม {totalRevenueMonthly.toLocaleString()} ฿
                  </div>
                </>
              )}
            </section>

            <section className="carddark p-4">
              <div className="mb-3 font-semibold">สัดส่วนการชำระเงิน</div>
              {pay.length === 0 ? (
                <div className="text-gray-400 text-sm">ยังไม่มีข้อมูลการชำระเงิน</div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pay} dataKey="value" nameKey="name" outerRadius={90} label>
                        {pay.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#1f1f1f", border: "1px solid #3a3a3a", color: "#fff" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>

          {/* เมนูยอดนิยม */}
          <section className="carddark p-4">
            <div className="mb-3 font-semibold">เมนูยอดนิยม</div>
            {tops.length === 0 ? (
              <div className="text-gray-400 text-sm">ยังไม่มีข้อมูลเมนูยอดนิยม</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tops.map((it, idx) => (
                  <div key={idx} className="carditem p-4">
                    <div className="font-semibold">{it.name}</div>
                    <div className="text-sm text-gray-400 mt-1">ออเดอร์: {it.orders}</div>
                    <div className="text-sm mt-2">
                      รายได้รวม:{" "}
                      <span className="text-yellow-400 font-semibold">
                        {(it.revenue ?? 0).toLocaleString()} ฿
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AppLayout>
  );
}
