"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  UserCheck,
  Calendar,
  Save,
  Printer,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import NepaliDatePicker from "@/components/common/NepaliDatePicker";
import { getCurrentBsDate, formatBsDateDisplay } from "@/lib/nepaliDate";
import { useReactToPrint } from "react-to-print";

type Teacher = {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  phone_number?: string;
};

type AttendanceRecord = {
  id?: string;
  teacher_id: string;
  date: string;
  status: "Present" | "Absent" | "Leave" | "Half Day" | "Late";
  remarks: string;
};

export default function TeacherAttendance() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(getCurrentBsDate());
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord>>({});
  const [originalData, setOriginalData] = useState<Record<string, AttendanceRecord>>({});
  
  const printRef = useRef<HTMLDivElement>(null);

  // Load teachers and existing attendance for selected date
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch teachers
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("id, first_name, middle_name, last_name, phone_number")
        .order("first_name", { ascending: true });

      if (teacherError) throw teacherError;
      if (teacherData) setTeachers(teacherData);

      // Fetch attendance for the specific date
      const { data: attendanceRes, error: attendanceError } = await supabase
        .from("teacher_attendance")
        .select("*")
        .eq("date", selectedDate);

      if (attendanceError) throw attendanceError;

      const newAttendance: Record<string, AttendanceRecord> = {};
      if (attendanceRes) {
        attendanceRes.forEach((record: any) => {
          newAttendance[record.teacher_id] = {
            id: record.id,
            teacher_id: record.teacher_id,
            date: record.date,
            status: record.status as any,
            remarks: record.remarks || ""
          };
        });
      }
      
      setAttendanceData(newAttendance);
      setOriginalData(JSON.parse(JSON.stringify(newAttendance))); // Deep copy
    } catch (err) {
      console.error("Error fetching teacher attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handleStatusChange = (teacherId: string, status: AttendanceRecord["status"]) => {
    setAttendanceData(prev => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        teacher_id: teacherId,
        date: selectedDate,
        status,
        remarks: prev[teacherId]?.remarks || ""
      }
    }));
  };

  const handleRemarksChange = (teacherId: string, remarks: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        teacher_id: teacherId,
        date: selectedDate,
        status: prev[teacherId]?.status || "Present", // Default to present if they just type a remark
        remarks
      }
    }));
  };

  const markAllAs = (status: AttendanceRecord["status"]) => {
    if (!window.confirm(`Are you sure you want to mark all filtered teachers as ${status}?`)) return;
    
    const newData = { ...attendanceData };
    filteredTeachers.forEach(t => {
      newData[t.id] = {
        ...newData[t.id],
        teacher_id: t.id,
        date: selectedDate,
        status,
        remarks: newData[t.id]?.remarks || ""
      };
    });
    setAttendanceData(newData);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const recordsToUpsert = Object.values(attendanceData).map(record => ({
        id: record.id, // Will be undefined for new records
        teacher_id: record.teacher_id,
        date: record.date,
        status: record.status,
        remarks: record.remarks
      }));

      if (recordsToUpsert.length === 0) {
        alert("No attendance data to save.");
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("teacher_attendance")
        .upsert(recordsToUpsert, { onConflict: "teacher_id, date" });

      if (error) throw error;
      
      alert("Teacher attendance saved successfully!");
      fetchData(); // Refresh to get IDs
    } catch (error: any) {
      alert("Failed to save attendance: " + (error.message || error));
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Teacher_Attendance_${selectedDate}`,
  });

  const formatTeacherName = (t: Teacher) => {
    return `${t.first_name} ${t.middle_name ? t.middle_name + " " : ""}${t.last_name}`;
  };

  const filteredTeachers = teachers.filter(t => {
    const searchLower = search.toLowerCase();
    const fullName = formatTeacherName(t).toLowerCase();
    return fullName.includes(searchLower) || (t.phone_number && t.phone_number.includes(searchLower));
  });

  const presentCount = Object.values(attendanceData).filter(r => r.status === "Present").length;
  const absentCount = Object.values(attendanceData).filter(r => r.status === "Absent").length;
  const leaveCount = Object.values(attendanceData).filter(r => r.status === "Leave").length;
  const otherCount = Object.values(attendanceData).filter(r => r.status === "Half Day" || r.status === "Late").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-brand-800 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-7 h-7 text-blue-200" />
              <h2 className="text-2xl font-bold">Teacher Attendance</h2>
            </div>
            <p className="text-blue-100 text-sm max-w-2xl">
              Manage daily attendance for teachers using the Nepali B.S. Calendar.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-all backdrop-blur-sm border border-white/20"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-5 py-2 bg-white text-blue-900 rounded-xl font-bold shadow-md hover:bg-blue-50 transition-all hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
            >
              <Save className="w-5 h-5 text-blue-700" />
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4 lg:col-span-3">
            <NepaliDatePicker
              label="Attendance Date (B.S.)"
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
            />
          </div>
          <div className="relative md:col-span-4 lg:col-span-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Search Teacher</label>
            <Search className="w-4 h-4 absolute left-3 bottom-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
            />
          </div>
          
          <div className="md:col-span-4 lg:col-span-5 flex flex-wrap gap-2 justify-end">
            <button onClick={() => markAllAs("Present")} className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100">
              All Present
            </button>
            <button onClick={() => markAllAs("Absent")} className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100">
              All Absent
            </button>
            <button onClick={() => markAllAs("Leave")} className="px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100">
              All Leave
            </button>
          </div>
        </div>
        
        {/* Stats Summary */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Total: <b>{teachers.length}</b></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Present: <b>{presentCount}</b></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Absent: <b>{absentCount}</b></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Leave: <b>{leaveCount}</b></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Other: <b>{otherCount}</b></div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mb-3 text-blue-600" />
            <p>Loading attendance records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">S.N</th>
                  <th className="px-4 py-3 font-semibold">Teacher Name</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                  <th className="px-4 py-3 font-semibold w-1/3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map((teacher, index) => {
                    const record = attendanceData[teacher.id];
                    const status = record?.status || "None";
                    
                    return (
                      <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-slate-500 text-sm">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{formatTeacherName(teacher)}</div>
                          {teacher.phone_number && <div className="text-xs text-slate-500">{teacher.phone_number}</div>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {(["Present", "Absent", "Leave", "Half Day", "Late"] as const).map(s => {
                              const isSelected = status === s;
                              let colorClasses = "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200";
                              
                              if (isSelected) {
                                if (s === "Present") colorClasses = "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm";
                                else if (s === "Absent") colorClasses = "bg-red-100 text-red-800 border-red-300 shadow-sm";
                                else if (s === "Leave") colorClasses = "bg-amber-100 text-amber-800 border-amber-300 shadow-sm";
                                else colorClasses = "bg-blue-100 text-blue-800 border-blue-300 shadow-sm";
                              }
                              
                              return (
                                <button
                                  key={s}
                                  onClick={() => handleStatusChange(teacher.id, s)}
                                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${colorClasses}`}
                                >
                                  {s}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder="Add remarks..."
                            value={record?.remarks || ""}
                            onChange={(e) => handleRemarksChange(teacher.id, e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No teachers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hidden Printable Area */}
      <div className="hidden">
        <div ref={printRef} className="p-8 bg-white text-black font-sans">
          <div className="text-center mb-6 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">Himalaya Basic School</h1>
            <h2 className="text-xl font-semibold">Teacher Attendance Report</h2>
            <p className="mt-2 text-lg">
              <b>Date:</b> {formatBsDateDisplay(selectedDate)} B.S.
            </p>
          </div>

          <div className="flex gap-6 mb-6 font-medium text-sm">
            <div>Total Teachers: {teachers.length}</div>
            <div className="text-green-700">Present: {presentCount}</div>
            <div className="text-red-700">Absent: {absentCount}</div>
            <div className="text-yellow-600">Leave: {leaveCount}</div>
          </div>

          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-left w-12">S.N.</th>
                <th className="border border-black p-2 text-left">Teacher Name</th>
                <th className="border border-black p-2 text-center w-24">Status</th>
                <th className="border border-black p-2 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher, idx) => {
                const record = attendanceData[teacher.id];
                const status = record?.status || "-";
                return (
                  <tr key={teacher.id}>
                    <td className="border border-black p-2 text-center">{idx + 1}</td>
                    <td className="border border-black p-2 font-medium">{formatTeacherName(teacher)}</td>
                    <td className="border border-black p-2 text-center font-bold">{status}</td>
                    <td className="border border-black p-2">{record?.remarks || "-"}</td>
                  </tr>
                );
              })}
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
