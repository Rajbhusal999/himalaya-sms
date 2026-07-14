"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function PrintAdmissionForm() {
  const params = useParams();
  const id = params.id as string;
  const [admission, setAdmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmission = async () => {
      const { data, error } = await supabase
        .from('admissions')
        .select('*')
        .eq('id', id)
        .single();
        
      if (data) {
        setAdmission(data);
      }
      setLoading(false);
    };
    
    if (id) fetchAdmission();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!admission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Admission record not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 print:bg-white py-8 print:py-0 text-black font-sans">
      <div className="max-w-[210mm] mx-auto mb-4 print:hidden flex justify-between items-center">
        <Link href="/admin/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <button 
          onClick={() => window.print()} 
          className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print Form
        </button>
      </div>

      {/* A4 Paper Container */}
      <div className="bg-white mx-auto shadow-xl print:shadow-none print:m-0 w-[210mm] min-h-[297mm] p-[15mm] box-border relative">
        
        {/* Header */}
        <div className="text-center border-b-2 border-brand-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-brand-950 uppercase tracking-wider">Shree Himalaya Basic School</h1>
          <p className="text-sm text-slate-600 mt-1">Pokhara-15, Kaski, Nepal</p>
          <div className="mt-4 inline-block bg-slate-100 border border-slate-300 px-6 py-2 rounded-full font-bold text-lg uppercase tracking-widest">
            Admission Application Form
          </div>
        </div>

        {/* Form Body */}
        <div className="space-y-6">
          <div className="flex justify-between items-end border-b border-dashed border-slate-300 pb-2">
            <div>
              <span className="font-semibold text-slate-700">Application ID: </span>
              <span className="font-mono text-sm">{admission.id.split('-')[0]}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Applied Date: </span>
              <span>{new Date(admission.created_at).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Applied Class: </span>
              <span className="font-bold underline">{admission.applied_class}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="col-span-2">
              <h3 className="font-bold text-lg uppercase bg-slate-100 p-2 mb-4 border-l-4 border-brand-600">Student Details</h3>
            </div>
            
            <div className="col-span-2 text-lg">
              <span className="font-semibold w-40 inline-block">Full Name:</span>
              <span className="border-b border-slate-400 pb-1 flex-1 inline-block min-w-[300px] uppercase font-bold">{admission.student_name}</span>
            </div>
            
            <div className="text-lg">
              <span className="font-semibold w-40 inline-block">Date of Birth:</span>
              <span className="border-b border-slate-400 pb-1 inline-block min-w-[150px]">{admission.dob}</span>
            </div>
            
            <div className="text-lg">
              <span className="font-semibold w-32 inline-block">Gender:</span>
              <span className="border-b border-slate-400 pb-1 inline-block min-w-[150px]">{admission.gender}</span>
            </div>

            <div className="col-span-2 mt-4">
              <h3 className="font-bold text-lg uppercase bg-slate-100 p-2 mb-4 border-l-4 border-brand-600">Parent/Guardian Details</h3>
            </div>

            <div className="col-span-2 text-lg">
              <span className="font-semibold w-40 inline-block">Father's Name:</span>
              <span className="border-b border-slate-400 pb-1 flex-1 inline-block min-w-[300px] uppercase">{admission.father_name || 'N/A'}</span>
            </div>

            <div className="col-span-2 text-lg">
              <span className="font-semibold w-40 inline-block">Mother's Name:</span>
              <span className="border-b border-slate-400 pb-1 flex-1 inline-block min-w-[300px] uppercase">{admission.mother_name || 'N/A'}</span>
            </div>

            <div className="col-span-2 text-lg">
              <span className="font-semibold w-40 inline-block">Guardian's Name:</span>
              <span className="border-b border-slate-400 pb-1 flex-1 inline-block min-w-[300px] uppercase font-bold">{admission.guardian_name}</span>
            </div>

            <div className="col-span-2 text-lg">
              <span className="font-semibold w-40 inline-block">Contact Number:</span>
              <span className="border-b border-slate-400 pb-1 flex-1 inline-block min-w-[300px] font-bold">{admission.guardian_contact}</span>
            </div>

            <div className="col-span-2 text-lg">
              <span className="font-semibold w-40 inline-block">Permanent Address:</span>
              <span className="border-b border-slate-400 pb-1 flex-1 inline-block min-w-[400px]">{admission.address}</span>
            </div>

            <div className="col-span-2 mt-4">
              <h3 className="font-bold text-lg uppercase bg-slate-100 p-2 mb-4 border-l-4 border-brand-600">Previous Education</h3>
            </div>

            <div className="col-span-2 text-lg">
              <span className="font-semibold w-56 inline-block">Previous School Name:</span>
              <span className="border-b border-slate-400 pb-1 flex-1 inline-block min-w-[300px]">{admission.previous_school || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Footer Signatures */}
        <div className="absolute bottom-[20mm] left-[15mm] right-[15mm]">
          <div className="flex justify-between items-end border-t border-slate-300 pt-8 mt-20">
            <div className="text-center w-48">
              <div className="border-b border-slate-800 h-8 mb-2"></div>
              <p className="font-semibold">Guardian's Signature</p>
              <p className="text-sm text-slate-500">Date: ........................</p>
            </div>
            <div className="text-center w-48">
              <div className="border-b border-slate-800 h-8 mb-2"></div>
              <p className="font-semibold">Principal / Admin</p>
              <p className="text-sm text-slate-500">Date: ........................</p>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white; }
        }
      `}</style>
    </div>
  );
}
