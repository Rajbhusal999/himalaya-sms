"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, LogOut, User, GraduationCap, MessageSquare } from "lucide-react";
import MarkEntry from "@/components/admin/MarkEntry";
import StaffChat from "@/components/chat/StaffChat";

export default function TeacherDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"marks" | "chat">("marks");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { validateSession } = await import("@/app/actions/auth");
        const session = await validateSession();
        
        if (!session || session.role !== "teacher") {
          router.push("/teacher/login");
        } else {
          const name = session.teachers 
            ? `${session.teachers.first_name} ${session.teachers.last_name}`
            : "Teacher";
          setTeacherName(name);
          setLoading(false);
        }
      } catch (err) {
        console.error("Session check failed", err);
        router.push("/teacher/login");
      }
    };
    checkSession();
  }, [router]);

  // Sync tab from URL on mount and popstate (handles back button)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "marks" || tab === "chat") {
      setActiveTab(tab);
    }

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const currentTab = params.get("tab") || "marks";
      if (currentTab === "marks" || currentTab === "chat") {
        setActiveTab(currentTab);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleTabClick = (tab: "marks" | "chat") => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState({}, "", url);
  };

  const handleLogout = async () => {
    const { clearSession } = await import("@/app/actions/auth");
    await clearSession();
    router.push("/teacher/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-brand-900 text-white shadow-md flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-brand-300 mr-3" />
              <span className="font-bold text-xl tracking-tight hidden sm:block">Shree Himalaya Basic School</span>
              <span className="font-bold text-xl tracking-tight sm:hidden">SHBS</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm font-medium text-brand-200">
                <User className="w-4 h-4 mr-1.5" />
                {teacherName}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-brand-200 hover:text-white hover:bg-white/10 transition-colors"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Teacher Portal</h1>
          <p className="text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-brand-600">{teacherName}</span>
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => handleTabClick("marks")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "marks"
                ? "bg-brand-600 text-white shadow-md shadow-brand-500/30"
                : "bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-600"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Mark Entry
          </button>
          <button
            onClick={() => handleTabClick("chat")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "chat"
                ? "bg-brand-600 text-white shadow-md shadow-brand-500/30"
                : "bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-600"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Staff Chat
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "marks" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <MarkEntry />
          </div>
        )}

        {activeTab === "chat" && teacherName && (
          <StaffChat senderName={teacherName} senderRole="teacher" />
        )}
      </main>
    </div>
  );
}
