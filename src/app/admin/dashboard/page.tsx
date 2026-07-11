"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import ManageStudents from "@/components/admin/ManageStudents";
import ManageTeachers from "@/components/admin/ManageTeachers";
import ManageSubjects from "@/components/admin/ManageSubjects";
import { 
  LayoutDashboard, 
  CalendarClock, 
  BookMarked, 
  FileSpreadsheet, 
  Users, 
  LogOut,
  ArrowRight,
  Settings,
  Bell,
  GraduationCap,
  UserCog,
  BookOpen,
  ClipboardCheck,
  IdCard,
  FileEdit,
  Library,
  FileText
} from "lucide-react";

type Stat = {
  label: string;
  value: number;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    students: 0,
    subjects: 0,
    marksEntries: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentMarks, setRecentMarks] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch counts
        const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
        const { count: subjectCount } = await supabase.from('subjects').select('*', { count: 'exact', head: true });
        const { count: marksCount } = await supabase.from('marks').select('*', { count: 'exact', head: true });
        
        setStats({
          students: studentCount || 0,
          subjects: subjectCount || 0,
          marksEntries: marksCount || 0
        });

        // Fetch recent marks for ledger preview
        const { data: recent } = await supabase
          .from('marks')
          .select(`
            id,
            marks_obtained,
            students ( name, class, roll_no ),
            subjects ( subject_name )
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recent) setRecentMarks(recent);

      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-600"></div>
        </div>
      );
    }

    if (activeTab === "students") {
      return <ManageStudents />;
    }

    if (activeTab === "teachers") {
      return <ManageTeachers />;
    }

    if (activeTab === "subjects") {
      return <ManageSubjects />;
    }

    return (
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 font-medium">Total Students</h3>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-5 h-5" /></div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats.students}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 font-medium">Subjects</h3>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><BookMarked className="w-5 h-5" /></div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats.subjects}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 font-medium">Marks Entries</h3>
              <div className="p-2 bg-green-50 text-green-600 rounded-lg"><FileSpreadsheet className="w-5 h-5" /></div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats.marksEntries}</p>
          </div>
        </div>

        {/* Interactive Grid Panels */}
        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">Exam Section Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl shadow-md text-white p-6 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="absolute right-0 top-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <CalendarClock className="w-10 h-10 mb-4 text-brand-200" />
            <h3 className="text-xl font-bold mb-2">Create Routine</h3>
            <p className="text-brand-100 text-sm mb-6">Schedule examination dates and assign invigilators.</p>
            <div className="flex items-center text-sm font-medium text-white">
              Open Tool <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-md text-white p-6 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="absolute right-0 top-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <BookMarked className="w-10 h-10 mb-4 text-purple-200" />
            <h3 className="text-xl font-bold mb-2">Mark Ledger</h3>
            <p className="text-purple-100 text-sm mb-6">Review raw marks submitted by teachers across all classes.</p>
            <div className="flex items-center text-sm font-medium text-white">
              Open Tool <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl shadow-md text-white p-6 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="absolute right-0 top-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <FileSpreadsheet className="w-10 h-10 mb-4 text-emerald-200" />
            <h3 className="text-xl font-bold mb-2">Tabulation Sheets</h3>
            <p className="text-emerald-100 text-sm mb-6">Generate official report cards and tabulation sheets.</p>
            <div className="flex items-center text-sm font-medium text-white">
              Open Tool <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>

        {/* Recent Data Table (Preview of Ledger) */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">Recent Mark Entries</h2>
            <button className="text-brand-600 hover:text-brand-700 text-sm font-medium">View Full Ledger</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Student</th>
                  <th className="px-6 py-4 font-medium">Class</th>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium text-right">Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentMarks.length > 0 ? (
                  recentMarks.map((mark, i) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-800">
                        {mark.marks_obtained}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No mark entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-brand-950 text-white shadow-xl flex-shrink-0 hidden md:flex md:flex-col">
        <div className="h-16 flex items-center px-6 bg-brand-900 border-b border-white/10">
          <span className="font-bold text-xl tracking-tight">Admin Portal</span>
        </div>
        <div className="flex-1 overflow-y-auto py-6">
          <div className="px-4 mb-2 text-xs font-semibold text-brand-400 uppercase tracking-wider">
            Exam Section
          </div>
          <nav className="space-y-1 px-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "overview" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("routine")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "routine" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <CalendarClock className="w-5 h-5 mr-3" />
              Create Routine
            </button>
            <button
              onClick={() => setActiveTab("subjects")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "subjects" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <BookOpen className="w-5 h-5 mr-3" />
              Subject Management
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "attendance" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <ClipboardCheck className="w-5 h-5 mr-3" />
              Attendance
            </button>
            <button
              onClick={() => setActiveTab("admit-card")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "admit-card" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <IdCard className="w-5 h-5 mr-3" />
              Admit Card
            </button>
            <button
              onClick={() => setActiveTab("mark-entry")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "mark-entry" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <FileEdit className="w-5 h-5 mr-3" />
              Mark Entry
            </button>
            <button
              onClick={() => setActiveTab("ledger")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "ledger" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <BookMarked className="w-5 h-5 mr-3" />
              Mark Ledger
            </button>
            <button
              onClick={() => setActiveTab("grade-ledger")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "grade-ledger" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <Library className="w-5 h-5 mr-3" />
              Grade Ledger
            </button>
            <button
              onClick={() => setActiveTab("grade-sheet")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "grade-sheet" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <FileText className="w-5 h-5 mr-3" />
              Grade Sheet
            </button>
            <button
              onClick={() => setActiveTab("tabulation")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "tabulation" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 mr-3" />
              Tabulation Sheets
            </button>
          </nav>
          
          <div className="px-4 mt-8 mb-2 text-xs font-semibold text-brand-400 uppercase tracking-wider">
            User Management
          </div>
          <nav className="space-y-1 px-2">
            <button
              onClick={() => setActiveTab("students")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "students" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <GraduationCap className="w-5 h-5 mr-3" />
              Manage Students
            </button>
            <button
              onClick={() => setActiveTab("teachers")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "teachers" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <UserCog className="w-5 h-5 mr-3" />
              Manage Teachers
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-white/10">
          <Link 
            href="/"
            className="flex items-center px-4 py-3 text-sm font-medium text-brand-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors w-full"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Back to Home
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex md:hidden items-center">
            <span className="font-bold text-lg text-slate-800">Admin Portal</span>
          </div>
          <div className="hidden md:flex items-center">
            <h1 className="text-xl font-semibold text-slate-800 capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-slate-500 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-500 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
              AD
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
