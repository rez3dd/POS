// src/components/components for admin and staff/RecentOrders.jsx
import React from "react";

/**
 * props:
 * - orders: Array<{
 *     id: number;
 *     code?: string | null;
 *     customerName: string;
 *     status: string;
 *     total?: number | null;
 *     createdAt?: string | Date;
 *   }>
 */
export default function RecentOrders({ orders = [] }) {
  // guard: ให้เป็นอาร์เรย์เสมอ กัน error orders.map is not a function
  const list = Array.isArray(orders) ? orders : [];

  const fmtDate = (d) => {
    if (!d) return "";
    try {
      const dt = typeof d === "string" ? new Date(d) : d;
      return dt.toLocaleString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const StatusBadge = ({ status }) => {
    const s = String(status || "").toUpperCase();
    let cls =
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ";
    if (s === "PAID")
      cls += "bg-green-500/15 text-green-300 border-green-600/40";
    else if (s === "PREPARING" || s === "READY")
      cls += "bg-yellow-500/15 text-yellow-300 border-yellow-600/40";
    else if (s === "CANCELLED")
      cls += "bg-red-500/15 text-red-300 border-red-600/40";
    else cls += "bg-gray-500/15 text-gray-300 border-gray-600/40";
    return <span className={cls}>{s || "UNKNOWN"}</span>;
  };

  if (list.length === 0) {
    return (
      <div className="text-sm text-gray-400">ยังไม่มีคำสั่งซื้อล่าสุด</div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((o) => (
        <div
          key={o.id}
          className="flex items-center justify-between px-4 py-3 rounded-lg
                     bg-[#232323] border border-[#2a2a2a] hover:bg-[#23232a]
                     transition shadow-sm"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-white font-bold truncate">
                {o.code || `#${o.id}`}
              </div>
              <StatusBadge status={o.status} />
            </div>
            <div className="mt-0.5 text-xs text-gray-400 truncate">
              {o.customerName || "ลูกค้าหน้าร้าน"}
              {o.createdAt ? (
                <>
                  {" "}
                  • <span className="text-gray-500">{fmtDate(o.createdAt)}</span>
                </>
              ) : null}
            </div>
          </div>

          <div className="ml-4 text-right shrink-0">
            <div className="text-yellow-400 font-extrabold">
              ฿{Number(o.total || 0).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
