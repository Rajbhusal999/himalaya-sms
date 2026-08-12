"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import * as XLSX from "xlsx";
import { Printer, Download, BookOpen, RefreshCw } from "lucide-react";

const ALLOWED_CLASSES = ["6", "7", "8"];
const EXAM_TERMS = ["First Term", "Second Term", "Final"];
const ACADEMIC_YEARS = Array.from({ length: 9 }, (_, i) => (2083 + i).toString());

const FULL_MARK = 50;
const PASS_MARK = 18; // 36% of 50

export default function NumberLedger() {
  const [selectedClass, setSelectedClass] = useState<string>("6");
  const [selectedTerm, setSelectedTerm] = useState<string>(EXAM_TERMS[0]);
  const [selectedYear, setSelectedYear] = useState<string>(ACADEMIC_YEARS[0]);

  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, Record<string, any>>>({});
  const [loading, setLoading] = useState<boolean>(false);

  const fmtNum = (num: any) => {
    if (num === "" || num === null || num === undefined) return "";
    const n = Number(num);
    if (isNaN(n)) return num;
    return Number.isInteger(n) ? n.toString() : n.toFixed(2);
  };

  const getDisplayRollNo = (cls: string, index: number) => {
    const classPrefixMap: Record<string, string> = {
      "6": "SI", "7": "SE", "8": "EI"
    };
    const classPrefix = classPrefixMap[cls] || cls;
    return `H${classPrefix}${(index + 1).toString().padStart(3, '0')}`;
  };

  const loadData = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      // 1. Fetch Students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, name, roll_no, class")
        .eq("class", selectedClass)
        .order("name");

      if (studentsError) throw studentsError;

      const formattedStudents = (studentsData || []).map((s: any, i: number) => ({
        ...s,
        displayRollNo: getDisplayRollNo(s.class, i)
      }));
      setStudents(formattedStudents);

      // 2. Fetch Subjects & filter zero credit hours
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .eq("class", selectedClass);

      if (subjectsError) throw subjectsError;

      let subjectsList = (subjectsData || []).filter(
        sub => sub.credit_hour !== null && Number(sub.credit_hour) > 0
      );

      const getSubjectRank = (name: string) => {
        const lower = name.toLowerCase();
        if (lower === "nepali" || lower.includes("nepali")) return 1;
        if (lower === "english" || (lower.includes("english") && !lower.includes("opt"))) return 2;
        if (lower.includes("math")) return 3;
        if (lower.includes("science") || lower.includes("technology") || lower.includes("sci")) return 4;
        if (lower.includes("social") || lower.includes("soc")) return 5;
        if (lower.includes("hpc") || lower.includes("health") || lower.includes("creative")) return 6;
        if (lower.includes("local") || lower.includes("bharatpur") || lower.includes("pride")) return 7;
        if (lower.includes("computer") || lower.includes("opt")) return 8;
        return 99;
      };

      subjectsList.sort((a, b) => getSubjectRank(a.subject_name) - getSubjectRank(b.subject_name));
      setSubjects(subjectsList);

      // 3. Fetch Marks from dedicated number_ledger_marks table
      const studentIds = formattedStudents.map((s: any) => s.id);
      if (studentIds.length > 0) {
        const { data: marksData, error: marksError } = await supabase
          .from("number_ledger_marks")
          .select("*")
          .in("student_id", studentIds)
          .eq("term", selectedTerm)
          .eq("academic_year", selectedYear);

        if (marksError) throw marksError;

        const marksMap: Record<string, Record<string, any>> = {};
        (marksData || []).forEach((m: any) => {
          if (!marksMap[m.student_id]) marksMap[m.student_id] = {};
          marksMap[m.student_id][m.subject_id] = m;
        });
        setMarks(marksMap);
      } else {
        setMarks({});
      }
    } catch (err: any) {
      console.error("Error loading Number Ledger data:", err);
      alert("Error loading data: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClass, selectedTerm, selectedYear]);

  // Extract ONLY numbers from dedicated number_ledger_marks table
  const getTermMark = (m: any): number | null => {
    if (!m) return null;
    const has = (v: any) => v !== undefined && v !== null && v !== "" && !isNaN(Number(v));
    if (has(m.mark)) return Number(m.mark);
    return null;
  };

  // Process rows for ledger rendering & PASS/FAIL rules (< 36% fails subject & student)
  const processedStudents = (() => {
    const studentList = students.map((student, idx) => {
      let studentTotal = 0;
      let validCount = 0;
      let hasFailed = false;

      const subjectMarks: Record<string, number | null> = {};

      subjects.forEach(sub => {
        const m = marks[student.id]?.[sub.id];
        const val = getTermMark(m);
        subjectMarks[sub.id] = val;

        if (val !== null) {
          studentTotal += val;
          validCount++;
          // Less than 36% (18 out of 50) is a FAIL
          if (val < PASS_MARK) {
            hasFailed = true;
          }
        }
      });

      const maxTotal = subjects.length * FULL_MARK;
      const percentage = maxTotal > 0 ? (studentTotal / maxTotal) * 100 : 0;

      let remarks = "NOT GRADED";
      if (validCount > 0) {
        remarks = hasFailed ? "FAIL" : "PASS";
      }

      return {
        student,
        idx,
        subjectMarks,
        studentTotal,
        validCount,
        hasFailed,
        percentage,
        remarks
      };
    });

    // Rank is assigned only among students who PASSED all subjects
    const passedTotals = [
      ...new Set(
        studentList
          .filter(s => s.validCount > 0 && !s.hasFailed && s.studentTotal > 0)
          .map(s => s.studentTotal)
      )
    ].sort((a, b) => b - a);

    return studentList.map(item => {
      const rank =
        item.validCount > 0 && !item.hasFailed && item.studentTotal > 0
          ? passedTotals.indexOf(item.studentTotal) + 1
          : "-";
      return { ...item, rank };
    });
  })();

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const headers = [
      "Roll No.",
      "Student Name",
      ...subjects.map(s => s.subject_name),
      "Total",
      "Percentage",
      "Rank",
      "Remarks"
    ];

    const rows = processedStudents.map(item => {
      const rowData: any[] = [
        item.student.roll_no || item.idx + 1,
        item.student.name
      ];

      subjects.forEach(sub => {
        const markVal = item.subjectMarks[sub.id];
        rowData.push(markVal !== null ? fmtNum(markVal) : "");
      });

      rowData.push(fmtNum(item.studentTotal));
      rowData.push(fmtNum(item.percentage) + "%");
      rowData.push(item.rank);
      rowData.push(item.remarks);

      return rowData;
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Number Ledger");
    XLSX.writeFile(wb, `Number_Ledger_Class_${selectedClass}_${selectedTerm}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
        }
      `}</style>

      {/* Header & Filter Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <BookOpen className="w-6 h-6 mr-2 text-brand-600" />
              Number Ledger
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Terminal examination number ledger (Class 6, 7 & 8 only). Pass mark is 36% (18/50).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 bg-white text-slate-900 font-medium"
            >
              {ALLOWED_CLASSES.map(cls => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 bg-white text-slate-900 font-medium"
            >
              {EXAM_TERMS.map(term => (
                <option key={term} value={term}>{term.toUpperCase()} EXAMINATION</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Academic Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 bg-white text-slate-900 font-medium"
            >
              {ACADEMIC_YEARS.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6 print:border-none print:shadow-none print:p-0">
        <div className="text-center mb-4 hidden print:block">
          <h1 className="text-xl font-bold uppercase">Himalaya Secondary School</h1>
          <h2 className="text-md font-semibold mt-1">Number Ledger - Class {selectedClass} ({selectedTerm} {selectedYear})</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto border border-black">
            <table className="w-full text-center border-collapse text-[11px] text-black">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-black text-[11px]">
                  <th className="border border-black px-1.5 py-1 w-12 text-center">Roll No.</th>
                  <th className="border border-black px-2 py-1 min-w-[140px] text-left">Student Name</th>
                  
                  {subjects.map(sub => (
                    <th key={sub.id} className="border border-black px-1.5 py-1 min-w-[65px] font-bold leading-tight text-center">
                      {sub.subject_name}
                    </th>
                  ))}

                  <th className="border border-black px-1.5 py-1 w-14 bg-slate-200 text-center">Total</th>
                  <th className="border border-black px-1.5 py-1 w-16 bg-slate-200 text-center">Percentage</th>
                  <th className="border border-black px-1 py-1 w-12 bg-slate-200 text-center">Rank</th>
                  <th className="border border-black px-1.5 py-1 w-16 bg-slate-200 text-center">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {processedStudents.map((item) => (
                  <tr key={item.student.id} className="hover:bg-slate-50 transition-colors h-7">
                    <td className="border border-black px-1 py-1 font-medium text-center">
                      {item.student.roll_no || item.idx + 1}
                    </td>
                    <td className="border border-black px-2 py-1 text-left font-medium whitespace-nowrap">
                      {item.student.name}
                    </td>

                    {subjects.map(sub => {
                      const markVal = item.subjectMarks[sub.id];
                      const isFailed = markVal !== null && markVal < PASS_MARK;
                      return (
                        <td 
                          key={sub.id} 
                          className={`border border-black px-1 py-1 font-semibold text-center ${
                            isFailed ? "bg-red-100 text-red-700 font-bold border-red-400" : ""
                          }`}
                        >
                          {markVal !== null ? fmtNum(markVal) : "-"}
                        </td>
                      );
                    })}

                    <td className="border border-black px-1 py-1 font-bold bg-slate-50 text-center">
                      {item.validCount > 0 ? fmtNum(item.studentTotal) : "-"}
                    </td>
                    <td className="border border-black px-1 py-1 font-bold bg-slate-50 text-center">
                      {item.validCount > 0 ? fmtNum(item.percentage) + "%" : "-"}
                    </td>
                    <td className="border border-black px-1 py-1 font-bold bg-slate-50 text-center">
                      {item.rank}
                    </td>
                    <td className={`border border-black px-1 py-1 text-[10px] font-bold text-center ${
                      item.remarks === "FAIL" 
                        ? "text-red-700 bg-red-100 font-black" 
                        : item.remarks === "PASS" 
                        ? "text-emerald-700 bg-emerald-50" 
                        : "text-slate-500"
                    }`}>
                      {item.remarks}
                    </td>
                  </tr>
                ))}

                {processedStudents.length === 0 && (
                  <tr>
                    <td
                      colSpan={subjects.length + 6}
                      className="border border-black px-4 py-8 text-center text-slate-500"
                    >
                      No student records found for Class {selectedClass}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
