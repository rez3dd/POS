// src/pages/staff/OrdersStaff.jsx
import React from "react";
import { Link } from "react-router-dom";
import AppLayout from "../../components/shared/AppLayout";
import SidebarStaff from "../../components/components for admin and staff/SidebarStaff";
import { listOrders } from "../../Services/Orders";

const TABS = [
  { key: "ALL", label: "ทั้งหมด" },
  { key: "PENDING", label: "ยังไม่ชำระ" },
  { key: "PAID", label: "ชำระแล้ว" },
];

export default function OrdersStaff() {
  const [orders, setOrders] = React.useState([]);
  const [err, setErr] = React.useState("");
  const [tab, setTab] = React.useState("ALL");

  React.useEffect(() => {
    let alive = true;
    listOrders({ limit: 200, sort: "desc" })
      .then((rows) => alive && setOrders(Array.isArray(rows) ? rows : []))
      .catch((e) => alive && setErr(e?.message || "โหลดคำสั่งซื้อไม่สำเร็จ"));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = React.useMemo(() => {
    if (tab === "ALL") return orders;
    return orders.filter((o) => String(o.status).toUpperCase() === tab);
  }, [orders, tab]);

  const pill = (status) => {
    const s = String(status).toUpperCase();
    const cls =
      s === "PAID"
        ? "bg-emerald-600/20 text-emerald-300 border-emerald-600/40"
        : "bg-yellow-600/20 text-yellow-300 border-yellow-600/40";
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs border ${cls}`}>
        {s === "PAID" ? "ชำระแล้ว" : "ยังไม่ชำระ"}
      </span>
    );
  };

  return (
    <AppLayout sidebar={<SidebarStaff />}>
      <h1 className="text-xl font-bold mb-4">คำสั่งซื้อ (พนักงาน)</h1>
      {!!err && (
        <div className="mb-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">
          {err}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-3 flex items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg border transition ${
              tab === t.key
                ? "bg-[#2a2a32] border-[#3a3a44] text-white"
                : "bg-[#1b1b20] border-[#2a2a32] text-gray-300 hover:bg-[#23232a]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-[#18181b] border border-[#23232a] rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-12 px-4 py-2 text-sm text-gray-400 border-b border-[#23232a]">
          <div className="col-span-4">รหัส</div>
          <div className="col-span-3">ลูกค้า</div>
          <div className="col-span-2 text-right">ยอดรวม</div>
          <div className="col-span-3 text-right pr-2">สถานะ</div>
        </div>

        {filtered.map((o) => (
          <Link
            key={o.id}
            to={`/orders/${o.id}`} // ✅ เข้าหน้า OrderDetail (เวอร์ชันรวม)
            className="grid grid-cols-12 items-center px-4 py-3 border-b border-[#23232a] hover:bg-[#1f1f24]"
          >
            <div className="col-span-12 md:col-span-4 font-medium">{o.code}</div>
            <div className="col-span-6 md:col-span-3 text-gray-300">
              {o.customerName || "-"}
            </div>
            <div className="col-span-3 md:col-span-2 md:text-right">{(o.total ?? 0).toLocaleString()} ฿</div>
            <div className="col-span-3 md:col-span-3 md:text-right">{pill(o.status)}</div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="p-4 text-gray-400">ไม่พบออเดอร์ตามเงื่อนไข</div>
        )}
      </div>
    </AppLayout>
  );
}
