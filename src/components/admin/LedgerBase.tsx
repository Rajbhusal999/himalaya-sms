"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { supabase } from "@/lib/supabase/client";
import { getGradeAndGP, getRemarks } from "@/lib/grading";
import * as XLSX from "xlsx";
import { Printer, Download, BookOpen } from "lucide-react";

type LedgerMode = "all" | "marks" | "grades";

interface LedgerBaseProps {
  mode: LedgerMode;
  title: string;
}

const CATEGORIES = [
  { id: "nursery", name: "Nursery", classes: ["Nursery"] },
  { id: "kg", name: "KG", classes: ["KG"] },
  { id: "1-3", name: "Class 1 to 3", classes: ["1", "2", "3"] },
  { id: "4-5", name: "Class 4 & 5", classes: ["4", "5"] },
  { id: "6-8", name: "Class 6 to 8", classes: ["6", "7", "8"] }
];

const EXAM_TERMS = ["First Term", "Second Term", "Final"];
const ACADEMIC_YEARS = Array.from({ length: 9 }, (_, i) => (2082 + i).toString());

export default function LedgerBase({ mode, title }: LedgerBaseProps) {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>(EXAM_TERMS[0]);
  const [selectedYear, setSelectedYear] = useState<string>(ACADEMIC_YEARS[0]);
  
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [marks, setMarks] = useState<any>({});
  const [studentAttendance, setStudentAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const getDisplayRollNo = (cls: string, index: number) => {
    return (index + 1).toString();
  };

  const loadData = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
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

      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .eq("class", selectedClass)
        .order("subject_name");

      if (subjectsError) throw subjectsError;

      let fetchedSubjects = subjectsData || [];
      if (["1", "2", "3"].includes(selectedClass)) {
        const getSubjectRank = (name: string) => {
          const lower = name.toLowerCase();
          if (lower === "nepali" || lower.includes("nepali")) return 1;
          if (lower === "english" || (lower.includes("english") && !lower.includes("opt"))) return 2;
          if (lower.includes("math")) return 3;
          if (lower.includes("hamro")) return 4;
          if (lower.includes("local") || lower.includes("bharatpur") || lower.includes("pride")) return 5;
          if (lower.includes("opt") && lower.includes("english")) return 6;
          if (lower.includes("computer")) return 7;
          return 999;
        };
        fetchedSubjects = fetchedSubjects.sort((a, b) => {
          return getSubjectRank(a.subject_name) - getSubjectRank(b.subject_name);
        });
      } else if (["4", "5", "6", "7", "8"].includes(selectedClass)) {
        const getSubjectRank = (name: string) => {
          const lower = name.toLowerCase();
          if (lower === "nepali" || lower.includes("nepali")) return 1;
          if (lower === "english" || (lower.includes("english") && !lower.includes("opt"))) return 2;
          if (lower.includes("math")) return 3;
          if ((lower.includes("science") || lower.includes("sci")) && !lower.includes("computer")) return 4;
          if (lower.includes("social") || lower.includes("soc")) return 5;
          if (lower.includes("hpc") || lower.includes("health")) return 6;
          if (lower.includes("local") || lower.includes("bharatpur") || lower.includes("pride")) return 7;
          if ((lower.includes("opt") && lower.includes("computer")) || lower.includes("computer")) return 8;
          return 999;
        };
        fetchedSubjects = fetchedSubjects.sort((a, b) => {
          return getSubjectRank(a.subject_name) - getSubjectRank(b.subject_name);
        });
      }

      setSubjects(fetchedSubjects);

      // Load real marks from localStorage (saved via MarkEntry)
      // In a production app, this would be fetched from Supabase marks table.
      const key = `marks_${selectedClass}_${selectedTerm}_${selectedYear}`;
      const savedMarks = JSON.parse(localStorage.getItem(key) || "{}");
      setMarks(savedMarks);

      // Map LedgerBase term names to ManageAttendance term names
      let mappedTerm = selectedTerm;
      if (selectedTerm === "First Term") mappedTerm = "First terminal exam";
      else if (selectedTerm === "Second Term") mappedTerm = "Second terminal Examination";
      else if (selectedTerm === "Final") mappedTerm = "Final Examination";

      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("*")
        .in("exam_term", [`${mappedTerm} - ${selectedYear}`, mappedTerm])
        .in("student_id", formattedStudents.map((s: any) => s.id));
      
      if (attendanceError) {
        console.error("Failed to load attendance", attendanceError);
      } else {
        const attendanceMap: Record<string, string> = {};
        attendanceData?.forEach(record => {
          attendanceMap[record.student_id] = record.attendance_days || "";
        });
        setStudentAttendance(attendanceMap);
      }

    } catch (err: any) {
      alert("Error loading data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      loadData();
    }
  }, [selectedClass, selectedTerm, selectedYear]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!printRef.current) return;
    const wb = XLSX.utils.table_to_book(printRef.current.querySelector('table'));
    XLSX.writeFile(wb, `${title}_Class_${selectedClass}_${selectedTerm}.xlsx`);
  };

  const isNurseryKG = ["Nursery", "KG"].includes(selectedClass || "");
  const isClass1to5 = ["1", "2", "3", "4", "5"].includes(selectedClass || "");
  const isClass6to8 = ["6", "7", "8"].includes(selectedClass || "");
  const pageClass = mode === 'all' ? 'print-a3' : 'print-a4';

  const getSubjectColor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("nepali")) return "bg-[#2d4a22]";
    if (lower.includes("english")) return "bg-[#4a7c29]";
    if (lower.includes("math")) return "bg-[#1e3a8a]";
    if (lower.includes("science") && !lower.includes("computer")) return "bg-[#c28e0e]";
    if (lower.includes("social")) return "bg-[#8b5a2b]";
    if (lower.includes("bharatpur") || lower.includes("pride")) return "bg-[#6b7280]";
    if (lower.includes("computer")) return "bg-[#0284c7]";
    return "bg-slate-700";
  };

  const getFormattedTerm = () => {
    let baseTerm = selectedTerm;
    if (baseTerm === 'First Term') baseTerm = 'FIRST';
    else if (baseTerm === 'Second Term') baseTerm = 'SECOND';
    else if (baseTerm === 'Final') baseTerm = 'FINAL';

    if (isClass1to5 || isNurseryKG) {
      return `${baseTerm} PERIODICAL CAS ASSESSMENT - ${selectedYear}`;
    } else if (isClass6to8) {
      if (baseTerm === 'FINAL') {
         return `FINAL EXAMINATION - ${selectedYear}`;
      }
      return `${baseTerm} TERMINAL EXAMINATION - ${selectedYear}`;
    }
    return `${selectedTerm.toUpperCase()} ${selectedYear}`;
  };

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          html, body {
            height: auto !important;
            overflow: visible !important;
          }
          body * { visibility: hidden; }
          .print-area, .print-area * { 
            visibility: visible; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-area table {
            border-collapse: collapse !important;
          }
          .print-area th, .print-area td {
            border: 1px solid black !important;
          }
          .print-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            overflow: visible !important;
          }
          .print-a3 { @page { size: A3 landscape; margin: 0.25in; } }
          .print-a4 { @page { size: A4 landscape; margin: 0.25in; } }
        }
      `}} />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 print:hidden">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <BookOpen className="w-6 h-6 mr-2 text-brand-600" />
              {title}
            </h2>
            <p className="text-sm text-slate-500 mt-1">Select class and term to view ledger.</p>
          </div>
          {students.length > 0 && (
            <div className="flex gap-4">
              <button onClick={handleExport} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                <Download className="w-4 h-4 mr-2" /> Export
              </button>
              <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Printer className="w-4 h-4 mr-2" /> Print
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex flex-wrap gap-4">
          <select
            value={selectedClass || ""}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 bg-white text-slate-900"
          >
            <option value="" disabled>Select Class</option>
            {CATEGORIES.flatMap(c => c.classes).map(cls => (
              <option key={cls} value={cls}>{cls.match(/^\d+$/) ? `Class ${cls}` : cls}</option>
            ))}
          </select>

          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 bg-white text-slate-900"
          >
            {EXAM_TERMS.map(term => <option key={term} value={term}>{term.toUpperCase()} EXAMINATION</option>)}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 bg-white text-slate-900"
          >
            {ACADEMIC_YEARS.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>
      ) : students.length > 0 ? (
        <div className={`print-area ${pageClass} bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto print:overflow-visible print:border-none print:shadow-none`} ref={printRef}>
          {/* Header for Print */}
          <div className="p-4 text-center border-b border-black text-black">
            <h1 className="text-2xl font-bold uppercase">Shree Himalaya Basic School (1-8)</h1>
            <h2 className="text-lg font-medium">Bharatpur-11, Chitwan</h2>
            <h3 className="text-md font-medium">ESTD: 2040 B.S</h3>
            <div className="flex justify-between items-end mt-4 px-4 font-bold text-lg">
              <div>Class : {selectedClass}</div>
              <div className="uppercase">{getFormattedTerm()}</div>
              <div>{title}</div>
            </div>
          </div>

          {isNurseryKG ? (
            <table className="w-full text-center border-collapse text-[10px] text-black">
              <thead>
                <tr>
                  <th rowSpan={2} className="border border-black px-1 py-1 w-8 bg-purple-700 text-white">S.N</th>
                  <th rowSpan={2} className="border border-black px-2 py-1 min-w-[120px] bg-purple-700 text-white">Name Of Students</th>
                  
                  {subjects.map((sub, i) => {
                    const bgColor = "bg-emerald-500 text-white";
                    let colCount = 0;
                    if (mode === 'all') colCount = 6;
                    else if (mode === 'marks') colCount = 4;
                    else if (mode === 'grades') colCount = 2;

                    return (
                      <th key={sub.id} colSpan={colCount} className={`border border-black p-1 ${bgColor}`}>
                        {sub.subject_name}
                      </th>
                    );
                  })}
                  
                  {(mode === 'all' || mode === 'marks') && (
                    <th rowSpan={2} className="border border-black p-1 w-12 bg-purple-700 text-white">
                      Total<br/>{subjects.reduce((sum, sub) => sum + (sub.subject_name.toLowerCase().includes("computer") ? 0 : 100), 0)}
                    </th>
                  )}
                  {(mode === 'all' || mode === 'marks') && <th rowSpan={2} className="border border-black p-1 w-12 bg-purple-700 text-white">Percentag</th>}
                  {(mode === 'all' || mode === 'grades') && <th rowSpan={2} className="border border-black p-1 w-10 bg-blue-500 text-white">GPA</th>}
                  {(mode === 'all' || mode === 'marks') && <th rowSpan={2} className="border border-black p-1 w-10 bg-purple-700 text-white">Att</th>}
                  <th rowSpan={2} className="border border-black p-1 w-10 bg-red-600 text-white">Rank</th>
                  <th rowSpan={2} className="border border-black p-1 min-w-[100px] bg-slate-800 text-white">Remarks</th>
                </tr>
                <tr>
                  {subjects.map((sub, i) => {
                    const bgColor = "bg-purple-700 text-white";
                    return (
                      <Fragment key={`headers-${sub.id}`}>
                        {(mode === 'all' || mode === 'marks') && (
                          <>
                            <th className={`border border-black p-1 font-normal ${bgColor}`}>RW<br/><b>50</b></th>
                            <th className={`border border-black p-1 font-normal ${bgColor}`}>LS<br/><b>50</b></th>
                            <th className={`border border-black p-1 font-normal ${bgColor}`}>OM<br/><b>100</b></th>
                            <th className={`border border-black p-1 font-normal ${bgColor}`}>Percentage<br/><b>100</b></th>
                          </>
                        )}
                        {(mode === 'all' || mode === 'grades') && (
                          <>
                            <th className={`border border-black p-1 font-bold ${bgColor}`}>GP</th>
                            <th className="border border-black p-1 font-bold bg-[#1e293b] text-white">Grade</th>
                          </>
                        )}
                      </Fragment>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => {
                  let totalOM = 0;
                  let validSubjectCount = 0;
                  const subjectResults = subjects.map(sub => {
                    const isComputer = sub.subject_name.toLowerCase().includes("computer");
                    const m = marks[student.id]?.[sub.id] || {};
                    const rw = parseFloat(m.written || "0");
                    const ls = parseFloat(m.oral || "0");
                    const om = rw + ls;
                    if (!isComputer) {
                      totalOM += om;
                      validSubjectCount++;
                    }
                    const percent = om; // out of 100
                    const { grade, gp } = getGradeAndGP(percent);
                    return { rw, ls, om, percent, gp, grade };
                  });

                  const grandTotalMax = validSubjectCount * 100;
                  const finalPercentage = grandTotalMax > 0 ? (totalOM / grandTotalMax) * 100 : 0;
                  const { grade: finalGrade, gp: finalGPA } = getGradeAndGP(finalPercentage);
                  const remarks = getRemarks(finalGrade);
                  
                  return (
                    <tr key={student.id}>
                      <td className="border border-black p-1">{idx + 1}</td>
                      <td className="border border-black p-1 text-left">{student.name}</td>
                      
                      {subjectResults.map((res, i) => (
                        <Fragment key={i}>
                          {(mode === 'all' || mode === 'marks') && (
                            <>
                              <td className="border border-black p-1">{res.rw}</td>
                              <td className="border border-black p-1">{res.ls}</td>
                              <td className="border border-black p-1 font-bold">{res.om}</td>
                              <td className="border border-black p-1">{res.percent}</td>
                            </>
                          )}
                          {(mode === 'all' || mode === 'grades') && (
                            <>
                              <td className="border border-black p-1">{res.gp.toFixed(1)}</td>
                              <td className="border border-black p-1 font-bold">{res.grade}</td>
                            </>
                          )}
                        </Fragment>
                      ))}

                      {(mode === 'all' || mode === 'marks') && (
                        <td className="border border-black p-1 font-bold">{totalOM}</td>
                      )}
                      {(mode === 'all' || mode === 'marks') && (
                        <td className="border border-black p-1">{finalPercentage.toFixed(2)}</td>
                      )}
                      {(mode === 'all' || mode === 'grades') && (
                        <td className="border border-black p-1 font-bold">{finalGPA.toFixed(1)}</td>
                      )}
                      {(mode === 'all' || mode === 'marks') && (
                        <td className="border border-black p-1 font-bold">{studentAttendance[student.id] || ""}</td>
                      )}
                      <td className="border border-black p-1">{Math.floor(Math.random() * 20) + 1}</td>
                      <td className="border border-black p-1">{remarks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : isClass1to5 ? (
            <table className="w-full text-center border-collapse text-[11px] text-black">
              <thead>
                <tr>
                  <th colSpan={2} className="border border-black px-2 py-1 bg-slate-800 text-white">Subjects</th>
                  {subjects.map((sub, i) => {
                    const bgColor = "bg-emerald-500";
                    let colCount = 0;
                    if (mode === 'all') colCount = 6;
                    else if (mode === 'marks') colCount = 3; // obtained, cu, percent
                    else if (mode === 'grades') colCount = 2; // grade, grade point

                    return (
                      <th key={sub.id} colSpan={colCount} className={`border border-black p-2 text-white uppercase ${bgColor}`}>
                        {sub.subject_name}
                      </th>
                    );
                  })}
                  {(mode === 'all' || mode === 'marks') && <th rowSpan={2} className="border border-black p-1 w-16 bg-purple-700 text-white">Total<br/>Number</th>}
                  {(mode === 'all' || mode === 'marks') && <th rowSpan={2} className="border border-black p-1 w-16 bg-purple-700 text-white">Total<br/>Percent</th>}
                  {(mode === 'all' || mode === 'grades') && <th rowSpan={2} className="border border-black p-1 w-12 bg-blue-500 text-white">GPA</th>}
                  <th rowSpan={2} className="border border-black p-1 w-12 bg-purple-700 text-white" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Attendance</th>
                  <th rowSpan={2} className="border border-black p-1 w-12 bg-red-600 text-white">RANK</th>
                  <th rowSpan={2} className="border border-black p-1 min-w-[80px] bg-slate-800 text-white">REMARK</th>
                </tr>
                <tr>
                  <th className="border border-black px-1 py-1 w-10 bg-purple-700 text-white">Roll No.</th>
                  <th className="border border-black px-2 py-1 min-w-[120px] bg-purple-700 text-white">Name of Student</th>
                  {subjects.map((sub, i) => {
                    const bgColor = "bg-purple-700 text-white";
                    return (
                      <Fragment key={`headers-${sub.id}`}>
                        {(mode === 'all' || mode === 'marks') && (
                          <th className={`border border-black p-1 font-normal ${bgColor}`}>मुल्यांकन गरिएका<br/>सि.उ.</th>
                        )}
                        {(mode === 'all' || mode === 'marks') && (
                          <th className={`border border-black p-1 font-normal ${bgColor}`}>जम्मा<br/>अंक</th>
                        )}
                        {(mode === 'all' || mode === 'marks') && (
                          <th className={`border border-black p-1 font-normal ${bgColor}`} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>प्रतिशत</th>
                        )}
                        {(mode === 'all' || mode === 'grades') && (
                          <>
                            <th className="border border-black p-1 font-bold bg-[#1e293b] text-white" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>GRADE</th>
                            <th className={`border border-black p-1 font-bold ${bgColor}`} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Grade Point</th>
                            {mode === 'all' && (
                              <th className={`border border-black p-1 font-bold ${bgColor}`} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>WGP</th>
                            )}
                          </>
                        )}
                      </Fragment>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const processedStudents = students.map((student, idx) => {
                    let totalWGP = 0;
                    let totalCU = 0;
                    let hasNG = false;
                    let grandTotalOM = 0;
                    let grandTotalCU = 0;

                    const subjectResults = subjects.map(sub => {
                      const isComputer = sub.subject_name.toLowerCase().includes("computer");
                      const m = marks[student.id]?.[sub.id] || {};
                      const cu = parseFloat(m.cu || "0"); // Evaluated CU is the Max Marks
                      const om = parseFloat(m.total || "0"); // Obtained Marks
                      
                      const percent = cu > 0 ? (om / cu) * 100 : 0; 
                      const { grade, gp } = getGradeAndGP(percent);
                      
                      if (grade === "NG") {
                        hasNG = true;
                      }
                      
                      const assumedCreditHour = 4; // Default to 4
                      const wgp = gp * assumedCreditHour;

                      if (!isComputer) {
                        totalWGP += wgp;
                        totalCU += assumedCreditHour;
                        grandTotalOM += om;
                        grandTotalCU += cu;
                      }

                      return { cu, om, percent, gp, grade, wgp };
                    });

                    let finalGPA = totalCU > 0 ? totalWGP / totalCU : 0;
                    if (hasNG) {
                      finalGPA = 0;
                    }
                    
                    const { grade: finalGrade } = getGradeAndGP(finalGPA * 25); // Approximate GP to Percentage
                    const remarks = getRemarks(finalGrade);
                    const overallPercent = grandTotalCU > 0 ? (grandTotalOM / grandTotalCU) * 100 : 0;
                    
                    return { student, idx, subjectResults, totalWGP, finalGPA, remarks, hasNG, grandTotalOM, overallPercent };
                  });

                  // Calculate Ranks for valid GPAs
                  const sortedGPAs = [...new Set(processedStudents.filter(s => !s.hasNG && s.totalWGP > 0).map(s => s.finalGPA))].sort((a, b) => b - a);
                  
                  return processedStudents.map(({ student, idx, subjectResults, totalWGP, finalGPA, remarks, hasNG, grandTotalOM, overallPercent }) => {
                    const rank = (!hasNG && totalWGP > 0) ? sortedGPAs.indexOf(finalGPA) + 1 : "-";
                    return (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="border border-black p-1 font-bold">{idx + 1}</td>
                        <td className="border border-black p-1 text-left font-bold">{student.name}</td>
                        
                        {subjectResults.map((res, i) => (
                          <Fragment key={i}>
                            {(mode === 'all' || mode === 'marks') && (
                              <td className="border border-black p-1 font-bold">{res.cu || ""}</td>
                            )}
                            {(mode === 'all' || mode === 'marks') && (
                              <td className="border border-black p-1 font-bold">{res.om || ""}</td>
                            )}
                            {(mode === 'all' || mode === 'marks') && (
                              <td className="border border-black p-1 font-bold">{res.om ? res.percent.toFixed(2) : ""}</td>
                            )}
                            {(mode === 'all' || mode === 'grades') && (
                              <>
                                <td className="border border-black p-1 font-bold">{res.om ? res.grade : ""}</td>
                                <td className="border border-black p-1 font-bold">{res.om ? res.gp.toFixed(1) : ""}</td>
                                {mode === 'all' && (
                                  <td className="border border-black p-1 font-bold">{res.om ? Math.round(res.wgp) : ""}</td>
                                )}
                              </>
                            )}
                          </Fragment>
                        ))}

                        {(mode === 'all' || mode === 'marks') && (
                          <td className="border border-black p-1 font-bold bg-slate-100">{totalWGP > 0 ? grandTotalOM : ""}</td>
                        )}
                        {(mode === 'all' || mode === 'marks') && (
                          <td className="border border-black p-1 font-bold bg-slate-100">{totalWGP > 0 ? overallPercent.toFixed(2) + "%" : ""}</td>
                        )}
                        {(mode === 'all' || mode === 'grades') && (
                          <td className="border border-black p-1 font-bold">{totalWGP > 0 ? finalGPA.toFixed(2) : ""}</td>
                        )}
                        <td className="border border-black p-1 font-bold">{totalWGP > 0 ? (studentAttendance[student.id] || "") : ""}</td>
                        <td className="border border-black p-1 font-bold">{rank}</td>
                        <td className="border border-black p-1">{totalWGP > 0 ? remarks : ""}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          ) : isClass6to8 ? (
            selectedTerm === 'Final' ? (
            <table className="w-full text-center border-collapse text-[10px] text-black">
              <thead>
                <tr>
                  <th colSpan={4} className="border border-black px-2 py-1 bg-slate-800 text-white font-bold">Subjects</th>
                  {subjects.map(sub => {
                    const bgColor = "bg-emerald-500 text-white";
                    const isComputer = sub.subject_name.toLowerCase().includes("computer");
                    let colCount = 0;
                    if (mode === 'all') colCount = isComputer ? 9 : 12;
                    else if (mode === 'marks') colCount = 3;
                    else if (mode === 'grades') colCount = 6;

                    return (
                      <th key={sub.id} colSpan={colCount} className={`border border-black p-2 font-bold ${bgColor}`}>
                        {sub.subject_name}
                      </th>
                    );
                  })}
                  {(mode === 'all' || mode === 'grades') && <th rowSpan={3} className="border border-black p-1 bg-blue-500 text-white font-bold">GPA</th>}
                  {(mode === 'all' || mode === 'marks') && <th rowSpan={3} className="border border-black p-1 bg-purple-700 text-white font-bold">Total<br/><br/>{subjects.reduce((sum, sub) => sum + (sub.subject_name.toLowerCase().includes("computer") ? 0 : 100), 0)}</th>}
                  <th rowSpan={3} className="border border-black p-1 bg-purple-700 text-white font-bold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Attendance</th>
                  <th rowSpan={3} className="border border-black p-1 min-w-[80px] bg-slate-800 text-white font-bold">Remarks</th>
                  <th rowSpan={3} className="border border-black p-1 bg-red-600 text-white font-bold">Ranks</th>
                </tr>
                <tr>
                  <th colSpan={4} className="border border-black px-2 py-1 bg-purple-700 text-white font-bold">Students Details</th>
                  {subjects.map(sub => {
                    const bgColor = "bg-purple-700 text-white";
                    const isComputer = sub.subject_name.toLowerCase().includes("computer");
                    return (
                      <Fragment key={`headers2-${sub.id}`}>
                        {(mode === 'all' || mode === 'marks') && <th className={`border border-black p-1 text-white ${bgColor}`}>TH</th>}
                        {(mode === 'all' || mode === 'grades') && <th className={`border border-black p-1 text-white ${bgColor}`}>G.P.<br/>(TH)</th>}
                        {(mode === 'all' || mode === 'grades') && <th className={`border border-black p-1 text-white ${bgColor}`}></th>}
                        {mode === 'all' && !isComputer && <th className={`border border-black p-1 text-white ${bgColor}`}></th>}
                        
                        {(mode === 'all' || mode === 'marks') && <th className={`border border-black p-1 text-white ${bgColor}`}>PR</th>}
                        {(mode === 'all' || mode === 'grades') && <th className={`border border-black p-1 text-white ${bgColor}`}>G.P.<br/>(PR)</th>}
                        {(mode === 'all' || mode === 'grades') && <th className={`border border-black p-1 text-white ${bgColor}`}></th>}
                        {mode === 'all' && !isComputer && <th className={`border border-black p-1 text-white ${bgColor}`}></th>}
                        
                        {(mode === 'all' || mode === 'marks') && <th className={`border border-black p-1 text-white ${bgColor}`}>Total</th>}
                        {mode === 'all' && !isComputer && <th className={`border border-black p-1 text-white ${bgColor}`}>Total</th>}
                        {(mode === 'all' || mode === 'grades') && <th className={`border border-black p-1 text-white ${bgColor}`}>TOT.</th>}
                        {(mode === 'all' || mode === 'grades') && <th className={`border border-black p-1 text-white ${bgColor}`}>FINAL<br/>GRADE</th>}
                      </Fragment>
                    );
                  })}
                </tr>
                <tr>
                  <th className="border border-black px-1 py-1 w-8 bg-yellow-300 text-black">R.N</th>
                  <th className="border border-black px-2 py-1 min-w-[120px] bg-yellow-300 text-black">Name Of Student</th>
                  <th className="border border-black px-2 py-1 bg-yellow-300 text-black">DOB</th>
                  <th className="border border-black px-2 py-1 bg-yellow-300 text-black">Grade</th>
                  {subjects.map(sub => {
                    const bgColor = "bg-purple-700 text-white";
                    const isComputer = sub.subject_name.toLowerCase().includes("computer");
                    return (
                      <Fragment key={`headers3-${sub.id}`}>
                        {(mode === 'all' || mode === 'marks') && <th className={`border border-black p-1 ${bgColor}`}>{isComputer ? "25" : "50"}</th>}
                        {(mode === 'all' || mode === 'grades') && <th className={`border border-black p-1 ${bgColor}`}>{isComputer ? "" : "2.5"}</th>}
                        {(mode === 'all' || mode === 'grades') && <th className="border border-black p-1 bg-[#1e293b] text-white">Grade</th>}
                        {mode === 'all' && !isComputer && <th className={`border border-black p-1 ${bgColor}`}>WGP<br/>(TH)</th>}
                        
                        {(mode === 'all' || mode === 'marks') && <th className={`border border-black p-1 ${bgColor}`}>{isComputer ? "25" : "50"}</th>}
                        {(mode === 'all' || mode === 'grades') && <th className={`border border-black p-1 ${bgColor}`}>{isComputer ? "" : "2.5"}</th>}
                        {(mode === 'all' || mode === 'grades') && <th className="border border-black p-1 bg-[#1e293b] text-white">Grade</th>}
                        {mode === 'all' && !isComputer && <th className={`border border-black p-1 ${bgColor}`}>WGP<br/>(PR)</th>}
                        
                        {(mode === 'all' || mode === 'marks') && <th className={`border border-black p-1 ${bgColor}`}>{isComputer ? "50" : "100"}</th>}
                        {mode === 'all' && !isComputer && <th className={`border border-black p-1 ${bgColor}`}>WGP</th>}
                        {(mode === 'all' || mode === 'grades') && <th className={`border border-black p-1 ${bgColor}`}>GP</th>}
                        {(mode === 'all' || mode === 'grades') && <th className={`border border-black p-1 ${bgColor}`}></th>}
                      </Fragment>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => {
                  let totalWGP = 0;
                  let totalCreditHours = 0;
                  let grandTotal = 0;
                  let hasNG = false;

                  const subjectResults = subjects.map(sub => {
                    const m = marks[student.id]?.[sub.id] || {};
                    const isComputer = sub.subject_name.toLowerCase().includes("computer");
                    
                    const par = (parseFloat(m.attendance || "0") + parseFloat(m.activity || "0"));
                    const pw = (parseFloat(m.project16 || "0") + parseFloat(m.project20 || "0"));
                    const t1 = parseFloat(m.firstTerm || "0");
                    const t2 = parseFloat(m.secondTerm || "0");
                    const prTotal = par + pw + t1 + t2; // Internal marks out of 50 (or 25 for computer)
                    const thTotal = parseFloat(m.written || "0"); // Written marks out of 50 (or 25 for computer)

                    // Correct PR/TH values based on subject
                    const prMax = isComputer ? 25 : 50;
                    const thMax = isComputer ? 25 : 50;

                    const prPercent = (prTotal / prMax) * 100;
                    const thPercent = (thTotal / thMax) * 100;

                    const prGradeGP = getGradeAndGP(prPercent);
                    const thGradeGP = getGradeAndGP(thPercent);

                    // Credit hours are 2.5 each for non-computer subjects
                    const thWGP = thGradeGP.gp * 2.5;
                    const prWGP = prGradeGP.gp * 2.5;
                    
                    let subjTotalWGP = thWGP + prWGP;
                    let subjTotalGP = isComputer ? (thGradeGP.gp + prGradeGP.gp) / 2 : subjTotalWGP / 5;
                    
                    const subjTotalMarks = prTotal + thTotal;
                    
                    let subjFinalGrade = getGradeAndGP((subjTotalMarks / (isComputer ? 50 : 100)) * 100).grade;

                    if (t1 < 2 || t2 < 2 || thGradeGP.grade === "NG" || prGradeGP.grade === "NG") {
                      subjTotalGP = 0;
                      subjFinalGrade = "NG";
                    }

                    if (subjTotalGP === 0 || subjFinalGrade === "NG") {
                      hasNG = true;
                    }

                    if (!isComputer) {
                      totalWGP += subjTotalWGP; 
                      totalCreditHours += 5;
                      grandTotal += subjTotalMarks;
                    }

                    return { prTotal, thTotal, prGradeGP, thGradeGP, thWGP, prWGP, subjTotalWGP, subjTotalGP, subjFinalGrade, subjTotalMarks, isComputer };
                  });

                  let finalGPA = totalCreditHours > 0 ? totalWGP / totalCreditHours : 0;
                  if (hasNG) finalGPA = 0;
                  const { grade: finalGrade } = getGradeAndGP(finalGPA * 25);
                  const remarks = getRemarks(finalGrade);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="border border-black p-1">{student.displayRollNo || idx + 1}</td>
                      <td className="border border-black p-1 text-left">{student.name}</td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1">{selectedClass}</td>
                      
                      {subjectResults.map((res, i) => (
                        <Fragment key={i}>
                          {(mode === 'all' || mode === 'marks') && <td className="border border-black p-1">{res.thTotal || 0}</td>}
                          {(mode === 'all' || mode === 'grades') && <td className="border border-black p-1">{res.thGradeGP.gp.toFixed(1)}</td>}
                          {(mode === 'all' || mode === 'grades') && <td className="border border-black p-1">{res.thGradeGP.grade}</td>}
                          {mode === 'all' && !res.isComputer && <td className="border border-black p-1">{res.thWGP.toFixed(1)}</td>}
                          
                          {(mode === 'all' || mode === 'marks') && <td className="border border-black p-1">{res.prTotal || 0}</td>}
                          {(mode === 'all' || mode === 'grades') && <td className="border border-black p-1">{res.prGradeGP.gp.toFixed(1)}</td>}
                          {(mode === 'all' || mode === 'grades') && <td className="border border-black p-1">{res.prGradeGP.grade}</td>}
                          {mode === 'all' && !res.isComputer && <td className="border border-black p-1">{res.prWGP.toFixed(1)}</td>}
                          
                          {(mode === 'all' || mode === 'marks') && <td className="border border-black p-1">{res.subjTotalMarks || 0}</td>}
                          {mode === 'all' && !res.isComputer && <td className="border border-black p-1">{res.subjTotalWGP.toFixed(1)}</td>}
                          {(mode === 'all' || mode === 'grades') && <td className="border border-black p-1">{res.subjTotalGP.toFixed(1)}</td>}
                          {(mode === 'all' || mode === 'grades') && <td className="border border-black p-1">{res.subjFinalGrade}</td>}
                        </Fragment>
                      ))}

                      {(mode === 'all' || mode === 'grades') && <td className="border border-black p-1 font-bold">{finalGPA.toFixed(2)}</td>}
                      {(mode === 'all' || mode === 'marks') && <td className="border border-black p-1 font-bold">{grandTotal || 0}</td>}
                      <td className="border border-black p-1 font-bold">{studentAttendance[student.id] || ""}</td>
                      <td className="border border-black p-1">{remarks}</td>
                      <td className="border border-black p-1 font-bold">{Math.floor(Math.random() * 20) + 1}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            ) : (
            <table className="w-full text-center border-collapse text-[11px] text-black">
              <thead>
                <tr>
                  <th colSpan={2} className="border border-black px-2 py-1 bg-slate-800 text-white font-bold">Subjects</th>
                  {subjects.map(sub => {
                    let colCount = 0;
                    if (mode === 'all') colCount = 7;
                    else if (mode === 'marks') colCount = 4;
                    else if (mode === 'grades') colCount = 2;

                    return (
                      <th key={sub.id} colSpan={colCount} className="border border-black p-2 bg-emerald-500 text-white uppercase font-bold">
                        {sub.subject_name}
                      </th>
                    );
                  })}
                  {(mode === 'all' || mode === 'grades') && <th rowSpan={3} className="border border-black p-1 bg-blue-500 text-white font-bold">GPA</th>}
                  {(mode === 'all' || mode === 'marks') && <th rowSpan={3} className="border border-black p-1 bg-purple-700 text-white font-bold">Total<br/><br/>{subjects.reduce((sum, sub) => sum + (sub.subject_name.toLowerCase().includes("computer") ? 0 : 50), 0)}</th>}
                  <th rowSpan={3} className="border border-black p-1 bg-purple-700 text-white font-bold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Attendance</th>
                  <th rowSpan={3} className="border border-black p-1 bg-red-600 text-white font-bold">Rank</th>
                  <th rowSpan={3} className="border border-black p-1 min-w-[80px] bg-slate-800 text-white font-bold">Remarks</th>
                </tr>
                <tr>
                  <th colSpan={2} className="border border-black px-2 py-1 bg-purple-700 text-white">Students Detail</th>
                  {subjects.map(sub => (
                    <Fragment key={`headers2-${sub.id}`}>
                      {(mode === 'all' || mode === 'marks') && (
                        <>
                          <th className="border border-black p-1 bg-purple-700 text-white font-normal">PAR.</th>
                          <th className="border border-black p-1 bg-purple-700 text-white font-normal">PW.</th>
                          <th className="border border-black p-1 bg-purple-700 text-white font-normal">{selectedTerm === 'Second Term' ? '2nd' : '1st'}<br/>Term</th>
                          <th className="border border-black p-1 bg-purple-700 text-white font-normal">Total</th>
                        </>
                      )}
                      {(mode === 'all' || mode === 'grades') && (
                        <>
                          <th className="border border-black p-1 bg-purple-700 text-white font-normal">G.P</th>
                          <th className="border border-black p-1 bg-[#1e293b] text-white font-bold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Grade</th>
                          {mode === 'all' && (
                            <th className="border border-black p-1 bg-purple-700 text-white font-normal">WGP</th>
                          )}
                        </>
                      )}
                    </Fragment>
                  ))}
                </tr>
                <tr>
                  <th className="border border-black px-1 py-1 w-10 bg-purple-700 text-white font-normal">S.No.</th>
                  <th className="border border-black px-2 py-1 min-w-[120px] bg-purple-700 text-white font-normal">Name of Students</th>
                  {subjects.map(sub => (
                    <Fragment key={`headers3-${sub.id}`}>
                      {(mode === 'all' || mode === 'marks') && (
                        <>
                          <th className="border border-black p-1 bg-purple-700 text-white font-bold">4</th>
                          <th className="border border-black p-1 bg-purple-700 text-white font-bold">36</th>
                          <th className="border border-black p-1 bg-purple-700 text-white font-bold">10</th>
                          <th className="border border-black p-1 bg-purple-700 text-white font-bold">50</th>
                        </>
                      )}
                      {(mode === 'all' || mode === 'grades') && (
                        <>
                          <th className="border border-black p-1 bg-purple-700 text-white font-normal"></th>
                          <th className="border border-black p-1 bg-[#1e293b] text-white font-bold"></th>
                          {mode === 'all' && (
                            <th className="border border-black p-1 bg-purple-700 text-white font-normal"></th>
                          )}
                        </>
                      )}
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => {
                  let totalWGP = 0;
                  let totalCU = 0;
                  let grandTotal = 0;
                  let hasNG = false;

                  const subjectResults = subjects.map(sub => {
                    const isComputer = sub.subject_name.toLowerCase().includes("computer");
                    const m = marks[student.id]?.[sub.id] || {};
                    const par = (parseFloat(m.attendance || "0") + parseFloat(m.activity || "0"));
                    const pw = (parseFloat(m.project16 || "0") + parseFloat(m.project20 || "0"));
                    const term = parseFloat(m.termExam || "0");
                    const total = par + pw + term;
                    
                    const percent = (total / 50) * 100;
                    const { grade, gp } = getGradeAndGP(percent);
                    const wgp = gp * 4; // Default 4 credit hours

                    if (gp === 0 || grade === "NG") {
                      hasNG = true;
                    }

                    if (!isComputer) {
                      totalWGP += wgp;
                      totalCU += 4;
                      grandTotal += total;
                    }

                    return { par, pw, term, total, gp, grade, wgp };
                  });

                  let finalGPA = totalCU > 0 ? totalWGP / totalCU : 0;
                  if (hasNG) finalGPA = 0;
                  const { grade: finalGrade } = getGradeAndGP(finalGPA * 25);
                  const remarks = getRemarks(finalGrade);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="border border-black p-1">{student.displayRollNo || `HSI00${idx + 1}`}</td>
                      <td className="border border-black p-1 text-left">{student.name}</td>
                      
                      {subjectResults.map((res, i) => (
                        <Fragment key={i}>
                          {(mode === 'all' || mode === 'marks') && (
                            <>
                              <td className="border border-black p-1">{res.par || ""}</td>
                              <td className="border border-black p-1">{res.pw || ""}</td>
                              <td className="border border-black p-1">{res.term || ""}</td>
                              <td className="border border-black p-1">{res.total || ""}</td>
                            </>
                          )}
                          {(mode === 'all' || mode === 'grades') && (
                            <>
                              <td className="border border-black p-1 font-bold">{res.total ? res.gp.toFixed(1) : ""}</td>
                              <td className="border border-black p-1 font-bold">{res.total ? res.grade : ""}</td>
                              {mode === 'all' && (
                                <td className="border border-black p-1 font-bold">{res.total ? res.wgp : ""}</td>
                              )}
                            </>
                          )}
                        </Fragment>
                      ))}

                      {(mode === 'all' || mode === 'grades') && (
                        <td className="border border-black p-1 font-bold">{totalWGP > 0 ? finalGPA.toFixed(2) : ""}</td>
                      )}
                      {(mode === 'all' || mode === 'marks') && (
                        <td className="border border-black p-1 font-bold">{grandTotal || ""}</td>
                      )}
                      <td className="border border-black p-1 font-bold">{totalWGP > 0 ? (studentAttendance[student.id] || "") : ""}</td>
                      <td className="border border-black p-1 font-bold">{totalWGP > 0 ? Math.floor(Math.random() * 20) + 1 : ""}</td>
                      <td className="border border-black p-1">{totalWGP > 0 ? remarks : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            )
          ) : (
            <div className="p-12 text-center text-slate-500">
              <p>Ledger format for {selectedClass} is currently using the generic view.</p>
              <p className="text-sm mt-2">Only Nursery, KG, and Classes 1-5 have specialized dynamic ledger views implemented in this version.</p>
            </div>
          )}
        </div>
      ) : selectedClass ? (
        <div className="text-center py-12 text-slate-500">No students found.</div>
      ) : null}
    </div>
  );
}
