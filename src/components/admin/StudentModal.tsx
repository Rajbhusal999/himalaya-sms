"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Student = {
  id?: string;
  name: string;
  roll_no: number;
  class: string;
  iemis_code?: string;
  student_id_string?: string;
  gender?: string;
  father_name?: string;
  mother_name?: string;
  section?: string;
  year?: string;
  permanent_address?: string;
  temporary_address?: string;
  dob?: string;
  mother_tongue?: string;
  disability_type?: string;
  guardian_name?: string;
  guardian_contact_number?: string;
};

type StudentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  onSuccess: () => void;
};

export default function StudentModal({ isOpen, onClose, student, onSuccess }: StudentModalProps) {
  const [formData, setFormData] = useState<Student>({
    name: "",
    roll_no: 0,
    class: "1",
    iemis_code: "",
    student_id_string: "",
    gender: "",
    father_name: "",
    mother_name: "",
    section: "",
    year: "",
    permanent_address: "",
    temporary_address: "",
    dob: "",
    mother_tongue: "",
    disability_type: "",
    guardian_name: "",
    guardian_contact_number: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData({
        ...student,
        iemis_code: student.iemis_code || "",
        student_id_string: student.student_id_string || "",
        gender: student.gender || "",
        father_name: student.father_name || "",
        mother_name: student.mother_name || "",
        section: student.section || "",
        year: student.year || "",
        permanent_address: student.permanent_address || "",
        temporary_address: student.temporary_address || "",
        dob: student.dob || "",
        mother_tongue: student.mother_tongue || "",
        disability_type: student.disability_type || "",
        guardian_name: student.guardian_name || "",
        guardian_contact_number: student.guardian_contact_number || "",
      });
    } else {
      setFormData({
        name: "",
        roll_no: 0,
        class: "1",
        iemis_code: "",
        student_id_string: "",
        gender: "",
        father_name: "",
        mother_name: "",
        section: "",
        year: "",
        permanent_address: "",
        temporary_address: "",
        dob: "",
        mother_tongue: "",
        disability_type: "",
        guardian_name: "",
        guardian_contact_number: "",
      });
    }
  }, [student, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;
    
    if (name === "dob") {
      value = value.replace(/\D/g, "");
      if (value.length > 4) value = value.substring(0, 4) + "/" + value.substring(4);
      if (value.length > 7) value = value.substring(0, 7) + "/" + value.substring(7, 9);
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: name === "roll_no" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        roll_no: formData.roll_no,
        class: formData.class,
        iemis_code: formData.iemis_code,
        student_id_string: formData.student_id_string,
        gender: formData.gender,
        father_name: formData.father_name,
        mother_name: formData.mother_name,
        section: formData.section,
        year: formData.year,
        permanent_address: formData.permanent_address,
        temporary_address: formData.temporary_address,
        dob: formData.dob,
        mother_tongue: formData.mother_tongue,
        disability_type: formData.disability_type,
        guardian_name: formData.guardian_name,
        guardian_contact_number: formData.guardian_contact_number,
      };

      if (student?.id) {
        const { error } = await supabase.from("students").update(payload).eq("id", student.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("students").insert([payload]);
        if (error) throw error;
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      alert("Error saving student: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            {student ? "Edit Student" : "Add New Student"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="student-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Class *</label>
              <select required name="class" value={formData.class} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-white text-slate-900">
                <option value="Nursery">Nursery</option>
                <option value="KG">KG</option>
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Roll No *</label>
              <input required type="number" name="roll_no" value={formData.roll_no} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
              <input type="text" name="section" value={formData.section} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">IEMIS Code</label>
              <input type="text" name="iemis_code" value={formData.iemis_code} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Student Id String</label>
              <input type="text" name="student_id_string" value={formData.student_id_string} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-white text-slate-900">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">DOB</label>
              <input type="text" placeholder="YYYY-MM-DD or text" name="dob" value={formData.dob} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Father Name</label>
              <input type="text" name="father_name" value={formData.father_name} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mother Name</label>
              <input type="text" name="mother_name" value={formData.mother_name} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Permanent Address</label>
              <input type="text" name="permanent_address" value={formData.permanent_address} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Address</label>
              <input type="text" name="temporary_address" value={formData.temporary_address} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Guardian Name</label>
              <input type="text" name="guardian_name" value={formData.guardian_name} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Guardian Contact</label>
              <input type="text" name="guardian_contact_number" value={formData.guardian_contact_number} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mother Tongue</label>
              <input type="text" name="mother_tongue" value={formData.mother_tongue} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Disability Type</label>
              <input type="text" name="disability_type" value={formData.disability_type} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
              <input type="text" name="year" value={formData.year} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
          </form>
        </div>
        
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium">
            Cancel
          </button>
          <button type="submit" form="student-form" disabled={loading} className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50">
            {loading ? "Saving..." : "Save Student"}
          </button>
        </div>
      </div>
    </div>
  );
}
