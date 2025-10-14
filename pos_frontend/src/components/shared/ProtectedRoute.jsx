import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "../../Services/Auth";

/**
 * ใช้แบบ:
 * <ProtectedRoute roles={['ADMIN','STAFF']}><Orders/></ProtectedRoute>
 * - ถ้าไม่ได้ส่ง roles เข้ามา = อนุญาตผู้ใช้ที่ login ทุกคน
 */
export default function ProtectedRoute({ roles, children }) {
  const loc = useLocation();
  const user = getCurrentUser(); // { user: { role }, token } หรือ null

  // ยังไม่ล็อกอิน → ไปหน้า / (login)
  if (!user) {
    return <Navigate to="/" replace state={{ from: loc }} />;
  }

  // เช็คสิทธิ์ (แปลง role เป็น UPPERCASE)
  const role = (user?.user?.role || user?.role || "").toString().toUpperCase();
  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(role)) {
    // ไม่มีสิทธิ์ → กลับหน้าหลักตาม role
    const home = role === "ADMIN" ? "/HomeAdmin" : "/HomeStaff";
    return <Navigate to={home} replace />;
  }

  return children;
}
