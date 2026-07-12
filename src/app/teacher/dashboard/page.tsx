"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, LogOut, User } from "lucide-react";
import MarkEntry from "@/components/admin/MarkEntry";

export default function TeacherDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // We check for the teacherId stored during login
    const teacherId = localStorage.getItem("teacherId");
    const teacherName = localStorage.getItem("teacherName");

    if (!teacherId) {
      router.push("/teacher/login");
    } else {
      setUserEmail(teacherName || "Teacher");
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("teacherId");
    localStorage.removeItem("teacherName");
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
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-brand-900 text-white shadow-md">
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
                {userEmail}
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

      {/* Main Content restricted to Mark Entry only */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Teacher Portal</h1>
          <p className="text-slate-500 mt-1">Manage and enter student marks for your classes.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <MarkEntry />
        </div>
      </main>
    </div>
  );
}
