// src/components/payments/PaymentModal.jsx
import React, { useMemo, useState } from "react";

/**
 * PaymentModal
 * props:
 *  - order: object (ต้องมี id, items[], total)
 *  - onClose: fn()
 *  - onPaid: async callback (orderUpdated) -> ให้ caller รีเฟรช data
 * 
 * Behavior:
 *  - support method "cash" and "qr"
 *  - for QR: produce a promptpay payload string (mock) and show QR image via qrserver (external)
 *  - for cash: input cashReceived -> compute change
 */
export default function PaymentModal({ order, onClose, onPaid }) {
  const [method, setMethod] = useState("cash"); // "cash" | "qr"
  const [cashReceived, setCashReceived] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const total = Number(order?.total || 0);

  const change = useMemo(() => {
    const paid = Number(cashReceived || 0);
    return paid >= total ? paid - total : null;
  }, [cashReceived, total]);

  // Mock promptpay payload (คุณเอาไป generate payload จริงจาก server หรือ lib จะดีกว่า)
  const promptpayRef = useMemo(() => {
    const id = String(order?.id || "ORD");
    // ตัวอย่าง payload แบบ simple (ไม่ใช่ payload จริงของ PromptPay)
    return `PROMPTPAY|REF:${id}|AMT:${total}`;
  }, [order, total]);

  // QR image URL via qrserver (public) — ถ้า offline อาจไม่ขึ้น แต่เป็นวิธีง่าย ๆ
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    promptpayRef
  )}`;

  const doPay = async () => {
    setErr("");
    setLoading(true);
    try {
      // onPaid ควรเรียก service ของคุณเพื่ออัปเดต order (เราจะส่งข้อมูล payment)
      const paymentPayload = {
        method,
        amountPaid: method === "cash" ? Number(cashReceived || 0) : total,
        change: method === "cash" ? (change ?? 0) : 0,
        ref: method === "qr" ? promptpayRef : null,
      };
      await onPaid(paymentPayload); // caller จะจัดการเรียก service และ refresh
      onClose();
    } catch (e) {
      setErr(e?.message || "เกิดข้อผิดพลาดในการบันทึกการชำระ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-3xl bg-[#18181b] rounded-xl shadow-xl border border-[#23232a] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#23232a]">
          <h3 className="text-lg font-semibold text-white">ชำระเงิน — ออเดอร์ #{order?.id}</h3>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-400">รวม: <span className="text-yellow-400 font-semibold">{total} ฿</span></div>
            <button onClick={onClose} className="px-3 py-1 rounded bg-[#23232a]">ปิด</button>
          </div>
        </div>

        <div className="p-4 grid md:grid-cols-2 gap-4">
          {/* Left: สรุปรายการ */}
          <div className="carddark p-4">
            <div className="text-sm text-gray-400 mb-3">รายการ</div>
            <div className="divide-y divide-[#2b2b2b]">
              {(order?.items || []).map((it, i) => (
                <div key={i} className="py-2 flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="font-medium text-white truncate">{it.name}</div>
                    {!!it.note && <div className="text-xs text-gray-400">หมายเหตุ: {it.note}</div>}
                  </div>
                  <div className="text-sm text-gray-300">{it.qty} × {it.price} ฿</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right">
              <div className="text-sm text-gray-400">รวม</div>
              <div className="text-xl font-semibold text-yellow-400">{total} ฿</div>
            </div>
          </div>

          {/* Right: วิธีชำระ */}
          <div className="carddark p-4">
            <div className="mb-3">
              <div className="text-sm text-gray-400 mb-2">วิธีการชำระ</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setMethod("cash")}
                  className={`px-3 py-2 rounded ${method === "cash" ? "bg-yellow-500 text-black" : "bg-[#1f1f1f]"}`}
                >
                  เงินสด
                </button>
                <button
                  onClick={() => setMethod("qr")}
                  className={`px-3 py-2 rounded ${method === "qr" ? "bg-yellow-500 text-black" : "bg-[#1f1f1f]"}`}
                >
                  QR / PromptPay
                </button>
              </div>
            </div>

            {method === "cash" && (
              <div>
                <label className="block text-sm text-gray-300 mb-1">รับเงิน (บาท)</label>
                <input
                  type="number"
                  min="0"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full bg-[#1f1f1f] border border-[#35353f] rounded-lg p-2 text-white"
                  placeholder="ใส่จำนวนเงินที่ลูกค้าจ่าย"
                />
                <div className="mt-3 text-sm text-gray-400">
                  ยอดรวม: <span className="text-yellow-400 font-semibold">{total} ฿</span>
                </div>
                <div className="mt-2">
                  เงินทอน:{" "}
                  <span className="font-semibold">{change === null ? "-" : `${change} ฿`}</span>
                </div>
              </div>
            )}

            {method === "qr" && (
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">สแกนเพื่อชำระ (PromptPay)</div>
                <div className="mx-auto w-44 h-44 bg-white p-2 rounded">
                  {/* รูป QR จากบริการภายนอก — ถ้าต้องการ offline ให้เปลี่ยนเป็น placeholder */}
                  <img src={qrImageUrl} alt="QR PromptPay" className="w-full h-full object-contain" />
                </div>
                <div className="text-xs text-gray-400 mt-2 break-words">{promptpayRef}</div>
                <div className="text-xs text-gray-500 mt-1">(ลูกค้าโอนแล้ว กดปุ่มยืนยัน)</div>
              </div>
            )}

            {!!err && <div className="text-sm text-red-400 mt-2">{err}</div>}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded border border-[#35353f] bg-[#1f1f1f] text-gray-300">ยกเลิก</button>
              <button
                onClick={doPay}
                disabled={loading || (method === "cash" && (Number(cashReceived || 0) < total))}
                className="px-4 py-2 rounded bg-yellow-500 text-black font-semibold disabled:opacity-40"
              >
                {loading ? "กำลังบันทึก..." : "ยืนยันการชำระ"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
