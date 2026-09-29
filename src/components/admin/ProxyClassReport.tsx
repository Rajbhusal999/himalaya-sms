"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { 
  FileText, 
  Printer, 
  Download, 
  Calendar, 
  Filter, 
  UserCheck, 
  UserX, 
  Award, 
  BarChart3,
  Search,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { ProxyClass } from "./ManageProxyClass";
import NepaliDatePicker from "@/components/common/NepaliDatePicker";
import { formatBsDateDisplay } from "@/lib/nepaliDate";

const LOCAL_STORAGE_KEY = "shbs_proxy_classes";

export default function ProxyClassReport() {
  const [proxyList, setProxyList] = useState<ProxyClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedClass, setSelectedClass] = useState("All");
  const [activeView, setActiveView] = useState<"detailed" | "teacher-summary">("detailed");

  const fetchProxyData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("proxy_classes")
        .select("*")
        .order("date", { ascending: false });

      if (!error && data) {
        setProxyList(data);
      } else {
        loadLocalStorage();
      }
    } catch (e) {
      loadLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalStorage = () => {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      try {
        setProxyList(JSON.parse(local));
      } catch (e) {
        setProxyList([]);
      }
    } else {
      setProxyList([]);
    }
  };

  useEffect(() => {
    fetchProxyData();
  }, []);

  // Filtered data (matching Nepali B.S. Date string values like 2083-06-13)
  const filteredList = proxyList.filter(item => {
    const matchesFromDate = !fromDate || item.date >= fromDate;
    const matchesToDate = !toDate || item.date <= toDate;
    const matchesTeacher = selectedTeacher === "All" || 
      item.proxy_teacher_name === selectedTeacher || 
      item.absent_teacher_name === selectedTeacher;
    const matchesStatus = selectedStatus === "All" || item.status === selectedStatus;
    const matchesClass = selectedClass === "All" || item.class_name === selectedClass;

    return matchesFromDate && matchesToDate && matchesTeacher && matchesStatus && matchesClass;
  });

  // Unique list of teachers for dropdown filter
  const allTeachersSet = new Set<string>();
  proxyList.forEach(p => {
    if (p.proxy_teacher_name) allTeachersSet.add(p.proxy_teacher_name);
    if (p.absent_teacher_name) allTeachersSet.add(p.absent_teacher_name);
  });
  const uniqueTeachers = Array.from(allTeachersSet).sort();

  // Workload aggregation per proxy teacher
  const teacherWorkloadMap = new Map<string, { proxyCount: number; absentCount: number; completedCount: number }>();

  proxyList.forEach(item => {
    // Proxy Teacher
    if (item.proxy_teacher_name) {
      const current = teacherWorkloadMap.get(item.proxy_teacher_name) || { proxyCount: 0, absentCount: 0, completedCount: 0 };
      current.proxyCount += 1;
      if ((item.status as string) === "Completed") current.completedCount += 1;
      teacherWorkloadMap.set(item.proxy_teacher_name, current);
    }
    // Absent Teacher
    if (item.absent_teacher_name) {
      const current = teacherWorkloadMap.get(item.absent_teacher_name) || { proxyCount: 0, absentCount: 0, completedCount: 0 };
      current.absentCount += 1;
      teacherWorkloadMap.set(item.absent_teacher_name, current);
    }
  });

  const teacherWorkloadList = Array.from(teacherWorkloadMap.entries()).map(([teacherName, stats]) => ({
    teacherName,
    ...stats
  })).sort((a, b) => b.proxyCount - a.proxyCount);

  const topSubstituteTeacher = teacherWorkloadList.length > 0 ? teacherWorkloadList[0] : null;

  // CSV Export
  const exportToCSV = () => {
    if (filteredList.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = ["S.N", "Nepali Date (B.S.)", "Class", "Period", "Absent Teacher", "Proxy Teacher", "Subject", "Reason", "Status"];
    const rows = filteredList.map((item, i) => [
      i + 1,
      `"${item.date}"`,
      `"${item.class_name}"`,
      `"${item.period.replace(/"/g, '""')}"`,
      `"${item.absent_teacher_name}"`,
      `"${item.proxy_teacher_name}"`,
      `"${item.subject_name}"`,
      `"${item.reason || ''}"`,
      `"${item.status || 'Assigned'}"`
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
              <h2 className="text-2xl font-bold">Proxy Class Reports & Analytics</h2>
            </div>
            <p className="text-purple-100 text-sm max-w-2xl">
              Generate detailed reports based on the <span className="font-semibold text-yellow-300">Nepali B.S. Calendar</span>, analyze teacher substitution workload, and print official logs.
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

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-xs uppercase text-purple-200 font-semibold">Total Proxy Records</span>
            <div className="text-2xl font-black mt-1">{filteredList.length}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-xs uppercase text-amber-200 font-semibold">Assigned Proxies</span>
            <div className="text-2xl font-black mt-1 text-amber-300">
              {filteredList.length}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-xs uppercase text-yellow-200 font-semibold">Top Substitute</span>
            <div className="text-base font-bold mt-1 text-yellow-300 truncate" title={topSubstituteTeacher?.teacherName}>
              {topSubstituteTeacher ? `${topSubstituteTeacher.teacherName} (${topSubstituteTeacher.proxyCount})` : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Official Print Header - only visible when printing */}
      <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase text-slate-900">SHREE HIMALAYA BASIC SCHOOL</h1>
        <p className="text-sm text-slate-600">Damak-9, Jhapa, Nepal | School Management System</p>
        <h2 className="text-lg font-bold underline mt-3 uppercase tracking-wider text-slate-800">
          Proxy Class Attendance & Workload Report (B.S. Calendar)
        </h2>
        <p className="text-xs text-slate-500 mt-1">Generated Date: {new Date().toLocaleString()}</p>
      </div>

      {/* Filter Bar - hidden in print */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:hidden">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            {/* From Date (Nepali BS) */}
            <div>
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
            <div>
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

            {/* Teacher filter */}
            <div className="self-end">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Filter Teacher</label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="All">All Teachers</option>
                {uniqueTeachers.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-end lg:self-center">
            <button
              onClick={() => setActiveView("detailed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === "detailed"
                  ? "bg-white text-indigo-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Detailed Log
            </button>
            <button
              onClick={() => setActiveView("teacher-summary")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === "teacher-summary"
                  ? "bg-white text-indigo-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Teacher Workload
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeView === "detailed" ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center print:hidden">
            <h3 className="font-bold text-slate-800 text-sm">Proxy Class Entry Log ({filteredList.length})</h3>
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
                  <th className="px-4 py-3 font-bold">Nepali Date (B.S.)</th>
                  <th className="px-4 py-3 font-bold">Class</th>
                  <th className="px-4 py-3 font-bold">Period</th>
                  <th className="px-4 py-3 font-bold">Absent Teacher</th>
                  <th className="px-4 py-3 font-bold">Proxy Substitute Teacher</th>
                  <th className="px-4 py-3 font-bold">Subject</th>
                  <th className="px-4 py-3 font-bold">Reason</th>
                  <th className="px-4 py-3 font-bold">Status</th>
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
                        <span className="bg-purple-50 text-purple-900 px-2 py-0.5 rounded border border-purple-200">
                          {formatBsDateDisplay(item.date)} B.S.
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {item.class_name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{item.period}</td>
                      <td className="px-4 py-3 text-red-700 font-semibold">{item.absent_teacher_name}</td>
                      <td className="px-4 py-3 text-emerald-800 font-bold">{item.proxy_teacher_name}</td>
                      <td className="px-4 py-3 text-blue-700 font-medium">{item.subject_name}</td>
                      <td className="px-4 py-3 text-slate-600">{item.reason || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          Assigned
                        </span>
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
        /* Teacher Workload Aggregation Table */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center print:hidden">
            <h3 className="font-bold text-slate-800 text-sm">Teacher Substitution Workload Summary</h3>
            <span className="text-xs text-slate-500">Aggregated from all proxy records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200 border-b border-slate-200 text-xs text-slate-700 uppercase tracking-wider whitespace-nowrap">
                  <th className="px-4 py-3 font-bold">S.N</th>
                  <th className="px-4 py-3 font-bold">Teacher Name</th>
                  <th className="px-4 py-3 font-bold text-center">Proxy Classes Taken</th>
                  <th className="px-4 py-3 font-bold text-center">Completed Classes</th>
                  <th className="px-4 py-3 font-bold text-center">Times Absent</th>
                  <th className="px-4 py-3 font-bold text-right">Net Substitution Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                {teacherWorkloadList.length > 0 ? (
                  teacherWorkloadList.map((row, index) => {
                    const balance = row.proxyCount - row.absentCount;
                    return (
                      <tr key={row.teacherName} className="hover:bg-slate-50 text-sm whitespace-nowrap">
                        <td className="px-4 py-3 text-slate-500 font-medium">{index + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{row.teacherName}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-xs">
                            {row.proxyCount} classes
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-700 font-medium">
                          {row.completedCount}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-3 py-1 bg-red-100 text-red-800 font-semibold rounded-full text-xs">
                            {row.absentCount} times
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-black ${
                            balance > 0 ? 'text-emerald-600' : balance < 0 ? 'text-red-600' : 'text-slate-600'
                          }`}>
                            {balance > 0 ? `+${balance}` : balance}
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
