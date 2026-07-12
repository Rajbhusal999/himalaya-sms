"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Plus, Trash2, BookOpen } from "lucide-react";

type Subject = {
  id: string;
  subject_name: string;
  subject_code: string;
  class: string | null;
  credit_hour: number | null;
  has_written?: boolean;
  has_oral?: boolean;
};

const CLASSES = ["Nursery", "KG", "ECD", "1", "2", "3", "4", "5", "6", "7", "8"];

export default function ManageSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("1");
  
  const [newSubject, setNewSubject] = useState({
    subject_name: "",
    subject_code: "",
    credit_hour: "",
    has_written: true,
    has_oral: true
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchSubjects(selectedClass);
  }, [selectedClass]);

  const fetchSubjects = async (cls: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("class", cls)
        .order("subject_name");
      
      if (error) throw error;
      setSubjects(data || []);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    
    try {
      const payload = {
        subject_name: newSubject.subject_name,
        subject_code: newSubject.subject_code,
        class: selectedClass,
        credit_hour: newSubject.credit_hour ? parseFloat(newSubject.credit_hour) : null,
        has_written: newSubject.has_written,
        has_oral: newSubject.has_oral
      };

      const { error } = await supabase.from("subjects").insert([payload]);
      
      if (error) throw error;
      
      setNewSubject({ subject_name: "", subject_code: "", credit_hour: "", has_written: true, has_oral: true });
      fetchSubjects(selectedClass);
    } catch (err: any) {
      alert("Error adding subject: " + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    
    try {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
      fetchSubjects(selectedClass);
    } catch (err: any) {
      alert("Error deleting subject: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <BookOpen className="w-6 h-6 mr-2 text-brand-600" />
              Manage Subjects
            </h2>
            <p className="text-sm text-slate-500 mt-1">Add or remove subjects and credit hours for specific classes.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Select Class:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-slate-50 text-slate-900 font-medium"
            >
              {CLASSES.map(cls => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Subject Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
              Add Subject to Class {selectedClass}
            </h3>
            
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject Name *</label>
                <input
                  required
                  type="text"
                  value={newSubject.subject_name}
                  onChange={(e) => setNewSubject({...newSubject, subject_name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900"
                  placeholder="e.g. Mathematics"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject Code *</label>
                <input
                  required
                  type="text"
                  value={newSubject.subject_code}
                  onChange={(e) => setNewSubject({...newSubject, subject_code: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900"
                  placeholder="e.g. MATH"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Credit Hour</label>
                <input
                  type="number"
                  step="0.1"
                  value={newSubject.credit_hour}
                  onChange={(e) => setNewSubject({...newSubject, credit_hour: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900"
                  placeholder="e.g. 4.0"
                />
              </div>

              {["Nursery", "KG"].includes(selectedClass) && (
                <div className="flex items-center gap-4 py-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSubject.has_written}
                      onChange={(e) => setNewSubject({...newSubject, has_written: e.target.checked})}
                      className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                    />
                    <span className="text-sm font-medium text-slate-700">Written Exam</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSubject.has_oral}
                      onChange={(e) => setNewSubject({...newSubject, has_oral: e.target.checked})}
                      className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                    />
                    <span className="text-sm font-medium text-slate-700">Oral Exam</span>
                  </label>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isAdding}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isAdding ? "Adding..." : "Add Subject"}
              </button>
            </form>
          </div>
        </div>

        {/* Subjects List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Subjects for Class {selectedClass}</h3>
              <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-1 rounded-full">
                {subjects.length} Subjects
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white shadow-sm z-10">
                  <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
                    <th className="px-6 py-3 font-medium">Subject Name</th>
                    <th className="px-6 py-3 font-medium">Code</th>
                    <th className="px-6 py-3 font-medium">Credit Hour</th>
                    {["Nursery", "KG"].includes(selectedClass) && <th className="px-6 py-3 font-medium text-center">Format</th>}
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={["Nursery", "KG"].includes(selectedClass) ? 5 : 4} className="px-6 py-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-600"></div>
                        <p className="mt-2 text-slate-500">Loading subjects...</p>
                      </td>
                    </tr>
                  ) : subjects.length > 0 ? (
                    subjects.map((subject) => (
                      <tr key={subject.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800">{subject.subject_name}</td>
                        <td className="px-6 py-4 text-slate-600">
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-mono border border-slate-200">
                            {subject.subject_code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {subject.credit_hour ? subject.credit_hour : "-"}
                        </td>
                        {["Nursery", "KG"].includes(selectedClass) && (
                          <td className="px-6 py-4 text-center">
                            <div className="flex gap-1 justify-center">
                              {subject.has_written && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">W</span>}
                              {subject.has_oral && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">O</span>}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDelete(subject.id)}
                            className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={["Nursery", "KG"].includes(selectedClass) ? 5 : 4} className="px-6 py-12 text-center text-slate-500">
                        No subjects found for Class {selectedClass}. 
                        <br />Use the form to add some.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
