"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Trash2, 
  Edit, 
  UserCheck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Filter,
  UserX,
  BookOpen
} from "lucide-react";
import NepaliDatePicker from "@/components/common/NepaliDatePicker";
import { getCurrentBsDate, formatBsDateDisplay } from "@/lib/nepaliDate";

export type ProxyClass = {
  id: string;
  date: string; // YYYY-MM-DD in B.S.
  class_name: string;
  section: string;
  period: string;
  absent_teacher_id?: string;
  absent_teacher_name: string;
  proxy_teacher_id?: string;
  proxy_teacher_name: string;
  subject_name: string;
  reason?: string;
  status: "Assigned" | "Completed" | "Cancelled";
  created_at?: string;
};

type Teacher = {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
};

type Subject = {
  id: string;
  subject_name: string;
};

const DEFAULT_CLASSES = [
  "Nursery", "KG", 
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", 
  "Class 6", "Class 7", "Class 8"
];

const DEFAULT_PERIODS = [
  "1st Period (10:00 - 10:45 AM)",
  "2nd Period (10:45 - 11:30 AM)",
  "3rd Period (11:30 - 12:15 PM)",
  "4th Period (12:15 - 01:00 PM)",
  "Tiffin Break (01:00 - 01:30 PM)",
  "5th Period (01:30 - 02:15 PM)",
  "6th Period (02:15 - 03:00 PM)",
  "7th Period (03:00 - 03:45 PM)"
];

const LOCAL_STORAGE_KEY = "shbs_proxy_classes";

