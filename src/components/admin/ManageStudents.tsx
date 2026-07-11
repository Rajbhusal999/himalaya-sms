"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Upload, Download, Plus, Users, Search, RefreshCw, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

type Student = {
  id: string;
  name: string;
  roll_no: number;
  class: number;
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

export default function ManageStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("class", { ascending: true })
        .order("roll_no", { ascending: true });
      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Map Excel headers to DB columns
        const newStudents = data.map((row: any) => ({
          name: row["FullName"] || row["Full Name"] || "Unknown",
          roll_no: row["S.N"] || row["Roll No"] || Math.floor(Math.random() * 1000), // Fallback
          class: parseInt(row["CurrentClass"] || row["Class"] || "1"),
          iemis_code: row["IEMIS Code"] ? String(row["IEMIS Code"]) : null,
          student_id_string: row["Student Id"] ? String(row["Student Id"]) : null,
          gender: row["Gender"] || null,
          father_name: row["Father Name"] || null,
          mother_name: row["Mother Name"] || null,
          section: row["Section"] ? String(row["Section"]) : null,
          year: row["Year"] ? String(row["Year"]) : null,
          permanent_address: row["Permanent Address"] || null,
          temporary_address: row["Temporary Address"] || null,
          dob: row["DOB"] ? String(row["DOB"]) : null,
          mother_tongue: row["Mother Tongue"] || null,
          disability_type: row["Disability Type"] || null,
          guardian_name: row["Guardian Name"] || null,
          guardian_contact_number: row["Guardian Contact Number"] ? String(row["Guardian Contact Number"]) : null,
        }));

        if (newStudents.length > 0) {
          const { error } = await supabase.from("students").insert(newStudents);
          if (error) throw error;
          alert(`Successfully imported ${newStudents.length} students!`);
          fetchStudents();
        }
      } catch (err: any) {
        alert("Error importing file: " + err.message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const exportToExcel = () => {
    // Map DB columns to Excel headers
    const exportData = students.map((s, index) => ({
      "S.N": index + 1,
      "IEMIS Code": s.iemis_code || "",
      "Student Id": s.student_id_string || "",
      "FullName": s.name,
      "Gender": s.gender || "",
      "Father Name": s.father_name || "",
      "Mother Name": s.mother_name || "",
      "CurrentClass": s.class,
      "Section": s.section || "",
      "Year": s.year || "",
      "Permanent Address": s.permanent_address || "",
      "Temporary Address": s.temporary_address || "",
      "DOB": s.dob || "",
      "Mother Tongue": s.mother_tongue || "",
      "Disability Type": s.disability_type || "",
      "Age": "", // Calculate if needed based on DOB
      "Guardian Name": s.guardian_name || "",
      "Guardian Contact Number": s.guardian_contact_number || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Students_Export.xlsx");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    try {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
      setStudents(students.filter((s) => s.id !== id));
    } catch (err: any) {
      alert("Error deleting student: " + err.message);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.student_id_string && s.student_id_string.toLowerCase().includes(search.toLowerCase())) ||
      (s.iemis_code && s.iemis_code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header Actions */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <Users className="w-6 h-6 mr-2 text-brand-600" />
            Manage Students
          </h2>
          <p className="text-slate-500 text-sm mt-1">Import, export, and manage student records</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
            />
          </div>
          
          <button 
            onClick={fetchStudents}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          
          <div className="relative">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? "Importing..." : "Import Excel"}
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto h-[600px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white shadow-sm z-10">
            <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-100">
              <th className="px-4 py-3 font-medium">S.N</th>
              <th className="px-4 py-3 font-medium">IEMIS Code</th>
              <th className="px-4 py-3 font-medium">Student Id</th>
              <th className="px-4 py-3 font-medium">FullName</th>
              <th className="px-4 py-3 font-medium">Gender</th>
              <th className="px-4 py-3 font-medium">Father Name</th>
              <th className="px-4 py-3 font-medium">Mother Name</th>
              <th className="px-4 py-3 font-medium">CurrentClass</th>
              <th className="px-4 py-3 font-medium">Section</th>
              <th className="px-4 py-3 font-medium">Permanent Address</th>
              <th className="px-4 py-3 font-medium">Temporary Address</th>
              <th className="px-4 py-3 font-medium">DOB</th>
              <th className="px-4 py-3 font-medium">Mother Tongue</th>
              <th className="px-4 py-3 font-medium">Disability Type</th>
              <th className="px-4 py-3 font-medium">Guardian Name</th>
              <th className="px-4 py-3 font-medium">Guardian Contact</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={17} className="px-6 py-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-600"></div>
                  <p className="mt-2 text-slate-500">Loading students...</p>
                </td>
              </tr>
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors text-sm">
                  <td className="px-4 py-3 text-slate-600">{index + 1}</td>
                  <td className="px-4 py-3 text-slate-900">{student.iemis_code || "-"}</td>
                  <td className="px-4 py-3 text-brand-600 font-medium">{student.student_id_string || "-"}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{student.name}</td>
                  <td className="px-4 py-3 text-slate-600">{student.gender || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{student.father_name || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{student.mother_name || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">Class {student.class}</td>
                  <td className="px-4 py-3 text-slate-600">{student.section || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{student.permanent_address || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{student.temporary_address || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{student.dob || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{student.mother_tongue || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{student.disability_type || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{student.guardian_name || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{student.guardian_contact_number || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => handleDelete(student.id)}
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
                <td colSpan={17} className="px-6 py-12 text-center text-slate-500">
                  No students found. Import an Excel file to add students.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
