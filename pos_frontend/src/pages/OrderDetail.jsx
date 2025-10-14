// src/pages/OrderDetail.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../Services/Auth";

// ⬇️ ใช้ path ให้ตรงกับโครงสร้างของคุณ
import OrderDetailAdmin from "./admin/OrderDetailAdmin";
import OrderDetailStaff from "./staff/OrderDetailStaff";

export default function OrderDetail() {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;

  const role = String(user.role || "").toUpperCase();

  if (role === "ADMIN") return <OrderDetailAdmin />;
  if (role === "STAFF") return <OrderDetailStaff />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2d2d2d] text-white p-8">
      <div className="bg-[#1d1d1f] border border-[#2a2a2a] rounded-xl p-6">
        <div className="text-lg font-semibold">ไม่มีสิทธิ์เข้าหน้านี้</div>
        <div className="text-sm text-gray-400 mt-1">
          บทบาทของคุณ: <b>{role || "-"}</b>
        </div>
      </div>
    </div>
  );
}
