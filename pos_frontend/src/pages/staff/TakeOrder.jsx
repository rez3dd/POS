import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/shared/AppLayout";
import SidebarStaff from "../../components/components for admin and staff/SidebarStaff";
import { getMenus } from "../../Services/Menu";
import { listCategories } from "../../Services/Categories";
import { createOrder } from "../../Services/Orders";

export default function TakeOrder() {
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cat, setCat] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([getMenus(), listCategories()])
      .then(([ms, cs]) => {
        if (!alive) return;
        const data = Array.isArray(ms) ? ms : ms?.data || [];
        setMenus(data);
        setCategories(cs);
        setErr("");
      })
      .catch((e) => alive && setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const filteredMenus = useMemo(() => {
    if (!cat) return menus;
    const id = Number(cat);
    return menus.filter((m) => m.categoryId === id);
  }, [menus, cat]);

  const addToCart = (m) => {
    if (m.status && String(m.status).toUpperCase() === "UNAVAILABLE") {
      alert("เมนูนี้ปิดขายชั่วคราว");
      return;
    }
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.menuId === m.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { menuId: m.id, name: m.name, price: m.price, qty: 1 }];
    });
  };
  const changeQty = (menuId, diff) => {
    setCart((prev) =>
      prev
        .map((c) => (c.menuId === menuId ? { ...c, qty: Math.max(1, c.qty + diff) } : c))
        .filter((c) => c.qty > 0)
    );
  };
  const removeItem = (menuId) => {
    setCart((prev) => prev.filter((c) => c.menuId !== menuId));
  };

  const total = useMemo(() => cart.reduce((s, c) => s + c.price * c.qty, 0), [cart]);
  const change = useMemo(() => Math.max(0, (Number(amountPaid) || 0) - total), [amountPaid, total]);

  const submitOrder = async () => {
    if (!cart.length) return alert("ยังไม่ได้เลือกเมนู");
    const paid = Number(amountPaid) || 0;
    try {
      const payload = {
        customerName: customerName || "ลูกค้าหน้าร้าน",
        items: cart.map((c) => ({
          menuId: c.menuId,
          qty: c.qty,
          name: c.name,
          price: c.price,
        })),
        method: "CASH",
        amountPaid: paid,
      };
      const created = await createOrder(payload);
      alert(`✅ สร้างออเดอร์สำเร็จ #${created.code}\nยอดรวม: ${total}฿\nชำระ: ${paid}฿\nเงินทอน: ${created.change ?? change}฿`);
      setCart([]);
      setCustomerName("");
      setAmountPaid("");
    } catch (e) {
      alert(e?.message || "สร้างออเดอร์ไม่สำเร็จ");
    }
  };

  return (
    <AppLayout sidebar={<SidebarStaff />}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">รับออเดอร์หน้าร้าน</h1>
        <div className="text-gray-400 text-sm">เลือกเมนู ใส่จำนวน และกด “ชำระเงินและสร้างออเดอร์”</div>
      </div>

      {!!err && (
        <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* เมนู */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <select
              className="bg-[#2d2d2d] border border-[#3f3e3e] rounded-lg p-2 text-white"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
            >
              <option value="">ทั้งหมด</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse h-32 bg-[#2d2d2d] rounded-lg border border-[#3f3e3e]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredMenus.map((m) => (
                <button
                  key={m.id}
                  onClick={() => addToCart(m)}
                  className="bg-[#2d2d2d] rounded-lg border border-[#3f3e3e] hover:bg-[#303030] transition text-left"
                >
                  <img src={m.imageUrl || "/noimg.png"} alt={m.name} className="w-full h-28 object-cover rounded-t-lg" />
                  <div className="p-3">
                    <div className="text-white font-medium">{m.name}</div>
                    <div className="text-xs text-gray-400">{m.category?.name || ""}</div>
                    <div className="text-sm text-gray-300 mt-1">{m.price} ฿</div>
                    {String(m.status).toUpperCase() === "UNAVAILABLE" && (
                      <div className="text-[11px] mt-1 text-red-400">ปิดขาย</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ตะกร้า */}
        <div className="bg-[#232323] rounded-xl border border-[#3f3e3e] p-4">
          <div className="text-white font-semibold mb-3">ตะกร้า</div>
          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">ชื่อลูกค้า (ไม่บังคับ)</label>
            <input
              className="w-full bg-[#2d2d2d] border border-[#3f3e3e] rounded-lg p-2 text-white"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="ลูกค้าหน้าร้าน"
            />
          </div>

          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
            {cart.map((c) => (
              <div key={c.menuId} className="bg-[#2d2d2d] rounded-lg border border-[#3f3e3e] p-3 flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{c.name}</div>
                  <div className="text-xs text-gray-400">{c.price} ฿</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => changeQty(c.menuId, -1)} className="px-2 py-1 rounded bg-[#333] text-white">-</button>
                  <div className="w-6 text-center text-white">{c.qty}</div>
                  <button onClick={() => changeQty(c.menuId, +1)} className="px-2 py-1 rounded bg-[#333] text-white">+</button>
                  <button onClick={() => removeItem(c.menuId)} className="ml-2 px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white">ลบ</button>
                </div>
              </div>
            ))}
            {cart.length === 0 && <div className="text-gray-400 text-sm">ยังไม่มีรายการในตะกร้า</div>}
          </div>

          {/* summary */}
          <div className="mt-4 space-y-3 text-sm text-gray-300">
            <div className="flex justify-between"><span>ยอดรวม</span><span className="text-yellow-400 font-semibold">{total} ฿</span></div>
            <div className="flex justify-between items-center">
              <span>รับเงิน</span>
              <input
                type="number"
                min="0"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-24 bg-[#2d2d2d] border border-[#3f3e3e] rounded-lg px-2 py-1 text-right text-white"
              />
            </div>
            <div className="flex justify-between"><span>เงินทอน</span><span className="text-emerald-400 font-semibold">{change} ฿</span></div>
          </div>

          <button
            onClick={submitOrder}
            disabled={!cart.length}
            className="mt-4 w-full px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition disabled:opacity-40"
          >
            ชำระเงินและสร้างออเดอร์
          </button>

          <button
            onClick={() => setShowQR(true)}
            className="mt-2 w-full px-4 py-2 rounded-lg border border-[#3f3e3e] bg-[#2d2d2d] text-gray-200 hover:bg-[#303030]"
          >
            แสดง QR พร้อมเพย์
          </button>

          {showQR && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-[#232323] border border-[#3f3e3e] rounded-2xl p-6 text-center relative">
                <button onClick={() => setShowQR(false)} className="absolute top-2 right-3 text-gray-400 hover:text-white text-lg">×</button>
                <h2 className="text-white font-semibold text-lg mb-3">สแกน QR พร้อมเพย์</h2>
                <img src="/qr_yourshop.png" alt="QR" className="w-64 h-64 object-contain mx-auto rounded-lg border border-[#3f3e3e]" />
                <div className="mt-3 text-sm text-gray-400">โปรดชำระยอด {total}฿ แล้วกดยืนยันหลังโอนสำเร็จ</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
