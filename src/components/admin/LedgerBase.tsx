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

export default function LedgerBase({ mode, title }: LedgerBaseProps) {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>(EXAM_TERMS[0]);
  
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [marks, setMarks] = useState<any>({});
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
      setSubjects(subjectsData || []);

      // Mock Marks Data for Nursery/KG based on standard pattern
      // In a real app, this comes from Supabase marks table.
      const mockMarks: any = {};
      formattedStudents.forEach(student => {
        mockMarks[student.id] = {};
        (subjectsData || []).forEach(sub => {
          // Generate random high marks for demo
          const rw = Math.floor(Math.random() * 20) + 30; // 30-50
          const ls = Math.floor(Math.random() * 20) + 30; // 30-50
          mockMarks[student.id][sub.id] = { written: rw.toString(), oral: ls.toString() };
        });
      });
      setMarks(mockMarks);

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
  }, [selectedClass, selectedTerm]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!printRef.current) return;
    const wb = XLSX.utils.table_to_book(printRef.current.querySelector('table'));
    XLSX.writeFile(wb, `${title}_Class_${selectedClass}_${selectedTerm}.xlsx`);
  };

  const isNurseryKG = ["Nursery", "KG"].includes(selectedClass || "");
  const pageClass = mode === 'all' ? 'print-a3' : 'print-a4';

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .print-a3 { @page { size: A3 landscape; margin: 0.5cm; } }
          .print-a4 { @page { size: A4 landscape; margin: 0.5cm; } }
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
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>
      ) : students.length > 0 ? (
        <div className={`print-area ${pageClass} bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto`} ref={printRef}>
          {/* Header for Print */}
          <div className="p-4 text-center border-b border-black text-black">
            <h1 className="text-2xl font-bold uppercase">Shree Himalaya Basic School (1-8)</h1>
            <h2 className="text-lg font-medium">Bharatpur-11, Chitwan</h2>
            <h3 className="text-md font-medium">ESTD: 2040 B.S</h3>
            <div className="flex justify-between items-end mt-4 px-4 font-bold text-lg">
              <div>Class : {selectedClass}</div>
              <div className="uppercase">{selectedTerm} 2082</div>
              <div>{title}</div>
            </div>
          </div>

          {isNurseryKG ? (
            <table className="w-full text-center border-collapse text-[10px] text-black">
              <thead>
                <tr>
                  <th rowSpan={2} className="border border-black px-1 py-1 w-8 bg-yellow-200">S.N</th>
                  <th rowSpan={2} className="border border-black px-2 py-1 min-w-[120px] bg-yellow-200">Name Of Students</th>
                  
                  {subjects.map((sub, i) => {
                    const bgColors = ["bg-orange-200", "bg-yellow-100", "bg-green-200", "bg-blue-200"];
                    const bgColor = bgColors[i % bgColors.length];
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
                    <th rowSpan={2} className="border border-black p-1 w-12 bg-gray-100">
                      Total<br/>{subjects.length * 100}
                    </th>
                  )}
                  {(mode === 'all' || mode === 'marks') && <th rowSpan={2} className="border border-black p-1 w-12 bg-gray-100">Percentag</th>}
                  {(mode === 'all' || mode === 'grades') && <th rowSpan={2} className="border border-black p-1 w-10 bg-gray-100">GPA</th>}
                  {(mode === 'all' || mode === 'marks') && <th rowSpan={2} className="border border-black p-1 w-10 bg-gray-100">Att</th>}
                  <th rowSpan={2} className="border border-black p-1 w-10 bg-gray-100">Rank</th>
                  <th rowSpan={2} className="border border-black p-1 min-w-[100px] bg-gray-100">Remarks</th>
                </tr>
                <tr>
                  {subjects.map((sub, i) => {
                    const bgColors = ["bg-orange-200", "bg-yellow-100", "bg-green-200", "bg-blue-200"];
                    const bgColor = bgColors[i % bgColors.length];
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
                            <th className={`border border-black p-1 font-bold ${bgColor}`}>Grade</th>
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
                  const subjectResults = subjects.map(sub => {
                    const m = marks[student.id]?.[sub.id] || {};
                    const rw = parseFloat(m.written || "0");
                    const ls = parseFloat(m.oral || "0");
                    const om = rw + ls;
                    totalOM += om;
                    const percent = om; // out of 100
                    const { grade, gp } = getGradeAndGP(percent);
                    return { rw, ls, om, percent, gp, grade };
                  });

                  const grandTotalMax = subjects.length * 100;
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
                        <td className="border border-black p-1">58</td> /* Mock Att */
                      )}
                      <td className="border border-black p-1">{Math.floor(Math.random() * 20) + 1}</td>
                      <td className="border border-black p-1">{remarks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <p>Ledger format for {selectedClass} is currently using the generic view.</p>
              <p className="text-sm mt-2">Only Nursery and KG have the specialized dynamic ledger view implemented in this version.</p>
            </div>
          )}
        </div>
      ) : selectedClass ? (
        <div className="text-center py-12 text-slate-500">No students found.</div>
      ) : null}
    </div>
  );
}
