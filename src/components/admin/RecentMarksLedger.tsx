"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { History, RefreshCw, Search } from "lucide-react";

export default function RecentMarksLedger() {
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredMarks = marks.filter(m => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const studentName = (m.students?.name || "").toLowerCase();
    const className = (m.students?.class || "").toLowerCase();
    const subjectName = (m.subjects?.subject_name || "").toLowerCase();
    const teacherName = m.teachers ? `${m.teachers.first_name} ${m.teachers.last_name}`.toLowerCase() : 'admin';
    
    return studentName.includes(term) || className.includes(term) || subjectName.includes(term) || teacherName.includes(term);
  });

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
                <th className="px-6 py-4 font-medium">Student</th>
                <th className="px-6 py-4 font-medium">Class</th>
                <th className="px-6 py-4 font-medium">Subject</th>
                <th className="px-6 py-4 font-medium">Entered By</th>
                <th className="px-6 py-4 font-medium">Date / Time</th>
                <th className="px-6 py-4 font-medium text-right">Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && marks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-600"></div>
                    <p className="mt-2 text-slate-500">Loading history...</p>
                  </td>
                </tr>
              ) : filteredMarks.length > 0 ? (
                filteredMarks.map((mark, i) => (
                  <tr key={mark.id || i} className="hover:bg-slate-50 transition-colors">
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
                      {mark.updated_at ? (
                         <span className="text-amber-600 font-medium" title={new Date(mark.updated_at).toLocaleString()}>
                           {new Date(mark.updated_at).toLocaleDateString()} {new Date(mark.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Edited)
                         </span>
                      ) : (
                         <span title={new Date(mark.created_at).toLocaleString()}>
                           {new Date(mark.created_at).toLocaleDateString()} {new Date(mark.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-800">
                      {(() => {
                        const has = (val: any) => val !== null && val !== undefined && val !== '';
                        
                        if (has(mark.total)) return mark.total;
                        if (has(mark.written_final)) return mark.written_final;
                        if (has(mark.term_exam)) return mark.term_exam;
                        if (has(mark.written)) {
                          let t = Number(mark.written);
                          if (has(mark.oral)) t += Number(mark.oral);
                          return t.toString();
                        }
                        if (has(mark.cu)) return `CU: ${mark.cu}`;
                        
                        let sum = 0;
                        let hasMarks = false;
                        ['project16', 'project20', 'activity', 'attendance', 'first_term', 'second_term'].forEach(key => {
                          if (has(mark[key])) {
                            sum += Number(mark[key]);
                            hasMarks = true;
                          }
                        });
                        if (hasMarks) return sum.toString();
                        
                        return '-';
                      })()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
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
