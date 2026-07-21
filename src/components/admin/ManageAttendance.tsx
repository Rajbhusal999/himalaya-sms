"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { ClipboardCheck, Search, Save } from "lucide-react";

type Student = {
  id: string;
  name: string;
  roll_no: number;
};

type AttendanceRecord = {
  id?: string;
  student_id: string;
  exam_term: string;
  attendance_days: string;
};

const CLASSES = ["Nursery", "KG", "ECD", "1", "2", "3", "4", "5", "6", "7", "8"];
const EXAM_TERMS = ["First terminal exam", "Second terminal Examination", "Final Examination"];
const ACADEMIC_YEARS = Array.from({ length: 9 }, (_, i) => (2083 + i).toString());

export default function ManageAttendance() {
  const [selectedClass, setSelectedClass] = useState<string>("1");
  const [selectedTerm, setSelectedTerm] = useState<string>(EXAM_TERMS[0]);
  const [selectedYear, setSelectedYear] = useState<string>(ACADEMIC_YEARS[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const handleLoad = async () => {
    setLoading(true);
    setDataLoaded(false);
    try {
      // Fetch students for the selected class
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, name, roll_no")
        .eq("class", selectedClass)
        .order("roll_no");

      if (studentsError) throw studentsError;

      setStudents(studentsData || []);

      // Fetch existing attendance for these students and the selected term and year
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from("attendance")
        .select("*")
        .eq("exam_term", `${selectedTerm} - ${selectedYear}`)
        .in("student_id", studentsData?.map(s => s.id) || []);

      if (attendanceError) throw attendanceError;

      // Map existing records to the state
      const newAttendanceData: Record<string, string> = {};
      attendanceRecords?.forEach(record => {
        newAttendanceData[record.student_id] = record.attendance_days || "";
      });
      setAttendanceData(newAttendanceData);
      setDataLoaded(true);

    } catch (err: any) {
      alert("Error loading data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId: string, value: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const recordsToUpsert = students.map(student => ({
        student_id: student.id,
        exam_term: `${selectedTerm} - ${selectedYear}`,
        attendance_days: attendanceData[student.id] || ""
      }));

      // Upsert using the unique constraint (student_id, exam_term)
      const { error } = await supabase
        .from("attendance")
        .upsert(recordsToUpsert, { onConflict: 'student_id,exam_term' });

      if (error) throw error;
      
      alert("Attendance saved successfully!");
    } catch (err: any) {
      alert("Error saving attendance: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <ClipboardCheck className="w-6 h-6 mr-2 text-brand-600" />
              Manage Attendance
            </h2>
            <p className="text-sm text-slate-500 mt-1">Record student attendance for specific exam terms.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Class:</label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setDataLoaded(false);
                }}
                className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-slate-50 text-slate-900 font-medium"
              >
                {CLASSES.map(cls => (
                  <option key={cls} value={cls}>Class {cls}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Term:</label>
              <select
                value={selectedTerm}
                onChange={(e) => {
                  setSelectedTerm(e.target.value);
                  setDataLoaded(false);
                }}
                className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-slate-50 text-slate-900 font-medium"
              >
                {EXAM_TERMS.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setDataLoaded(false);
                }}
                className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-slate-50 text-slate-900 font-medium"
              >
                {ACADEMIC_YEARS.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleLoad}
              disabled={loading}
              className="w-full sm:w-auto flex justify-center items-center py-2 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {loading ? "Loading..." : "Load Students"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {dataLoaded && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-slate-800">
                Attendance List
              </h3>
              <p className="text-sm text-slate-500">
                Class {selectedClass} • {selectedTerm} • {selectedYear}
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || students.length === 0}
              className="flex justify-center items-center py-2 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="px-6 py-4 font-medium">Roll No</th>
                  <th className="px-6 py-4 font-medium">Student Name</th>
                  <th className="px-6 py-4 font-medium">Attendance (Days)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-600 w-24">
                        {student.roll_no}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 w-64">
                        <input
                          type="text"
                          value={attendanceData[student.id] || ""}
                          onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                          placeholder="e.g. 45 or 45/50"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900"
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                      No students found in Class {selectedClass}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!dataLoaded && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4">
            <ClipboardCheck className="w-8 h-8 text-brand-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-1">Ready to Load Students</h3>
          <p className="text-slate-500 max-w-md">
            Select a class and an exam term from the filters above, then click "Load Students" to start entering attendance.
          </p>
        </div>
      )}
    </div>
  );
}
