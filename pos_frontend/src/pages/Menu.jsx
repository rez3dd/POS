// src/pages/Menu.jsx
import React, { useEffect, useState } from "react";
import AppLayout from "../components/shared/AppLayout";
import SidebarAdmin from "../components/components for admin and staff/SidebarAdmin";
import { getMenus, createMenu, updateMenu, resetAllMenus } from "../Services/Menu";
import { Link } from "react-router-dom";

const CATEGORIES = ["ผัด", "แกง", "ต้ม", "ทอด", "อื่นๆ"];

export default function Menu() {
  const [items, setItems] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "อื่นๆ",
    status: "available",
    imageUrl: "", // สำหรับลิงก์รูป (ระบบอัปโหลดไฟล์จริงจะทำในหน้าแก้ไข)
  });

  // โหลดรายการ
  async function load() {
    setErr("");
    try {
      const list = await getMenus();
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setErr(e?.message || "โหลดเมนูไม่สำเร็จ");
      setItems([]);
    }
  }
  useEffect(() => { load(); }, []);

  // เพิ่มเมนู
  const onAdd = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        category: form.category || null,
        status: form.status?.toUpperCase() === "AVAILABLE" ? "AVAILABLE" : "UNAVAILABLE",
        imageUrl: form.imageUrl || null,
      };
      const created = await createMenu(payload);
      if (created) setItems((prev) => [created, ...prev]);
      setOpenAdd(false);
      setForm({
        name: "",
        price: "",
        category: "อื่นๆ",
        status: "available",
        imageUrl: "",
      });
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "เพิ่มเมนูไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  // Toggle สถานะ เปิดขาย/ปิดขาย
  const toggleStatus = async (it) => {
    const next = (it.status || "").toUpperCase() === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
    try {
      await updateMenu(it.id, { status: next });
      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, status: next } : x)));
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "เปลี่ยนสถานะไม่สำเร็จ");
    }
  };

  // รีเซ็ตเมนูทั้งหมด (ล้าง Orders + OrderItems + Menus)
  const onResetAll = async () => {
    if (!confirm("ยืนยันล้างเมนูทั้งหมด (รวมถึงคำสั่งซื้อทั้งหมด) ?")) return;
    setBusy(true);
    setErr("");
    try {
      const res = await resetAllMenus();
      alert(res?.message || "ล้างข้อมูลสำเร็จ");
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "ล้างข้อมูลไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppLayout sidebar={<SidebarAdmin />}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">เมนูอาหาร</h1>
          <div className="text-gray-400 text-sm">จัดการเมนูอาหารในร้านของคุณ</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetAll}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3a3a3a] text-white hover:bg-[#4a4a4a] transition disabled:opacity-50"
            title="ล้างเมนูทั้งหมด (รวมออเดอร์) — ใช้เฉพาะตอนเริ่มใหม่"
          >
            ล้างเมนูทั้งหมด
          </button>
          <button
            onClick={() => setOpenAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition"
          >
            <span className="text-xl">＋</span> เพิ่มเมนู
          </button>
        </div>
      </div>

      {!!err && (
        <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">
          {err}
        </div>
      )}

      <div className="bg-[#18181b] rounded-xl shadow-lg overflow-hidden border border-[#23232a]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#23232a] bg-[#18181b]">
          <div className="font-semibold text-white">รายการเมนูทั้งหมด</div>
          <div className="text-sm text-gray-400">{items.length} รายการ</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-300 bg-[#23232a]">
                <th className="py-3 px-6 font-medium">รูป</th>
                <th className="py-3 px-6 font-medium">รหัส</th>
                <th className="py-3 px-6 font-medium">ชื่อเมนู</th>
                <th className="py-3 px-6 font-medium">หมวดหมู่</th>
                <th className="py-3 px-6 font-medium">ราคา</th>
                <th className="py-3 px-6 font-medium">สถานะ</th>
                <th className="py-3 px-6 font-medium text-right">การจัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#23232a]">
              {items.map((it) => {
                const imgSrc = it.imageUrl || it.image || "";
                const isAvail = (it.status || "").toUpperCase() === "AVAILABLE";
                return (
                  <tr key={it.id} className="hover:bg-[#23232a]/60 transition">
                    <td className="py-3 px-6">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#1f1f1f] border border-[#3a3a3a]">
                        {imgSrc ? (
                          <img src={imgSrc} alt={it.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-xs text-gray-500">
                            ไม่มีรูป
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-6">{it.id}</td>
                    <td className="py-3 px-6">
                      <Link
                        to={`/menu/${it.id}`}
                        className="underline underline-offset-2 hover:text-yellow-400"
                      >
                        {it.name}
                      </Link>
                    </td>
                    <td className="py-3 px-6">{it.category || "-"}</td>
                    <td className="py-3 px-6">{it.price}</td>
                    <td className="py-3 px-6">
                      <span
                        className={
                          "px-3 py-1 rounded-full text-xs font-medium border " +
                          (isAvail
                            ? "bg-green-500/10 text-green-300 border-green-700/40"
                            : "bg-red-500/10 text-red-300 border-red-700/40")
                        }
                      >
                        {isAvail ? "พร้อมขาย" : "ปิดขาย"}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right space-x-2">
                      <Link
                        to={`/menu/${it.id}`}
                        className="px-3 py-1 rounded-lg border border-[#23232a] bg-[#23232a] text-gray-300 hover:bg-[#35353f] transition"
                      >
                        แก้ไข
                      </Link>
                      <button
                        onClick={() => toggleStatus(it)}
                        className="px-3 py-1 rounded-lg border border-[#23232a] bg-[#23232a] text-gray-300 hover:bg-[#35353f] transition"
                      >
                        {isAvail ? "ปิดขาย" : "เปิดขาย"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    ยังไม่มีเมนู
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal เพิ่มเมนู */}
      {openAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#18181b] rounded-xl shadow-xl w-full max-w-md p-7 border border-[#23232a]">
            <div className="flex items-center justify-between mb-5">
              <div className="font-semibold text-lg text-white">เพิ่มเมนู</div>
              <button onClick={() => setOpenAdd(false)} className="text-gray-400 hover:text-white text-xl">
                ✕
              </button>
            </div>

            <form onSubmit={onAdd} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">ชื่อเมนู</label>
                <input
                  className="w-full bg-[#23232a] border border-[#35353f] rounded-lg p-2 text-white"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">ราคา (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-[#23232a] border border-[#35353f] rounded-lg p-2 text-white"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">หมวดหมู่</label>
                  <select
                    className="w-full bg-[#23232a] border border-[#35353f] rounded-lg p-2 text-white"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">สถานะ</label>
                <select
                  className="w-full bg-[#23232a] border border-[#35353f] rounded-lg p-2 text-white"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="available">พร้อมขาย</option>
                  <option value="unavailable">ปิดขาย</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">ลิงก์รูปภาพ (ไม่บังคับ)</label>
                <input
                  className="w-full bg-[#23232a] border border-[#35353f] rounded-lg p-2 text-white"
                  placeholder="เช่น https://…/xxx.jpg"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpenAdd(false)}
                  className="px-4 py-2 rounded-lg border border-[#35353f] bg-[#23232a] text-gray-300 hover:bg-[#35353f] transition"
                >
                  ยกเลิก
                </button>
                <button
                  disabled={busy}
                  className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition disabled:opacity-40"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
