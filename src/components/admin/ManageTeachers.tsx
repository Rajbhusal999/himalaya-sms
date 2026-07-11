"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Plus, Search, RefreshCw, Trash2, Edit } from "lucide-react";
import TeacherModal from "./TeacherModal";

type Teacher = {
  id: string;
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

export default function ManageTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTeachers(data || []);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this teacher/staff?")) return;
    
    try {
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
      fetchTeachers();
    } catch (err: any) {
      alert("Error deleting teacher: " + err.message);
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const fullName = `${teacher.first_name} ${teacher.middle_name || ""} ${teacher.last_name}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header Section */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Manage Teachers & Staff</h2>
            <p className="text-sm text-slate-500 mt-1">Add, edit, or remove teachers and staff members.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm w-64 text-slate-900"
              />
            </div>
            
            <button 
              onClick={fetchTeachers}
              className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                setEditingTeacher(null);
                setIsModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-brand-600 text-white border border-transparent rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Teacher/Staff
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto h-[600px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white shadow-sm z-10">
            <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-100 whitespace-nowrap">
              <th className="px-4 py-3 font-medium">S.N</th>
              <th className="px-4 py-3 font-medium">First Name</th>
              <th className="px-4 py-3 font-medium">Middle Name</th>
              <th className="px-4 py-3 font-medium">Last Name</th>
              <th className="px-4 py-3 font-medium">Gender</th>
              <th className="px-4 py-3 font-medium">Post</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Subject Teach</th>
              <th className="px-4 py-3 font-medium">DOB</th>
              <th className="px-4 py-3 font-medium">Joining Date</th>
              <th className="px-4 py-3 font-medium">Phone Number</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={13} className="px-6 py-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-600"></div>
                  <p className="mt-2 text-slate-500">Loading teachers...</p>
                </td>
              </tr>
            ) : filteredTeachers.length > 0 ? (
              filteredTeachers.map((teacher, index) => (
                <tr key={teacher.id} className="hover:bg-slate-50 transition-colors text-sm whitespace-nowrap">
                  <td className="px-4 py-3 text-slate-600">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{teacher.first_name}</td>
                  <td className="px-4 py-3 text-slate-600">{teacher.middle_name || "-"}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{teacher.last_name}</td>
                  <td className="px-4 py-3 text-slate-600">{teacher.gender || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{teacher.post || "-"}</td>
                  <td className="px-4 py-3 text-brand-600 font-medium">{teacher.teacher_category || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{teacher.subject_teach || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{teacher.dob || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{teacher.joining_date || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{teacher.phone_number || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{teacher.username || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setEditingTeacher(teacher);
                        setIsModalOpen(true);
                      }}
                      className="text-blue-500 hover:text-blue-700 p-1 rounded-md hover:bg-blue-50 transition-colors mr-2"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(teacher.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={13} className="px-6 py-12 text-center text-slate-500">
                  No teachers found. Click "Add Teacher/Staff" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TeacherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        teacher={editingTeacher}
        onSuccess={fetchTeachers}
      />
    </div>
  );
}
