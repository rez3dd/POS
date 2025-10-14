// src/pages/MenuDetail.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/shared/AppLayout";
import SidebarAdmin from "../components/components for admin and staff/SidebarAdmin";
import { getMenuById, updateMenu } from "../Services/Menu";

const CATS = ["ผัด", "แกง", "ต้ม", "ทอด", "อื่นๆ"];

export default function MenuDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "อื่นๆ",
    status: "AVAILABLE", // ALWAYS UPPERCASE
  });

  const [currentImage, setCurrentImage] = useState(null); // imageUrl จากฐานข้อมูล
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  const preview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile]
  );

  // ปิด object URL ป้องกัน memory leak
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // โหลดข้อมูลเมนู
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await getMenuById(id);
        if (!alive) return;

        setForm({
          name: data?.name || "",
          price: String(data?.price ?? ""),
          category: data?.category || "อื่นๆ",
          status: (data?.status || "AVAILABLE").toUpperCase(),
        });
        setCurrentImage(data?.imageUrl || null);
      } catch (e) {
        if (alive) setErr(e?.response?.data?.message || e?.message || "โหลดข้อมูลเมนูไม่สำเร็จ");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // บันทึก
  const onSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setErr("");
    try {
      // ส่ง key "image" ให้ตรงกับ backend (upload.single("image"))
      const payload = {
        name: form.name,
        price: Number(form.price),
        category: form.category || null,
        status:
          form.status === "AVAILABLE" || form.status === "UNAVAILABLE"
            ? form.status
            : "AVAILABLE",
        image: imageFile || undefined,
      };

      const updated = await updateMenu(Number(id), payload);

      // อัปเดตรูปทันที (ใช้ imageUrl จากคำตอบถ้ามี)
      if (updated?.imageUrl) setCurrentImage(updated.imageUrl);
      if (imageFile) {
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }

      alert("บันทึกสำเร็จ");
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  // ==== อัปโหลดรูป: click / drag & drop ====
  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) return alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
    if (file.size > 5 * 1024 * 1024) return alert("ไฟล์ใหญ่เกินไป (เกิน 5MB)");
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
    if (!/^image\//.test(file.type)) return alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
    if (file.size > 5 * 1024 * 1024) return alert("ไฟล์ใหญ่เกินไป (เกิน 5MB)");
    setImageFile(file);
  };

  const onDragOver = (e) => e.preventDefault();

  return (
    <AppLayout sidebar={<SidebarAdmin />}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">แก้ไขเมนู #{id}</h1>
          <div className="text-gray-400 text-sm">อัปเดตรายละเอียดเมนูและรูปภาพ</div>
        </div>
        <button
          onClick={() => nav("/menu")}
          className="px-4 py-2 rounded-lg border border-[#35353f] bg-[#23232a] text-gray-300 hover:bg-[#35353f] transition"
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
        <div className="animate-pulse h-52 bg-[#23232a] rounded-lg" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ฟอร์มซ้าย */}
          <div className="md:col-span-2 bg-[#18181b] rounded-xl border border-[#23232a] p-6">
            <form onSubmit={onSave} className="space-y-4">
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
                    {CATS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">สถานะ</label>
                <select
                  className="w-full bg-[#23232a] border border-[#35353f] rounded-lg p-2 text-white"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value.toUpperCase() })
                  }
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
          <div className="bg-[#18181b] rounded-xl border border-[#23232a] p-6">
            <div className="text-white font-semibold mb-3">รูปภาพเมนู</div>

            <div className="mb-4">
              <img
                src={preview || currentImage || "/noimg.png"}
                alt="preview"
                className="w-full h-56 object-cover rounded-lg border border-[#35353f]"
              />
            </div>

            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              className="rounded-xl border-2 border-dashed border-[#3a3a3a] bg-[#151518] p-4"
            >
              <div className="flex flex-col items-start gap-3">
                <div className="text-sm text-gray-300">เลือกรูปใหม่</div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg border border-[#3a3a3a] bg-[#23232a] text-gray-200 hover:bg-[#30303a] transition"
                  >
                    เลือกไฟล์
                  </button>
                  <span className="text-xs text-gray-400">
                    รองรับ .jpg .png .webp ขนาดไม่เกิน ~5MB (ลากไฟล์มาวางที่กรอบนี้ได้)
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
                  <div className="mt-2 w-full flex items-center justify-between rounded-lg bg-[#23232a] border border-[#35353f] px-3 py-2">
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
  