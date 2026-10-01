"use client";

import { useState, useEffect } from "react";
import { NEPALI_MONTHS_EN, NEPALI_MONTHS_NP, getCurrentBsDate } from "@/lib/nepaliDate";
import { Calendar as CalendarIcon } from "lucide-react";

type NepaliDatePickerProps = {
  value: string; // YYYY-MM-DD in BS
  onChange: (bsDate: string) => void;
  className?: string;
  label?: string;
  required?: boolean;
  hideToday?: boolean;
};

const BS_YEARS = Array.from({ length: 15 }, (_, i) => 2078 + i); // 2078 BS to 2092 BS

export default function NepaliDatePicker({
  value,
  onChange,
  className = "",
  label,
  required = false,
  hideToday = false
}: NepaliDatePickerProps) {
  // Parse current value or fallback to today's BS date
  const initialParts = (value || getCurrentBsDate()).split("-");
  const [year, setYear] = useState<number>(parseInt(initialParts[0]) || 2083);
  const [month, setMonth] = useState<number>(parseInt(initialParts[1]) || 6); // 1-indexed
  const [day, setDay] = useState<number>(parseInt(initialParts[2]) || 13);

  // Sync internal state when external value changes
  useEffect(() => {
    if (value && value.includes("-")) {
      const parts = value.split("-");
      if (parts.length === 3) {
        setYear(parseInt(parts[0]) || 2083);
        setMonth(parseInt(parts[1]) || 6);
        setDay(parseInt(parts[2]) || 13);
      }
    }
  }, [value]);

  const updateDate = (y: number, m: number, d: number) => {
    setYear(y);
    setMonth(m);
    setDay(d);
    const mStr = m.toString().padStart(2, "0");
    const dStr = d.toString().padStart(2, "0");
    const formattedStr = `${y}-${mStr}-${dStr}`;
    onChange(formattedStr);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = parseInt(e.target.value);
    updateDate(y, month, day);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = parseInt(e.target.value);
    updateDate(year, m, day);
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const d = parseInt(e.target.value);
    updateDate(year, month, d);
  };

  const setToday = () => {
    const todayBs = getCurrentBsDate();
    const parts = todayBs.split("-");
    updateDate(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span>{label} {required && <span className="text-red-500">*</span>}</span>
          <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Nepali B.S. Calendar
          </span>
        </label>
      )}

      <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-blue-500 w-full overflow-hidden">
        <CalendarIcon className="w-4 h-4 text-blue-600 hidden sm:block flex-shrink-0 ml-1" />
        
        {/* Year Dropdown */}
        <select
          value={year}
          onChange={handleYearChange}
          className="bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded px-1.5 py-1.5 focus:outline-none cursor-pointer min-w-0"
          title="Select Nepali Year (B.S.)"
        >
          {BS_YEARS.map((y) => (
            <option key={y} value={y}>
              {y} B.S.
            </option>
          ))}
        </select>

        {/* Month Dropdown */}
        <select
          value={month}
          onChange={handleMonthChange}
          className="bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded px-1.5 py-1.5 focus:outline-none flex-1 min-w-0 cursor-pointer text-ellipsis"
          title="Select Nepali Month"
        >
          {NEPALI_MONTHS_EN.map((mName, idx) => (
            <option key={mName} value={idx + 1}>
              {mName} ({NEPALI_MONTHS_NP[idx]})
            </option>
          ))}
        </select>

        {/* Day Dropdown */}
        <select
          value={day}
          onChange={handleDayChange}
          className="bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded px-1.5 py-1.5 focus:outline-none cursor-pointer min-w-0"
          title="Select Nepali Day"
        >
          {Array.from({ length: 32 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d.toString().padStart(2, "0")}
            </option>
          ))}
        </select>

        {/* Quick Today Button */}
        {!hideToday && (
          <button
            type="button"
            onClick={setToday}
            className="px-2 py-1 bg-blue-600 text-white rounded text-[11px] font-bold hover:bg-blue-700 transition-colors flex-shrink-0"
            title="Set to Today (BS)"
          >
            Today
          </button>
        )}
      </div>
    </div>
  );
}
