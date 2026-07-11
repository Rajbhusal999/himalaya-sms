"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { ArrowLeft, Save, CheckCircle2, AlertCircle, Search } from "lucide-react";

type Subject = {
  id: string;
  subject_name: string;
  subject_code: string;
};

type Student = {
  id: string;
  name: string;
  roll_no: number;
  class: number;
};

type MarkEntry = {
  student_id: string;
  marks_obtained: string; // Keep as string for input state, convert to number on save
};

export default function EntryMarks() {
  const router = useRouter();
  
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({}); // student_id -> marks
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data, error } = await supabase.from('subjects').select('*').order('subject_name');
      if (data) setSubjects(data);
      if (error) console.error("Error fetching subjects:", error);
    };
    fetchSubjects();
  }, []);

  const handleFetchStudents = async () => {
    if (!selectedClass || !selectedSubject) {
      setMessage({ type: 'error', text: 'Please select both Class and Subject.' });
      return;
    }
    
    setFetching(true);
    setMessage(null);
    
    try {
      // 1. Fetch students for the class
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('class', parseInt(selectedClass))
        .order('roll_no');
        
      if (studentsError) throw studentsError;
      
      setStudents(studentsData || []);
      
      // 2. Fetch existing marks for these students in this subject
      if (studentsData && studentsData.length > 0) {
        const studentIds = studentsData.map(s => s.id);
        const { data: marksData, error: marksError } = await supabase
          .from('marks')
          .select('student_id, marks_obtained')
          .eq('subject_id', selectedSubject)
          .in('student_id', studentIds);
          
        if (marksError) throw marksError;
        
        const marksMap: Record<string, string> = {};
        marksData?.forEach(m => {
          marksMap[m.student_id] = m.marks_obtained.toString();
        });
        
        setMarks(marksMap);
      }
      
      if (studentsData?.length === 0) {
        setMessage({ type: 'error', text: 'No students found in this class. Add students from the Admin panel first.' });
      }
      
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to fetch data' });
    } finally {
      setFetching(false);
    }
  };

  const handleMarkChange = (studentId: string, value: string) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // Prepare records for upsert
      const recordsToUpsert = students.map(student => {
        const markValue = marks[student.id];
        return {
          student_id: student.id,
          subject_id: selectedSubject,
          marks_obtained: markValue && markValue !== "" ? parseFloat(markValue) : null,
          entered_by: userId || null
        };
      }).filter(record => record.marks_obtained !== null); // Only save entered marks
      
      if (recordsToUpsert.length === 0) {
        setMessage({ type: 'error', text: 'No marks entered to save.' });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('marks')
        .upsert(recordsToUpsert, { onConflict: 'student_id,subject_id' });
        
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Marks saved successfully!' });
      
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save marks' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-brand-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/teacher/dashboard" className="flex items-center text-brand-200 hover:text-white transition-colors mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-bold text-xl tracking-tight">Entry Exam Marks</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Selection Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Class</label>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border border-slate-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white text-slate-900"
              >
                <option value="">Select Class</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={num}>Class {num}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full border border-slate-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white text-slate-900"
              >
                <option value="">Select Subject</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.subject_name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            onClick={handleFetchStudents}
            disabled={fetching}
            className="w-full md:w-auto inline-flex justify-center items-center px-6 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-colors"
          >
            {fetching ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Search className="w-5 h-5 mr-2" />
            )}
            Load Students List
          </button>
        </div>

        {/* Messaging */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Student Marks Entry Table */}
        {students.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">
                Class {selectedClass} Students
              </h2>
              <span className="px-3 py-1 bg-brand-100 text-brand-700 text-sm font-medium rounded-full">
                {students.length} Students
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Roll No</th>
                    <th className="px-6 py-4 font-medium">Student Name</th>
                    <th className="px-6 py-4 font-medium text-right w-48">Marks Obtained</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-medium">
                        {student.roll_no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                        {student.name}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={marks[student.id] || ""}
                          onChange={(e) => handleMarkChange(student.id, e.target.value)}
                          className="w-32 border border-slate-300 rounded-lg py-2 px-3 text-right focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white text-slate-900 font-medium"
                          placeholder="e.g. 85.5"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={handleSave}
                disabled={loading}
                className="inline-flex justify-center items-center px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all shadow-sm hover:shadow"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Save All Marks
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
