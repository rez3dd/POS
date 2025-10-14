// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../Services/Auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await login({ email, password }); // <-- เก็บ token ภายใน Auth.js แล้ว
      const role = res?.user?.role?.toUpperCase();

      if (role === "ADMIN") navigate("/HomeAdmin", { replace: true });
      else if (role === "STAFF") navigate("/HomeStaff", { replace: true });
      else navigate("/", { replace: true });
    } catch (ex) {
      setErr(ex?.message || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2d2d2d] text-white">
      <div className="w-full max-w-md bg-[#1d1d1f] rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold">เข้าสู่ระบบ</h1>
          <p className="text-sm text-gray-400 mt-1">POS Restaurant</p>
        </div>

        {err && (
          <div className="mb-4 bg-red-900/50 border border-red-700 rounded-lg px-3 py-2 text-sm">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">อีเมล</label>
            <input
              type="email"
              className="w-full px-3 py-2 rounded-lg bg-[#23232a] border border-[#35353f] focus:border-yellow-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@pos.local"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">รหัสผ่าน</label>
            <input
              type="password"
              className="w-full px-3 py-2 rounded-lg bg-[#23232a] border border-[#35353f] focus:border-yellow-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="mt-4 text-sm text-center text-gray-400">
          ยังไม่มีบัญชี?{" "}
          <a href="/signup" className="text-yellow-400 hover:underline">
            สมัครสมาชิก
          </a>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          ตัวอย่างบัญชีสำหรับทดสอบ: <br />
          Admin — admin@pos.local / admin123 <br />
          Staff — staff@pos.local / staff123
        </div>
      </div>
    </div>
  );
}
