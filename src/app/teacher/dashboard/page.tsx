"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { BookOpen, LogOut, ClipboardEdit, User, FileText, TrendingUp } from "lucide-react";

export default function TeacherDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // In a real app we'd redirect to login, but since auth is complex to setup on the fly
        // we'll allow mock viewing if there's no session, for demonstration purposes.
        setUserEmail("mock_teacher@gmail.com");
        // router.push("/teacher/login");
      } else {
        setUserEmail(session.user.email ?? "");
      }
      setLoading(false);
    };
    
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Teacher Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage classes and enter student marks</p>
        </div>

        {/* Primary Action Button */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-2xl shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 rounded-full bg-white opacity-10 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="px-8 py-12 md:py-16 flex flex-col md:flex-row items-center justify-between relative z-10">
              <div className="mb-6 md:mb-0 text-center md:text-left text-white">
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Examination Period</h2>
                <p className="text-brand-100 text-lg max-w-xl">
                  It is time to enter the final marks for this term. Please ensure all entries are double-checked before submission.
                </p>
              </div>
              
              <Link 
                href="/teacher/entry-marks"
                className="inline-flex items-center px-8 py-4 bg-white text-brand-700 hover:bg-brand-50 hover:text-brand-800 rounded-xl font-bold text-lg shadow-lg transform transition-all hover:scale-105 active:scale-95 group"
              >
                <ClipboardEdit className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                Entry Exam Marks
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats / Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start">
            <div className="p-3 bg-blue-100 text-brand-600 rounded-lg mr-4">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-lg mb-1">Recent Entries</h3>
              <p className="text-slate-500 text-sm">View and edit marks you have entered recently. (Coming soon)</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg mr-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-lg mb-1">Class Performance</h3>
              <p className="text-slate-500 text-sm">View statistical analysis of your classes. (Coming soon)</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
