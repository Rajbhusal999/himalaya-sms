"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { History, RefreshCw, Search, Trash2 } from "lucide-react";

export default function RecentMarksLedger() {
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMarks, setSelectedMarks] = useState<Set<string>>(new Set());

  const fetchMarks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marks')
        .select(`
          id,
          total,
          written_final,
          term_exam,
          written, oral, cu, first_term, second_term, project16, project20, activity, attendance,
          created_at, updated_at,
          students ( name, class, roll_no ),
          subjects ( subject_name ),
          teachers ( first_name, last_name )
        `)
        .order('updated_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setMarks(data || []);
    } catch (err: any) {
      console.error("Error fetching marks history:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarks();
  }, []);

  const handleDeleteMark = async (markId: string) => {
    if (!confirm("Are you sure you want to delete this mark entry? This action cannot be undone.")) return;

    try {
      const { error } = await supabase
        .from('marks')
        .delete()
        .eq('id', markId);

      if (error) throw error;
      
      alert("Mark entry deleted successfully.");
      // Also remove from selection if selected
      const newSelection = new Set(selectedMarks);
      newSelection.delete(markId);
      setSelectedMarks(newSelection);
      fetchMarks();
    } catch (err: any) {
      console.error("Error deleting mark:", err.message);
      alert("Failed to delete mark: " + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMarks.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedMarks.size} mark entries? This action cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('marks')
        .delete()
        .in('id', Array.from(selectedMarks));

      if (error) throw error;
      
      alert(`${selectedMarks.size} mark entries deleted successfully.`);
      setSelectedMarks(new Set());
      fetchMarks();
    } catch (err: any) {
      console.error("Error deleting marks:", err.message);
      alert("Failed to delete marks: " + err.message);
    }
  };

  const filteredMarks = marks.filter(m => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const studentName = (m.students?.name || "").toLowerCase();
    const className = (m.students?.class || "").toLowerCase();
    const subjectName = (m.subjects?.subject_name || "").toLowerCase();
    const teacherName = m.teachers ? `${m.teachers.first_name} ${m.teachers.last_name}`.toLowerCase() : 'admin';
    
    return studentName.includes(term) || className.includes(term) || subjectName.includes(term) || teacherName.includes(term);
  });

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedMarks);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedMarks(newSelection);
  };

  const toggleAll = () => {
    if (selectedMarks.size === filteredMarks.length && filteredMarks.length > 0) {
      setSelectedMarks(new Set());
    } else {
      setSelectedMarks(new Set(filteredMarks.map(m => m.id)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <History className="w-6 h-6 mr-2 text-brand-600" />
              Mark Entry History
            </h2>
            <p className="text-sm text-slate-500 mt-1">Full log of all mark entries across classes.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-slate-50 text-slate-900 text-sm w-full md:w-64"
              />
            </div>
            {selectedMarks.size > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedMarks.size})
              </button>
            )}
            <button 
              onClick={fetchMarks}
              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-brand-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-medium w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={filteredMarks.length > 0 && selectedMarks.size === filteredMarks.length}
                    onChange={toggleAll}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 font-medium">Student</th>
                <th className="px-6 py-4 font-medium">Class</th>
                <th className="px-6 py-4 font-medium">Subject</th>
                <th className="px-6 py-4 font-medium">Entered By</th>
                <th className="px-6 py-4 font-medium">Date / Time</th>
                <th className="px-6 py-4 font-medium text-right">Marks</th>
                <th className="px-6 py-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && marks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-600"></div>
                    <p className="mt-2 text-slate-500">Loading history...</p>
                  </td>
                </tr>
              ) : filteredMarks.length > 0 ? (
                filteredMarks.map((mark, i) => (
                  <tr key={mark.id || i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedMarks.has(mark.id)}
                        onChange={() => toggleSelection(mark.id)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-medium">
                      {mark.students?.name} <span className="text-slate-400 text-sm ml-2">Roll: {mark.students?.roll_no}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      Class {mark.students?.class}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {mark.subjects?.subject_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {mark.teachers ? `${mark.teachers.first_name} ${mark.teachers.last_name}` : 'Admin'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-sm">
                      {(() => {
                        const createdAt = mark.created_at ? new Date(mark.created_at) : null;
                        const updatedAt = mark.updated_at ? new Date(mark.updated_at) : null;
                        const isEdited = createdAt && updatedAt && (updatedAt.getTime() - createdAt.getTime() > 5000);
                        const displayDate = updatedAt || createdAt || new Date();
                        
                        return (
                          <span className={isEdited ? "text-amber-600 font-medium" : ""} title={displayDate.toLocaleString()}>
                            {displayDate.toLocaleDateString()} {displayDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isEdited && " (Edited)"}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-800">
                      {(() => {
                        const has = (val: any) => val !== null && val !== undefined && val !== '';
                        const formatNum = (val: any) => {
                          const n = Number(val);
                          if (isNaN(n)) return val;
                          return Number.isInteger(n) ? n.toString() : n.toFixed(2);
                        };
                        
                        if (has(mark.total)) return formatNum(mark.total);
                        if (has(mark.written_final)) return formatNum(mark.written_final);
                        if (has(mark.term_exam)) return formatNum(mark.term_exam);
                        if (has(mark.written)) {
                          let t = Number(mark.written);
                          if (has(mark.oral)) t += Number(mark.oral);
                          return formatNum(t);
                        }
                        if (has(mark.cu)) return `CU: ${formatNum(mark.cu)}`;
                        
                        let sum = 0;
                        let hasMarks = false;
                        ['project16', 'project20', 'activity', 'attendance', 'first_term', 'second_term'].forEach(key => {
                          if (has(mark[key])) {
                            sum += Number(mark[key]);
                            hasMarks = true;
                          }
                        });
                        if (hasMarks) return formatNum(sum);
                        
                        return '-';
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button 
                        onClick={() => handleDeleteMark(mark.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Mark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No mark entries found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
