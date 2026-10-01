"use client";

import { useState, useRef, useEffect } from "react";
import { X, Printer, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useReactToPrint } from "react-to-print";
import { NEPALI_MONTHS_EN, NEPALI_MONTHS_NP, getCurrentBsDate } from "@/lib/nepaliDate";

type MonthlyTeacherAttendanceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  teachers: any[];
};

export default function MonthlyTeacherAttendanceModal({ isOpen, onClose, teachers }: MonthlyTeacherAttendanceModalProps) {
  const currentBsParts = getCurrentBsDate().split("-");
  const [year, setYear] = useState(parseInt(currentBsParts[0]) || 2083);
  const [month, setMonth] = useState(parseInt(currentBsParts[1]) || 6);
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  const printRef = useRef<HTMLDivElement>(null);

  const fetchMonthlyData = async () => {
    setLoading(true);
    const monthStr = month.toString().padStart(2, "0");
    const yearMonth = `${year}-${monthStr}`;

    try {
      const { data, error } = await supabase
        .from("teacher_attendance")
        .select("*")
        .like("date", `${yearMonth}-%`);
      
      if (error) throw error;
      setAttendanceData(data || []);
    } catch (err: any) {
      console.error(err);
      alert("Error fetching monthly data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMonthlyData();
    }
  }, [isOpen, year, month]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Monthly_Attendance_${year}_${month}`,
  });

  if (!isOpen) return null;

  // Process data for the table
  const BS_YEARS = Array.from({ length: 15 }, (_, i) => 2078 + i);
  
  // Calculate summary per teacher
  const summary: Record<string, any> = {};
  teachers.forEach(t => {
    summary[t.id] = { teacher: t, present: 0, absent: 0, leave: 0, halfDay: 0, late: 0, total: 0 };
  });

  attendanceData.forEach(record => {
    if (summary[record.teacher_id]) {
      const s = summary[record.teacher_id];
      s.total += 1;
      if (record.status === "Present") s.present += 1;
      else if (record.status === "Absent") s.absent += 1;
      else if (record.status === "Leave") s.leave += 1;
      else if (record.status === "Half Day") s.halfDay += 1;
      else if (record.status === "Late") s.late += 1;
    }
  });

  const monthName = NEPALI_MONTHS_EN[month - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Monthly Attendance Report</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Year (B.S.)</label>
              <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="px-3 py-1.5 border border-slate-300 rounded text-sm bg-white">
                {BS_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Month</label>
              <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="px-3 py-1.5 border border-slate-300 rounded text-sm bg-white">
                {NEPALI_MONTHS_EN.map((m, i) => <option key={m} value={i + 1}>{m} ({NEPALI_MONTHS_NP[i]})</option>)}
              </select>
            </div>
          </div>
          <button onClick={() => handlePrint()} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium">
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
             <div className="flex flex-col items-center justify-center p-12 text-slate-500">
               <RefreshCw className="w-8 h-8 animate-spin mb-3 text-brand-600" />
               <p>Loading monthly data...</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">S.N</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold text-center text-emerald-600">Present</th>
                    <th className="px-4 py-3 font-semibold text-center text-red-600">Absent</th>
                    <th className="px-4 py-3 font-semibold text-center text-amber-600">Leave</th>
                    <th className="px-4 py-3 font-semibold text-center text-blue-600">Late / Half Day</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.values(summary).map((s, idx) => (
                    <tr key={s.teacher.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500 text-sm">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {s.teacher.first_name} {s.teacher.middle_name ? s.teacher.middle_name + " " : ""}{s.teacher.last_name}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-emerald-600">{s.present}</td>
                      <td className="px-4 py-3 text-center font-semibold text-red-600">{s.absent}</td>
                      <td className="px-4 py-3 text-center font-semibold text-amber-600">{s.leave}</td>
                      <td className="px-4 py-3 text-center font-semibold text-blue-600">{s.halfDay + s.late}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Printable Area */}
      <div className="hidden">
        <div ref={printRef} className="p-8 bg-white text-black font-sans">
          <div className="text-center mb-6 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">Himalaya Basic School</h1>
            <h2 className="text-xl font-semibold">Monthly Teacher & Staff Attendance Report</h2>
            <p className="mt-2 text-lg">
              <b>Month:</b> {monthName} {year} B.S.
            </p>
          </div>

          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-left w-12">S.N.</th>
                <th className="border border-black p-2 text-left">Name</th>
                <th className="border border-black p-2 text-center w-16">Present</th>
                <th className="border border-black p-2 text-center w-16">Absent</th>
                <th className="border border-black p-2 text-center w-16">Leave</th>
                <th className="border border-black p-2 text-center w-24">Late/Half Day</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(summary).map((s, idx) => (
                <tr key={s.teacher.id}>
                  <td className="border border-black p-2 text-center">{idx + 1}</td>
                  <td className="border border-black p-2 font-medium">
                    {s.teacher.first_name} {s.teacher.middle_name ? s.teacher.middle_name + " " : ""}{s.teacher.last_name}
                  </td>
                  <td className="border border-black p-2 text-center">{s.present}</td>
                  <td className="border border-black p-2 text-center">{s.absent}</td>
                  <td className="border border-black p-2 text-center">{s.leave}</td>
                  <td className="border border-black p-2 text-center">{s.halfDay + s.late}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-16 flex justify-between">
            <div className="text-center">
              <div className="border-t border-black w-48 mx-auto mb-2"></div>
              <p className="font-semibold">Prepared By</p>
            </div>
            <div className="text-center">
              <div className="border-t border-black w-48 mx-auto mb-2"></div>
              <p className="font-semibold">Principal / Headmaster</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