export default function ManageProxyClass() {
  const [proxyList, setProxyList] = useState<ProxyClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterClass, setFilterClass] = useState("All");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProxyClass | null>(null);
  
  // Form State (Defaulting date to current Nepali B.S. Date)
  const [formData, setFormData] = useState({
    date: getCurrentBsDate(),
    class_name: "Class 1",
    section: "A",
    period: "1st Period (10:00 - 10:45 AM)",
    absent_teacher_id: "",
    absent_teacher_name: "",
    proxy_teacher_id: "",
    proxy_teacher_name: "",
    subject_name: "",
    reason: "",
    status: "Assigned" as "Assigned" | "Completed" | "Cancelled"
  });

  const [saving, setSaving] = useState(false);

  // Load teachers & subjects
  const fetchTeachersAndSubjects = async () => {
    try {
      const { data: teacherData } = await supabase.from("teachers").select("id, first_name, middle_name, last_name");
      if (teacherData) setTeachers(teacherData);

      const { data: subjectData } = await supabase.from("subjects").select("id, subject_name");
      if (subjectData) setSubjects(subjectData);
    } catch (err) {
      console.error("Error loading teachers/subjects:", err);
    }
  };

  // Load proxy classes
  const fetchProxyClasses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("proxy_classes")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        loadFromLocalStorage();
      } else if (data) {
        setProxyList(data);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      try {
        setProxyList(JSON.parse(localData));
      } catch (e) {
        setProxyList([]);
      }
    } else {
      setProxyList([]);
    }
  };

  useEffect(() => {
    fetchTeachersAndSubjects();
    fetchProxyClasses();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      date: getCurrentBsDate(),
      class_name: "Class 1",
      section: "A",
      period: DEFAULT_PERIODS[0],
      absent_teacher_id: teachers[0]?.id || "",
      absent_teacher_name: teachers[0] ? `${teachers[0].first_name} ${teachers[0].last_name}` : "",
      proxy_teacher_id: teachers[1]?.id || teachers[0]?.id || "",
      proxy_teacher_name: teachers[1] ? `${teachers[1].first_name} ${teachers[1].last_name}` : "",
      subject_name: subjects[0]?.subject_name || "English",
      reason: "Sick Leave",
      status: "Assigned"
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: ProxyClass) => {
    setEditingItem(item);
    setFormData({
      date: item.date || getCurrentBsDate(),
      class_name: item.class_name,
      section: item.section || "A",
      period: item.period,
      absent_teacher_id: item.absent_teacher_id || "",
      absent_teacher_name: item.absent_teacher_name,
      proxy_teacher_id: item.proxy_teacher_id || "",
      proxy_teacher_name: item.proxy_teacher_name,
      subject_name: item.subject_name,
      reason: item.reason || "",
      status: item.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.absent_teacher_name.trim() || !formData.proxy_teacher_name.trim()) {
      alert("Please select both Absent Teacher and Substitute (Proxy) Teacher.");
      return;
    }

    if (formData.absent_teacher_name === formData.proxy_teacher_name) {
      alert("Absent teacher and Proxy teacher cannot be the same person.");
      return;
    }

    setSaving(true);
    const payload = {
      id: editingItem ? editingItem.id : `proxy_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      date: formData.date, // Saved in BS Date string YYYY-MM-DD
      class_name: formData.class_name,
      section: formData.section,
      period: formData.period,
      absent_teacher_id: formData.absent_teacher_id,
      absent_teacher_name: formData.absent_teacher_name,
      proxy_teacher_id: formData.proxy_teacher_id,
      proxy_teacher_name: formData.proxy_teacher_name,
      subject_name: formData.subject_name,
      reason: formData.reason,
      status: formData.status,
      created_at: editingItem?.created_at || new Date().toISOString()
    };

    try {
      if (editingItem) {
        await supabase.from("proxy_classes").update(payload).eq("id", editingItem.id);
      } else {
        await supabase.from("proxy_classes").insert([payload]);
      }
    } catch (err) {
      console.warn("Supabase save attempt skipped or failed, saving locally.");
    }

    let updatedList: ProxyClass[];
    if (editingItem) {
      updatedList = proxyList.map(p => p.id === editingItem.id ? payload : p);
    } else {
      updatedList = [payload, ...proxyList];
    }

    setProxyList(updatedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    setSaving(false);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this proxy class assignment?")) return;

    try {
      await supabase.from("proxy_classes").delete().eq("id", id);
    } catch (e) {
      console.warn("Supabase delete failed, removing locally.");
    }

    const updated = proxyList.filter(item => item.id !== id);
    setProxyList(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  const toggleStatus = async (item: ProxyClass) => {
    const nextStatus: "Assigned" | "Completed" | "Cancelled" = 
      item.status === "Assigned" ? "Completed" : item.status === "Completed" ? "Cancelled" : "Assigned";

    const updatedItem = { ...item, status: nextStatus };

    try {
      await supabase.from("proxy_classes").update({ status: nextStatus }).eq("id", item.id);
    } catch (e) {}

    const updatedList = proxyList.map(p => p.id === item.id ? updatedItem : p);
    setProxyList(updatedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
  };

  // Filtering
  const filteredList = proxyList.filter(item => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      item.absent_teacher_name.toLowerCase().includes(searchLower) ||
      item.proxy_teacher_name.toLowerCase().includes(searchLower) ||
      item.class_name.toLowerCase().includes(searchLower) ||
      item.subject_name.toLowerCase().includes(searchLower) ||
      (item.reason && item.reason.toLowerCase().includes(searchLower)) ||
      (item.date && item.date.includes(searchLower));

    const matchesDate = !filterDate || item.date === filterDate;
    const matchesStatus = filterStatus === "All" || item.status === filterStatus;
    const matchesClass = filterClass === "All" || item.class_name === filterClass;

    return matchesSearch && matchesDate && matchesStatus && matchesClass;
  });

  const formatTeacherName = (t: Teacher) => {
    return `${t.first_name} ${t.middle_name ? t.middle_name + " " : ""}${t.last_name}`;
  };

  const todayBs = getCurrentBsDate();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-brand-800 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-7 h-7 text-blue-200" />
              <h2 className="text-2xl font-bold">Proxy Class Management</h2>
            </div>
            <p className="text-blue-100 text-sm max-w-2xl">
              Assign substitute teachers according to the <span className="font-semibold text-yellow-300">Nepali B.S. Calendar</span>. Track and manage class substitutions easily.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-blue-900 rounded-xl font-bold shadow-md hover:bg-blue-50 transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5 text-blue-700" />
            Assign Proxy Class
          </button>
        </div>

        {/* Quick Stats Banner inside header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/15 text-white">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-xs uppercase text-blue-200 font-semibold tracking-wider">Total Proxies</span>
            <div className="text-2xl font-black mt-1">{proxyList.length}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-xs uppercase text-blue-200 font-semibold tracking-wider">Today ({todayBs} BS)</span>
            <div className="text-2xl font-black mt-1">
              {proxyList.filter(p => p.date === todayBs).length}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-xs uppercase text-emerald-200 font-semibold tracking-wider">Completed</span>
            <div className="text-2xl font-black mt-1 text-emerald-300">
              {proxyList.filter(p => p.status === "Completed").length}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-xs uppercase text-amber-200 font-semibold tracking-wider">Assigned / Active</span>
            <div className="text-2xl font-black mt-1 text-amber-300">
              {proxyList.filter(p => p.status === "Assigned").length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search teacher, class, subject, date (e.g. 2083-06-13)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
            />
          </div>

          {/* Date Filter Component */}
          <div className="relative">
            <NepaliDatePicker
              value={filterDate}
              onChange={(bsDate) => setFilterDate(bsDate)}
            />
            {filterDate && (
              <button 
                onClick={() => setFilterDate("")} 
                className="absolute right-1 top-1 text-[10px] text-red-500 hover:text-red-700 bg-red-50 rounded px-1 border border-red-200"
              >
                Clear Date Filter
              </button>
            )}
          </div>

          {/* Class Filter */}
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 self-end"
          >
            <option value="All">All Classes</option>
            {DEFAULT_CLASSES.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex gap-2 self-end">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button
              onClick={fetchProxyClasses}
              className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
              title="Refresh List"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wider whitespace-nowrap">
                <th className="px-4 py-3 font-semibold">S.N</th>
                <th className="px-4 py-3 font-semibold">Nepali Date (B.S.)</th>
                <th className="px-4 py-3 font-semibold">Class & Section</th>
                <th className="px-4 py-3 font-semibold">Period / Time</th>
                <th className="px-4 py-3 font-semibold">Absent Teacher</th>
                <th className="px-4 py-3 font-semibold">Substitute (Proxy) Teacher</th>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Reason</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-slate-500 text-sm">Loading proxy class records...</p>
                  </td>
                </tr>
              ) : filteredList.length > 0 ? (
                filteredList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-blue-50/40 transition-colors text-sm whitespace-nowrap">
                    <td className="px-4 py-3 text-slate-500 font-medium">{index + 1}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span className="bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                          {formatBsDateDisplay(item.date)} B.S.
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {item.class_name} <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">Sec {item.section || 'A'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {item.period}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-red-700 font-medium bg-red-50/50 rounded-lg">
                      <div className="flex items-center gap-1.5">
                        <UserX className="w-3.5 h-3.5 text-red-500" />
                        {item.absent_teacher_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-emerald-800 font-bold bg-emerald-50/60 rounded-lg">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {item.proxy_teacher_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-blue-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        {item.subject_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate text-xs" title={item.reason}>
                      {item.reason || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-transform active:scale-95 ${
                          item.status === "Completed"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                            : item.status === "Cancelled"
                            ? "bg-red-100 text-red-800 border border-red-300 hover:bg-red-200"
                            : "bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200"
                        }`}
                        title="Click to toggle status"
                      >
                        {item.status === "Completed" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {item.status === "Cancelled" && <XCircle className="w-3 h-3 text-red-600" />}
                        {item.status === "Assigned" && <AlertCircle className="w-3 h-3 text-blue-600" />}
                        {item.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit Proxy"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete Proxy"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                    <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-base font-semibold text-slate-700">No Proxy Class Records Found</p>
                    <p className="text-xs text-slate-400 mt-1">Click "Assign Proxy Class" to assign a substitute teacher.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal with Nepali B.S. Date Picker */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-blue-200" />
                <h3 className="text-lg font-bold">
                  {editingItem ? "Edit Proxy Class Assignment" : "Assign Proxy Class"}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-blue-200 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800 text-sm">
              {/* Nepali Date Picker Field */}
              <NepaliDatePicker
                label="Date (Nepali BS Calendar)"
                required
                value={formData.date}
                onChange={(bsDate) => setFormData({ ...formData, date: bsDate })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Class */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Class *</label>
                  <select
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {DEFAULT_CLASSES.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="All">All Sections</option>
                  </select>
                </div>

                {/* Period */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Period / Time *</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                  >
                    {DEFAULT_PERIODS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                {/* Absent Teacher */}
                <div>
                  <label className="block font-medium text-red-700 mb-1 flex items-center gap-1">
                    <UserX className="w-4 h-4" /> Absent Teacher *
                  </label>
                  {teachers.length > 0 ? (
                    <select
                      value={formData.absent_teacher_name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const t = teachers.find(item => formatTeacherName(item) === name);
                        setFormData({
                          ...formData,
                          absent_teacher_name: name,
                          absent_teacher_id: t ? t.id : ""
                        });
                      }}
                      className="w-full px-3 py-2 border border-red-300 bg-red-50/30 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-medium text-slate-800"
                    >
                      <option value="">-- Select Absent Teacher --</option>
                      {teachers.map(t => {
                        const name = formatTeacherName(t);
                        return <option key={t.id} value={name}>{name}</option>;
                      })}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Enter Absent Teacher Name"
                      required
                      value={formData.absent_teacher_name}
                      onChange={(e) => setFormData({ ...formData, absent_teacher_name: e.target.value })}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  )}
                </div>

                {/* Substitute / Proxy Teacher */}
                <div>
                  <label className="block font-medium text-emerald-700 mb-1 flex items-center gap-1">
                    <UserCheck className="w-4 h-4" /> Proxy Teacher (Substitute) *
                  </label>
                  {teachers.length > 0 ? (
                    <select
                      value={formData.proxy_teacher_name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const t = teachers.find(item => formatTeacherName(item) === name);
                        setFormData({
                          ...formData,
                          proxy_teacher_name: name,
                          proxy_teacher_id: t ? t.id : ""
                        });
                      }}
                      className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50/30 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-800"
                    >
                      <option value="">-- Select Proxy Teacher --</option>
                      {teachers.map(t => {
                        const name = formatTeacherName(t);
                        return <option key={t.id} value={name}>{name}</option>;
                      })}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Enter Proxy Teacher Name"
                      required
                      value={formData.proxy_teacher_name}
                      onChange={(e) => setFormData({ ...formData, proxy_teacher_name: e.target.value })}
                      className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Subject & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Subject *</label>
                  {subjects.length > 0 ? (
                    <select
                      value={formData.subject_name}
                      onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.subject_name}>{s.subject_name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Mathematics, English"
                      required
                      value={formData.subject_name}
                      onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  >
                    <option value="Assigned">Assigned</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Reason / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Casual Leave, Sick Leave, Emergency Duty"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-colors font-bold shadow-md disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingItem ? "Update Assignment" : "Save Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
