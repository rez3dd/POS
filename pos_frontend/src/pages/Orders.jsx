// src/pages/Orders.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import OrdersAdmin from "./admin/OrdersAdmin";
import OrdersStaff from "./staff/OrdersStaff";
import { getCurrentUser } from "../Services/Auth";

export default function Orders() {
  const user = getCurrentUser();

  // ❌ ถ้ายังไม่ล็อกอิน
  if (!user) return <Navigate to="/login" replace />;

  const role = user.role?.toUpperCase();

  // ✅ แยกตามสิทธิ์
  if (role === "ADMIN") return <OrdersAdmin />;
  if (role === "STAFF") return <OrdersStaff />;

  return (
    <div className="text-white p-6 text-center">
      ไม่มีสิทธิ์เข้าหน้านี้
    </div>
  );
}
