"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import ManageStudents from "@/components/admin/ManageStudents";
import ManageTeachers from "@/components/admin/ManageTeachers";
import ManageSubjects from "@/components/admin/ManageSubjects";
import ManageAttendance from "@/components/admin/ManageAttendance";
import ManageAdmitCards from "@/components/admin/ManageAdmitCards";
import CreateRoutine from "@/components/admin/CreateRoutine";
import MarkEntry from "@/components/admin/MarkEntry";
import MarkLedger from "@/components/admin/MarkLedger";
import Ledger from "@/components/admin/Ledger";
import GradeLedger from "@/components/admin/GradeLedger";
import GradeSheet from "@/components/admin/GradeSheet";
import ReportsDashboard from "@/components/admin/ReportsDashboard";
import ManageNews from "@/components/admin/ManageNews";
import ManageAdmissions from "@/components/admin/ManageAdmissions";
import ManageSettings from "@/components/admin/ManageSettings";
import StaffChat from "@/components/chat/StaffChat";
import ManageRatings from "@/components/admin/ManageRatings";
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
  FileText,
  BarChart3,
  Menu,
  X,
  Megaphone,
  MessageSquare,
  Star
} from "lucide-react";

type Stat = {
  label: string;
  value: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    admissions: 0,
    subjects: 0
  });
  const [loading, setLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [recentMarks, setRecentMarks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Authentication Check
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { validateSession } = await import("@/app/actions/auth");
        const session = await validateSession();
        
        if (!session || session.role !== "admin") {
          router.push("/admin/login");
        } else {
          setIsAuthChecking(false);
        }
      } catch (err) {
        console.error("Session check failed", err);
        router.push("/admin/login");
      }
    };
    checkSession();
  }, [router]);

  // Sync tab from URL on mount and popstate (handles back button/mobile swipe back)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
    }

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const currentTab = params.get("tab") || "overview";
      setActiveTab(currentTab);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch counts
        const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
        const { count: teacherCount } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
        const { count: admissionCount } = await supabase.from('admissions').select('*', { count: 'exact', head: true }).eq('status', 'New');
        const { count: subjectCount } = await supabase.from('subjects').select('*', { count: 'exact', head: true });
        
        setStats({
          students: studentCount || 0,
          teachers: teacherCount || 0,
          admissions: admissionCount || 0,
          subjects: subjectCount || 0
        });

        // Fetch recent marks for ledger preview
        const { data: recent } = await supabase
          .from('marks')
          .select(`
            id,
            total,
            written_final,
            term_exam,
            students ( name, class, roll_no ),
            subjects ( subject_name ),
            teachers ( first_name, last_name )
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recent) setRecentMarks(recent);

        // Fetch Real Notifications
        const [admissionsRes, messagesRes, ratingsRes] = await Promise.all([
          supabase.from('admissions').select('id, student_name, created_at, class_applied').eq('status', 'New').order('created_at', { ascending: false }).limit(3),
          supabase.from('messages').select('id, sender_name, created_at').order('created_at', { ascending: false }).limit(3),
          supabase.from('ratings').select('id, name, rating, created_at').order('created_at', { ascending: false }).limit(3)
        ]);

        const notifs: any[] = [];
        if (admissionsRes.data) {
          admissionsRes.data.forEach(adm => {
            notifs.push({
              id: `adm_${adm.id}`,
              type: 'admission',
              title: `New admission received for Class ${adm.class_applied}`,
              subtitle: adm.student_name,
              created_at: new Date(adm.created_at)
            });
          });
        }
        if (messagesRes.data) {
          messagesRes.data.forEach(msg => {
            notifs.push({
              id: `msg_${msg.id}`,
              type: 'message',
              title: `New message from ${msg.sender_name}`,
              subtitle: 'Check Staff Chat',
              created_at: new Date(msg.created_at)
            });
          });
        }
        if (ratingsRes.data) {
          ratingsRes.data.forEach(rating => {
            notifs.push({
              id: `rating_${rating.id}`,
              type: 'rating',
              title: `New ${rating.rating}-star review from ${rating.name}`,
              subtitle: 'Check Ratings & Reviews',
              created_at: new Date(rating.created_at)
            });
          });
        }

        notifs.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        setNotifications(notifs.slice(0, 5));

      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Real-time subscriptions — auto-refresh overview stats on any DB change
    const channels = [
      supabase.channel("rt-students").on("postgres_changes", { event: "*", schema: "public", table: "students" }, fetchDashboardData).subscribe(),
      supabase.channel("rt-teachers").on("postgres_changes", { event: "*", schema: "public", table: "teachers" }, fetchDashboardData).subscribe(),
      supabase.channel("rt-admissions").on("postgres_changes", { event: "*", schema: "public", table: "admissions" }, fetchDashboardData).subscribe(),
      supabase.channel("rt-marks").on("postgres_changes", { event: "*", schema: "public", table: "marks" }, fetchDashboardData).subscribe(),
      supabase.channel("rt-subjects").on("postgres_changes", { event: "*", schema: "public", table: "subjects" }, fetchDashboardData).subscribe(),
    ];

    return () => { channels.forEach(c => supabase.removeChannel(c)); };
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

    if (activeTab === "attendance") {
      return <ManageAttendance />;
    }

    if (activeTab === "routine") {
      return <CreateRoutine onRoutineSaved={() => handleTabClick("admit-card")} />;
    }

    if (activeTab === "admit-card") {
      return <ManageAdmitCards />;
    }

    if (activeTab === "mark-entry") {
      return <MarkEntry />;
    }

    if (activeTab === "ledger") {
      return <Ledger />;
    }

    if (activeTab === "mark-ledger") {
      return <MarkLedger />;
    }

    if (activeTab === "grade-ledger") {
      return <GradeLedger />;
    }

    if (activeTab === "grade-sheet") {
      return <GradeSheet />;
    }

    if (activeTab === "reports") {
      return <ReportsDashboard />;
    }

    if (activeTab === "news") {
      return <ManageNews />;
    }

    if (activeTab === "admissions") {
      return <ManageAdmissions />;
    }

    if (activeTab === "settings") {
      return <ManageSettings />;
    }

    if (activeTab === "chat") {
      return <StaffChat senderName="Admin" senderRole="admin" />;
    }

    if (activeTab === "ratings") {
      return <ManageRatings />;
    }

    return (
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg shadow-blue-500/20 p-6 text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Total Students</p>
                <h3 className="text-4xl font-bold">{stats.students}</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-sm text-blue-100 font-medium relative z-10 flex items-center gap-1 cursor-pointer hover:text-white" onClick={() => handleTabClick("students")}>
              View details <ArrowRight className="w-4 h-4" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-lg shadow-purple-500/20 p-6 text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-purple-100 text-sm font-medium uppercase tracking-wider mb-1">Total Teachers</p>
                <h3 className="text-4xl font-bold">{stats.teachers}</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <UserCog className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-sm text-purple-100 font-medium relative z-10 flex items-center gap-1 cursor-pointer hover:text-white" onClick={() => handleTabClick("teachers")}>
              Manage faculty <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl shadow-lg shadow-amber-500/20 p-6 text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-amber-100 text-sm font-medium uppercase tracking-wider mb-1">New Admissions</p>
                <h3 className="text-4xl font-bold">{stats.admissions}</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <ClipboardCheck className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-sm text-amber-100 font-medium relative z-10 flex items-center gap-1 cursor-pointer hover:text-white" onClick={() => handleTabClick("admissions")}>
              Review applications <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl shadow-lg shadow-emerald-500/20 p-6 text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider mb-1">Total Subjects</p>
                <h3 className="text-4xl font-bold">{stats.subjects}</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BookMarked className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-sm text-emerald-100 font-medium relative z-10 flex items-center gap-1 cursor-pointer hover:text-white" onClick={() => handleTabClick("subjects")}>
              View curriculum <ArrowRight className="w-4 h-4" />
            </div>
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

          <div onClick={() => handleTabClick("reports")} className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl shadow-md text-white p-6 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="absolute right-0 top-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <BarChart3 className="w-10 h-10 mb-4 text-emerald-200" />
            <h3 className="text-xl font-bold mb-2">Reports & Analysis</h3>
            <p className="text-emerald-100 text-sm mb-6">Generate official reports, analytics, and tabulation sheets.</p>
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
                  <th className="px-6 py-4 font-medium">Entered By</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {mark.teachers ? `${mark.teachers.first_name} ${mark.teachers.last_name}` : 'Admin'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-800">
                        {mark.total || mark.written_final || mark.term_exam || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
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

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);

    // Update URL without full page reload to support back button/swipe back
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState({}, "", url);
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return "Just now";
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex print:block print:bg-white overflow-hidden">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`w-64 bg-brand-950 text-white shadow-xl flex-shrink-0 flex-col print:hidden fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 flex ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 bg-brand-900 border-b border-white/10">
          <span className="font-bold text-xl tracking-tight">Admin Portal</span>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 text-brand-200 hover:text-white hover:bg-brand-800 rounded-md -mr-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-6">
          <div className="px-4 mb-2 text-xs font-semibold text-brand-400 uppercase tracking-wider">
            Exam Section
          </div>
          <nav className="space-y-1 px-2">
            <button
              onClick={() => handleTabClick("overview")}
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
              onClick={() => handleTabClick("routine")}
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
              onClick={() => handleTabClick("subjects")}
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
              onClick={() => handleTabClick("attendance")}
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
              onClick={() => handleTabClick("admit-card")}
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
              onClick={() => handleTabClick("mark-entry")}
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
              onClick={() => handleTabClick("ledger")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "ledger" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <BookOpen className="w-5 h-5 mr-3" />
              Ledger
            </button>
            <button
              onClick={() => handleTabClick("mark-ledger")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "mark-ledger" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <BookMarked className="w-5 h-5 mr-3" />
              Mark Ledger
            </button>
            <button
              onClick={() => handleTabClick("grade-ledger")}
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
              onClick={() => handleTabClick("grade-sheet")}
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
              onClick={() => handleTabClick("reports")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "reports" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <BarChart3 className="w-5 h-5 mr-3" />
              Reports
            </button>
            <button
              onClick={() => handleTabClick("news")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "news" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <Megaphone className="w-5 h-5 mr-3" />
              Manage News
            </button>
            <button
              onClick={() => handleTabClick("admissions")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "admissions" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <ClipboardCheck className="w-5 h-5 mr-3" />
              Admissions
            </button>
          </nav>

          <div className="px-4 mt-8 mb-2 text-xs font-semibold text-brand-400 uppercase tracking-wider">
            Communication
          </div>
          <nav className="space-y-1 px-2">
            <button
              onClick={() => handleTabClick("chat")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "chat" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              Staff Chat
            </button>
            <button
              onClick={() => handleTabClick("ratings")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "ratings" 
                  ? "bg-brand-800 text-white" 
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              }`}
            >
              <Star className="w-5 h-5 mr-3" />
              Ratings & Reviews
            </button>
          </nav>
          
          <div className="px-4 mt-8 mb-2 text-xs font-semibold text-brand-400 uppercase tracking-wider">
            User Management
          </div>
          <nav className="space-y-1 px-2">
            <button
              onClick={() => handleTabClick("students")}
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
              onClick={() => handleTabClick("teachers")}
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
          <button 
            onClick={async () => {
              const { clearSession } = await import("@/app/actions/auth");
              await clearSession();
              router.push("/admin/login");
            }}
            className="flex items-center px-4 py-3 text-sm font-medium text-brand-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors w-full text-left"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout & Home
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 print:hidden">
          <div className="flex md:hidden items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg text-slate-800">Admin Portal</span>
          </div>
          <div className="hidden md:flex items-center">
            <h1 className="text-xl font-semibold text-slate-800 capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-2 transition-colors rounded-full ${isNotificationsOpen ? 'bg-brand-100 text-brand-600' : 'text-slate-400 hover:text-slate-500 hover:bg-slate-100'}`}
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Notifications</h3>
                    <span className="text-xs text-brand-600 cursor-pointer hover:underline">Mark all as read</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => {
                            if (notif.type === 'admission') handleTabClick('admissions');
                            if (notif.type === 'message') handleTabClick('chat');
                            if (notif.type === 'rating') handleTabClick('ratings');
                            setIsNotificationsOpen(false);
                          }}
                        >
                          <div className="flex gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.type === 'admission' ? 'bg-amber-500' : notif.type === 'rating' ? 'bg-green-500' : 'bg-brand-500'}`}></div>
                            <div>
                              <p className="text-sm text-slate-800">{notif.title}</p>
                              <p className="text-xs text-slate-500 mt-1">{notif.subtitle} • {timeAgo(notif.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-slate-500 text-sm">
                        No new notifications
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-slate-100 text-center">
                    <button className="text-sm font-medium text-brand-600 hover:text-brand-700">View all notifications</button>
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={() => handleTabClick("settings")}
              className={`p-2 transition-colors rounded-full ${activeTab === 'settings' ? 'bg-brand-100 text-brand-600' : 'text-slate-400 hover:text-slate-500 hover:bg-slate-100'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
              AD
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print:overflow-visible print:p-0 print:m-0">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
