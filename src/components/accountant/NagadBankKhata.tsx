"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Printer, FileSpreadsheet, ArrowLeft } from "lucide-react";

const SCHOOL_NAME = "श्री हिमालय आधारभूत विद्यालय , भरतपुर -११ , चितवन";
const FISCAL_YEARS = ["2081/2082", "2082/2083", "2083/2084", "2084/2085", "2085/2086"];

// ── BankNagadiKitab uses 9 vouchers per page ──────────────────────────────────
// Each ROW of NagadBankKhata = ONE page of BankNagadiKitab = 9 vouchers summed
const BNK_ROWS_PER_PAGE = 9;

// ── NagadBankKhata shows 11 page-rows per printed page (matching screenshot) ──
const NBK_ROWS_PER_PRINT_PAGE = 11;

// Nepali numerals for पाना नं
const NEPALI_NUMS = ["", "१", "२", "३", "४", "५", "६", "७", "८", "९",
  "१०", "११", "१२", "१३", "१४", "१५", "१६", "१७", "१८", "१९", "२०",
  "२१", "२२", "२३", "२४", "२५", "२६", "२७", "२८", "२९", "३०"];
const nepali = (n: number) => NEPALI_NUMS[n] ?? String(n);

const safeAdd = (a: number, b: number) => Math.round((a + b) * 100) / 100;

