"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Printer, FileSpreadsheet, ArrowLeft } from "lucide-react";

const FISCAL_YEARS = ["2081/2082", "2082/2083", "2083/2084", "2084/2085", "2085/2086"];

const safeAdd = (a: number, b: number) => Math.round((a + b) * 100) / 100;

const fmt = (n: number) => {
  if (!n || n === 0) return "";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

type Voucher = {
  cash_debit: number;
  cash_credit: number;
  bank_debit: number;
  bank_credit: number;
  kharcha_debit: number;
  kharcha_credit: number;
  bibidh_debit: number;
  bibidh_credit: number;
};

type Props = { onBack: () => void };

export default function TrialBalance({ onBack }: Props) {
  const [selectedFY, setSelectedFY] = useState("2083/2084");
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual values for Peshi (since no dedicated columns exist in DB) and Remarks
  const [peshiDebit, setPeshiDebit] = useState("");
  const [peshiCredit, setPeshiCredit] = useState("");
  const [remarks, setRemarks] = useState({
    cash: "0", bank: "0", kharcha: "0", peshi: "0", bibidh: "0"
  });

  useEffect(() => {
    fetchData();
  }, [selectedFY]);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("accounting_vouchers")
      .select("cash_debit, cash_credit, bank_debit, bank_credit, kharcha_debit, kharcha_credit, bibidh_debit, bibidh_credit")
      .eq("fiscal_year", selectedFY);
    
    setVouchers(data || []);
    setLoading(false);
  };

  // Calculate sums
  const sumCD = vouchers.reduce((s, v) => safeAdd(s, v.cash_debit || 0), 0);
  const sumCC = vouchers.reduce((s, v) => safeAdd(s, v.cash_credit || 0), 0);
  const sumBD = vouchers.reduce((s, v) => safeAdd(s, v.bank_debit || 0), 0);
  const sumBC = vouchers.reduce((s, v) => safeAdd(s, v.bank_credit || 0), 0);
  const sumKD = vouchers.reduce((s, v) => safeAdd(s, v.kharcha_debit || 0), 0);
  const sumKC = vouchers.reduce((s, v) => safeAdd(s, v.kharcha_credit || 0), 0);
  const sumBiD = vouchers.reduce((s, v) => safeAdd(s, v.bibidh_debit || 0), 0);
  const sumBiC = vouchers.reduce((s, v) => safeAdd(s, v.bibidh_credit || 0), 0);

  const pDebitNum = Number(peshiDebit) || 0;
  const pCreditNum = Number(peshiCredit) || 0;

  const totalDebit = safeAdd(safeAdd(safeAdd(safeAdd(sumCD, sumBD), sumKD), pDebitNum), sumBiD);
  const totalCredit = safeAdd(safeAdd(safeAdd(safeAdd(sumCC, sumBC), sumKC), pCreditNum), sumBiC);

  const handlePrint = () => window.print();

  const handleExport = () => {
    const headers = ["क्र.सं.", "विवरण", "डेबिट", "क्रेडिट", "कैफियत"];
    
    const rows = [
      ["१", "नगद", sumCD || "", sumCC || "", remarks.cash],
      ["२", "बैंक", sumBD || "", sumBC || "", remarks.bank],
      ["३", "खर्च", sumKD || "", sumKC || "", remarks.kharcha],
      ["४", "पेश्की", pDebitNum || "", pCreditNum || "", remarks.peshi],
      ["५", "विविध", sumBiD || "", sumBiC || "", remarks.bibidh],
    ];

    const totalRow = ["", "जम्मा", totalDebit || "0", totalCredit || "0", "0"];

    const csv = [
      [`सन्तुलन परीक्षण ( आ.व. ${selectedFY} )`],
      [],
      headers,
      ...rows,
      totalRow,
    ].map(r => r.join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trial-balance-${selectedFY.replace("/", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRemark = (key: keyof typeof remarks, val: string) => {
    setRemarks(prev => ({ ...prev, [key]: val }));
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #tb-print-root, #tb-print-root * { visibility: visible !important; color: black !important; }
          #tb-print-root { position: fixed; inset: 0; overflow: visible; }
          @page { size: A4 portrait; margin: 20mm; }
          .no-print { display: none !important; }
          table { border-collapse: collapse; width: 100%; font-size: 11pt; color: black; }
          th, td { border: 1px solid #333 !important; padding: 6px 10px !important; color: black !important; }
          th { background-color: #f1f5f9 !important; }
          input { background: transparent; border: none; outline: none; width: 100%; color: black !important; }
          input::placeholder { color: transparent; }
        }
      `}</style>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
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
              <h2 className="text-xl font-bold text-slate-800">सन्तुलन परीक्षण</h2>
              <p className="text-slate-500 text-xs">Trial Balance</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Fiscal Year (आ.व.)</label>
              <select
                value={selectedFY}
                onChange={e => setSelectedFY(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
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
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm shadow transition-colors"
            >
              <Printer className="w-4 h-4" /> Print A4 Portrait
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div id="tb-print-root" className="overflow-x-auto">
            <table className="border-collapse text-base w-full max-w-3xl mx-auto">
              <thead>
                <tr>
                  <td
                    colSpan={5}
                    className="text-center font-bold border border-slate-400 bg-white py-4 text-xl text-black"
                    style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}
                  >
                    सन्तुलन परीक्षण ( आ.व. {selectedFY} )
                  </td>
                </tr>
                <tr className="bg-slate-50 text-center font-bold text-black">
                  <th className="border border-slate-500 px-4 py-2 w-16" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>क्र.सं.</th>
                  <th className="border border-slate-500 px-4 py-2 w-1/4" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>विवरण</th>
                  <th className="border border-slate-500 px-4 py-2 w-1/4" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>डेबिट</th>
                  <th className="border border-slate-500 px-4 py-2 w-1/4" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>क्रेडिट</th>
                  <th className="border border-slate-500 px-4 py-2 w-32" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>कैफियत</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. Cash */}
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="border border-slate-400 px-4 py-2 text-center text-black font-medium" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>१</td>
                  <td className="border border-slate-400 px-4 py-2 text-center text-black font-medium" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>नगद</td>
                  <td className="border border-slate-400 px-4 py-2 text-right font-mono text-black">{fmt(sumCD)}</td>
                  <td className="border border-slate-400 px-4 py-2 text-right font-mono text-black">{fmt(sumCC)}</td>
                  <td className="border border-slate-400 px-2 py-2 text-right text-black">
                    <input type="text" value={remarks.cash} onChange={e => handleRemark("cash", e.target.value)} className="w-full text-right bg-transparent border-0 focus:ring-0 p-0" />
                  </td>
                </tr>
                
                {/* 2. Bank */}
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="border border-slate-400 px-4 py-2 text-center text-black font-medium" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>२</td>
                  <td className="border border-slate-400 px-4 py-2 text-center text-black font-medium" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>बैंक</td>
                  <td className="border border-slate-400 px-4 py-2 text-right font-mono text-black">{fmt(sumBD)}</td>
                  <td className="border border-slate-400 px-4 py-2 text-right font-mono text-black">{fmt(sumBC)}</td>
                  <td className="border border-slate-400 px-2 py-2 text-right text-black">
                    <input type="text" value={remarks.bank} onChange={e => handleRemark("bank", e.target.value)} className="w-full text-right bg-transparent border-0 focus:ring-0 p-0" />
                  </td>
                </tr>

                {/* 3. Kharcha */}
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="border border-slate-400 px-4 py-2 text-center text-black font-medium" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>३</td>
                  <td className="border border-slate-400 px-4 py-2 text-center text-black font-medium" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>खर्च</td>
                  <td className="border border-slate-400 px-4 py-2 text-right font-mono text-black">{fmt(sumKD)}</td>
                  <td className="border border-slate-400 px-4 py-2 text-right font-mono text-black">{fmt(sumKC)}</td>
                  <td className="border border-slate-400 px-2 py-2 text-right text-black">
                    <input type="text" value={remarks.kharcha} onChange={e => handleRemark("kharcha", e.target.value)} className="w-full text-right bg-transparent border-0 focus:ring-0 p-0" />
                  </td>
                </tr>

                {/* 4. Peshi (Manual Input as per DB constraints) */}
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="border border-slate-400 px-4 py-2 text-center text-black font-medium" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>४</td>
                  <td className="border border-slate-400 px-4 py-2 text-center text-black font-medium" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>पेश्की</td>
                  <td className="border border-slate-400 px-2 py-2 text-right font-mono text-black">
                    <input type="number" value={peshiDebit} onChange={e => setPeshiDebit(e.target.value)} className="w-full text-right bg-transparent border-0 focus:ring-0 p-0 font-mono" placeholder="0.00" />
                  </td>
                  <td className="border border-slate-400 px-2 py-2 text-right font-mono text-black">
                    <input type="number" value={peshiCredit} onChange={e => setPeshiCredit(e.target.value)} className="w-full text-right bg-transparent border-0 focus:ring-0 p-0 font-mono" placeholder="0.00" />
                  </td>
                  <td className="border border-slate-400 px-2 py-2 text-right text-black">
                    <input type="text" value={remarks.peshi} onChange={e => handleRemark("peshi", e.target.value)} className="w-full text-right bg-transparent border-0 focus:ring-0 p-0" />
                  </td>
                </tr>

                {/* 5. Bibidh */}
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="border border-slate-400 px-4 py-2 text-center text-black font-medium" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>५</td>
                  <td className="border border-slate-400 px-4 py-2 text-center text-black font-medium" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>विविध</td>
                  <td className="border border-slate-400 px-4 py-2 text-right font-mono text-black">{fmt(sumBiD)}</td>
                  <td className="border border-slate-400 px-4 py-2 text-right font-mono text-black">{fmt(sumBiC)}</td>
                  <td className="border border-slate-400 px-2 py-2 text-right text-black">
                    <input type="text" value={remarks.bibidh} onChange={e => handleRemark("bibidh", e.target.value)} className="w-full text-right bg-transparent border-0 focus:ring-0 p-0" />
                  </td>
                </tr>

                {/* Total */}
                <tr className="bg-white font-bold text-black">
                  <td colSpan={2} className="border border-slate-400 px-4 py-3 text-center" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>जम्मा</td>
                  <td className="border border-slate-400 px-4 py-3 text-right font-mono text-black">{totalDebit > 0 ? fmt(totalDebit) : "0"}</td>
                  <td className="border border-slate-400 px-4 py-3 text-right font-mono text-black">{totalCredit > 0 ? fmt(totalCredit) : "0"}</td>
                  <td className="border border-slate-400 px-4 py-3 text-right text-black font-mono">0</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
