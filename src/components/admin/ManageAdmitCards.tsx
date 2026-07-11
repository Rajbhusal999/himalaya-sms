"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Printer, CalendarPlus, X, Search, Check, Save } from "lucide-react";

type Student = {
  id: string;
  name: string;
  roll_no: number;
  class: string;
};

type Routine = {
  id?: string;
  class: string;
  exam_term: string;
  subject: string;
  exam_date: string;
  shift: string;
  exam_time: string;
};

const CLASSES = ["Nursery", "KG", "ECD", "1", "2", "3", "4", "5", "6", "7", "8"];
const EXAM_TERMS = ["First terminal exam", "Second terminal Examination", "Final Examination"];

export default function ManageAdmitCards() {
  const [selectedClass, setSelectedClass] = useState<string>("1");
  const [selectedTerm, setSelectedTerm] = useState<string>(EXAM_TERMS[0]);
  const [selectedRollNo, setSelectedRollNo] = useState<string>("All");
  
  const [students, setStudents] = useState<Student[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [routineForm, setRoutineForm] = useState<Routine[]>([{ class: "1", exam_term: EXAM_TERMS[0], subject: "", exam_date: "", shift: "Morning", exam_time: "10:00-12:00" }]);
  const [savingRoutine, setSavingRoutine] = useState(false);

  const fetchStudentsAndRoutine = async () => {
    setLoading(true);
    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, name, roll_no, class")
        .eq("class", selectedClass)
        .order("roll_no");

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch routine
      const { data: routineData, error: routineError } = await supabase
        .from("exam_routines")
        .select("*")
        .eq("class", selectedClass)
        .eq("exam_term", selectedTerm)
        .order("exam_date");

      if (routineError) throw routineError;
      setRoutines(routineData || []);
      
      if (routineData && routineData.length > 0) {
        setRoutineForm(routineData);
      } else {
        setRoutineForm([{ class: selectedClass, exam_term: selectedTerm, subject: "", exam_date: "", shift: "Morning", exam_time: "10:10-12:10" }]);
      }

    } catch (err: any) {
      alert("Error loading data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsAndRoutine();
  }, [selectedClass, selectedTerm]);

  const handleSaveRoutine = async () => {
    setSavingRoutine(true);
    try {
      // First, delete existing routine for this class and term
      await supabase
        .from("exam_routines")
        .delete()
        .eq("class", selectedClass)
        .eq("exam_term", selectedTerm);

      const validRoutines = routineForm.filter(r => r.subject && r.exam_date).map(r => ({
        class: selectedClass,
        exam_term: selectedTerm,
        subject: r.subject,
        exam_date: r.exam_date,
        shift: r.shift,
        exam_time: r.exam_time
      }));

      if (validRoutines.length > 0) {
        const { error } = await supabase.from("exam_routines").insert(validRoutines);
        if (error) throw error;
      }
      
      setIsRoutineModalOpen(false);
      fetchStudentsAndRoutine();
      alert("Routine saved successfully!");
    } catch (err: any) {
      alert("Error saving routine: " + err.message);
    } finally {
      setSavingRoutine(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredStudents = selectedRollNo === "All" 
    ? students 
    : students.filter(s => s.roll_no.toString() === selectedRollNo);

  // Split routine into two halves for the 2-column layout
  const halfLength = Math.ceil(routines.length / 2);
  const leftRoutine = routines.slice(0, halfLength);
  const rightRoutine = routines.slice(halfLength);

  return (
    <div className="space-y-6">
      {/* Control Panel (Hidden on Print) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <Printer className="w-6 h-6 mr-2 text-brand-600" />
              Admit Cards
            </h2>
            <p className="text-sm text-slate-500 mt-1">Set routine and print admit cards.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Class:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-slate-50"
              >
                {CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Term:</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-slate-50"
              >
                {EXAM_TERMS.map(term => <option key={term} value={term}>{term}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Roll No:</label>
              <select
                value={selectedRollNo}
                onChange={(e) => setSelectedRollNo(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-slate-50"
              >
                <option value="All">All Students</option>
                {students.map(s => <option key={s.id} value={s.roll_no}>{s.roll_no}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 border-l border-slate-200 pl-4">
              <button
                onClick={() => setIsRoutineModalOpen(true)}
                className="flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                <CalendarPlus className="w-4 h-4 mr-2" />
                Set Routine
              </button>
              
              <button
                onClick={handlePrint}
                disabled={routines.length === 0 || filteredStudents.length === 0}
                className="flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Cards
              </button>
            </div>
          </div>
        </div>
        
        {routines.length === 0 && !loading && (
          <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200">
            ⚠️ No routine found for this class and term. Please <b>Set Routine</b> before printing admit cards.
          </div>
        )}
      </div>

      {/* Routine Modal */}
      {isRoutineModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                  <h3 className="text-xl leading-6 font-bold text-slate-900 flex items-center">
                    <CalendarPlus className="w-6 h-6 mr-2 text-brand-600" />
                    Set Routine for Class {selectedClass} - {selectedTerm}
                  </h3>
                  <button onClick={() => setIsRoutineModalOpen(false)} className="text-slate-400 hover:text-slate-500 p-2 rounded-full hover:bg-slate-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-3 text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2 px-2">
                    <div className="col-span-3">Date</div>
                    <div className="col-span-3">Subject</div>
                    <div className="col-span-3">Shift</div>
                    <div className="col-span-2">Time</div>
                    <div className="col-span-1 text-center">Act</div>
                  </div>
                  
                  {routineForm.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="YYYY-MM-DD"
                          value={item.exam_date}
                          onChange={(e) => {
                            const newForm = [...routineForm];
                            newForm[index].exam_date = e.target.value;
                            setRoutineForm(newForm);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Subject"
                          value={item.subject}
                          onChange={(e) => {
                            const newForm = [...routineForm];
                            newForm[index].subject = e.target.value;
                            setRoutineForm(newForm);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Morning"
                          value={item.shift}
                          onChange={(e) => {
                            const newForm = [...routineForm];
                            newForm[index].shift = e.target.value;
                            setRoutineForm(newForm);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="10:00-12:00"
                          value={item.exam_time}
                          onChange={(e) => {
                            const newForm = [...routineForm];
                            newForm[index].exam_time = e.target.value;
                            setRoutineForm(newForm);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          onClick={() => {
                            const newForm = [...routineForm];
                            newForm.splice(index, 1);
                            setRoutineForm(newForm);
                          }}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-md"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => {
                      const lastItem = routineForm[routineForm.length - 1] || { shift: "Morning", exam_time: "10:10-12:10" };
                      setRoutineForm([...routineForm, { class: selectedClass, exam_term: selectedTerm, subject: "", exam_date: "", shift: lastItem.shift, exam_time: lastItem.exam_time }]);
                    }}
                    className="mt-2 text-brand-600 font-medium text-sm hover:text-brand-700 flex items-center"
                  >
                    + Add Row
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleSaveRoutine}
                  disabled={savingRoutine}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-brand-600 text-base font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {savingRoutine ? "Saving..." : "Save Routine"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRoutineModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Area */}
      {routines.length > 0 && filteredStudents.length > 0 && (
        <div className="print-area">
          {/* We chunk students by 2 to fit exactly 2 per page */}
          {Array.from({ length: Math.ceil(filteredStudents.length / 2) }).map((_, pageIndex) => (
            <div key={pageIndex} className="page-break-after-always print:h-[297mm] print:w-[210mm] print:box-border print:p-[10mm] flex flex-col justify-between gap-8 bg-slate-100 p-8 my-8 print:bg-white print:my-0 shadow-lg print:shadow-none mx-auto max-w-[210mm]">
              
              {filteredStudents.slice(pageIndex * 2, pageIndex * 2 + 2).map((student, cardIndex) => (
                <div key={student.id} className="admit-card-container border-2 border-black bg-[#ffebe0] p-4 relative h-[130mm] flex flex-col font-serif">
                  
                  {/* Header */}
                  <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-3">
                    {/* Placeholder Logo Left */}
                    <div className="w-24 h-24 border border-black flex items-center justify-center bg-white rounded-full">
                      <span className="text-[10px] text-center font-bold">SHREE<br/>HIMALAYA<br/>SCHOOL</span>
                    </div>
                    
                    <div className="text-center flex-1">
                      <h1 className="text-2xl font-bold tracking-wider mb-1">SHREE HIMALAYA BASIC SCHOOL</h1>
                      <h2 className="text-sm font-semibold mb-1">BHARATPUR-11, JAGRITICHOWK</h2>
                      <h3 className="text-lg font-bold uppercase mb-2">{selectedTerm} - {new Date().getFullYear() + 56}</h3>
                      <div className="inline-block border-2 border-black bg-[#ffdbcc] px-6 py-1 font-bold text-lg shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                        ADMIT CARD
                      </div>
                    </div>
                    
                    {/* Placeholder Logo Right */}
                    <div className="w-24 h-24 border border-black flex items-center justify-center bg-white">
                      <span className="text-[10px] text-center font-bold">LOGO</span>
                    </div>
                  </div>

                  {/* Student Details */}
                  <div className="flex justify-between mb-3 text-sm font-bold">
                    <div className="flex-1 flex gap-4">
                      <div className="border border-black px-4 py-1 flex items-center">NAME :</div>
                      <div className="border border-black px-4 py-1 flex-1 flex items-center bg-white">{student.name}</div>
                    </div>
                    <div className="flex w-48 ml-4">
                      <div className="border border-black px-4 py-1 flex items-center">CLASS :</div>
                      <div className="border border-black px-4 py-1 flex-1 flex items-center justify-center bg-white">{student.class}</div>
                    </div>
                  </div>

                  <div className="flex justify-between mb-4 text-sm font-bold">
                    <div className="flex w-48">
                      <div className="border border-black px-2 py-1 flex items-center">ROLL NO.</div>
                      <div className="border border-black px-2 py-1 flex-1 flex items-center justify-center bg-white">HSE{student.roll_no.toString().padStart(3, '0')}</div>
                    </div>
                    <div className="w-48 flex flex-col">
                      <div className="flex border-t border-l border-r border-black">
                        <div className="w-16 px-2 py-1 border-r border-black flex items-center">SHIFT :</div>
                        <div className="flex-1 px-2 py-1 bg-white">{routines[0]?.shift || "MORNING"}</div>
                      </div>
                      <div className="flex border border-black">
                        <div className="w-16 px-2 py-1 border-r border-black flex items-center">TIME :</div>
                        <div className="flex-1 px-2 py-1 bg-white">{routines[0]?.exam_time || "10:10-12:10"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Routine Table */}
                  <div className="flex-1 border-2 border-black flex flex-col mb-4 bg-white text-xs font-bold">
                    <div className="flex border-b border-black text-center bg-white">
                      <div className="w-[15%] py-1 border-r border-black">DATE</div>
                      <div className="w-[20%] py-1 border-r border-black">SUBJECT</div>
                      <div className="w-[15%] py-1 border-r border-black">INVIGILATOR SIGN</div>
                      <div className="w-[15%] py-1 border-r border-black">DATE</div>
                      <div className="w-[20%] py-1 border-r border-black">SUBJECT</div>
                      <div className="w-[15%] py-1">INVIGILATOR SIGN</div>
                    </div>
                    
                    {Array.from({ length: Math.max(leftRoutine.length, rightRoutine.length) }).map((_, i) => (
                      <div key={i} className="flex border-b border-black last:border-b-0 text-center flex-1 items-center">
                        <div className="w-[15%] py-1 border-r border-black h-full flex items-center justify-center">{leftRoutine[i]?.exam_date || ""}</div>
                        <div className="w-[20%] py-1 border-r border-black h-full flex items-center justify-center">{leftRoutine[i]?.subject || ""}</div>
                        <div className="w-[15%] py-1 border-r border-black h-full"></div>
                        <div className="w-[15%] py-1 border-r border-black h-full flex items-center justify-center">{rightRoutine[i]?.exam_date || ""}</div>
                        <div className="w-[20%] py-1 border-r border-black h-full flex items-center justify-center">{rightRoutine[i]?.subject || ""}</div>
                        <div className="w-[15%] py-1 h-full"></div>
                      </div>
                    ))}
                  </div>

                  {/* Signatures */}
                  <div className="flex justify-between mt-auto pt-6 text-sm font-bold text-center">
                    <div className="w-1/4 border-t border-black pt-1">CLASS TEACHER</div>
                    <div className="w-1/3 border-t border-black pt-1">EXAM CO-ORDINATOR</div>
                    <div className="w-1/4 border-t border-black pt-1">PRINCIPAL</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
