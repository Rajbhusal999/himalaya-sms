"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Users, ShieldCheck, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 p-4">
      <div className="relative w-full max-w-md">
        {/* Decorative background blur */}
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-400 to-brand-300 rounded-2xl blur opacity-30 animate-pulse"></div>
        
        <div className="relative glass-panel rounded-2xl p-8 md:p-12 text-center text-white shadow-2xl border border-white/10 transition-all duration-500">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/10 rounded-full border border-white/20">
              <GraduationCap className="w-12 h-12 text-brand-100" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Exam Management System</h1>
          <p className="text-brand-200 mb-8 font-medium">Welcome to the portal</p>
          
          {!showOptions ? (
            <button
              onClick={() => setShowOptions(true)}
              className="w-full py-4 px-6 bg-brand-500 hover:bg-brand-600 hover-glow text-white rounded-xl font-semibold text-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 shadow-lg"
            >
              Shree Himalaya Basic School
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Link 
                href="/admin/dashboard"
                className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-3 group"
              >
                <ShieldCheck className="w-5 h-5 text-brand-300 group-hover:text-brand-200" />
                School / Admin Login
              </Link>
              
              <Link 
                href="/teacher/login"
                className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-3 group"
              >
                <Users className="w-5 h-5 text-brand-300 group-hover:text-brand-200" />
                Teacher Login
              </Link>
              
              <button
                onClick={() => setShowOptions(false)}
                className="mt-6 text-sm text-brand-300 hover:text-white transition-colors"
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
