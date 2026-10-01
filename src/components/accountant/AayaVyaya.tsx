"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Printer, FileSpreadsheet, ArrowLeft } from "lucide-react";

const SCHOOL_NAME = "श्री हिमालय आधारभूत विद्यालय , भरतपुर -११ , चितवन";
const FISCAL_YEARS = ["2081/2082", "2082/2083", "2083/2084", "2084/2085", "2085/2086"];

// Safe addition
const safeAdd = (a: number, b: number) => Math.round((a + b) * 100) / 100;

const fmt = (n: number) => {
  if (!n || n === 0) return "";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

type Topic = { id: string; name: string; type: string };
type Voucher = {
  id: string;
  topic_id: string;
  topic_type: string;
  kharcha_credit: number;
  cash_debit: number;
  bank_debit: number;
  bibidh_debit: number;
  kharcha_debit: number;
  cash_credit: number;
  bank_credit: number;
  bibidh_credit: number;
};

type Props = { onBack: () => void };

export default function AayaVyaya({ onBack }: Props) {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState("2083/2084");
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedFiscalYear]);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: vData }, { data: tData }] = await Promise.all([
      supabase
        .from("accounting_vouchers")
        .select("id,topic_id,topic_type,kharcha_credit,cash_debit,bank_debit,bibidh_debit,kharcha_debit,cash_credit,bank_credit,bibidh_credit")
        .eq("fiscal_year", selectedFiscalYear),
      supabase.from("accounting_topics").select("id,name,type").order("created_at", { ascending: true }),
    ]);
    setVouchers(vData || []);
    setTopics(tData || []);
    setLoading(false);
  };

  // Amount extraction logic
  const getIncomeAmount = (v: Voucher) =>
    v.kharcha_credit || v.cash_debit || v.bank_debit || v.bibidh_debit || 0;

  const getExpenseAmount = (v: Voucher) =>
    v.kharcha_debit || v.cash_credit || v.bank_credit || v.bibidh_credit || 0;

  // Separate topics
  const incomeTopics = topics.filter(t => t.type === "Income");
  const expenseTopics = topics.filter(t => t.type === "Expense");

  // Calculate totals per topic
  const incomeData = incomeTopics.map(t => {
    const total = vouchers
      .filter(v => v.topic_id === t.id && v.topic_type === "Income")
      .reduce((s, v) => safeAdd(s, getIncomeAmount(v)), 0);
    return { ...t, total };
  });

  const expenseData = expenseTopics.map(t => {
    const total = vouchers
      .filter(v => v.topic_id === t.id && v.topic_type === "Expense")
      .reduce((s, v) => safeAdd(s, getExpenseAmount(v)), 0);
    return { ...t, total };
  });

  // Calculate grand totals
  const totalIncome = incomeData.reduce((s, t) => safeAdd(s, t.total), 0);
  const totalExpense = expenseData.reduce((s, t) => safeAdd(s, t.total), 0);

  // Align rows (max length of both sides)
  const maxRows = Math.max(incomeData.length, expenseData.length);
  const rows = Array.from({ length: maxRows }).map((_, i) => ({
    inc: incomeData[i] || null,
    exp: expenseData[i] || null,
  }));

  const handlePrint = () => window.print();

  const handleExport = () => {
    const headers = ["आम्दानी शिर्षक", "रकम", "", "खर्च शिर्षक", "रकम"];
    const csvRows = rows.map(r => [
      r.inc?.name || "",
      r.inc?.total ? r.inc.total : "",
      "",
      r.exp?.name || "",
      r.exp?.total ? r.exp.total : "",
    ]);

    const totalRow = ["जम्मा", totalIncome || "0", "", "जम्मा", totalExpense || "0"];

    const csv = [
      [SCHOOL_NAME],
      [`आ.व. ${selectedFiscalYear} को आय / व्यय विवरण`],
      [],
      headers,
      ...csvRows,
      [],
      totalRow,
    ].map(r => r.join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aaya-vyaya-${selectedFiscalYear.replace("/", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #ay-print-root, #ay-print-root * { visibility: visible !important; color: black !important; }
          #ay-print-root { position: fixed; inset: 0; overflow: visible; }
          @page { size: A4 portrait; margin: 15mm; }
          .no-print { display: none !important; }
          table { border-collapse: collapse; width: 100%; font-size: 10pt; color: black; }
          th, td { border: 1px solid #333 !important; padding: 4px 6px !important; color: black !important; }
          th { background-color: #f1f5f9 !important; }
          .total-row td { background-color: #fef08a !important; font-weight: bold !important; }
        }
      `}</style>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 no-print flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <div>
              <h2 className="text-xl font-bold text-slate-800">आय व्यय</h2>
              <p className="text-slate-500 text-xs">Aaya Vyaya — Income & Expenditure</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Fiscal Year (आ.व.)</label>
              <select
                value={selectedFiscalYear}
                onChange={e => setSelectedFiscalYear(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
              >
                {FISCAL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow transition-colors"
            >
              <Printer className="w-4 h-4" /> Print A4 Portrait
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <div id="ay-print-root" className="overflow-x-auto">
            <table className="border-collapse text-sm w-full max-w-4xl mx-auto">
              <thead>
                <tr>
                  <td
                    colSpan={4}
                    className="text-center font-bold border border-slate-400 bg-slate-50 py-3 text-lg text-black"
                    style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}
                  >
                    आ.व. {selectedFiscalYear} को आय / व्यय विवरण
                  </td>
                </tr>
                <tr className="bg-slate-200 text-center font-bold text-black text-base">
                  <th colSpan={2} className="border border-slate-500 px-3 py-2 w-1/2" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>आम्दानी</th>
                  <th colSpan={2} className="border border-slate-500 px-3 py-2 w-1/2" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>खर्च</th>
                </tr>
                <tr className="bg-slate-100 text-center text-sm font-bold text-black">
                  <th className="border border-slate-500 px-3 py-2 w-1/4" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>शिर्षक</th>
                  <th className="border border-slate-500 px-3 py-2 w-1/4" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>रकम</th>
                  <th className="border border-slate-500 px-3 py-2 w-1/4" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>शिर्षक</th>
                  <th className="border border-slate-500 px-3 py-2 w-1/4" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>रकम</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="border border-slate-400 px-4 py-1.5 text-right text-black font-medium" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>
                      {row.inc?.name || ""}
                    </td>
                    <td className="border border-slate-400 px-4 py-1.5 text-right font-mono text-black">
                      {fmt(row.inc?.total || 0)}
                    </td>
                    <td className="border border-slate-400 px-4 py-1.5 text-right text-black font-medium" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>
                      {row.exp?.name || ""}
                    </td>
                    <td className="border border-slate-400 px-4 py-1.5 text-right font-mono text-black">
                      {fmt(row.exp?.total || 0)}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="border border-slate-300 py-12 text-center text-slate-400">
                      No topics found.
                    </td>
                  </tr>
                )}
                {/* Grand Total */}
                <tr className="total-row bg-yellow-200 font-bold text-sm text-black">
                  <td className="border border-slate-500 px-4 py-3 text-center font-bold text-black" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>जम्मा</td>
                  <td className="border border-slate-500 px-4 py-3 text-right font-mono font-bold text-black">{totalIncome > 0 ? fmt(totalIncome) : "0"}</td>
                  <td className="border border-slate-500 px-4 py-3 text-center font-bold text-black" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>जम्मा</td>
                  <td className="border border-slate-500 px-4 py-3 text-right font-mono font-bold text-black">{totalExpense > 0 ? fmt(totalExpense) : "0"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
