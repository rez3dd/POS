// src/pages/Users.jsx
import React, { useEffect, useState } from "react";
import AppLayout from "../components/shared/AppLayout";
import SidebarAdmin from "../components/components for admin and staff/SidebarAdmin";
import api from "../Services/api";

export default function Users() {
  const [users, setUsers] = useState([]);         // เก็บเป็น "array" เสมอ
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "staff", password: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- helper: แปลง payload ให้เป็น array เสมอ ---
  const normalizeToArray = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.users)) return payload.users;
    if (Array.isArray(payload.data)) return payload.data;
    // กันกรณี object ที่มี array อยู่ข้างใน key อื่น
    const firstArray = Object.values(payload).find((v) => Array.isArray(v));
    return Array.isArray(firstArray) ? firstArray : [];
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/users"); // <- ได้ { users: [...] } ในโปรเจกต์นี้
      setUsers(normalizeToArray(res.data));
    } catch (err) {
      setUsers([]); // กัน render
      setError(err?.response?.data?.message || err?.message || "โหลดผู้ใช้ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const onAdd = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { name, email, role, password } = form;
      const data = {};
      if (name !== undefined) data.name = name;
      if (email !== undefined) data.email = email;
      if (role !== undefined) data.role = role === "admin" ? "ADMIN" : "STAFF"; // map ให้ตรง backend
      if (password) data.password = password; // ควร hash ที่ backend ในงานจริง

      await api.post("/users", data);
      setForm({ name: "", email: "", role: "staff", password: "" });
      setOpenAdd(false);
      fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "เพิ่มผู้ใช้ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const count = Array.isArray(users) ? users.length : 0;

  return (
    <AppLayout sidebar={<SidebarAdmin />}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">ผู้ใช้งาน</h1>
          <div className="text-gray-400 text-sm">จัดการสิทธิ์ผู้ใช้งานในระบบ</div>
        </div>
        <button
          onClick={() => setOpenAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition"
        >
          ＋ เพิ่มผู้ใช้
        </button>
      </div>

      {/* ตารางผู้ใช้ */}
      <div className="bg-[#18181b] rounded-xl shadow-lg overflow-hidden border border-[#23232a]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#23232a] bg-[#18181b]">
          <div className="font-semibold text-white">รายการผู้ใช้งานทั้งหมด</div>
          <div className="text-sm text-gray-400">{count} คน</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-300 bg-[#23232a]">
                <th className="py-3 px-6 font-medium">ID</th>
                <th className="py-3 px-6 font-medium">ชื่อ</th>
                <th className="py-3 px-6 font-medium">อีเมล</th>
                <th className="py-3 px-6 font-medium">สิทธิ์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#23232a]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#23232a]/60 transition">
                  <td className="py-3 px-6">{u.id}</td>
                  <td className="py-3 px-6">{u.name}</td>
                  <td className="py-3 px-6">{u.email}</td>
                  <td className="py-3 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        (u.role || "").toUpperCase() === "ADMIN"
                          ? "bg-red-500/10 text-red-300 border-red-700/40"
                          : "bg-green-500/10 text-green-300 border-green-700/40"
                      }`}
                    >
                      {(u.role || "").toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}

              {count === 0 && !loading && !error && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-400">
                    ยังไม่มีผู้ใช้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && <div className="p-4 text-sm text-gray-400">กำลังโหลด...</div>}
        {!!error && <div className="p-4 text-sm text-red-400">FetchError: {String(error)}</div>}
      </div>

      {/* Modal เพิ่มผู้ใช้ */}
      {openAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#18181b] rounded-xl shadow-xl w/full max-w-md p-7 border border-[#23232a]">
            <div className="flex items-center justify-between mb-5">
              <div className="font-semibold text-lg text-white">เพิ่มผู้ใช้</div>
              <button onClick={() => setOpenAdd(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            <form onSubmit={onAdd} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">ชื่อ</label>
                <input
                  className="w-full bg-[#23232a] border border-[#35353f] rounded-lg p-2 text-white"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">อีเมล</label>
                <input
                  type="email"
                  className="w-full bg-[#23232a] border border-[#35353f] rounded-lg p-2 text-white"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">สิทธิ์</label>
                <select
                  className="w-full bg-[#23232a] border border-[#35353f] rounded-lg p-2 text-white"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">รหัสผ่าน</label>
                <input
                  type="password"
                  className="w-full bg-[#23232a] border border-[#35353f] rounded-lg p-2 text-white"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
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
