"use client";

import { BookOpen } from "lucide-react";

export default function Ledger() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-brand-600" />
            Ledger
          </h2>
          <p className="text-sm text-slate-500 mt-1">General Ledger Overview.</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
        <p>Ledger functionality is coming soon.</p>
      </div>
    </div>
  );
}
