// src/components/components for admin and staff/Minicard.jsx
import React, { useEffect, useState } from "react";
import { getStatsOverview } from "../../Services/Stats";

const money = (n) =>
  new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(n || 0);

const Card = ({ title, value, subtitle }) => (
  <div className="bg-[#232323] rounded-xl border border-[#23232a] p-5">
    <div className="text-gray-300 text-sm mb-2">{title}</div>
    <div className="text-2xl font-extrabold text-white mb-1">{value}</div>
    {subtitle ? (
      <div className="text-xs text-gray-400">{subtitle}</div>
    ) : null}
  </div>
);

export default function MiniCard() {
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState({
    revenueToday: 0,
    ordersToday: 0,
    avgTicket: 0,
    inProgress: 0,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getStatsOverview();
        if (!alive) return;
        setKpi({
          revenueToday: Number(data?.revenueToday) || 0,
          ordersToday: Number(data?.ordersToday) || 0,
          avgTicket: Number(data?.avgTicket) || 0,
          inProgress: Number(data?.inProgress) || 0,
        });
      } catch (_e) {
        if (!alive) return;
        setKpi({ revenueToday: 0, ordersToday: 0, avgTicket: 0, inProgress: 0 });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[96px] bg-[#18181b] rounded-xl border border-[#23232a]">
            <div className="animate-pulse h-full w-full rounded-xl bg-[#23232a]" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "รายได้วันนี้",
      value: `฿${money(kpi.revenueToday)}`,
      subtitle: "เปรียบเทียบเมื่อวาน (กำหนดต่อยอดได้)",
    },
    {
      title: "ออเดอร์กำลังดำเนินการ",
      value: money(kpi.inProgress),
      subtitle: "รวมสถานะ PENDING และ PREPARING",
    },
    {
      title: "จำนวนบิล (วันนี้)",
      value: money(kpi.ordersToday),
      subtitle: "เฉพาะออเดอร์ที่ชำระเงินแล้ว",
    },
    {
      title: "ค่าเฉลี่ย/บิล (วันนี้)",
      value: `฿${money(kpi.avgTicket)}`,
      subtitle: "รายได้วันนี้ ÷ จำนวนบิลวันนี้",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c, idx) => (
        <Card key={idx} title={c.title} value={c.value} subtitle={c.subtitle} />
      ))}
    </div>
  );
}
