// src/pages/MenuDetail.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/shared/AppLayout";
import SidebarAdmin from "../components/components for admin and staff/SidebarAdmin";
import { getMenuById, updateMenu } from "../Services/Menu";
import { listCategories } from "../Services/Categories";
import { api } from "../Services/api";

const API_BASE = (api?.defaults?.baseURL || "").replace(/\/+$/, "");
const IMG_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='120'>
      <rect width='100%' height='100%' fill='#2d2d2d'/>
      <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle'
        fill='#8b8b8b' font-family='sans-serif' font-size='12'>no image</text>
    </svg>`
  );

function abs(u) {
  if (!u) return "";
  let norm = String(u).replace(/\\/g, "/").trim();
  if (/^https?:\/\//i.test(norm)) return norm;
  norm = norm.replace(/^\.?\/*/, "");
  if (!norm.startsWith("uploads/")) {
    if (!norm.includes("/")) norm = `uploads/${norm}`;
    else norm = `uploads/${norm.replace(/^\/+/, "")}`;
  }
  const path = `/${norm}`;
  const base = API_BASE.replace(/\/api$/i, "");
  return `${base}${path}`;
}

export default function MenuDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    categoryId: "",
    status: "AVAILABLE",
  });

  const [categories, setCategories] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);

  // 👇 state สำหรับเพิ่มหมวดหมู่ใหม่
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  const preview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile]
  );

  async function refreshCategories() {
    const cats = await listCategories();
    setCategories(Array.isArray(cats) ? cats : cats?.data || []);
  }

  // โหลดข้อมูล
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const [cats, data] = await Promise.all([listCategories(), getMenuById(id)]);
        if (!alive) return;

        setCategories(Array.isArray(cats) ? cats : cats?.data || []);
        setForm({
          name: data?.name || "",
          price: String(data?.price ?? ""),
          categoryId: data?.categoryId ?? "",
          status: (data?.status || "AVAILABLE").toUpperCase(),
        });
        setCurrentImage(data?.imageUrl ? abs(data.imageUrl) : null);
      } catch (e) {
        if (alive) setErr(e?.message || "โหลดข้อมูลเมนูไม่สำเร็จ");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  // ⬆️ อัปโหลดไฟล์ไป /api/upload แล้วได้ URL จริงกลับมา
  async function uploadNewImage() {
    if (!imageFile) return null;
    const fd = new FormData();
    fd.append("image", imageFile);
    const res = await api.post("/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });
    const url = res.data?.url;
    if (!url) throw new Error("ไม่มี url กลับมาจาก /api/upload");
    return url;
  }

  // ➕ เพิ่มหมวดหมู่ใหม่
  async function addCategory() {
    const name = String(newCatName || "").trim();
    if (!name) return alert("กรุณากรอกชื่อหมวดหมู่");
    setAddingCat(true);
    setErr("");
    try {
      // เรียกตรง ๆ ที่ /api/categories (รองรับโค้ด backend ตอนนี้)
      const res = await api.post("/categories", { name });
      const cat = res?.data;
      await refreshCategories();
      // เลือกหมวดหมู่ให้อัตโนมัติ
      if (cat?.id) {
        setForm((f) => ({ ...f, categoryId: cat.id }));
      }
      setNewCatName("");
      alert(`เพิ่มหมวดหมู่ "${name}" สำเร็จ`);
    } catch (e) {
      // 409 = ซ้ำ
      const msg = e?.response?.data?.message || e?.message || "เพิ่มหมวดหมู่ไม่สำเร็จ";
      alert(msg);
    } finally {
      setAddingCat(false);
    }
  }

  // บันทึก (ถ้ามีไฟล์ใหม่ → อัปโหลดก่อน แล้วค่อย update imageUrl)
  const onSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setErr("");
    try {
      let newUrl = null;
      if (imageFile) {
        newUrl = await uploadNewImage(); // 1) upload ก่อน
      }

      // 2) อัปเดตข้อมูลเมนู (แนบ imageUrl เมื่อมีรูปใหม่)
      await updateMenu(Number(id), {
        name: form.name,
        price: Number(form.price),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        status: form.status,
        ...(newUrl ? { imageUrl: newUrl } : {}),
      });

      // 3) โหลดข้อมูลใหม่ เพื่อดึง imageUrl ล่าสุดมาแสดง
      const fresh = await getMenuById(id);
      const data = fresh?.data || fresh;
      setCurrentImage(data?.imageUrl ? abs(data.imageUrl) : null);

      // ล้างไฟล์เลือกใหม่
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      alert("บันทึกสำเร็จ");
    } catch (e2) {
      setErr(e2?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) return alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
    if (file.size > 5 * 1024 * 1024) return alert("ไฟล์ใหญ่เกิน 5MB");
    setImageFile(file);
  };
  const clearFile = () => {
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) return alert("กรุณาเลือกไฟล์รูปภาพ");
    if (file.size > 5 * 1024 * 1024) return alert("ไฟล์ใหญ่เกิน 5MB");
    setImageFile(file);
  };
  const onDragOver = (e) => e.preventDefault();

  return (
    <AppLayout sidebar={<SidebarAdmin />}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">แก้ไขเมนู #{id}</h1>
        </div>
        <button
          onClick={() => nav("/menu")}
          className="px-4 py-2 rounded-lg border border-[#3f3e3e] bg-[#232323] text-gray-200 hover:bg-[#2d2d2d] transition"
        >
          ← กลับ
        </button>
      </div>

      {!!err && (
        <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">
          {err}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse h-52 bg-[#232323] rounded-lg border border-[#3f3e3e]" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ฟอร์มซ้าย */}
          <div className="md:col-span-2 rounded-xl bg-[#232323] border border-[#3f3e3e] p-6">
            <form onSubmit={onSave} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">ชื่อเมนู</label>
                <input
                  className="w-full bg-[#2d2d2d] border border-[#3f3e3e] rounded-lg p-2 text-white"
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
                    className="w-full bg-[#2d2d2d] border border-[#3f3e3e] rounded-lg p-2 text-white"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">หมวดหมู่</label>
                  <div className="flex gap-2">
                    <select
                      className="w-full bg-[#2d2d2d] border border-[#3f3e3e] rounded-lg p-2 text-white"
                      value={form.categoryId ?? ""}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    >
                      <option value="">— ไม่ระบุ —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* แถว “เพิ่มหมวดหมู่ใหม่” */}
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="เพิ่มหมวดหมู่ใหม่ เช่น เครื่องดื่ม"
                      className="flex-1 bg-[#2d2d2d] border border-[#3f3e3e] rounded-lg p-2 text-white"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCategory();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addCategory}
                      disabled={addingCat || !newCatName.trim()}
                      className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                    >
                      {addingCat ? "กำลังเพิ่ม..." : "เพิ่มหมวดหมู่"}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">สถานะ</label>
                <select
                  className="w-full bg-[#2d2d2d] border border-[#3f3e3e] rounded-lg p-2 text-white"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="AVAILABLE">พร้อมขาย</option>
                  <option value="UNAVAILABLE">ปิดขาย</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition disabled:opacity-40"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>

          {/* รูปขวา */}
          <div className="rounded-xl bg-[#232323] border border-[#3f3e3e] p-6">
            <div className="text-white font-semibold mb-3">รูปภาพเมนู</div>

            <div className="mb-4">
              <img
                src={preview || currentImage || IMG_PLACEHOLDER}
                alt="preview"
                className="w-full h-56 object-cover rounded-lg border border-[#3f3e3e]"
                onError={(e) => (e.currentTarget.src = IMG_PLACEHOLDER)}
              />
            </div>

            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              className="rounded-xl border-2 border-dashed border-[#3f3e3e] bg-[#1b1b1b] p-4"
            >
              <div className="flex flex-col items-start gap-3">
                <div className="text-sm text-gray-300">เลือกรูปใหม่</div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg border border-[#3f3e3e] bg-[#2d2d2d] text-gray-200 hover:bg-[#303030] transition"
                  >
                    เลือกไฟล์
                  </button>
                  <span className="text-xs text-gray-400">
                    รองรับ .jpg .png .webp ขนาดไม่เกิน ~5MB (ลากไฟล์มาวางที่กล่องนี้ได้)
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onPickFile}
                  className="hidden"
                />
                {imageFile ? (
                  <div className="mt-2 w-full flex items-center justify-between rounded-lg bg-[#2d2d2d] border border-[#3f3e3e] px-3 py-2">
                    <div className="text-xs text-gray-300 truncate">
                      {imageFile.name}{" "}
                      <span className="text-gray-400">
                        ({Math.round(imageFile.size / 1024)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white"
                    >
                      ล้างไฟล์
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-gray-500">ยังไม่ได้เลือกไฟล์</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
