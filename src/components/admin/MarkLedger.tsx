"use client";

import { useState } from "react";
import { BookMarked } from "lucide-react";

export default function MarkLedger() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <BookMarked className="w-6 h-6 mr-2 text-brand-600" />
            Mark Ledger
          </h2>
          <p className="text-sm text-slate-500 mt-1">View and manage the mark ledger for all classes.</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
        <p>Mark Ledger functionality is coming soon.</p>
      </div>
    </div>
  );
}
