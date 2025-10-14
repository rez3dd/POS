// src/components/shared/DashboardHome.jsx
import { useMemo } from "react";
import MiniCard from "../components for admin and staff/Minicard";
import RecentOrders from "../components for admin and staff/RecentOrders";
import PopularDishes from "../components for admin and staff/PopularDishes";
import { BsCashCoin } from "react-icons/bs";

/**
 * Dashboard shell (เหมือนหน้า HomeStaff เป๊ะ)
 * props:
 * - sidebar: <SidebarAdmin/> หรือ <SidebarStaff/>
 * - roleLabel: string เช่น 'Admin' | 'Staff'
 * - now: Date object (ใช้โชว์เวลา)
 * - summary: { revenue, revenueChangePct, inProgress, inProgressChangePct }
 * - recentOrders: array
 * - popularDishes: array
 */
export default function DashboardHome({
  sidebar,
  roleLabel = "Staff",
  now = new Date(),
  summary = {
    revenue: 0,
    revenueChangePct: 0,
    inProgress: 0,
    inProgressChangePct: 0,
  },
  recentOrders = [],
  popularDishes = [],
}) {
  const timeString = useMemo(
    () =>
      now.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [now]
  );

  const dateString = useMemo(
    () =>
      now.toLocaleDateString("th-TH", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [now]
  );

  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h >= 5 && h < 12) return { icon: "🌅", text: "สวัสดีตอนเช้า" };
    if (h >= 12 && h < 16) return { icon: "☀️", text: "สวัสดีตอนบ่าย" };
    if (h >= 16 && h < 19) return { icon: "🌇", text: "สวัสดีตอนเย็น" };
    return { icon: "🌙", text: "สวัสดียามดึก" };
  }, [now]);

  return (
    <div className="flex min-h-screen bg-[#2d2d2d] text-white">
      {sidebar}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto max-h-screen">
        {/* Header — ยึดแบบ HomeStaff */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {greeting.icon} {greeting.text},{" "}
              <span className="text-yellow-400">{roleLabel}</span>
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {roleLabel === "Admin"
                ? "ยินดีต้อนรับเข้าสู่ระบบผู้ดูแลร้าน"
                : "พร้อมรับออเดอร์ และให้บริการลูกค้า"}
            </p>
          </div>
          <div className="text-right mt-4 md:mt-0">
            <div className="text-sm text-white">{timeString}</div>
            <div className="text-xs text-gray-400">{dateString}</div>
          </div>
        </div>

        {/* Layout เดียวกับ HomeStaff: ซ้าย 2 ส่วน, ขวา PopularDishes */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ซ้าย: KPI + คำสั่งซื้อล่าสุด */}
          <div className="xl:col-span-2 space-y-6">
            {/* KPI cards (2 ใบ) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MiniCard
                title="ออเดอร์กำลังดำเนินการ"
                icon={<BsCashCoin />}
                number={summary.inProgress}
                footerNum={summary.inProgressChangePct}
              />
              <MiniCard
                title="รายได้วันนี้"
                icon={<BsCashCoin />}
                number={summary.revenue}
                footerNum={summary.revenueChangePct}
                highlightColor="#02ca3a"
              />
            </div>

            {/* คำสั่งซื้อล่าสุด */}
            <RecentOrders orders={recentOrders} />
          </div>

          {/* ขวา: เมนูยอดนิยม */}
          <PopularDishes dishes={popularDishes} />
        </div>
      </div>
    </div>
  );
}
