import { Outlet } from "react-router-dom";
import SidebarAdmin from "../components for admin and staff/SidebarAdmin";
import SidebarStaff from "../components for admin and staff/SidebarStaff";

function getCurrentRole() {
  try {
    const raw = localStorage.getItem("auth"); // โครงสร้างที่คุณใช้เก็บตอนล็อกอิน
    if (!raw) return null;
    const { user } = JSON.parse(raw);
    return user?.role ?? null; // 'ADMIN' | 'STAFF' | 'CUSTOMER' | null
  } catch {
    return null;
  }
}

export default function RoleLayout() {
  const role = getCurrentRole();

  return (
    <div className="min-h-screen bg-[#0f1115] text-white">
      {/* Sidebar (ซ้าย) */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-white/10 bg-black/20 backdrop-blur">
        {role === "ADMIN" ? <SidebarAdmin /> : <SidebarStaff />}
      </aside>

      {/* เนื้อหาหลัก (ขวา) */}
      <main className="ml-64 p-6">
        <Outlet />
      </main>
    </div>
  );
}
