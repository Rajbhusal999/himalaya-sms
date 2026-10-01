"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Printer, FileSpreadsheet, ArrowLeft } from "lucide-react";

const SCHOOL_NAME = "श्री हिमालय आधारभूत विद्यालय , भरतपुर -११ , चितवन";
const FISCAL_YEARS = ["2081/2082", "2082/2083", "2083/2084", "2084/2085", "2085/2086"];
const ROWS_PER_PAGE = 11; // match screenshot (11 data rows per physical page)

// Nepali numerals
const NEPALI_NUMS = ["", "१", "२", "३", "४", "५", "६", "७", "८", "९",
  "१०", "११", "१२", "१३", "१४", "१५", "१६", "१७", "१८", "१९", "२०",
  "२१", "२२", "२३", "२४", "२५", "२६", "२७", "२८", "२९", "३०"];
const nepali = (n: number) => NEPALI_NUMS[n] ?? String(n);

const safeAdd = (a: number, b: number) => Math.round((a + b) * 100) / 100;

const fmt = (n: number) =>
  (n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Voucher = {
  id: string;
  date: string;
  voucher_number: string;
  description: string;
  cash_debit: number;
  cash_credit: number;
  bank_debit: number;
  bank_credit: number;
  kharcha_debit: number;
  kharcha_credit: number;
  bibidh_debit: number;
  bibidh_credit: number;
  fiscal_year: string;
};

type Props = { onBack: () => void };

export default function NagadBankKhata({ onBack }: Props) {
  const [selectedFY, setSelectedFY] = useState("2083/2084");
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [selectedFY]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("accounting_vouchers")
      .select("id,date,voucher_number,description,cash_debit,cash_credit,bank_debit,bank_credit,kharcha_debit,kharcha_credit,bibidh_debit,bibidh_credit,fiscal_year")
      .eq("fiscal_year", selectedFY)
      .order("date", { ascending: true })
      .order("voucher_number", { ascending: true });
    if (!error) setVouchers(data || []);
    setLoading(false);
  };

  // ── Grand Totals (precise) ────────────────────────────────────────────────────
  const gCD  = vouchers.reduce((s, v) => safeAdd(s, v.cash_debit   || 0), 0);
  const gCC  = vouchers.reduce((s, v) => safeAdd(s, v.cash_credit  || 0), 0);
  const gBD  = vouchers.reduce((s, v) => safeAdd(s, v.bank_debit   || 0), 0);
  const gBC  = vouchers.reduce((s, v) => safeAdd(s, v.bank_credit  || 0), 0);
  const gKD  = vouchers.reduce((s, v) => safeAdd(s, v.kharcha_debit|| 0), 0); // खर्च
  const gPD  = vouchers.reduce((s, v) => safeAdd(s, v.kharcha_credit|| 0), 0); // पेश्की फिर्ता (credit side of kharcha = paeako)
  const gBiD = vouchers.reduce((s, v) => safeAdd(s, v.bibidh_debit || 0), 0);
  const gBiC = vouchers.reduce((s, v) => safeAdd(s, v.bibidh_credit|| 0), 0);

  // Bank b/d = Total Bank Debit − Total Bank Credit
  const bankBD = Math.round((gBD - gBC) * 100) / 100;

  // Debit Amount  = Cash Debit + Bank Debit + Kharcha (खर्च) + Bibidh Debit
  const totalDebit  = Math.round((gCD + gBD + gKD + gBiD) * 100) / 100;
  // Credit Amount = Cash Credit + Bank Credit + Peshi paeako + Bibidh Credit
  const totalCredit = Math.round((gCC + gBC + gPD + gBiC) * 100) / 100;

  // ── Pages ─────────────────────────────────────────────────────────────────────
  const pages: Voucher[][] = [];
  for (let i = 0; i < vouchers.length; i += ROWS_PER_PAGE) {
    pages.push(vouchers.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const handlePrint = () => window.print();

  const handleExport = () => {
    const headers = ["पाना नं", "नगद डेबिट", "नगद क्रेडिट", "बैंक डेबिट", "बैंक क्रेडिट",
      "खर्च", "पेश्की पाएको", "फिर्ताएको", "विविध डेबिट", "विविध क्रेडिट"];
    const rows = vouchers.map((v, i) => [
      i + 1,
      v.cash_debit || "", v.cash_credit || "",
      v.bank_debit || "", v.bank_credit || "",
      v.kharcha_debit || "", v.kharcha_credit || "", "",
      v.bibidh_debit || "", v.bibidh_credit || "",
    ]);
    const total = ["जम्मा", gCD, gCC, gBD, gBC, gKD, gPD, "", gBiD, gBiC];
    const bankBDRow = ["", "", "", "Bank b/d", bankBD, "", "", "", "", ""];
    const csv = [
      [SCHOOL_NAME], [`आ.व. ${selectedFY}`], [`नगद बैंक खाता`], [],
      headers, ...rows, [], total, bankBDRow, [],
      ["Debit Amount", totalDebit], ["Credit Amount", totalCredit],
    ].map(r => r.join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `nagad-bank-khata-${selectedFY.replace("/", "-")}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Shared thead ──────────────────────────────────────────────────────────────
  const TableHead = ({ fy }: { fy: string }) => (
    <thead>
      <tr>
        <td colSpan={10}
          className="text-center font-bold border border-slate-400 py-2 text-sm text-black bg-slate-50"
          style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>
          नगद बैंक खाता ({fy})
        </td>
      </tr>
      <tr className="bg-slate-200 text-center text-[11px] font-bold text-black">
        <th rowSpan={2} className="border border-slate-500 px-1 py-1 text-black"
          style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>पाना<br />नं</th>
        <th colSpan={2} className="border border-slate-500 px-1 py-1 text-black bg-blue-100"
          style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>नगद</th>
        <th colSpan={2} className="border border-slate-500 px-1 py-1 text-black bg-purple-100"
          style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>बैंक</th>
        <th rowSpan={2} className="border border-slate-500 px-1 py-1 text-black bg-rose-50"
          style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>खर्च</th>
        <th colSpan={2} className="border border-slate-500 px-1 py-1 text-black bg-amber-100"
          style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>पेश्की</th>
        <th colSpan={2} className="border border-slate-500 px-1 py-1 text-black bg-emerald-100"
          style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>विविध</th>
      </tr>
      <tr className="bg-slate-200 text-center text-[10px] font-bold text-black">
        {["डेबिट", "क्रेडिट"].map((h, i) => (
          <th key={`c${i}`} className="border border-slate-500 px-1 py-1 text-black bg-blue-50"
            style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>{h}</th>
        ))}
        {["डेबिट", "क्रेडिट"].map((h, i) => (
          <th key={`b${i}`} className="border border-slate-500 px-1 py-1 text-black bg-purple-50"
            style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>{h}</th>
        ))}
        {["पाएको", "फिर्ताएको"].map((h, i) => (
          <th key={`p${i}`} className="border border-slate-500 px-1 py-1 text-black bg-amber-50"
            style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>{h}</th>
        ))}
        {["डेबिट", "क्रेडिट"].map((h, i) => (
          <th key={`bi${i}`} className="border border-slate-500 px-1 py-1 text-black bg-emerald-50"
            style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>{h}</th>
        ))}
      </tr>
    </thead>
  );

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #nbk-print-root, #nbk-print-root * { visibility: visible !important; color: black !important; }
          #nbk-print-root { position: fixed; inset: 0; overflow: visible; }
          @page { size: A4 landscape; margin: 10mm 8mm; }
          .no-print { display: none !important; }
          .page-section { page-break-after: always; page-break-inside: avoid; }
          .page-section:last-child { page-break-after: auto; }
          table { border-collapse: collapse; width: 100%; font-size: 9pt; color: black; }
          th, td { border: 1px solid #333 !important; padding: 2px 4px !important; color: black !important; }
          th { background-color: #e2e8f0 !important; }
          .total-row td { background-color: #fef08a !important; font-weight: bold !important; }
          .summary-box { border: 1px solid #333 !important; }
        }
      `}</style>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 no-print flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <div>
              <h2 className="text-xl font-bold text-slate-800">नगद बैंक खाता</h2>
              <p className="text-slate-500 text-xs">Nagad Bank Khata — Cash &amp; Bank Ledger</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Fiscal Year (आ.व.)</label>
              <select value={selectedFY} onChange={e => setSelectedFY(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white">
                {FISCAL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow transition-colors">
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </button>
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow transition-colors">
              <Printer className="w-4 h-4" /> Print A4 Landscape
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div id="nbk-print-root" className="overflow-x-auto space-y-10">
            {pages.map((pageRows, pageIdx) => {
              const startIdx = pageIdx * ROWS_PER_PAGE;
              // Running cumulative totals up to end of this page
              const cumSlice = vouchers.slice(0, startIdx + pageRows.length);
              const pCD  = cumSlice.reduce((s, v) => safeAdd(s, v.cash_debit   || 0), 0);
              const pCC  = cumSlice.reduce((s, v) => safeAdd(s, v.cash_credit  || 0), 0);
              const pBD  = cumSlice.reduce((s, v) => safeAdd(s, v.bank_debit   || 0), 0);
              const pBC  = cumSlice.reduce((s, v) => safeAdd(s, v.bank_credit  || 0), 0);
              const pKD  = cumSlice.reduce((s, v) => safeAdd(s, v.kharcha_debit|| 0), 0);
              const pPD  = cumSlice.reduce((s, v) => safeAdd(s, v.kharcha_credit|| 0), 0);
              const pBiD = cumSlice.reduce((s, v) => safeAdd(s, v.bibidh_debit || 0), 0);
              const pBiC = cumSlice.reduce((s, v) => safeAdd(s, v.bibidh_credit|| 0), 0);

              const pageBankBD = Math.round((pBD - pBC) * 100) / 100;
              const isLast = pageIdx === pages.length - 1;
              const label = isLast ? "जम्मा (Grand Total)" : `जम्मा (पृ. ${pageIdx + 1})`;

              // Empty rows to fill page up to ROWS_PER_PAGE
              const emptyCount = Math.max(0, ROWS_PER_PAGE - pageRows.length);

              return (
                <div key={pageIdx}
                  className={`page-section ${!isLast ? "border-b-2 border-dashed border-slate-300 pb-10" : ""}`}>
                  <table className="border-collapse text-xs w-full">
                    <TableHead fy={selectedFY} />
                    <tbody>
                      {pageRows.map((v, rowIdx) => (
                        <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                          <td className="border border-slate-400 px-1 py-1 text-center text-black font-bold"
                            style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>
                            {nepali(startIdx + rowIdx + 1)}
                          </td>
                          <td className="border border-slate-400 px-2 py-1 text-right font-mono text-black">{v.cash_debit   ? fmt(v.cash_debit)   : ""}</td>
                          <td className="border border-slate-400 px-2 py-1 text-right font-mono text-black">{v.cash_credit  ? fmt(v.cash_credit)  : ""}</td>
                          <td className="border border-slate-400 px-2 py-1 text-right font-mono text-black">{v.bank_debit   ? fmt(v.bank_debit)   : ""}</td>
                          <td className="border border-slate-400 px-2 py-1 text-right font-mono text-black">{v.bank_credit  ? fmt(v.bank_credit)  : ""}</td>
                          <td className="border border-slate-400 px-2 py-1 text-right font-mono text-black">{v.kharcha_debit ? fmt(v.kharcha_debit) : ""}</td>
                          <td className="border border-slate-400 px-2 py-1 text-right font-mono text-black">{v.kharcha_credit? fmt(v.kharcha_credit): ""}</td>
                          <td className="border border-slate-400 px-2 py-1 text-black"></td>
                          <td className="border border-slate-400 px-2 py-1 text-right font-mono text-black">{v.bibidh_debit  ? fmt(v.bibidh_debit)  : ""}</td>
                          <td className="border border-slate-400 px-2 py-1 text-right font-mono text-black">{v.bibidh_credit ? fmt(v.bibidh_credit) : ""}</td>
                        </tr>
                      ))}

                      {/* Fill empty rows to complete the page */}
                      {Array.from({ length: emptyCount }).map((_, i) => (
                        <tr key={`empty-${i}`}>
                          <td className="border border-slate-300 px-1 py-1 text-center text-slate-300 text-[10px]"
                            style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>
                            {nepali(startIdx + pageRows.length + i + 1)}
                          </td>
                          {Array.from({ length: 9 }).map((_, j) => (
                            <td key={j} className="border border-slate-200 px-2 py-1"></td>
                          ))}
                        </tr>
                      ))}

                      {/* ── Page / Grand Total row ── */}
                      <tr className={`total-row font-bold text-xs ${isLast ? "bg-yellow-200" : "bg-amber-100"}`}>
                        <td className="border border-slate-500 px-2 py-1.5 text-right font-bold text-black"
                          style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>जम्मा</td>
                        <td className="border border-slate-500 px-2 py-1.5 text-right font-mono text-black">{fmt(pCD)}</td>
                        <td className="border border-slate-500 px-2 py-1.5 text-right font-mono text-black">{fmt(pCC)}</td>
                        <td className="border border-slate-500 px-2 py-1.5 text-right font-mono text-black">{fmt(pBD)}</td>
                        <td className="border border-slate-500 px-2 py-1.5 text-right font-mono text-black">{fmt(pBC)}</td>
                        <td className="border border-slate-500 px-2 py-1.5 text-right font-mono text-black">{fmt(pKD)}</td>
                        <td className="border border-slate-500 px-2 py-1.5 text-right font-mono text-black">{fmt(pPD)}</td>
                        <td className="border border-slate-500 px-2 py-1.5 text-black"></td>
                        <td className="border border-slate-500 px-2 py-1.5 text-right font-mono text-black">{fmt(pBiD)}</td>
                        <td className="border border-slate-500 px-2 py-1.5 text-right font-mono text-black">{fmt(pBiC)}</td>
                      </tr>

                      {/* Bank b/d row */}
                      <tr>
                        <td className="border-0 py-1" colSpan={10}></td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="border-0 px-1 py-1"></td>
                        <td className="border-0 px-1 py-1"></td>
                        <td colSpan={2}
                          className="border border-slate-400 px-3 py-1.5 text-center font-bold text-black text-xs"
                          style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>
                          Bank b/d
                        </td>
                        <td className="border border-slate-400 px-3 py-1.5 text-right font-mono font-bold text-black text-xs">
                          {fmt(pageBankBD)}
                        </td>
                        <td colSpan={4} className="border-0"></td>
                      </tr>
                      <tr><td colSpan={10} className="border-0 py-1"></td></tr>

                      {/* ── Summary Box (only on last page) ── */}
                      {isLast && (
                        <>
                          <tr>
                            <td colSpan={10} className="border-0 pt-4 pb-1">
                              <div className="summary-box inline-block border border-slate-400 rounded overflow-hidden">
                                <table className="border-collapse text-xs">
                                  <tbody>
                                    <tr>
                                      <td className="border border-slate-400 px-4 py-1.5 font-bold text-black bg-slate-100">Debit Amount</td>
                                      <td className="border border-slate-400 px-6 py-1.5 text-right font-mono font-bold text-black bg-white">{fmt(totalDebit)}</td>
                                    </tr>
                                    <tr>
                                      <td className="border border-slate-400 px-4 py-1.5 font-bold text-black bg-slate-100">Credit Amount</td>
                                      <td className="border border-slate-400 px-6 py-1.5 text-right font-mono font-bold text-black bg-white">{fmt(totalCredit)}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>

                  {!isLast && (
                    <p className="no-print text-center text-xs text-slate-400 mt-2 italic">
                      — Page {pageIdx + 1} ends — Running totals shown above —
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
