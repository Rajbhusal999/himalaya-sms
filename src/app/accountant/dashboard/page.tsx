"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { validateSession, clearSession } from "@/app/actions/auth";
import {
  LayoutDashboard,
  ReceiptText,
  BarChart3,
  LogOut,
  Menu,
  X,
  ArrowRight,
  Calculator,
  UserCircle,
  FolderTree,
  BookText,
  TrendingUp,
  TrendingDown,
  Landmark,
  PieChart,
  Scale
} from "lucide-react";
import ManageTopics from "@/components/accountant/ManageTopics";
import EntryVoucher from "@/components/accountant/EntryVoucher";

export default function AccountantDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Authentication Check
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await validateSession();
        
        if (!session || session.role !== "accountant") {
          router.push("/accountant/login");
        } else {
          setIsAuthChecking(false);
        }
      } catch (err) {
        console.error("Session check failed", err);
        router.push("/accountant/login");
      }
    };
    checkSession();
  }, [router]);

  // Sync tab from URL on mount and popstate
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

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);

    // Update URL without full page reload
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState({}, "", url);
  };

  const handleLogout = async () => {
    await clearSession();
    router.push("/accountant/login");
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const renderContent = () => {

    if (activeTab === "report") {
      const reports = [
        { id: 'bank-nagadi', name: 'Bank Nagadi Kitab', np: 'बैंक नगदी किताब', icon: BookText, color: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:border-blue-500' },
        { id: 'aamdani-khata', name: 'Aamdani Khata', np: 'आम्दानी खाता', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', hover: 'hover:border-emerald-500' },
        { id: 'kharcha-khata', name: 'Kharcha Khata', np: 'खर्च खाता', icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50', hover: 'hover:border-rose-500' },
        { id: 'nagad-bank', name: 'Nagad Bank Khata', np: 'नगद बैंक खाता', icon: Landmark, color: 'text-purple-600', bg: 'bg-purple-50', hover: 'hover:border-purple-500' },
        { id: 'aaya-vyaya', name: 'Aaya Vyaya', np: 'आय व्यय', icon: PieChart, color: 'text-amber-600', bg: 'bg-amber-50', hover: 'hover:border-amber-500' },
        { id: 'trial-balance', name: 'Trial Balance', np: 'सन्तुलन परीक्षण', icon: Scale, color: 'text-indigo-600', bg: 'bg-indigo-50', hover: 'hover:border-indigo-500' }
      ];

      return (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Financial Reports</h2>
              <p className="text-slate-500">Select a report to generate and view data.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <button
                key={report.id}
                type="button"
                className={`flex flex-col items-start p-6 bg-white border-2 border-slate-100 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${report.hover} group text-left w-full relative overflow-hidden`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${report.bg} ${report.color}`}>
                  <report.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-slate-900 mb-1">{report.name}</h3>
                <p className="text-sm font-semibold text-slate-500">{report.np}</p>
                <ArrowRight className={`absolute bottom-6 right-6 w-5 h-5 opacity-0 -translate-x-4 transition-all group-hover:opacity-100 group-hover:translate-x-0 ${report.color}`} />
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === "voucher") {
      return <EntryVoucher />;
    }

    if (activeTab === "topics") {
      return <ManageTopics />;
    }

    return (
      <div className="space-y-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Welcome, Accountant! 👋</h1>
            <p className="text-slate-500 text-lg">Manage the school's finances, vouchers, and generate reports.</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-full">
            <UserCircle className="w-16 h-16 text-emerald-600" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">Quick Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div 
            onClick={() => handleTabClick("report")}
            className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-md text-white p-6 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className="absolute right-0 top-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <BarChart3 className="w-10 h-10 mb-4 text-blue-200" />
            <h3 className="text-xl font-bold mb-2">Financial Reports</h3>
            <p className="text-blue-100 text-sm mb-6">View day books, ledgers, and financial summary reports.</p>
            <div className="flex items-center text-sm font-medium text-white">
              Open Tool <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div 
            onClick={() => handleTabClick("voucher")}
            className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl shadow-md text-white p-6 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className="absolute right-0 top-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <Calculator className="w-10 h-10 mb-4 text-emerald-100" />
            <h3 className="text-xl font-bold mb-2">Entry Voucher</h3>
            <p className="text-emerald-100 text-sm mb-6">Create new accounting vouchers and transactions.</p>
            <div className="flex items-center text-sm font-medium text-white">
              Open Tool <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div 
            onClick={() => handleTabClick("topics")}
            className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-xl shadow-md text-white p-6 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className="absolute right-0 top-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <FolderTree className="w-10 h-10 mb-4 text-violet-200" />
            <h3 className="text-xl font-bold mb-2">Topics & Categories</h3>
            <p className="text-violet-100 text-sm mb-6">Manage accounting topics and subtopics for vouchers.</p>
            <div className="flex items-center text-sm font-medium text-white">
              Open Tool <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`w-64 bg-slate-900 text-white shadow-xl flex-shrink-0 flex-col fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 flex ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 bg-slate-950 border-b border-white/10">
          <span className="font-bold text-xl tracking-tight text-emerald-400">Accountant</span>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md -mr-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-6">
          <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Finance Menu
          </div>
          <nav className="space-y-1 px-2">
            <button
              onClick={() => handleTabClick("overview")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "overview" 
                  ? "bg-emerald-600 text-white" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Overview
            </button>
            <button
              onClick={() => handleTabClick("voucher")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "voucher" 
                  ? "bg-emerald-600 text-white" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <ReceiptText className="w-5 h-5 mr-3" />
              Entry Voucher
            </button>
            <button
              onClick={() => handleTabClick("report")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "report" 
                  ? "bg-emerald-600 text-white" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <BarChart3 className="w-5 h-5 mr-3" />
              Reports
            </button>
            <button
              onClick={() => handleTabClick("topics")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "topics" 
                  ? "bg-emerald-600 text-white" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <FolderTree className="w-5 h-5 mr-3" />
              Topics & Subtopics
            </button>
          </nav>
        </div>
        <div className="p-4 bg-slate-950 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors font-medium text-sm border border-red-500/20"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0 shadow-sm">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="mr-4 p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 md:hidden focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-800 capitalize tracking-tight">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-bold tracking-wide">
              Accounting Portal
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
