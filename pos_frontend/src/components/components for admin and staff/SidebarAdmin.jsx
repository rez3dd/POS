// src/components/components for admin and staff/SidebarAdmin.jsx
import { NavLink } from "react-router-dom";
import { AiFillProfile, AiOutlineHome } from "react-icons/ai";
import { BsCartCheck } from "react-icons/bs";
import { GiKnifeFork } from "react-icons/gi";
import { HiOutlineChartBar } from "react-icons/hi";
import { FiUsers, FiLogOut } from "react-icons/fi";

export default function SidebarAdmin() {
  const menu = [
    { to: "/HomeAdmin", icon: <AiOutlineHome />, label: "หน้าหลัก" }, // ✅ แก้ path
    { to: "/orders", icon: <BsCartCheck />, label: "คำสั่งซื้อ" },
    { to: "/menu", icon: <GiKnifeFork />, label: "เมนูอาหาร" },
    { to: "/stats", icon: <HiOutlineChartBar />, label: "สถิติ" },
    { to: "/users", icon: <FiUsers />, label: "พนักงาน" },
    { to: "/logout", icon: <FiLogOut />, label: "ออกจากระบบ" },
  ];

  return (
    <aside className="w-20 bg-[#1f1f1f] text-white py-4 flex flex-col items-center space-y-6 min-h-screen">
      <img src="/logo.png" alt="logo" className="w-10 h-10" />
      {menu.map((item, i) => (
        <NavLink
          key={i}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center text-xs transition ${
              isActive ? "text-yellow-400" : "hover:text-yellow-400 text-white"
            }`
          }
        >
          <div className="text-xl">{item.icon}</div>
          <span className="text-[11px]">{item.label}</span>
        </NavLink>
      ))}
    </aside>
  );
}
