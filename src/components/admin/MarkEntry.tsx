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

export default function MarkEntry() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>(EXAM_TERMS[0]);

  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, Record<string, { written: string; oral: string; cu?: string; total?: string }>>>({});
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

      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);

      // In a real application, you would also fetch existing marks for this term and class to populate state.
      // For now we just reset the local state.
      setMarks({});

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

  const handleMarkChange = (studentId: string, subjectId: string, field: 'written' | 'oral' | 'cu' | 'total', value: string) => {
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
    // Here you would normally push the marks dictionary to Supabase.
    alert("Marks would be saved to database!");
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
          <div className="flex flex-col lg:flex-row items-center justify-between mb-6 gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                Class {selectedClass} - Mark Entry
              </h3>
              <p className="text-sm text-slate-500 mt-1">Enter marks for students in this class.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-slate-50 text-slate-900 font-medium"
              >
                {EXAM_TERMS.map(term => <option key={term} value={term}>{term}</option>)}
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
            <div className="overflow-x-auto border border-black max-w-full">
              <table className="w-full text-center border-collapse text-sm text-black">
                <thead>
                  <tr>
                    <th rowSpan={2} className="border border-black px-2 py-2 w-24">Symbol No.</th>
                    <th rowSpan={2} className="border border-black px-4 py-2 min-w-[150px]">Student Name</th>
                    <th colSpan={["1", "2", "3", "4", "5"].includes(selectedClass || "") ? subjects.length * 2 : subjects.reduce((acc, sub) => acc + ((sub.has_written ? 1 : 0) + (sub.has_oral ? 1 : 0)), 0)} className="border border-black px-4 py-1">Subject</th>
                    <th rowSpan={2} className="border border-black px-4 py-2 w-20">Total</th>
                  </tr>
                  <tr>
                    {subjects.map(sub => {
                      const columns = [];
                      const isClass1to5 = ["1", "2", "3", "4", "5"].includes(selectedClass || "");
                      if (isClass1to5) {
                        columns.push(<th key={`${sub.id}-cu`} className="border border-black px-2 py-1 min-w-[60px] text-xs font-normal">मुल्यांकन गरिएका सि.उ.</th>);
                        columns.push(<th key={`${sub.id}-total`} className="border border-black px-2 py-1 min-w-[60px] text-xs font-normal">जम्मा अंक</th>);
                      } else {
                        if (sub.has_written) columns.push(<th key={`${sub.id}-w`} className="border border-black px-2 py-1 min-w-[60px] text-xs font-normal">Written</th>);
                        if (sub.has_oral) columns.push(<th key={`${sub.id}-o`} className="border border-black px-2 py-1 min-w-[60px] text-xs font-normal">Oral</th>);
                      }
                      return (
                        <th key={sub.id} colSpan={columns.length} className="border border-black p-0">
                          <div className="border-b border-black py-1 font-bold">{sub.subject_name}</div>
                          <div className="flex">
                            {columns.map((col, idx) => (
                              <div key={idx} className={`flex-1 ${idx > 0 ? 'border-l border-black' : ''}`}>{col.props.children}</div>
                            ))}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="border border-black px-2 py-1">{student.displayRollNo}</td>
                      <td className="border border-black px-2 py-1 text-left font-medium whitespace-nowrap">{student.name}</td>
                      
                      {subjects.map(sub => {
                        const isClass1to5 = ["1", "2", "3", "4", "5"].includes(selectedClass || "");
                        return (
                          <td key={sub.id} colSpan={isClass1to5 ? 2 : ((sub.has_written ? 1 : 0) + (sub.has_oral ? 1 : 0))} className="border border-black p-0">
                            <div className="flex h-full">
                              {isClass1to5 ? (
                                <>
                                  <div className="flex-1 border-r border-black last:border-r-0">
                                    <input 
                                      type="number"
                                      min="0"
                                      value={marks[student.id]?.[sub.id]?.cu || ""}
                                      onChange={(e) => handleCuChange(sub.id, e.target.value)}
                                      className="w-full h-full p-1 text-center bg-transparent focus:bg-blue-50 focus:outline-none"
                                    />
                                  </div>
                                  <div className="flex-1 last:border-r-0">
                                    <input 
                                      type="number"
                                      min="0"
                                      value={marks[student.id]?.[sub.id]?.total || ""}
                                      onChange={(e) => handleMarkChange(student.id, sub.id, 'total', e.target.value)}
                                      className="w-full h-full p-1 text-center bg-transparent focus:bg-blue-50 focus:outline-none"
                                    />
                                  </div>
                                </>
                              ) : (
                                <>
                                  {sub.has_written && (
                                    <div className="flex-1 border-r border-black last:border-r-0">
                                      <input 
                                        type="number"
                                        min="0"
                                        value={marks[student.id]?.[sub.id]?.written || ""}
                                        onChange={(e) => handleMarkChange(student.id, sub.id, 'written', e.target.value)}
                                        className="w-full h-full p-1 text-center bg-transparent focus:bg-blue-50 focus:outline-none"
                                      />
                                    </div>
                                  )}
                                  {sub.has_oral && (
                                    <div className="flex-1 last:border-r-0">
                                      <input 
                                        type="number"
                                        min="0"
                                        value={marks[student.id]?.[sub.id]?.oral || ""}
                                        onChange={(e) => handleMarkChange(student.id, sub.id, 'oral', e.target.value)}
                                        className="w-full h-full p-1 text-center bg-transparent focus:bg-blue-50 focus:outline-none"
                                      />
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      
                      <td className="border border-black px-2 py-1 font-bold bg-slate-50">
                        {calculateTotal(student.id)}
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={(["1", "2", "3", "4", "5"].includes(selectedClass || "") ? subjects.length * 2 : subjects.reduce((acc, sub) => acc + ((sub.has_written ? 1 : 0) + (sub.has_oral ? 1 : 0)), 0)) + 3} className="border border-black px-4 py-8 text-center text-slate-500">
                        No students found in this class.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
