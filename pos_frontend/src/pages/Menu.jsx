// src/pages/Menu.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AppLayout from "../components/shared/AppLayout";
import SidebarAdmin from "../components/components for admin and staff/SidebarAdmin";
import { getMenus, createMenu, updateMenu, resetAllMenus } from "../Services/Menu";
import { listCategories, createCategory } from "../Services/Categories";
import { api } from "../Services/api";

const API_BASE = (api?.defaults?.baseURL || "").replace(/\/+$/, ""); // no trailing slash

const IMG_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>
      <rect width='100%' height='100%' fill='#2d2d2d'/>
      <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle'
        fill='#8b8b8b' font-family='sans-serif' font-size='11'>no image</text>
    </svg>`
  );

// ✅ ทำ URL ให้ “ใช้ได้จริง” ทั้งกรณีเป็นชื่อไฟล์, uploads/..., /uploads/..., และ http(s) เต็ม
function abs(u) {
  if (!u) return "";
  let norm = String(u).replace(/\\/g, "/").trim();

  // ลิงก์เต็มอยู่แล้ว
  if (/^https?:\/\//i.test(norm)) return norm;

  // ตัด ./ และ / นำหน้าออกเพื่อ normalize
  norm = norm.replace(/^\.?\/*/, "");

  // ถ้าเป็นเพียงชื่อไฟล์ หรือไม่ขึ้นต้นด้วย uploads/ ให้โยนเข้าโฟลเดอร์ uploads
  if (!norm.startsWith("uploads/")) {
    // หากไม่มี slash เลย = ชื่อไฟล์ล้วน → บังคับไป uploads/
    if (!norm.includes("/")) norm = `uploads/${norm}`;
    else {
      // มีโฟลเดอร์แต่ไม่ใช่ uploads → ใส่ uploads ครอบ
      norm = `uploads/${norm.replace(/^\/+/, "")}`;
    }
  }

  const path = `/${norm}`;
  const base = API_BASE.replace(/\/api$/i, ""); // ตัด /api ออกเพราะ static เสิร์ฟนอก /api
  return `${base}${path}`;
}

export default function Menu() {
  const loc = useLocation();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    name: "",
    price: "",
    categoryId: "",
    status: "AVAILABLE",
    imageUrl: "",
  });

  async function loadMenus() {
    try {
      const list = await getMenus();
      const arr = Array.isArray(list) ? list : list?.data || [];
      setItems(
        arr.map((m) => ({
          ...m,
          imageUrl: m.imageUrl ? abs(m.imageUrl) : "",
        }))
      );
    } catch (e) {
      console.error(e);
      setItems([]);
    }
  }

  async function loadCategories() {
    try {
      const list = await listCategories();
      setCategories(Array.isArray(list) ? list : list?.data || []);
    } catch (e) {
      console.error(e);
      setCategories([]);
    }
  }

  useEffect(() => {
    loadMenus();
    loadCategories();
  }, []);

  useEffect(() => {
    loadMenus();
    const onFocus = () => loadMenus();
    const onVisible = () => {
      if (document.visibilityState === "visible") loadMenus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loc.key]);

  const onAddMenu = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("กรุณากรอกชื่อเมนู");
    if (!form.price) return alert("กรุณากรอกราคา");

    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        status: form.status.toUpperCase(),
        imageUrl: form.imageUrl?.trim() || null, // ใส่ URL ภายนอก/ชื่อไฟล์ ก็ได้
      };
      await createMenu(payload);
      await loadMenus();
      setOpenAdd(false);
      setForm({ name: "", price: "", categoryId: "", status: "AVAILABLE", imageUrl: "" });
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "เพิ่มเมนูไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const onAddCategory = async () => {
    const name = prompt("กรอกชื่อหมวดหมู่ใหม่:");
    if (!name) return;
    try {
      const newCat = await createCategory(name);
      setCategories((prev) => [...prev, newCat]);
      alert("เพิ่มหมวดหมู่แล้ว");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "เพิ่มหมวดหมู่ไม่สำเร็จ");
    }
  };

  const toggleStatus = async (it) => {
    const next = it.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
    try {
      await updateMenu(it.id, { status: next });
      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, status: next } : x)));
      setTimeout(loadMenus, 200);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "เปลี่ยนสถานะไม่สำเร็จ");
    }
  };

  const onResetAll = async () => {
    if (!confirm("ยืนยันล้างเมนูทั้งหมด?")) return;
    setBusy(true);
    try {
      const res = await resetAllMenus();
      alert(res?.message || "ล้างข้อมูลสำเร็จ");
      await loadMenus();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "ล้างข้อมูลไม่สำเร็จ");
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
            onClick={loadMenus}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3a3a3a] text-white hover:bg-[#4a4a4a]"
          >
            รีเฟรช
          </button>
          <button
            onClick={onResetAll}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3a3a3a] text-white hover:bg-[#4a4a4a] disabled:opacity-50"
          >
            ล้างเมนูทั้งหมด
          </button>
          <button
            onClick={() => setOpenAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400"
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
                <th className="py-3 px-6">ชื่อเมนู</th>
                <th className="py-3 px-6">หมวดหมู่</th>
                <th className="py-3 px-6">ราคา</th>
                <th className="py-3 px-6">สถานะ</th>
                <th className="py-3 px-6 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#23232a]">
              {items.map((it) => {
                const img = it.imageUrl ? it.imageUrl : IMG_PLACEHOLDER;
                return (
                  <tr key={it.id} className="hover:bg-[#23232a]/60 transition">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={img}
                          alt={it.name}
                          className="w-10 h-10 rounded-lg object-cover border border-[#3a3a3a]"
                          onError={(e) => (e.currentTarget.src = IMG_PLACEHOLDER)}
                        />
                        <span className="text-white">{it.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6">{it.category?.name || "-"}</td>
                    <td className="py-3 px-6">{it.price}</td>
                    <td className="py-3 px-6">
                      <span
                        className={
                          "px-3 py-1 rounded-full text-xs font-medium border " +
                          (it.status === "AVAILABLE"
                            ? "bg-green-500/10 text-green-300 border-green-700/40"
                            : "bg-red-500/10 text-red-300 border-red-700/40")
                        }
                      >
                        {it.status === "AVAILABLE" ? "พร้อมขาย" : "ปิดขาย"}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/menu/${it.id}`}
                          className="px-3 py-1 rounded-lg border border-[#23232a] bg-[#2b2b2b] text-gray-200 hover:bg-[#35353f] transition"
                        >
                          แก้ไข
                        </Link>
                        <button
                          onClick={() => toggleStatus(it)}
                          className="px-3 py-1 rounded-lg border border-[#23232a] bg-[#23232a] text-gray-300 hover:bg-[#35353f] transition"
                        >
                          {it.status === "AVAILABLE" ? "ปิดขาย" : "เปิดขาย"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">
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
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => !busy && setOpenAdd(false)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <form
              onSubmit={onAddMenu}
              className="w-full max-w-lg rounded-2xl bg-[#232323] border border-[#3f3e3e] p-5 shadow-xl"
            >
              <div className="text-white text-lg font-semibold mb-4">เพิ่มเมนู</div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">ชื่อเมนู</label>
                  <input
                    className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg p-2 text-white"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">ราคา (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg p-2 text-white"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">หมวดหมู่</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                      className="flex-1 bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg p-2 text-white"
                    >
                      <option value="">— ไม่ระบุ —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={onAddCategory}
                      className="px-3 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">รูปภาพ (URL หรือชื่อไฟล์)</label>
                  <input
                    className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg p-2 text-white"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="เช่น https://... หรือ mydish.jpg (ระบบจะชี้ไป /uploads/mydish.jpg)"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpenAdd(false)}
                  className="px-4 py-2 rounded-lg border border-[#3f3e3e] bg-[#1f1f1f] text-gray-300 hover:bg-[#2a2a2a]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 disabled:opacity-50"
                >
                  {busy ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
