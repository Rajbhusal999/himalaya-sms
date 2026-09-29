"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { 
  FileText, 
  Printer, 
  Download, 
  Calendar, 
  UserCheck, 
  UserX, 
  RefreshCw,
  Coins,
  Clock,
  BookOpen
} from "lucide-react";
import { ProxyClass } from "./ManageProxyClass";
import NepaliDatePicker from "@/components/common/NepaliDatePicker";
import { formatBsDateDisplay } from "@/lib/nepaliDate";

const PROXY_RATE_PER_CLASS = 70; // NRs. 70 per proxy class attended

type AssignedSlot = {
  date: string;
  period: string;
  class_name: string;
  subject_name: string;
};

type TeacherWorkload = {
  proxyCount: number;
  absentCount: number;
  totalAmount: number;
  assignedSlots: AssignedSlot[];
};

export default function ProxyClassReport() {
  const [proxyList, setProxyList] = useState<ProxyClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("All");
  const [selectedClass, setSelectedClass] = useState("All");
  const [activeView, setActiveView] = useState<"detailed" | "teacher-summary">("detailed");

  const fetchProxyData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("proxy_classes")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching proxy classes from Supabase:", error);
      } else if (data) {
        setProxyList(data);
      }
    } catch (e) {
      console.error("Error fetching proxy classes:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProxyData();
  }, []);

  // Filtered data (matching Nepali B.S. Date string values)
  const filteredList = proxyList.filter(item => {
    const matchesFromDate = !fromDate || item.date >= fromDate;
    const matchesToDate = !toDate || item.date <= toDate;
    const matchesTeacher = selectedTeacher === "All" || 
      item.proxy_teacher_name === selectedTeacher || 
      item.absent_teacher_name === selectedTeacher;
    const matchesClass = selectedClass === "All" || item.class_name === selectedClass;

    return matchesFromDate && matchesToDate && matchesTeacher && matchesClass;
  });

  // Unique list of teachers for dropdown filter
  const allTeachersSet = new Set<string>();
  proxyList.forEach(p => {
    if (p.proxy_teacher_name) allTeachersSet.add(p.proxy_teacher_name);
    if (p.absent_teacher_name) allTeachersSet.add(p.absent_teacher_name);
  });
  const uniqueTeachers = Array.from(allTeachersSet).sort();

  // Workload aggregation per proxy teacher with NRs 70 calculation & days/periods list
  const teacherWorkloadMap = new Map<string, TeacherWorkload>();

  filteredList.forEach(item => {
    // Proxy Teacher (substitute)
    if (item.proxy_teacher_name) {
      const current = teacherWorkloadMap.get(item.proxy_teacher_name) || { 
        proxyCount: 0, 
        absentCount: 0, 
        totalAmount: 0,
        assignedSlots: [] 
      };
      current.proxyCount += 1;
      current.totalAmount += PROXY_RATE_PER_CLASS;
      current.assignedSlots.push({
        date: item.date,
        period: item.period,
        class_name: item.class_name,
        subject_name: item.subject_name
      });
      teacherWorkloadMap.set(item.proxy_teacher_name, current);
    }

    // Absent Teacher
    if (item.absent_teacher_name) {
      const current = teacherWorkloadMap.get(item.absent_teacher_name) || { 
        proxyCount: 0, 
        absentCount: 0, 
        totalAmount: 0,
        assignedSlots: [] 
      };
      current.absentCount += 1;
      teacherWorkloadMap.set(item.absent_teacher_name, current);
    }
  });

  const teacherWorkloadList = Array.from(teacherWorkloadMap.entries())
    .map(([teacherName, stats]) => ({
      teacherName,
      ...stats
    }))
    .filter(row => row.proxyCount > 0)
    .sort((a, b) => b.proxyCount - a.proxyCount);

  const totalSchoolAmount = filteredList.length * PROXY_RATE_PER_CLASS;
  const selectedTeacherStats = selectedTeacher !== "All" ? teacherWorkloadMap.get(selectedTeacher) : null;

  // CSV Export
  const exportToCSV = () => {
    if (filteredList.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = ["S.N", "Date", "Class", "Period", "Absent Teacher", "Proxy Teacher", "Subject", "Reason", "Approved By"];
    const rows = filteredList.map((item, i) => [
      i + 1,
      `"${item.date}"`,
      `"${item.class_name}"`,
      `"${item.period.replace(/"/g, '""')}"`,
      `"${item.absent_teacher_name}"`,
      `"${item.proxy_teacher_name}"`,
      `"${item.subject_name}"`,
      `"${item.reason || ''}"`,
      `"${item.approved_by || 'Headmaster'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Proxy_Class_Report_BS_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Header Banner - hidden in print */}
      <div className="bg-gradient-to-r from-indigo-800 via-purple-800 to-brand-900 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-7 h-7 text-purple-300" />
              <h2 className="text-2xl font-bold">Proxy Class Reports & Workload Analytics</h2>
            </div>
            <p className="text-purple-100 text-sm max-w-2xl">
              Track proxy substitutions according to the <span className="font-semibold text-yellow-300">Nepali B.S. Calendar</span>. School allowance rate: <span className="font-bold text-emerald-300">NRs. 70 per proxy class</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold backdrop-blur-sm border border-white/20 transition-all text-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-900 rounded-xl font-bold shadow-md hover:bg-purple-50 transition-all text-sm"
            >
              <Printer className="w-4 h-4 text-indigo-700" />
              Print Report
            </button>
          </div>
        </div>

        {/* Stats Row with NRs 70 Calculation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-sm">
            <span className="text-xs uppercase text-purple-200 font-semibold tracking-wider">Total Proxy Classes</span>
            <div className="text-2xl font-black mt-1">{filteredList.length}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-sm">
            <span className="text-xs uppercase text-emerald-200 font-semibold tracking-wider flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-emerald-300" /> Total Payable Amount (NRs. 70/class)
            </span>
            <div className="text-2xl font-black mt-1 text-emerald-300">
              NRs. {totalSchoolAmount}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-sm">
            <span className="text-xs uppercase text-yellow-200 font-semibold tracking-wider">Top Substitute Teacher</span>
            <div className="text-base font-bold mt-1 text-yellow-300 truncate" title={teacherWorkloadList[0]?.teacherName}>
              {teacherWorkloadList[0] ? `${teacherWorkloadList[0].teacherName} (${teacherWorkloadList[0].proxyCount} classes = NRs. ${teacherWorkloadList[0].totalAmount})` : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Official Print Header - only visible when printing */}
      <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-6">
        <div className="flex items-center justify-between border-b border-slate-300 pb-3 mb-3">
          <img src="/saraswati.png" alt="Saraswati" className="w-16 h-16 object-contain" />
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold uppercase text-slate-900 tracking-wide">SHREE HIMALAYA BASIC SCHOOL</h1>
            <p className="text-sm font-bold text-slate-700">Bharatpur-11, Chitwan, Nepal</p>
            <p className="text-xs text-slate-500">School Management System</p>
          </div>
          <img src="/logo.png" alt="School Logo" className="w-16 h-16 object-contain" />
        </div>
        <h2 className="text-lg font-bold underline uppercase tracking-wider text-slate-800 mt-2">
          {activeView === "detailed"
            ? "PROXY CLASS ATTENDANCE & DETAIL REPORT"
            : "PROXY CLASS WORKLOAD & REMUNERATION SUMMARY (RATE: NRS. 70 / CLASS)"}
        </h2>
        <p className="text-xs text-slate-500 mt-1">Generated Date: {new Date().toLocaleString()}</p>
      </div>

      {/* Filter Bar with Blue Styled Filter Teacher Dropdown */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:hidden">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 items-end">
            {/* From Date (Nepali BS) */}
            <div className="lg:col-span-4 min-w-0">
              <NepaliDatePicker
                label="From Date (BS)"
                value={fromDate}
                onChange={(bsDate) => setFromDate(bsDate)}
              />
              {fromDate && (
                <button onClick={() => setFromDate("")} className="text-[10px] text-red-500 hover:underline mt-0.5">
                  Clear From Date
                </button>
              )}
            </div>

            {/* To Date (Nepali BS) */}
            <div className="lg:col-span-4 min-w-0">
              <NepaliDatePicker
                label="To Date (BS)"
                value={toDate}
                onChange={(bsDate) => setToDate(bsDate)}
              />
              {toDate && (
                <button onClick={() => setToDate("")} className="text-[10px] text-red-500 hover:underline mt-0.5">
                  Clear To Date
                </button>
              )}
            </div>

            {/* Filter Teacher - Explicit Blue Styled Dropdown & Options */}
            <div className="lg:col-span-4">
              <label className="block text-xs font-bold text-blue-900 mb-1">Filter Teacher</label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full px-3.5 py-2 border-2 border-blue-400 bg-blue-50/40 text-blue-700 font-bold rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white shadow-sm cursor-pointer"
              >
                <option value="All" className="text-blue-900 font-bold bg-white">All Teachers</option>
                {uniqueTeachers.map(t => (
                  <option key={t} value={t} className="text-blue-700 font-bold bg-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl self-end lg:self-center shrink-0">
            <button
              onClick={() => setActiveView("detailed")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeView === "detailed"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Detailed Log
            </button>
            <button
              onClick={() => setActiveView("teacher-summary")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeView === "teacher-summary"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Teacher Workload & Amount
            </button>
          </div>
        </div>

        {/* Selected Teacher Summary Banner if filtered */}
        {selectedTeacher !== "All" && selectedTeacherStats && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-blue-900">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-sm">Selected Teacher: <span className="text-blue-700 underline">{selectedTeacher}</span></span>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="bg-white px-3 py-1 rounded-lg border border-blue-200">
                Classes Attended: <span className="text-blue-700">{selectedTeacherStats.proxyCount}</span>
              </span>
              <span className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-lg border border-emerald-300">
                Total Amount Earned: <span className="text-emerald-700 font-black">NRs. {selectedTeacherStats.totalAmount}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeView === "detailed" ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center print:hidden">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Proxy Class Entry Log ({filteredList.length})</h3>
              <p className="text-xs text-slate-500">Each substitute proxy class is assigned <span className="font-semibold text-emerald-700">NRs. 70</span> payout rate.</p>
            </div>
            <button 
              onClick={fetchProxyData}
              className="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200 border-b border-slate-200 text-xs text-slate-700 uppercase tracking-wider whitespace-nowrap">
                  <th className="px-4 py-3 font-bold">S.N</th>
                  <th className="px-4 py-3 font-bold">Date</th>
                  <th className="px-4 py-3 font-bold">Class</th>
                  <th className="px-4 py-3 font-bold">Period</th>
                  <th className="px-4 py-3 font-bold">Absent Teacher</th>
                  <th className="px-4 py-3 font-bold">Proxy Teacher</th>
                  <th className="px-4 py-3 font-bold">Subject</th>
                  <th className="px-4 py-3 font-bold">Reason</th>
                  <th className="px-4 py-3 font-bold text-center">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                      Loading report data...
                    </td>
                  </tr>
                ) : filteredList.length > 0 ? (
                  filteredList.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50 text-xs whitespace-nowrap">
                      <td className="px-4 py-3 text-slate-500 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 text-slate-900 font-bold">
                        <span className="bg-purple-50 text-purple-900 px-2 py-0.5 rounded border border-purple-200 print:border-none print:bg-transparent print:p-0">
                          {formatBsDateDisplay(item.date)} B.S.
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {item.class_name}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 print:hidden" />
                          {item.period}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-red-700 font-semibold">{item.absent_teacher_name}</td>
                      <td className="px-4 py-3 text-blue-700 font-bold bg-blue-50/40 rounded-lg print:bg-transparent print:p-0">{item.proxy_teacher_name}</td>
                      <td className="px-4 py-3 text-blue-600 font-medium">{item.subject_name}</td>
                      <td className="px-4 py-3 text-slate-600">{item.reason || '-'}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800">
                        {item.approved_by || 'Headmaster'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                      No matching proxy records found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Teacher Workload & Amount Aggregation Table */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center print:hidden">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Teacher Substitution Workload & Remuneration Summary</h3>
              <p className="text-xs text-slate-500">Calculated at <span className="font-bold text-emerald-700">NRs. 70</span> per proxy class with detailed days & periods log.</p>
            </div>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-300">
              Total School Payout: NRs. {totalSchoolAmount}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200 border-b border-slate-200 text-xs text-slate-700 uppercase tracking-wider whitespace-nowrap">
                  <th className="px-4 py-3 font-bold">S.N</th>
                  <th className="px-4 py-3 font-bold">Proxy Teacher Name</th>
                  <th className="px-4 py-3 font-bold text-center">Proxy Classes Taken</th>
                  <th className="px-4 py-3 font-bold text-center">Total Amount (NRs. 70/class)</th>
                  <th className="px-4 py-3 font-bold">Which Days & Which Periods Attended</th>
                  <th className="px-4 py-3 font-bold text-center">Times Absent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                {teacherWorkloadList.length > 0 ? (
                  teacherWorkloadList.map((row, index) => {
                    return (
                      <tr key={row.teacherName} className="hover:bg-slate-50 text-sm align-top">
                        <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">{index + 1}</td>
                        <td className="px-4 py-3 font-bold text-blue-700 whitespace-nowrap">
                          {row.teacherName}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-900 font-bold rounded-full text-xs border border-blue-200">
                            {row.proxyCount} classes
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 font-black rounded-full text-xs border border-emerald-300">
                            NRs. {row.totalAmount}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {row.assignedSlots.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-w-xl">
                              {row.assignedSlots.map((slot, sIdx) => (
                                <span 
                                  key={sIdx}
                                  className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-[11px] px-2 py-1 rounded-md border border-slate-300 font-medium"
                                >
                                  <Calendar className="w-3 h-3 text-purple-600" />
                                  <span className="font-bold">{formatBsDateDisplay(slot.date)} B.S.</span>
                                  <span className="text-slate-400">|</span>
                                  <Clock className="w-3 h-3 text-blue-600" />
                                  <span>{slot.period}</span>
                                  <span className="text-slate-400">|</span>
                                  <span className="text-blue-700 font-bold">{slot.class_name}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No proxy classes attended</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 bg-red-50 text-red-700 font-semibold rounded-full text-xs border border-red-200">
                            {row.absentCount} times
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No teacher proxy workload data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print Footer */}
      <div className="hidden print:flex justify-between items-end pt-16 mt-12 border-t border-slate-400 text-xs text-slate-700">
        <div className="text-center">
          <div className="w-40 border-b border-slate-700 mb-1"></div>
          <p className="font-bold">Prepared By</p>
        </div>
        <div className="text-center">
          <div className="w-40 border-b border-slate-700 mb-1"></div>
          <p className="font-bold">Exam Controller</p>
        </div>
        <div className="text-center">
          <div className="w-40 border-b border-slate-700 mb-1"></div>
          <p className="font-bold">Headmaster / Principal</p>
        </div>
      </div>
    </div>
  );
}

