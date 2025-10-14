// src/pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUp } from "../Services/Auth";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    role: "STAFF", // ค่าเริ่มต้นเป็นลูกค้า
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.name.trim()) return setErr("กรุณากรอกชื่อ");
    if (!form.email.trim()) return setErr("กรุณากรอกอีเมล");
    if (!form.password) return setErr("กรุณากรอกรหัสผ่าน");
    if (form.password.length < 6) return setErr("รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร");
    if (form.password !== form.confirm) return setErr("รหัสผ่านยืนยันไม่ตรงกัน");

    try {
      setLoading(true);
      // ✨ เรียก API สมัครสมาชิก (จะได้รับ token + user และถูกเก็บใน localStorage ที่ Services/Auth.js)
      const res = await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role, // "ADMIN" | "STAFF" | 
      });

      // นำทางตาม role (ถ้าต้องการเปลี่ยนเส้นทาง ปรับตรงนี้ได้)
      const role = String(res?.user?.role || form.role).toUpperCase();
      if (role === "ADMIN") navigate("/HomeAdmin", { replace: true });
      else if (role === "STAFF") navigate("/HomeStaff", { replace: true });
      else navigate("/", { replace: true });
    } catch (ex) {
      setErr(ex?.message || "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2d2d2d] text-white p-4">
      <div className="w-full max-w-lg bg-[#1d1d1f] rounded-2xl shadow-xl p-8 border border-[#2a2a2a]">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold">สมัครสมาชิก</h1>
          <div className="text-sm text-gray-400 mt-1">POS Restaurant</div>
        </div>

        {err && (
          <div className="mb-4 rounded-lg bg-red-900/50 border border-red-700 px-3 py-2 text-sm">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">ชื่อ-นามสกุล</label>
            <input
              className="w-full bg-[#23232a] border border-[#35353f] rounded-lg px-3 py-2 outline-none focus:border-yellow-500"
              value={form.name}
              onChange={onChange("name")}
              placeholder="เช่น สมชาย ใจดี"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">อีเมล</label>
            <input
              type="email"
              className="w-full bg-[#23232a] border border-[#35353f] rounded-lg px-3 py-2 outline-none focus:border-yellow-500"
              value={form.email}
              onChange={onChange("email")}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">รหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  className="w-full bg-[#23232a] border border-[#35353f] rounded-lg px-3 py-2 pr-10 outline-none focus:border-yellow-500"
                  value={form.password}
                  onChange={onChange("password")}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white text-sm"
                >
                  {showPwd ? "ซ่อน" : "แสดง"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">ยืนยันรหัสผ่าน</label>
              <input
                type={showPwd ? "text" : "password"}
                className="w-full bg-[#23232a] border border-[#35353f] rounded-lg px-3 py-2 outline-none focus:border-yellow-500"
                value={form.confirm}
                onChange={onChange("confirm")}
                required
              />
            </div>
          </div>

          {/* บทบาท: ถ้าสมัครทั่วไป แนะนำให้ล็อกเป็น CUSTOMER */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">บทบาทผู้ใช้</label>
            <select
              className="w-full bg-[#23232a] border border-[#35353f] rounded-lg px-3 py-2 outline-none focus:border-yellow-500"
              value={form.role}
              onChange={onChange("role")}
            >
              <option value="STAFF">พนักงาน</option>
              {/* ถ้าไม่อยากให้สมัครเป็น Admin ให้ตัด option นี้ออก */}
              <option value="ADMIN">ผู้ดูแลระบบ</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2.5 rounded-lg disabled:opacity-50"
          >
            {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-400 text-center">
          มีบัญชีแล้ว?{" "}
          <Link to="/login" className="text-yellow-400 hover:underline">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
