"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Printer, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function ManageAdmissions() {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admissions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setAdmissions(data);
    }
    setLoading(false);
  };

  const markAsReviewed = async (id: string) => {
    const { error } = await supabase
      .from('admissions')
      .update({ status: 'Reviewed' })
      .eq('id', id);
      
    if (!error) {
      fetchAdmissions();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Admission Applications</h2>
        <p className="text-sm text-slate-500 mb-6">Review new student applications and print admission forms.</p>
        
        {admissions.length === 0 ? (
          <div className="text-center p-10 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            No admission applications found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Student Name</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Class</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Guardian Contact</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Applied Date</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admissions.map(adm => (
                  <tr key={adm.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800">{adm.student_name}</td>
                    <td className="py-3 px-4 text-slate-600">{adm.applied_class}</td>
                    <td className="py-3 px-4 text-slate-600">{adm.guardian_contact}</td>
                    <td className="py-3 px-4 text-sm text-slate-500">{new Date(adm.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      {adm.status === 'Pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                          <Clock className="w-3 h-3" />
                          New
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Reviewed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {adm.status === 'Pending' && (
                        <button onClick={() => markAsReviewed(adm.id)} className="text-xs font-medium text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors">
                          Mark Reviewed
                        </button>
                      )}
                      <Link href={`/admin/admissions/print/${adm.id}`} target="_blank" className="inline-flex items-center text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                        <Printer className="w-3 h-3 mr-1.5" />
                        Print Form
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
