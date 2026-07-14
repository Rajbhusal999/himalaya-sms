"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { GraduationCap, ArrowLeft, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AdmissionForm() {
  const [formData, setFormData] = useState({
    student_name: "",
    dob: "",
    gender: "",
    father_name: "",
    mother_name: "",
    guardian_name: "",
    guardian_contact: "",
    address: "",
    previous_school: "",
    applied_class: "",
  });
  
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    
    const { error } = await supabase
      .from('admissions')
      .insert([formData]);
      
    if (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage(error.message || "Something went wrong. Please try again.");
    } else {
      setStatus("success");
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Application Submitted!</h2>
          <p className="text-slate-600">
            Thank you for applying to Shree Himalaya Basic School. Your admission form has been saved successfully. Our administration will review it and contact you shortly.
          </p>
          <div className="pt-4">
            <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors w-full">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-600 rounded-lg shadow-sm">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-brand-950 tracking-tight leading-none">Shree Himalaya</h1>
              <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mt-0.5">Basic School</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-brand-900 p-8 text-white text-center">
            <h2 className="text-3xl font-bold mb-2">Admission Application Form</h2>
            <p className="text-brand-200">Please fill out all the required information accurately.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {status === "error" && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Student Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                  <input type="text" name="student_name" required value={formData.student_name} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth *</label>
                  <input type="date" name="dob" required value={formData.dob} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                  <select name="gender" required value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Applying for Class *</label>
                  <select name="applied_class" required value={formData.applied_class} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none">
                    <option value="">Select Class</option>
                    <option value="ECD">ECD</option>
                    <option value="1">Class 1</option>
                    <option value="2">Class 2</option>
                    <option value="3">Class 3</option>
                    <option value="4">Class 4</option>
                    <option value="5">Class 5</option>
                    <option value="6">Class 6</option>
                    <option value="7">Class 7</option>
                    <option value="8">Class 8</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Parent/Guardian Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Father's Name</label>
                  <input type="text" name="father_name" value={formData.father_name} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mother's Name</label>
                  <input type="text" name="mother_name" value={formData.mother_name} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Guardian's Name *</label>
                  <input type="text" name="guardian_name" required value={formData.guardian_name} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Guardian's Contact Number *</label>
                  <input type="tel" name="guardian_contact" required value={formData.guardian_contact} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Permanent Address *</label>
                  <input type="text" name="address" required value={formData.address} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="e.g. Pokhara-15, Kaski" />
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Previous Education (If applicable)</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name of Previous School</label>
                <input type="text" name="previous_school" value={formData.previous_school} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200">
              <button 
                type="submit" 
                disabled={status === "submitting"}
                className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-3 disabled:opacity-70"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  "Submit Admission Form"
                )}
              </button>
              <p className="text-center text-sm text-slate-500 mt-4">By submitting this form, you agree to the rules and regulations of Shree Himalaya Basic School.</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
