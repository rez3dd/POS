// src/pages/admin/OrderDetailAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../components/shared/AppLayout";
import SidebarAdmin from "../../components/components for admin and staff/SidebarAdmin";
import { getOrderById } from "../../Services/Orders";

const StatusPill = ({ value }) => {
  const v = String(value || "").toUpperCase(); // UNPAID | PAID
  const map = {
    UNPAID: "bg-yellow-500/10 text-yellow-300 border-yellow-700/40",
    PAID: "bg-emerald-500/10 text-emerald-300 border-emerald-700/40",
  };
  const label = v === "PAID" ? "ชำระแล้ว" : "ยังไม่ชำระ";
  return (
    <span
      className={
        "px-3 py-1 rounded-full text-xs font-medium border " +
        (map[v] || "bg-[#333]/50 text-gray-300 border-[#444]")
      }
    >
      {label}
    </span>
  );
};

export default function OrderDetailAdmin() {
  const { id } = useParams();
  const nav = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const total = useMemo(() => {
    if (!order?.items) return 0;
    return order.items.reduce(
      (s, it) => s + (it.price || it.menu?.price || 0) * (it.qty || 0),
      0
    );
  }, [order]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    getOrderById(id)
      .then((res) => alive && setOrder(res))
      .catch((e) => alive && setErr(e?.message || "โหลดข้อมูลออเดอร์ไม่สำเร็จ"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <AppLayout sidebar={<SidebarAdmin />}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">รายละเอียดออเดอร์</h1>
          <div className="text-gray-400 text-sm">ตรวจสอบรายละเอียดคำสั่งซื้อ</div>
        </div>
        <button
          onClick={() => nav("/orders")}
          className="px-4 py-2 rounded-lg border border-[#35353f] bg-[#23232a] text-gray-300 hover:bg-[#35353f] transition"
        >
          ← กลับรายการ
        </button>
      </div>

      {!!err && (
        <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">
          {err}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse h-52 bg-[#23232a] rounded-lg" />
      ) : order ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* รายการอาหาร */}
          <div className="lg:col-span-2 bg-[#18181b] rounded-xl border border-[#23232a] p-6">
            <div className="flex items-center justify-between">
              <div className="text-white font-semibold">
                ออเดอร์ #{order.code || order.id} •{" "}
                {order.customerName || "ลูกค้าหน้าร้าน"}
              </div>
              <StatusPill value={order.status} />
            </div>

            <div className="mt-4 space-y-3">
              {order.items?.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-[#23232a] rounded-lg p-3"
                >
                  <div>
                    <div className="text-white font-medium">
                      {it.menu?.name || it.name} × {it.qty}
                    </div>
                    {!!it.note && (
                      <div className="text-xs text-gray-400">
                        หมายเหตุ: {it.note}
                      </div>
                    )}
                  </div>
                  <div className="text-yellow-400 font-semibold">
                    {(it.price || it.menu?.price || 0) * (it.qty || 0)} ฿
                  </div>
                </div>
              ))}
              {(!order.items || order.items.length === 0) && (
                <div className="text-gray-400 text-sm">ไม่มีรายการอาหาร</div>
              )}
            </div>
          </div>

            {/* สรุป */}
          <div className="bg-[#18181b] rounded-xl border border-[#23232a] p-6">
            <div className="text-white font-semibold mb-3">สรุป</div>
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>ยอดรวม</span>
              <span className="text-yellow-400 font-semibold">{total} ฿</span>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-300">
              <span>สถานะ</span>
              <StatusPill value={order.status} />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-400">ไม่พบออเดอร์</div>
      )}
    </AppLayout>
  );
}
