// src/pages/staff/TakeOrder.jsx
import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/shared/AppLayout";
import SidebarStaff from "../../components/components for admin and staff/SidebarStaff";
import { getMenus } from "../../Services/Menu";
import { createOrder } from "../../Services/Orders";

const toArr = (v) =>
  Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : Array.isArray(v?.items) ? v.items : [];

export default function TakeOrder() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [cart, setCart] = useState([]); // {menuId, name, price, qty, note?}
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // โหลดเมนู
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await getMenus();
        if (!alive) return;
        setMenus(toArr(res));
      } catch (e) {
        if (alive) setErr(e?.message || "โหลดเมนูไม่สำเร็จ");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // จัดการตะกร้า
  const addToCart = (m) => {
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.menuId === m.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [
        ...prev,
        { menuId: m.id, name: m.name, price: Number(m.price || 0), qty: 1 },
      ];
    });
  };
  const changeQty = (menuId, diff) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuId === menuId ? { ...c, qty: Math.max(0, c.qty + diff) } : c
        )
        .filter((c) => c.qty > 0)
    );
  };
  const removeItem = (menuId) => {
    setCart((prev) => prev.filter((c) => c.menuId !== menuId));
  };

  const total = useMemo(
    () => cart.reduce((s, c) => s + Number(c.price || 0) * Number(c.qty || 0), 0),
    [cart]
  );

  // ส่งออเดอร์
  const submitOrder = async () => {
    if (!cart.length) {
      setErr("ยังไม่ได้เลือกเมนู");
      return;
    }
    setErr("");
    setSuccessMsg("");
    try {
      setSubmitting(true);

      // ส่งข้อมูลให้ครบ: menuId, qty, price (บางแบ็กเอนด์ต้องการ)
      const payload = {
        customerName: customerName || "ลูกค้าหน้าร้าน",
        items: cart.map((c) => ({
          menuId: c.menuId,
          qty: c.qty,
          price: c.price,      // ✅ ใส่ราคาไปด้วยเพื่อความเข้ากันได้
          name: c.name,        // เผื่อแบ็กเอนด์รับชื่อด้วย
        })),
        total,                  // เผื่อบาง API ต้องการ
        note: "",               // เผื่ออนาคตจะใส่หมายเหตุ
        status: "PENDING",      // ให้ค่าเริ่มต้นกว้าง ๆ
      };

      const created = await createOrder(payload);

      // แสดงผลสำเร็จแบบ inline
      setSuccessMsg(
        `สร้างออเดอร์สำเร็จ ${created?.code ? `#${created.code}` : created?.id ? `#${created.id}` : ""}`
      );
      setCart([]);
      setCustomerName("");
    } catch (e) {
      // แสดงข้อความอ่านง่ายแทน alert
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "สร้างออเดอร์ไม่สำเร็จ"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout sidebar={<SidebarStaff />}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">รับออเดอร์หน้าร้าน</h1>
        <div className="text-gray-400 text-sm">
          เลือกเมนู ใส่จำนวน และกดสร้างออเดอร์
        </div>
      </div>

      {!!err && (
        <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">
          {err}
        </div>
      )}
      {!!successMsg && (
        <div className="mb-4 text-sm text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-2 rounded-lg">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* เมนู */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse h-32 bg-[#23232a] rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {menus.map((m) => (
                <button
                  key={m.id}
                  onClick={() => addToCart(m)}
                  className="bg-[#16171b] rounded-lg border border-[#35353f] hover:bg-[#2a2a2a] transition text-left"
                >
                  <img
                    src={m.imageUrl || m.image || "/noimg.png"}
                    alt={m.name}
                    className="w-full h-28 object-cover rounded-t-lg"
                    onError={(e) => (e.currentTarget.src = "/noimg.png")}
                  />
                  <div className="p-3">
                    <div className="text-white font-medium">{m.name}</div>
                    <div className="text-sm text-gray-400">{Number(m.price || 0)} ฿</div>
                  </div>
                </button>
              ))}
              {menus.length === 0 && (
                <div className="text-gray-400">ยังไม่มีเมนู</div>
              )}
            </div>
          )}
        </div>

        {/* ตะกร้า */}
        <div className="bg-[#18181b] rounded-xl border border-[#23232a] p-4">
          <div className="text-white font-semibold mb-3">ตะกร้า</div>

          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">
              ชื่อลูกค้า (ไม่บังคับ)
            </label>
            <input
              className="w-full bg-[#23232a] border border-[#35353f] rounded-lg p-2 text-white"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="ลูกค้าหน้าร้าน"
            />
          </div>

          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
            {cart.map((c) => (
              <div
                key={c.menuId}
                className="bg-[#23232a] rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <div className="text-white font-medium">{c.name}</div>
                  <div className="text-xs text-gray-400">
                    {Number(c.price)} ฿
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeQty(c.menuId, -1)}
                    className="px-2 py-1 rounded bg-[#333] text-white"
                  >
                    -
                  </button>
                  <div className="w-6 text-center text-white">{c.qty}</div>
                  <button
                    onClick={() => changeQty(c.menuId, +1)}
                    className="px-2 py-1 rounded bg-[#333] text-white"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(c.menuId)}
                    className="ml-2 px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="text-gray-400 text-sm">
                ยังไม่มีรายการในตะกร้า
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-300">
            <span>ยอดรวม</span>
            <span className="text-yellow-400 font-semibold">
              {total.toLocaleString()} ฿
            </span>
          </div>

          <button
            onClick={submitOrder}
            disabled={!cart.length || submitting}
            className="mt-4 w-full px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition disabled:opacity-40"
          >
            {submitting ? "กำลังสร้างออเดอร์..." : "สร้างออเดอร์"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
