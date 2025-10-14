// src/components/shared/AppLayout.jsx
import React from "react";

export default function AppLayout({ sidebar, children }) {
  return (
    <div className="min-h-screen bg-[#2d2d2d] text-white">
      {/* Sidebar คงที่ เต็มสูง ติดซ้าย */}
      <aside className="fixed inset-y-0 left-0 w-20 bg-[#1f1f1f] ">
        {sidebar}
      </aside>
        <div className="ml-20">

        {/* เนื้อหา */}
        <main className="p-5">
          <div className="mx-auto max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
