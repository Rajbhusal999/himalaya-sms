"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { CalendarClock, X, Save } from "lucide-react";

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

interface CreateRoutineProps {
  onRoutineSaved: () => void;
}

export default function CreateRoutine({ onRoutineSaved }: CreateRoutineProps) {
  const [selectedClass, setSelectedClass] = useState<string>("1");
  const [selectedTerm, setSelectedTerm] = useState<string>(EXAM_TERMS[0]);
  
  const [routineForm, setRoutineForm] = useState<Routine[]>([{ class: "1", exam_term: EXAM_TERMS[0], subject: "", exam_date: "", shift: "Morning", exam_time: "10:10-12:10" }]);
  const [loading, setLoading] = useState(false);
  const [savingRoutine, setSavingRoutine] = useState(false);

  useEffect(() => {
    fetchRoutine();
  }, [selectedClass, selectedTerm]);

  const fetchRoutine = async () => {
    setLoading(true);
    try {
      const { data: routineData, error } = await supabase
        .from("exam_routines")
        .select("*")
        .eq("class", selectedClass)
        .eq("exam_term", selectedTerm)
        .order("exam_date");

      if (error) throw error;
      
      if (routineData && routineData.length > 0) {
        setRoutineForm(routineData);
      } else {
        setRoutineForm([{ class: selectedClass, exam_term: selectedTerm, subject: "", exam_date: "", shift: "Morning", exam_time: "10:10-12:10" }]);
      }
    } catch (err: any) {
      alert("Error loading routine: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoutine = async () => {
    setSavingRoutine(true);
    try {
      // Delete existing routine for this class and term
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
      
      alert("Routine saved successfully!");
      onRoutineSaved(); // Redirects to Admit Card
    } catch (err: any) {
      alert("Error saving routine: " + err.message);
    } finally {
      setSavingRoutine(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <CalendarClock className="w-6 h-6 mr-2 text-brand-600" />
              Create Routine
            </h2>
            <p className="text-sm text-slate-500 mt-1">Set up exam routines for classes.</p>
          </div>
          
          <div className="flex items-center gap-4">
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
          </div>
        </div>
      </div>

      {/* Routine Editor */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-slate-800">
              Exam Schedule
            </h3>
            <p className="text-sm text-slate-500">
              Class {selectedClass} • {selectedTerm}
            </p>
          </div>
          <button
            onClick={handleSaveRoutine}
            disabled={savingRoutine || loading}
            className="flex justify-center items-center py-2 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {savingRoutine ? "Saving..." : "Save Routine & View Admit Cards"}
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-12 gap-3 text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2 px-2">
            <div className="col-span-3">Date</div>
            <div className="col-span-3">Subject</div>
            <div className="col-span-3">Shift</div>
            <div className="col-span-2">Time</div>
            <div className="col-span-1 text-center">Act</div>
          </div>
          
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading routine...</div>
          ) : (
            routineForm.map((item, index) => (
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
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
          
          <button
            onClick={() => {
              const lastItem = routineForm[routineForm.length - 1] || { shift: "Morning", exam_time: "10:10-12:10" };
              setRoutineForm([...routineForm, { class: selectedClass, exam_term: selectedTerm, subject: "", exam_date: "", shift: lastItem.shift, exam_time: lastItem.exam_time }]);
            }}
            className="mt-4 text-brand-600 font-medium text-sm hover:text-brand-700 flex items-center px-2"
          >
            + Add Row
          </button>
        </div>
      </div>
    </div>
  );
}
