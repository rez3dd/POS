// src/pages/staff/PaymentPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/shared/AppLayout";
import SidebarStaff from "../../components/components for admin and staff/SidebarStaff";

import { listOrders, getOrderById, updateOrderStatus } from "../../Services/Orders";

// ---------------------- CONFIG ----------------------
const QR_IMAGE = "../my-qr.png"; // <- วางไฟล์ของคุณไว้ที่ public/qr/ แล้วแก้ชื่อนี้
const POLL_MS = 15000; // รีเฟรชรายการทุก 15 วิ
// ----------------------------------------------------

function Pill({ tone = "yellow", children }) {
  const tones = {
    yellow: "bg-yellow-500/10 text-yellow-300 border-yellow-700/40",
    green: "bg-emerald-500/10 text-emerald-300 border-emerald-700/40",
    gray: "bg-[#303030] text-gray-200 border-[#3f3e3e]",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs border ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  );
}

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl bg-[#232323] border border-[#3f3e3e] shadow-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#3f3e3e]">
            <div className="text-white font-semibold">สแกนเพื่อชำระ</div>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white px-2 py-1 rounded"
            >
              ✕
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  const [orders, setOrders] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const currentOrder = useMemo(
    () => orders.find((o) => String(o.id) === String(currentId)),
    [orders, currentId]
  );

  async function loadOrders() {
    setLoading(true);
    try {
      // ขอมาเยอะหน่อย แล้วคัดกรองฝั่งหน้าเว็บให้เหลือ "ยังไม่ชำระ"
      const res = await listOrders({ limit: 100, sort: "desc" });
      const list = Array.isArray(res) ? res : res?.data || [];
      // เหลือเฉพาะยังไม่ชำระ/UNPAID
      const unpaid = list.filter((o) => String(o.status).toUpperCase() !== "PAID");
      // เรียงใหม่ล่าสุดก่อน
      unpaid.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(unpaid);
      if (!currentId && unpaid.length) setCurrentId(unpaid[0].id);
    } catch (e) {
      console.error("Load orders error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      await loadOrders();
    })();

    const t = setInterval(loadOrders, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  async function confirmCash() {
    if (!currentOrder) return;
    setBusy(true);
    try {
      // เปลี่ยนสถานะเป็น PAID
      await updateOrderStatus(currentOrder.id, "PAID");
      await loadOrders();
    } catch (e) {
      alert(e?.message || "ยืนยันรับชำระไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const total = useMemo(() => Number(currentOrder?.total ?? 0), [currentOrder]);

  return (
    <AppLayout sidebar={<SidebarStaff />}>
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-extrabold text-white">การชำระเงิน</h1>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 rounded-lg border border-[#3f3e3e] bg-[#232323] text-gray-300 hover:bg-[#343434] transition"
          >
            ← กลับ
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* ซ้าย: รายการยังไม่ชำระ */}
          <div className="col-span-12 md:col-span-5">
            <div className="rounded-2xl bg-[#232323] border border-[#3f3e3e] p-4">
              <div className="text-white font-semibold mb-3">ออเดอร์ที่ยังไม่ชำระ</div>

              {loading ? (
                <div className="h-40 rounded-lg bg-[#2d2d2d] animate-pulse" />
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setCurrentId(o.id)}
                      className={`w-full text-left rounded-xl px-4 py-3 border ${
                        String(o.id) === String(currentId)
                          ? "bg-[#2b2b2b] border-[#545353]"
                          : "bg-[#2d2d2d] border-[#3f3e3e] hover:bg-[#343434]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">
                            #{o.code || `ORD-${o.id}`} • ลูกค้าหน้าร้าน
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(o.createdAt).toLocaleString("th-TH")}
                          </div>
                        </div>

                        {/* สถานะ + ราคา (ไม่ตกบรรทัด) */}
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          <Pill tone="yellow">ยังไม่ชำระ</Pill>
                          <div className="text-yellow-400 font-semibold flex items-baseline gap-[2px]">
                            <span>{o.total ?? 0}</span>
                            <span className="text-[15px] font-bold leading-none">฿</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}

                  {orders.length === 0 && (
                    <div className="text-sm text-gray-400">ไม่มีออเดอร์ค้างชำระ</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ขวา: กล่องชำระเงิน */}
          <div className="col-span-12 md:col-span-7">
            <div className="rounded-2xl bg-[#232323] border border-[#3f3e3e] p-5">
              <div className="text-white font-semibold mb-4">
                {currentOrder
                  ? `ออเดอร์ #${currentOrder.code || currentOrder.id} • ลูกค้าหน้าร้าน`
                  : "เลือกออเดอร์เพื่อชำระ"}
              </div>

              <div className="grid grid-cols-12 gap-6">
                {/* ยอดรวม + วิธีชำระ */}
                <div className="col-span-12 lg:col-span-5">
                  <div className="rounded-xl bg-[#2d2d2d] border border-[#3f3e3e] p-4">
                    <div className="text-gray-300 mb-1">ยอดรวม</div>
                    <div className="text-4xl text-white font-extrabold tabular-nums">
                      ฿{total}
                    </div>

                    <div className="mt-6 text-gray-300 text-sm">ช่องทางการชำระ:</div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        className="px-4 py-2 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition"
                        onClick={() => setQrOpen(false)}
                        disabled={!currentOrder}
                      >
                        เงินสด
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition"
                        onClick={() => setQrOpen(true)}
                        disabled={!currentOrder}
                      >
                        QR พร้อมเพย์
                      </button>
                    </div>

                    <div className="mt-6 flex flex-col gap-2">
                      <button
                        onClick={confirmCash}
                        disabled={!currentOrder || busy}
                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition disabled:opacity-50"
                      >
                        {busy ? "กำลังยืนยัน..." : "ยืนยันรับชำระ (เงินสด)"}
                      </button>
                      <button
                        onClick={loadOrders}
                        className="px-4 py-2 rounded-lg border border-[#3f3e3e] bg-[#2d2d2d] text-gray-200 hover:bg-[#343434] transition"
                      >
                        รีเฟรชรายการ
                      </button>
                    </div>
                  </div>
                </div>

                {/* ช่องว่างด้านขวาเพื่อไม่ให้หน้าดูโล่งเกินไป */}
                <div className="col-span-12 lg:col-span-7">
                  <div className="rounded-xl bg-[#2d2d2d] border border-[#3f3e3e] p-4 h-full">
                    <div className="text-white font-semibold mb-2">หมายเหตุ</div>
                      <ul className="text-sm text-gray-400 list-disc ml-5 space-y-1">
                      <li>ตรวจยอดรับแล้วกดปุ่ม “ยืนยันรับชำระ” เพื่อเปลี่ยนสถานะออเดอร์เป็น “ชำระแล้ว”</li>
                      <li>หากลูกค้าชำระผ่านพร้อมเพย์ ให้กดปุ่ม “QR พร้อมเพย์” เพื่อแสดงรหัสสแกน</li>
                      <li>ระบบจะอัปเดตรายการออเดอร์ใหม่อัตโนมัติทุก <span className="text-gray-300">15 วินาที</span></li>
                      <li>สามารถกดปุ่ม “รีเฟรชรายการ” เพื่ออัปเดตข้อมูลได้ทันที</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* MODAL: QR พร้อมเพย์ */}
        <Modal open={qrOpen && !!currentOrder} onClose={() => setQrOpen(false)}>
          {currentOrder ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-gray-300 text-sm">ยอดที่ต้องชำระ</div>
                <div className="text-3xl font-extrabold text-white tabular-nums mt-1">
                  ฿{total}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  * หลังลูกค้าชำระแล้ว กรุณากดปุ่ม “ยืนยันรับชำระ”
                </div>
              </div>

              <div className="flex items-center justify-center">
                <img
                  src={QR_IMAGE}
                  alt="PromptPay QR"
                  className="w-[320px] h-auto rounded-lg border border-[#3f3e3e] shadow-lg"
                />
              </div>
            </div>
          ) : null}
        </Modal>
      </div>
    </AppLayout>
  );
}
