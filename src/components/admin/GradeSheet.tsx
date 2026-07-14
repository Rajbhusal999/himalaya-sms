"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { getGradeAndGP, getRemarks } from "@/lib/grading";
import { Printer, FileText } from "lucide-react";
import Image from "next/image";

const CATEGORIES = [
  { id: "nursery", name: "Nursery", classes: ["Nursery"] },
  { id: "kg", name: "KG", classes: ["KG"] },
  { id: "1-3", name: "Class 1 to 3", classes: ["1", "2", "3"] },
  { id: "4-5", name: "Class 4 & 5", classes: ["4", "5"] },
  { id: "6-8", name: "Class 6 to 8", classes: ["6", "7", "8"] }
];

const EXAM_TERMS = ["First Term", "Second Term", "Final"];
const ACADEMIC_YEARS = Array.from({ length: 9 }, (_, i) => (2082 + i).toString());

export default function GradeSheet() {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>(EXAM_TERMS[0]);
  const [selectedYear, setSelectedYear] = useState<string>(ACADEMIC_YEARS[0]);
  const [specificRollNo, setSpecificRollNo] = useState<string>("");
  
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [marks, setMarks] = useState<any>({});
  const [studentAttendance, setStudentAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const getDisplayRollNo = (cls: string, index: number) => {
    const classPrefixMap: Record<string, string> = {
      "1": "ON", "2": "TW", "3": "TH", "4": "FO", "5": "FI",
      "6": "SI", "7": "SE", "8": "EI", "Nursery": "NU", "KG": "KG", "ECD": "EC"
    };
    const classPrefix = classPrefixMap[cls] || cls.substring(0, 2).toUpperCase();
    return `H${classPrefix}${(index + 1).toString().padStart(3, '0')}`;
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
      if (["1", "2", "3", "4", "5", "6", "7", "8"].includes(selectedClass)) {
        const getSubjectRank = (name: string) => {
          const lower = name.toLowerCase();
          if (lower === "nepali" || lower.includes("nepali")) return 1;
          if (lower === "english" || (lower.includes("english") && !lower.includes("opt"))) return 2;
          if (lower.includes("math")) return 3;
          if ((lower.includes("science") || lower.includes("sci")) && !lower.includes("computer")) return 4;
          if (lower.includes("social") || lower.includes("soc")) return 5;
          if (lower.includes("hpc") || lower.includes("health")) return 6;
          if (lower.includes("hamro")) return 4;
          if (lower.includes("local") || lower.includes("bharatpur") || lower.includes("pride")) return 7;
          if ((lower.includes("opt") && lower.includes("computer")) || lower.includes("computer")) return 8;
          if (lower.includes("opt") && lower.includes("english")) return 6;
          return 999;
        };
        fetchedSubjects = fetchedSubjects.sort((a, b) => {
          return getSubjectRank(a.subject_name) - getSubjectRank(b.subject_name);
        });
      }

      setSubjects(fetchedSubjects);

      const key = `marks_${selectedClass}_${selectedTerm}_${selectedYear}`;
      const savedMarks = JSON.parse(localStorage.getItem(key) || "{}");
      setMarks(savedMarks);

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

  const getFormattedTerm = () => {
    const isNurseryTo5 = ["Nursery", "KG", "ECD", "1", "2", "3", "4", "5"].includes(selectedClass || "");
    let baseTerm = selectedTerm;
    
    if (isNurseryTo5) {
      if (baseTerm === 'First Term') baseTerm = 'FIRST';
      else if (baseTerm === 'Second Term') baseTerm = 'SECOND';
      else if (baseTerm === 'Final') baseTerm = 'FINAL';
      return `${baseTerm} PERIODICAL CAS ASSESSMENT - ${selectedYear}`;
    }

    if (baseTerm === 'First Term') baseTerm = 'FIRST TERMINAL';
    else if (baseTerm === 'Second Term') baseTerm = 'SECOND TERMINAL';
    else if (baseTerm === 'Final') baseTerm = 'FINAL';

    return `${baseTerm} EXAMINATION - ${selectedYear}`;
  };

  const processStudentGrades = (student: any) => {
    let totalWGP = 0;
    let totalCreditHours = 0;
    let hasNG = false;
    const isClass6to8 = ["6", "7", "8"].includes(selectedClass || "");
    const isClass1to5 = ["1", "2", "3", "4", "5"].includes(selectedClass || "");

    const subjectResults = subjects.map(sub => {
      const isComputer = sub.subject_name.toLowerCase().includes("computer");
      const m = marks[student.id]?.[sub.id] || {};
      
      let creditHour = 4;
      if (isClass6to8) {
        if (selectedTerm === "Final") {
          creditHour = sub.credit_hour !== null ? sub.credit_hour : (isComputer ? 2 : 5);
        } else {
          creditHour = sub.credit_hour !== null ? sub.credit_hour : (isComputer ? 0 : 4);
        }
      } else if (isClass1to5) {
        creditHour = sub.credit_hour !== null ? sub.credit_hour : 4;
      }

      let subjTotalGP = 0;
      let subjFinalGrade = "NG";

      if (isClass6to8) {
        if (selectedTerm === "Final") {
          const par = (parseFloat(m.attendance || "0") + parseFloat(m.activity || "0"));
          const pw = (parseFloat(m.project16 || "0") + parseFloat(m.project20 || "0"));
          const t1 = parseFloat(m.firstTerm || "0");
          const t2 = parseFloat(m.secondTerm || "0");
          const prTotal = par + pw + t1 + t2; 
          const thTotal = parseFloat(m.written || "0"); 
          const prMax = isComputer ? 25 : 50;
          const thMax = isComputer ? 25 : 50;
          const prPercent = (prTotal / prMax) * 100;
          const thPercent = (thTotal / thMax) * 100;
          const prGradeGP = getGradeAndGP(prPercent);
          const thGradeGP = getGradeAndGP(thPercent);
          
          subjTotalGP = isComputer ? (thGradeGP.gp + prGradeGP.gp) / 2 : ((thGradeGP.gp * (creditHour / 2)) + (prGradeGP.gp * (creditHour / 2))) / creditHour;
          const subjTotalMarks = prTotal + thTotal;
          subjFinalGrade = getGradeAndGP((subjTotalMarks / (isComputer ? 50 : 100)) * 100).grade;

          if (t1 < 2 || t2 < 2 || thGradeGP.grade === "NG" || prGradeGP.grade === "NG") {
            subjTotalGP = 0;
            subjFinalGrade = "NG";
          }
        } else {
          const par = (parseFloat(m.attendance || "0") + parseFloat(m.activity || "0"));
          const pw = (parseFloat(m.project16 || "0") + parseFloat(m.project20 || "0"));
          const term = parseFloat(m.termExam || "0");
          const total = par + pw + term;
          
          const percent = (total / 50) * 100;
          const { grade, gp } = getGradeAndGP(percent);
          subjTotalGP = gp;
          subjFinalGrade = grade;

          if (gp === 0 || grade === "NG") {
            subjTotalGP = 0;
            subjFinalGrade = "NG";
          }
        }
      } else {
        const cu = parseFloat(m.cu || "0"); 
        const om = parseFloat(m.total || "0"); 
        const percent = cu > 0 ? (om / cu) * 100 : 0; 
        const { grade, gp } = getGradeAndGP(percent);
        subjTotalGP = gp;
        subjFinalGrade = grade;
      }

      if (subjTotalGP === 0 || subjFinalGrade === "NG") {
        hasNG = true;
      }

      if (!isComputer) {
        totalWGP += subjTotalGP * creditHour; 
        totalCreditHours += creditHour;
      }

      return { 
        subjectName: sub.subject_name, 
        creditHour: (isClass6to8 && isComputer) ? "" : creditHour.toString(), 
        gp: subjTotalGP, 
        grade: subjFinalGrade,
        remarks: getRemarks(subjFinalGrade)
      };
    });

    let finalGPA = totalCreditHours > 0 ? totalWGP / totalCreditHours : 0;
    if (hasNG) finalGPA = 0;

    let finalGrade = "NG";
    if (finalGPA >= 3.6) finalGrade = "A+";
    else if (finalGPA >= 3.2) finalGrade = "A";
    else if (finalGPA >= 2.8) finalGrade = "B+";
    else if (finalGPA >= 2.4) finalGrade = "B";
    else if (finalGPA >= 2.0) finalGrade = "C+";
    else if (finalGPA >= 1.6) finalGrade = "C";
    else if (finalGPA > 0) finalGrade = "D";
    
    if (hasNG || finalGPA === 0) {
      finalGrade = "NG";
    }
    const finalRemarks = getRemarks(finalGrade);

    return { subjectResults, finalGPA, hasNG, finalRemarks };
  };

  // Compute ranks
  const computedStudents = students.map((student, idx) => {
    return { student, idx, ...processStudentGrades(student) };
  });

  const sortedGPAs = [...new Set(computedStudents.filter(s => !s.hasNG && s.finalGPA > 0).map(s => s.finalGPA))].sort((a, b) => b - a);
  
  const finalStudents = computedStudents.map(s => {
    const rank = (!s.hasNG && s.finalGPA > 0) ? sortedGPAs.indexOf(s.finalGPA) + 1 : "-";
    return { ...s, rank };
  });

  const studentsToRender = specificRollNo 
    ? finalStudents.filter(s => s.student.displayRollNo === specificRollNo || s.student.roll_no === specificRollNo)
    : finalStudents;

  // Group into pairs for printing
  const pairedStudents = [];
  for (let i = 0; i < studentsToRender.length; i += 2) {
    pairedStudents.push(studentsToRender.slice(i, i + 2));
  }

  const renderGradeSheet = (studentData: any) => {
    const { student, subjectResults, finalGPA, rank, finalRemarks } = studentData;
    
    return (
      <div className="w-1/2 p-2 border-r border-black last:border-r-0 relative">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden opacity-20">
          <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold whitespace-nowrap text-slate-400" style={{ transform: 'rotate(-45deg)' }}>
            SHREE HIMALAYA BASIC SCHOOL (1-8)
          </div>
        </div>
        
        {/* Header */}
        <div className="flex border-b border-black text-black mb-1">
          <div className="w-24 border-r border-black flex items-center justify-center bg-white overflow-hidden p-1">
            <img src="/saraswati.png" alt="Saraswati" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-1 overflow-hidden">
            <h1 className="text-lg sm:text-xl font-bold uppercase tracking-tight leading-tight whitespace-nowrap">SHREE HIMALAYA BASIC SCHOOL (1-8)</h1>
            <h2 className="text-sm font-bold mt-1">BHARATPUR-11, JAGRITICHOWK</h2>
          </div>
          <div className="w-24 border-l border-black flex items-center justify-center bg-white overflow-hidden p-1">
            <img src="/logo.png" alt="School Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        
        {/* Exam Title */}
        <div className="bg-[#b3d4f5] border-y border-black text-center py-1 font-bold uppercase text-black text-sm print:bg-[#b3d4f5]">
          {getFormattedTerm()}
        </div>
        <div className="bg-[#ffe4d6] border-b border-black text-center py-1 font-bold underline uppercase text-black text-sm print:bg-[#ffe4d6]">
          GRADESHEET
        </div>

        {/* Student Details */}
        <table className="w-full text-black text-sm border-collapse border border-black mt-2 mb-2 font-medium">
          <tbody>
            <tr>
              <td className="border border-black p-1 w-24">Roll No.</td>
              <td className="border border-black p-1 font-bold">{student.displayRollNo || student.roll_no}</td>
              <td className="border border-black p-1 w-20">Class :</td>
              <td className="border border-black p-1 font-bold w-16 text-center">{selectedClass}</td>
            </tr>
            <tr>
              <td className="border border-black p-1">Students Name :</td>
              <td className="border border-black p-1 font-bold text-center" colSpan={3}>{student.name}</td>
            </tr>
          </tbody>
        </table>

        {/* Grades Table */}
        <div className="relative">
          <table className="w-full text-center border-collapse text-xs text-black border border-black z-10 relative bg-white">
            <thead className="font-bold">
              <tr>
                <th className="border border-black p-1 w-8">S.N.</th>
                <th className="border border-black p-1">SUBJECTS</th>
                <th className="border border-black p-1 w-14 leading-tight">CREDIT<br/>HOUR</th>
                <th className="border border-black p-1 w-14 leading-tight">GRADE<br/>POINT</th>
                <th className="border border-black p-1 w-12">GRADE</th>
                <th className="border border-black p-1 w-16">REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {subjectResults.map((res: any, idx: number) => (
                <tr key={idx}>
                  <td className="border border-black p-1">{idx + 1}</td>
                  <td className="border border-black p-1 uppercase">{res.subjectName}</td>
                  <td className="border border-black p-1">{res.creditHour}</td>
                  <td className="border border-black p-1">{res.gp.toFixed(1)}</td>
                  <td className="border border-black p-1">{res.grade}</td>
                  {idx === 0 && (
                    <td className="border border-black p-1 relative" rowSpan={subjectResults.length}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`font-bold text-lg tracking-widest text-slate-700 ${studentData.hasNG ? 'text-slate-700' : 'text-slate-700'}`} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                          {finalRemarks}
                        </span>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Watermark Logo Container (Positioned absolutely behind the table if we want a real watermark, but the image shows NOT GRADED in remarks) */}
        </div>

        {/* Footer Stats */}
        <table className="w-full text-center border-collapse text-sm text-black border border-black font-bold">
          <tbody>
            <tr>
              <td className="border border-black p-1 text-left w-12">GPA :</td>
              <td className="border border-black p-1 w-16">{finalGPA.toFixed(1)}</td>
              <td className="border border-black p-1 text-left w-14">Rank :</td>
              <td className="border border-black p-1">{rank}</td>
              <td className="border border-black p-1 text-left w-24">Attendance :</td>
              <td className="border border-black p-1">{studentAttendance[student.id] || "0"}</td>
            </tr>
          </tbody>
        </table>

        {/* Signatures */}
        <div className="flex justify-between items-end mt-12 px-4 text-xs font-medium text-black">
          <div className="text-center w-28 border-t border-black pt-1">Class Teacher</div>
          <div className="text-center w-32 border-t border-black pt-1">Exam Coordinator</div>
          <div className="text-center w-28 border-t border-black pt-1">Head Teacher</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: white !important;
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
          .page-break {
            page-break-after: always;
            clear: both;
          }
          .page-break:last-child {
            page-break-after: auto;
          }
          @page { size: A4 landscape; margin: 0.25in; }
        }
      `}} />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 print:hidden">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-brand-600" />
              Grade Sheets
            </h2>
            <p className="text-sm text-slate-500 mt-1">Generate and print grade sheets for a class or specific student.</p>
          </div>
          {studentsToRender.length > 0 && (
            <div className="flex gap-4">
              <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Printer className="w-4 h-4 mr-2" /> Print Grade Sheets
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Class</label>
            <select
              value={selectedClass || ""}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 bg-white text-slate-900 min-w-[120px]"
            >
              <option value="" disabled>Select Class</option>
              {CATEGORIES.flatMap(c => c.classes).map(cls => (
                <option key={cls} value={cls}>{cls.match(/^\d+$/) ? `Class ${cls}` : cls}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 bg-white text-slate-900"
            >
              {EXAM_TERMS.map(term => <option key={term} value={term}>{term.toUpperCase()}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 bg-white text-slate-900"
            >
              {ACADEMIC_YEARS.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Roll No (Optional)</label>
            <input 
              type="text" 
              placeholder="All students"
              value={specificRollNo}
              onChange={(e) => setSpecificRollNo(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 bg-white text-slate-900 w-32"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>
      ) : studentsToRender.length > 0 ? (
        <div className="print-area bg-[#ffe4d6] p-4 rounded-xl print:p-0 print:bg-white print:border-none border border-slate-200" ref={printRef}>
          {pairedStudents.map((pair, pageIdx) => (
            <div key={pageIdx} className="page-break flex w-full bg-white mb-8 print:mb-0 print:h-screen shadow-md print:shadow-none border border-black print:border-none print:w-full">
              {pair.map((studentData) => renderGradeSheet(studentData))}
              {/* Fill with empty space if only 1 student on the last page */}
              {pair.length === 1 && (
                <div className="w-1/2 p-2 relative"></div>
              )}
            </div>
          ))}
        </div>
      ) : selectedClass && !loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
          No students found matching the criteria.
        </div>
      ) : null}
    </div>
  );
}
