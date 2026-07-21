"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Folder, ChevronRight, GraduationCap, Save, RefreshCw } from "lucide-react";

const CATEGORIES = [
  { id: "nursery", name: "Nursery", classes: ["Nursery"], color: "bg-pink-100 text-pink-600 border-pink-200" },
  { id: "kg", name: "KG", classes: ["KG"], color: "bg-purple-100 text-purple-600 border-purple-200" },
  { id: "1-3", name: "Class 1 to 3", classes: ["1", "2", "3"], color: "bg-blue-100 text-blue-600 border-blue-200" },
  { id: "4-5", name: "Class 4 & 5", classes: ["4", "5"], color: "bg-emerald-100 text-emerald-600 border-emerald-200" },
  { id: "6-8", name: "Class 6 to 8", classes: ["6", "7", "8"], color: "bg-amber-100 text-amber-600 border-amber-200" }
];

const EXAM_TERMS = ["First Term", "Second Term", "Final"];
const ACADEMIC_YEARS = Array.from({ length: 9 }, (_, i) => (2083 + i).toString());

export default function MarkEntry() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>(EXAM_TERMS[0]);
  const [selectedYear, setSelectedYear] = useState<string>(ACADEMIC_YEARS[0]);

  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, Record<string, { written?: string; oral?: string; cu?: string; total?: string; attendance?: string; activity?: string; project16?: string; project20?: string; termExam?: string; firstTerm?: string; secondTerm?: string; writtenFinal?: string; }>>>({});
  const [loading, setLoading] = useState(false);

  // Helper to generate display roll number
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
      // Fetch students for the class, ordered alphabetically
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

      // Fetch subjects for the class
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .eq("class", selectedClass)
        .order("subject_name");

      let subjectsList = subjectsData || [];
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
        subjectsList = subjectsList.sort((a, b) => {
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
        subjectsList = subjectsList.sort((a, b) => {
          return getSubjectRank(a.subject_name) - getSubjectRank(b.subject_name);
        });
      }
      setSubjects(subjectsList);
      if (subjectsList.length > 0) {
        setSelectedSubject(subjectsList[0].id);
      } else {
        setSelectedSubject(null);
      }

      // Fetch existing marks from Supabase for this class, term, and year
      const studentIds = (studentsData || []).map((s: any) => s.id);
      if (studentIds.length > 0) {
        const { data: marksData, error: marksError } = await supabase
          .from("marks")
          .select("*")
          .in("student_id", studentIds)
          .eq("term", selectedTerm)
          .eq("academic_year", selectedYear);

        if (marksError) throw marksError;

        const marksMap: Record<string, Record<string, any>> = {};
        (marksData || []).forEach((m: any) => {
          if (!marksMap[m.student_id]) marksMap[m.student_id] = {};
          marksMap[m.student_id][m.subject_id] = {
            written: m.written?.toString() ?? "",
            oral: m.oral?.toString() ?? "",
            cu: m.cu?.toString() ?? "",
            total: m.total?.toString() ?? "",
            attendance: m.attendance?.toString() ?? "",
            activity: m.activity?.toString() ?? "",
            project16: m.project16?.toString() ?? "",
            project20: m.project20?.toString() ?? "",
            termExam: m.term_exam?.toString() ?? "",
            firstTerm: m.first_term?.toString() ?? "",
            secondTerm: m.second_term?.toString() ?? "",
            writtenFinal: m.written_final?.toString() ?? "",
          };
        });
        setMarks(marksMap);
      } else {
        setMarks({});
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

  const handleMarkChange = (studentId: string, subjectId: string, field: string, value: string) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subjectId]: {
          ...(prev[studentId]?.[subjectId] || { written: "", oral: "", cu: "", total: "" }),
          [field]: value
        }
      }
    }));
  };

  const handleCuChange = (subjectId: string, value: string) => {
    setMarks(prev => {
      const newMarks = { ...prev };
      students.forEach(student => {
        if (!newMarks[student.id]) {
          newMarks[student.id] = {};
        }
        newMarks[student.id] = {
          ...newMarks[student.id],
          [subjectId]: {
            ...(newMarks[student.id][subjectId] || { written: "", oral: "", cu: "", total: "" }),
            cu: value
          }
        };
      });
      return newMarks;
    });
  };

  const calculateTotal = (studentId: string) => {
    const studentMarks = marks[studentId];
    if (!studentMarks) return 0;

    let total = 0;
    const isClass1to5 = ["1", "2", "3", "4", "5"].includes(selectedClass || "");
    Object.values(studentMarks).forEach((m: any) => {
      if (isClass1to5) {
        total += parseFloat(m.total || "0");
      } else {
        total += parseFloat(m.written || "0") + parseFloat(m.oral || "0");
      }
    });
    return total;
  };

  const handleSaveMarks = async () => {
    try {
      const upsertRows: any[] = [];
      const parseVal = (v: any) => (v !== undefined && v !== null && v !== "" ? parseFloat(v) : null);

      students.forEach(student => {
        subjects.forEach(sub => {
          const m = marks[student.id]?.[sub.id] || {};

          const hasAnyValue = [
            m.written, m.oral, m.cu, m.total,
            m.attendance, m.activity, m.project16, m.project20,
            m.termExam, m.firstTerm, m.secondTerm, m.writtenFinal,
          ].some(v => v !== undefined && v !== null && v !== "");

          if (!hasAnyValue) return;

          upsertRows.push({
            student_id: student.id,
            subject_id: sub.id,
            term: selectedTerm,
            academic_year: selectedYear,
            written: parseVal(m.written),
            oral: parseVal(m.oral),
            cu: parseVal(m.cu),
            total: parseVal(m.total),
            attendance: parseVal(m.attendance),
            activity: parseVal(m.activity),
            project16: parseVal(m.project16),
            project20: parseVal(m.project20),
            term_exam: parseVal(m.termExam),
            first_term: parseVal(m.firstTerm),
            second_term: parseVal(m.secondTerm),
            written_final: parseVal(m.writtenFinal),
          });
        });
      });

      if (upsertRows.length === 0) {
        alert("No marks to save. Please enter some marks first.");
        return;
      }

      console.log("Saving rows to Supabase:", upsertRows);

      const { data, error } = await supabase
        .from("marks")
        .upsert(upsertRows, { onConflict: "student_id,subject_id,term,academic_year" })
        .select();

      if (error) {
        console.error("Supabase upsert error:", error);
        throw error;
      }

      console.log("Saved successfully:", data);
      alert(`Marks saved successfully! (${upsertRows.length} records saved)`);
    } catch (err: any) {
      console.error("Save marks error:", err);
      alert("Failed to save marks: " + (err.message || JSON.stringify(err)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <GraduationCap className="w-6 h-6 mr-2 text-brand-600" />
            Mark Entry
          </h2>
          <p className="text-sm text-slate-500 mt-1">Select a category and class to enter marks.</p>
        </div>
      </div>

      {!selectedCategory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => (
            <div 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md transition-shadow group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-xl border ${cat.color}`}>
                  <Folder className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{cat.name}</h3>
                  <p className="text-sm text-slate-500">{cat.classes.length} {cat.classes.length === 1 ? 'Class' : 'Classes'}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-600 transition-colors" />
            </div>
          ))}
        </div>
      ) : !selectedClass ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {CATEGORIES.find(c => c.id === selectedCategory)?.name} - Select Class
              </h3>
            </div>
            <button 
              onClick={() => setSelectedCategory(null)}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              &larr; Back to Categories
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {CATEGORIES.find(c => c.id === selectedCategory)?.classes.map((cls) => (
              <div 
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className="p-4 border border-slate-200 rounded-lg text-center cursor-pointer hover:bg-brand-50 hover:border-brand-200 transition-colors"
              >
                <div className="text-xl font-bold text-slate-700 mb-1">{cls.match(/^\d+$/) ? `Class ${cls}` : cls}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4 border-b border-slate-100 pb-4">
            <div className="w-full lg:w-auto flex flex-col items-start">
              <button 
                onClick={() => setSelectedClass(null)}
                className="text-sm font-medium text-brand-600 hover:text-brand-700 mb-2 flex items-center"
              >
                &larr; Back to Classes
              </button>
              <h3 className="text-xl font-bold text-slate-800">
                Class {selectedClass} - Mark Entry
              </h3>
              <p className="text-sm text-slate-500 mt-1">Enter marks for students in this class.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={selectedSubject || ""}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-slate-50 text-slate-900 font-medium"
              >
                <option value="" disabled>Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
              </select>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-slate-50 text-slate-900 font-medium"
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

              <button 
                onClick={() => {
                  setSelectedClass(null);
                  setMarks({});
                }}
                className="text-sm font-medium text-brand-600 hover:text-brand-700 px-3 py-2"
              >
                Change Class
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
            </div>
          ) : (
            (() => {
              const activeSubject = subjects.find(s => s.id === selectedSubject);
              if (!activeSubject) return <div className="text-center py-8">Please select a subject.</div>;
              
              const isFinal = selectedTerm === "Final";
              
              return (
                <div className="overflow-x-auto border border-black max-w-full">
                  <div className="font-bold text-center border-b border-black py-2 bg-slate-50">विषय : {activeSubject.subject_name}</div>
                  <table className="w-full text-center border-collapse text-sm text-black">
                    <thead>
                      <tr>
                        <th rowSpan={2} className="border border-black px-2 py-2 w-16">क्र.सं.</th>
                        <th rowSpan={2} className="border border-black px-4 py-2 min-w-[200px]">विद्यार्थीको नाम</th>
                        <th colSpan={3} className="border border-black px-2 py-1">सहभागिता</th>
                        <th colSpan={3} className="border border-black px-2 py-1">परियोजना / प्रयोगात्मक</th>
                        {isFinal ? (
                          <>
                            <th colSpan={2} className="border border-black px-2 py-1">त्रैमासिक परीक्षा</th>
                            <th rowSpan={2} className="border border-black px-2 py-1 w-16">जम्मा ५०</th>
                            <th rowSpan={2} className="border border-black px-2 py-1 w-16">लिखित ५०</th>
                          </>
                        ) : (
                          <>
                            <th rowSpan={2} className="border border-black px-2 py-1 w-24">त्रैमासिक परीक्षा (१०)</th>
                            <th rowSpan={2} className="border border-black px-2 py-1 w-16">जम्मा ५०</th>
                          </>
                        )}
                      </tr>
                      <tr>
                        <th className="border border-black px-2 py-1 font-normal text-xs w-16">हाजिरी (२)</th>
                        <th className="border border-black px-2 py-1 font-normal text-xs w-16">सक्रियता (२)</th>
                        <th className="border border-black px-2 py-1 font-normal text-xs w-16">जम्मा (४)</th>
                        <th className="border border-black px-2 py-1 font-normal text-xs w-16">१६</th>
                        <th className="border border-black px-2 py-1 font-normal text-xs w-16">२०</th>
                        <th className="border border-black px-2 py-1 font-normal text-xs w-16">जम्मा (३६)</th>
                        {isFinal && (
                          <>
                            <th className="border border-black px-2 py-1 font-normal text-xs w-16">प्र. त्रै (५)</th>
                            <th className="border border-black px-2 py-1 font-normal text-xs w-16">द्वि. त्रै. (५)</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, idx) => {
                        const m = marks[student.id]?.[activeSubject.id] || {};
                        const pTotalNum = (parseFloat(m.attendance || "0") + parseFloat(m.activity || "0"));
                        const projTotalNum = (parseFloat(m.project16 || "0") + parseFloat(m.project20 || "0"));
                        const pTotal = pTotalNum || "";
                        const projTotal = projTotalNum || "";
                        const subTotal50 = isFinal 
                          ? ((pTotalNum + projTotalNum + parseFloat(m.firstTerm || "0") + parseFloat(m.secondTerm || "0")) || "")
                          : ((pTotalNum + projTotalNum + parseFloat(m.termExam || "0")) || "");
                          
                        return (
                          <tr key={student.id} className="hover:bg-slate-50">
                            <td className="border border-black px-2 py-1">{idx + 1}</td>
                            <td className="border border-black px-2 py-1 text-left font-medium">{student.name}</td>
                            
                            <td className="border border-black p-0">
                              <input type="number" min="0" max="2" value={m.attendance || ""} onChange={e => handleMarkChange(student.id, activeSubject.id, 'attendance', e.target.value)} className="w-full h-full p-1 text-center bg-transparent focus:bg-blue-50 focus:outline-none" />
                            </td>
                            <td className="border border-black p-0">
                              <input type="number" min="0" max="2" value={m.activity || ""} onChange={e => handleMarkChange(student.id, activeSubject.id, 'activity', e.target.value)} className="w-full h-full p-1 text-center bg-transparent focus:bg-blue-50 focus:outline-none" />
                            </td>
                            <td className="border border-black p-1 bg-slate-50 font-medium">{pTotal}</td>
                            
                            <td className="border border-black p-0">
                              <input type="number" min="0" max="16" value={m.project16 || ""} onChange={e => handleMarkChange(student.id, activeSubject.id, 'project16', e.target.value)} className="w-full h-full p-1 text-center bg-transparent focus:bg-blue-50 focus:outline-none" />
                            </td>
                            <td className="border border-black p-0">
                              <input type="number" min="0" max="20" value={m.project20 || ""} onChange={e => handleMarkChange(student.id, activeSubject.id, 'project20', e.target.value)} className="w-full h-full p-1 text-center bg-transparent focus:bg-blue-50 focus:outline-none" />
                            </td>
                            <td className="border border-black p-1 bg-slate-50 font-medium">{projTotal}</td>
                            
                            {isFinal ? (
                              <>
                                <td className="border border-black p-0">
                                  <input type="number" min="0" max="5" value={m.firstTerm || ""} onChange={e => handleMarkChange(student.id, activeSubject.id, 'firstTerm', e.target.value)} className="w-full h-full p-1 text-center bg-transparent focus:bg-blue-50 focus:outline-none" />
                                </td>
                                <td className="border border-black p-0">
                                  <input type="number" min="0" max="5" value={m.secondTerm || ""} onChange={e => handleMarkChange(student.id, activeSubject.id, 'secondTerm', e.target.value)} className="w-full h-full p-1 text-center bg-transparent focus:bg-blue-50 focus:outline-none" />
                                </td>
                                <td className="border border-black p-1 bg-slate-50 font-bold">{subTotal50}</td>
                                <td className="border border-black p-0">
                                  <input type="number" min="0" max="50" value={m.writtenFinal || ""} onChange={e => handleMarkChange(student.id, activeSubject.id, 'writtenFinal', e.target.value)} className="w-full h-full p-1 text-center bg-transparent focus:bg-blue-50 focus:outline-none font-bold text-brand-700" />
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="border border-black p-0">
                                  <input type="number" min="0" max="10" value={m.termExam || ""} onChange={e => handleMarkChange(student.id, activeSubject.id, 'termExam', e.target.value)} className="w-full h-full p-1 text-center bg-transparent focus:bg-blue-50 focus:outline-none" />
                                </td>
                                <td className="border border-black p-1 bg-slate-50 font-bold text-brand-700">{subTotal50}</td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                      {students.length === 0 && (
                        <tr>
                          <td colSpan={12} className="border border-black px-4 py-8 text-center text-slate-500">No students found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })()
          )}


          {students.length > 0 && subjects.length > 0 && (
            <div className="mt-6 flex justify-end">
              <button 
                onClick={handleSaveMarks}
                className="flex items-center px-6 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Marks
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
