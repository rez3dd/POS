// src/components/shared/ClockBadge.jsx
import React, { useEffect, useState } from "react";

/**
 * แสดงเวลา/วันที่แบบเรียลไทม์ (เขตเวลาไทย, ปฏิทินไทย, 24 ชั่วโมง)
 * props:
 *  - showSeconds (bool) = true  : แสดงวินาที
 *  - className (string)         : Tailwind class เสริม
 */
export default function ClockBadge({ showSeconds = true, className = "" }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // เวลา 24 ชม. ตามไทย
  const time = now.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
    hour12: false,
  });

  // วันที่แบบไทย (จะเป็น พ.ศ. อัตโนมัติ)
  const date = now.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className={
        "flex items-end gap-2 text-right " + className
      }
    >
      <div className="text-sm text-gray-400">{date}</div>
      <div className="text-lg font-semibold text-gray-100 tabular-nums">
        {time}
      </div>
    </div>
  );
}