const fmt = (n: number) =>
  (n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Voucher = {
  id: string;
  cash_debit: number;
  cash_credit: number;
  bank_debit: number;
  bank_credit: number;
  kharcha_debit: number;
  kharcha_credit: number;
  bibidh_debit: number;
  bibidh_credit: number;
};

// One aggregated row = totals of one BankNagadiKitab page
type PageRow = {
  pageNo: number;           // पाना नं (from BankNagadiKitab)
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

export default function NagadBankKhata({ onBack }: Props) {
  const [selectedFY, setSelectedFY] = useState("2083/2084");
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [selectedFY]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("accounting_vouchers")
      .select("id,cash_debit,cash_credit,bank_debit,bank_credit,kharcha_debit,kharcha_credit,bibidh_debit,bibidh_credit")
      .eq("fiscal_year", selectedFY)
      .order("date", { ascending: true })
      .order("voucher_number", { ascending: true });
    if (!error) setVouchers(data || []);
    setLoading(false);
  };

  // ── Build page-rows: each row = sum of BNK_ROWS_PER_PAGE vouchers ─────────────
  const pageRows: PageRow[] = [];
  for (let i = 0; i < Math.max(vouchers.length, 1); i += BNK_ROWS_PER_PAGE) {
    const chunk = vouchers.slice(i, i + BNK_ROWS_PER_PAGE);
    if (chunk.length === 0) break;
    pageRows.push({
      pageNo: pageRows.length + 1,
      cash_debit:    chunk.reduce((s, v) => safeAdd(s, v.cash_debit    || 0), 0),
      cash_credit:   chunk.reduce((s, v) => safeAdd(s, v.cash_credit   || 0), 0),
      bank_debit:    chunk.reduce((s, v) => safeAdd(s, v.bank_debit    || 0), 0),
      bank_credit:   chunk.reduce((s, v) => safeAdd(s, v.bank_credit   || 0), 0),
      kharcha_debit: chunk.reduce((s, v) => safeAdd(s, v.kharcha_debit || 0), 0),
      kharcha_credit:chunk.reduce((s, v) => safeAdd(s, v.kharcha_credit|| 0), 0),
      bibidh_debit:  chunk.reduce((s, v) => safeAdd(s, v.bibidh_debit  || 0), 0),
      bibidh_credit: chunk.reduce((s, v) => safeAdd(s, v.bibidh_credit || 0), 0),
    });
  }

  // ── Grand Totals across ALL page-rows ────────────────────────────────────────
  const gCD  = pageRows.reduce((s, r) => safeAdd(s, r.cash_debit),    0);
  const gCC  = pageRows.reduce((s, r) => safeAdd(s, r.cash_credit),   0);
  const gBD  = pageRows.reduce((s, r) => safeAdd(s, r.bank_debit),    0);
  const gBC  = pageRows.reduce((s, r) => safeAdd(s, r.bank_credit),   0);
  const gKD  = pageRows.reduce((s, r) => safeAdd(s, r.kharcha_debit), 0);
  const gPD  = pageRows.reduce((s, r) => safeAdd(s, r.kharcha_credit),0);
  const gBiD = pageRows.reduce((s, r) => safeAdd(s, r.bibidh_debit),  0);
  const gBiC = pageRows.reduce((s, r) => safeAdd(s, r.bibidh_credit), 0);

  // Bank b/d = Total Bank Debit − Total Bank Credit
  const bankBD = Math.round((gBD - gBC) * 100) / 100;

  // Debit Amount  = Cash Debit + Bank Debit + Kharcha + Bibidh Debit
  const totalDebit  = Math.round((gCD + gBD + gKD + gBiD) * 100) / 100;
  // Credit Amount = Cash Credit + Bank Credit + Peshi Paeako + Bibidh Credit
  const totalCredit = Math.round((gCC + gBC + gPD + gBiC) * 100) / 100;

  // ── Split page-rows into print pages (11 per print page) ─────────────────────
  const printPages: PageRow[][] = [];
  for (let i = 0; i < Math.max(pageRows.length, 1); i += NBK_ROWS_PER_PRINT_PAGE) {
    const chunk = pageRows.slice(i, i + NBK_ROWS_PER_PRINT_PAGE);
    printPages.push(chunk);
  }
  if (printPages.length === 0) printPages.push([]);

  const handlePrint = () => window.print();

  const handleExport = () => {
    const headers = ["पाना नं (BNK Page)", "नगद डेबिट", "नगद क्रेडिट", "बैंक डेबिट", "बैंक क्रेडिट",
      "खर्च", "पेश्की पाएको", "फिर्ताएको", "विविध डेबिट", "विविध क्रेडिट"];
    const rows = pageRows.map(r => [
      r.pageNo,
      r.cash_debit || "", r.cash_credit || "",
      r.bank_debit || "", r.bank_credit || "",
      r.kharcha_debit || "", r.kharcha_credit || "", "",
      r.bibidh_debit || "", r.bibidh_credit || "",
    ]);
    const total = ["जम्मा", gCD, gCC, gBD, gBC, gKD, gPD, "", gBiD, gBiC];
    const csv = [
      [SCHOOL_NAME], [`आ.व. ${selectedFY}`], [`नगद बैंक खाता`],
      [`(प्रत्येक पाना = बैंक नगदी किताबको ${BNK_ROWS_PER_PAGE} भौचर)`],
      [],
      headers, ...rows, [], total,
      [], ["Bank b/d", "", "", bankBD],
      [], ["Debit Amount", totalDebit], ["Credit Amount", totalCredit],
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
              <p className="text-slate-500 text-xs">
                Nagad Bank Khata — Each row = 1 page of Bank Nagadi Kitab ({BNK_ROWS_PER_PAGE} vouchers)
              </p>
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

        {/* Info banner */}
        <div className="no-print mb-4 px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-800 font-medium">
          ℹ️ Each numbered row (पाना नं) below represents the totals from one complete page of the{" "}
          <strong>Bank Nagadi Kitab</strong> ({BNK_ROWS_PER_PAGE} vouchers per page).
          Currently showing <strong>{pageRows.length}</strong> pages from{" "}
          <strong>{vouchers.length}</strong> total vouchers.
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div id="nbk-print-root" className="overflow-x-auto space-y-10">
            {printPages.map((printPageRows, printPageIdx) => {
              // Cumulative totals up to and including this print page
              const allRowsSoFar = pageRows.slice(0, (printPageIdx + 1) * NBK_ROWS_PER_PRINT_PAGE);
              const cumCD  = allRowsSoFar.reduce((s, r) => safeAdd(s, r.cash_debit),    0);
              const cumCC  = allRowsSoFar.reduce((s, r) => safeAdd(s, r.cash_credit),   0);
              const cumBD  = allRowsSoFar.reduce((s, r) => safeAdd(s, r.bank_debit),    0);
              const cumBC  = allRowsSoFar.reduce((s, r) => safeAdd(s, r.bank_credit),   0);
              const cumKD  = allRowsSoFar.reduce((s, r) => safeAdd(s, r.kharcha_debit), 0);
              const cumPD  = allRowsSoFar.reduce((s, r) => safeAdd(s, r.kharcha_credit),0);
              const cumBiD = allRowsSoFar.reduce((s, r) => safeAdd(s, r.bibidh_debit),  0);
              const cumBiC = allRowsSoFar.reduce((s, r) => safeAdd(s, r.bibidh_credit), 0);

              const pageBankBD = Math.round((cumBD - cumBC) * 100) / 100;
              const isLast = printPageIdx === printPages.length - 1;

              // Fill empty rows up to NBK_ROWS_PER_PRINT_PAGE
              const startPageNo = printPageIdx * NBK_ROWS_PER_PRINT_PAGE;
              const emptyCount = Math.max(0, NBK_ROWS_PER_PRINT_PAGE - printPageRows.length);

              return (
                <div key={printPageIdx}
                  className={`page-section ${!isLast ? "border-b-2 border-dashed border-slate-300 pb-10" : ""}`}>
                  <table className="border-collapse text-xs w-full">
                    <TableHead fy={selectedFY} />
                    <tbody>
                      {/* ── Actual page-rows ── */}
                      {printPageRows.map((r) => (
                        <tr key={r.pageNo} className="hover:bg-purple-50/20 transition-colors">
                          <td className="border border-slate-400 px-1 py-1.5 text-center text-black font-bold text-sm"
                            style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>
                            {nepali(r.pageNo)}
                          </td>
                          <td className="border border-slate-400 px-2 py-1.5 text-right font-mono text-black">{r.cash_debit    ? fmt(r.cash_debit)    : ""}</td>
                          <td className="border border-slate-400 px-2 py-1.5 text-right font-mono text-black">{r.cash_credit   ? fmt(r.cash_credit)   : ""}</td>
                          <td className="border border-slate-400 px-2 py-1.5 text-right font-mono text-black">{r.bank_debit    ? fmt(r.bank_debit)    : ""}</td>
                          <td className="border border-slate-400 px-2 py-1.5 text-right font-mono text-black">{r.bank_credit   ? fmt(r.bank_credit)   : ""}</td>
                          <td className="border border-slate-400 px-2 py-1.5 text-right font-mono text-black">{r.kharcha_debit ? fmt(r.kharcha_debit) : ""}</td>
                          <td className="border border-slate-400 px-2 py-1.5 text-right font-mono text-black">{r.kharcha_credit? fmt(r.kharcha_credit): ""}</td>
                          <td className="border border-slate-400 px-2 py-1.5 text-black"></td>
                          <td className="border border-slate-400 px-2 py-1.5 text-right font-mono text-black">{r.bibidh_debit  ? fmt(r.bibidh_debit)  : ""}</td>
                          <td className="border border-slate-400 px-2 py-1.5 text-right font-mono text-black">{r.bibidh_credit ? fmt(r.bibidh_credit) : ""}</td>
                        </tr>
                      ))}

                      {/* Empty filler rows */}
                      {Array.from({ length: emptyCount }).map((_, i) => (
                        <tr key={`empty-${i}`}>
                          <td className="border border-slate-200 px-1 py-1.5 text-center text-slate-200 text-[10px]"
                            style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>
                            {nepali(startPageNo + printPageRows.length + i + 1)}
                          </td>
                          {Array.from({ length: 9 }).map((_, j) => (
                            <td key={j} className="border border-slate-200 px-2 py-1.5"></td>
                          ))}
                        </tr>
                      ))}

                      {/* ── Cumulative जम्मा row ── */}
                      <tr className={`total-row font-bold text-xs ${isLast ? "bg-yellow-200" : "bg-amber-100"}`}>
                        <td className="border border-slate-500 px-2 py-2 text-right font-bold text-black"
                          style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>जम्मा</td>
                        <td className="border border-slate-500 px-2 py-2 text-right font-mono text-black">{fmt(cumCD)}</td>
                        <td className="border border-slate-500 px-2 py-2 text-right font-mono text-black">{fmt(cumCC)}</td>
                        <td className="border border-slate-500 px-2 py-2 text-right font-mono text-black">{fmt(cumBD)}</td>
                        <td className="border border-slate-500 px-2 py-2 text-right font-mono text-black">{fmt(cumBC)}</td>
                        <td className="border border-slate-500 px-2 py-2 text-right font-mono text-black">{fmt(cumKD)}</td>
                        <td className="border border-slate-500 px-2 py-2 text-right font-mono text-black">{fmt(cumPD)}</td>
                        <td className="border border-slate-500 px-2 py-2 text-black"></td>
                        <td className="border border-slate-500 px-2 py-2 text-right font-mono text-black">{fmt(cumBiD)}</td>
                        <td className="border border-slate-500 px-2 py-2 text-right font-mono text-black">{fmt(cumBiC)}</td>
                      </tr>

                      {/* Bank b/d row */}
                      <tr><td colSpan={10} className="border-0 py-1"></td></tr>
                      <tr>
                        <td colSpan={3} className="border-0 px-1 py-1"></td>
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

                      {/* Summary box — only on last print page */}
                      {isLast && (
                        <tr>
                          <td colSpan={10} className="border-0 pt-3 pb-1">
                            <div className="inline-block border border-slate-400 rounded overflow-hidden">
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
                      )}
                    </tbody>
                  </table>

                  {!isLast && (
                    <p className="no-print text-center text-xs text-slate-400 mt-2 italic">
                      — Print page {printPageIdx + 1} ends — Running जम्मा shown above —
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
