// src/components/SidebarStaff.jsx
import { NavLink } from "react-router-dom";
import { AiOutlineHome } from "react-icons/ai";
import { BsCartCheck, BsCartPlus } from "react-icons/bs";
import { FiLogOut } from "react-icons/fi";
import { RiMoneyDollarCircleLine } from "react-icons/ri";

export default function SidebarStaff() {
  const menu = [
    { to: "/HomeStaff", icon: <AiOutlineHome />, label: "หน้าหลัก" },
    { to: "/orders", icon: <BsCartCheck />, label: "คำสั่งซื้อ" },
    { to: "/takeorder", icon: <BsCartPlus />, label: "รับออเดอร์" },
    // { to: "/payment", icon: <RiMoneyDollarCircleLine />, label: "ชำระเงิน" }, // ✅ แก้ path
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
