"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Teacher = {
  id?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender?: string;
  post?: string;
  teacher_category?: string;
  subject_teach?: string;
  permanent_address?: string;
  temporary_address?: string;
  dob?: string;
  joining_date?: string;
  phone_number?: string;
  account_number?: string;
  username?: string;
  password?: string;
  pan_no?: string;
};

type TeacherModalProps = {
  isOpen: boolean;
  onClose: () => void;
  teacher?: Teacher | null;
  onSuccess: () => void;
};

export default function TeacherModal({ isOpen, onClose, teacher, onSuccess }: TeacherModalProps) {
  const [formData, setFormData] = useState<Teacher>({
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "",
    post: "",
    teacher_category: "",
    subject_teach: "",
    permanent_address: "",
    temporary_address: "",
    dob: "",
    joining_date: "",
    phone_number: "",
    account_number: "",
    username: "",
    password: "",
    pan_no: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (teacher) {
      setFormData({
        ...teacher,
        middle_name: teacher.middle_name || "",
        gender: teacher.gender || "",
        post: teacher.post || "",
        teacher_category: teacher.teacher_category || "",
        subject_teach: teacher.subject_teach || "",
        permanent_address: teacher.permanent_address || "",
        temporary_address: teacher.temporary_address || "",
        dob: teacher.dob || "",
        joining_date: teacher.joining_date || "",
        phone_number: teacher.phone_number || "",
        account_number: teacher.account_number || "",
        username: teacher.username || "",
        password: teacher.password || "",
        pan_no: teacher.pan_no || "",
      });
    } else {
      setFormData({
        first_name: "",
        middle_name: "",
        last_name: "",
        gender: "",
        post: "",
        teacher_category: "",
        subject_teach: "",
        permanent_address: "",
        temporary_address: "",
        dob: "",
        joining_date: "",
        phone_number: "",
        account_number: "",
        username: "",
        password: "",
        pan_no: "",
      });
    }
  }, [teacher, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        gender: formData.gender,
        post: formData.post,
        teacher_category: formData.teacher_category,
        subject_teach: formData.subject_teach,
        permanent_address: formData.permanent_address,
        temporary_address: formData.temporary_address,
        dob: formData.dob,
        joining_date: formData.joining_date,
        phone_number: formData.phone_number,
        account_number: formData.account_number,
        username: formData.username,
        password: formData.password,
        pan_no: formData.pan_no,
      };

      if (teacher?.id) {
        const { error } = await supabase.from("teachers").update(payload).eq("id", teacher.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("teachers").insert([payload]);
        if (error) throw error;
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      alert("Error saving teacher: " + error.message);
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
            {teacher ? "Edit Teacher/Staff" : "Add New Teacher/Staff"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="teacher-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
              <input required type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Middle Name</label>
              <input type="text" name="middle_name" value={formData.middle_name} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
              <input required type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Post</label>
              <input type="text" name="post" value={formData.post} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teacher Category</label>
              <select name="teacher_category" value={formData.teacher_category} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-white text-slate-900">
                <option value="">Select Category</option>
                <option value="Teacher">Teacher</option>
                <option value="Staff">Staff</option>
                <option value="Principal">Principal</option>
                <option value="Assistant Principal">Assistant Principal</option>
                <option value="Level co-ordinator">Level co-ordinator</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject Teach</label>
              <input type="text" name="subject_teach" value={formData.subject_teach} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">DOB</label>
              <input type="text" placeholder="YYYY-MM-DD or text" name="dob" value={formData.dob} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Joining Date</label>
              <input type="text" placeholder="YYYY-MM-DD or text" name="joining_date" value={formData.joining_date} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
              <input type="text" name="account_number" value={formData.account_number} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PAN NO.</label>
              <input type="text" name="pan_no" value={formData.pan_no} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="text" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-slate-900" />
            </div>
          </form>
        </div>
        
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium">
            Cancel
          </button>
          <button type="submit" form="teacher-form" disabled={loading} className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50">
            {loading ? "Saving..." : "Save Teacher/Staff"}
          </button>
        </div>
      </div>
    </div>
  );
}
