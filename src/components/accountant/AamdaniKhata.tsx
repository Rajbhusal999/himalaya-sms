"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Printer, FileSpreadsheet, ArrowLeft } from "lucide-react";

const SCHOOL_NAME = "श्री हिमालय आधारभूत विद्यालय , भरतपुर -११ , चितवन";

const FISCAL_YEARS = ["2081/2082", "2082/2083", "2083/2084", "2084/2085", "2085/2086"];

// Safe addition to avoid floating point errors
const safeAdd = (a: number, b: number) => Math.round((a + b) * 100) / 100;

const fmt = (n: number) => {
  if (!n || n === 0) return "0";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

type Topic = { id: string; name: string; type: string };
type Voucher = {
  id: string;
  date: string;
  voucher_number: string;
  description: string;
  source_type: string;
  topic_id: string;
  fiscal_year: string;
  kharcha_credit: number; // income amount for Income vouchers
  cash_debit: number;
  bank_debit: number;
  bibidh_debit: number;
};

type Props = { onBack: () => void };

export default function AamdaniKhata({ onBack }: Props) {
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
        .select("id,date,voucher_number,description,source_type,topic_id,fiscal_year,kharcha_credit,cash_debit,bank_debit,bibidh_debit")
        .eq("topic_type", "Income")
        .eq("fiscal_year", selectedFiscalYear)
        .order("date", { ascending: true })
        .order("voucher_number", { ascending: true }),
    ]);
    setVouchers(vData || []);
    setTopics(tData || []);
    setLoading(false);
  };

  const getTopicName = (id: string) => topics.find(t => t.id === id)?.name || "—";

  // Separate subtopics by source type
  const sarkariTopics = topics.filter(t =>
    vouchers.some(v => v.topic_id === t.id && v.source_type === "सरकारी")
  );
  const antarikTopics = topics.filter(t =>
    vouchers.some(v => v.topic_id === t.id && v.source_type === "आन्तरिक स्रोत")
  );
  // Combined unique subtopics for column headers
  const allSarkariCols = sarkariTopics.length > 0 ? sarkariTopics : [];
  const allAntarikCols = antarikTopics.length > 0 ? antarikTopics : [];

  // Total amount per row (income = kharcha_credit primarily, fallback to bank/cash debit)
  const getRowAmount = (v: Voucher) =>
    v.kharcha_credit || v.cash_debit || v.bank_debit || v.bibidh_debit || 0;

  const getAmountForCol = (v: Voucher, colId: string) => {
    if (v.topic_id !== colId) return 0;
    return getRowAmount(v);
  };

  // Column totals
  const colTotal = (colId: string) =>
    vouchers.reduce((s, v) => safeAdd(s, getAmountForCol(v, colId)), 0);

  const grandTotal = vouchers.reduce((s, v) => safeAdd(s, getRowAmount(v)), 0);

  // Source-group totals per row
  const sarkariRowTotal = (v: Voucher) =>
    v.source_type === "सरकारी" ? getRowAmount(v) : 0;
  const antarikRowTotal = (v: Voucher) =>
    v.source_type === "आन्तरिक स्रोत" ? getRowAmount(v) : 0;

  const handlePrint = () => window.print();

  const handleExport = () => {
    const sHeaders = allSarkariCols.map(t => t.name);
    const aHeaders = allAntarikCols.map(t => t.name);
    const headers = ["मिति", "विवरण", "भौचर नं", ...sHeaders, ...aHeaders, "जम्मा"];

    const rows = vouchers.map(v => [
      v.date,
      v.description || "",
      v.voucher_number,
      ...allSarkariCols.map(c => getAmountForCol(v, c.id) || ""),
      ...allAntarikCols.map(c => getAmountForCol(v, c.id) || ""),
      getRowAmount(v),
    ]);

    const totalsRow = [
      "जम्मा", "", "",
      ...allSarkariCols.map(c => colTotal(c.id) || ""),
      ...allAntarikCols.map(c => colTotal(c.id) || ""),
      grandTotal,
    ];

    const csv = [
      [SCHOOL_NAME],
      [`आ.व. ${selectedFiscalYear}`],
      ["आम्दानी खाता"],
      [],
      headers,
      ...rows,
      [],
      totalsRow,
    ]
      .map(r => r.join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aamdani-khata-${selectedFiscalYear.replace("/", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCols = 3 + allSarkariCols.length + allAntarikCols.length + 1;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #amd-print-root, #amd-print-root * { visibility: visible !important; color: black !important; }
          #amd-print-root { position: fixed; inset: 0; overflow: visible; }
          @page { size: A3 landscape; margin: 8mm 6mm; }
          .no-print { display: none !important; }
          table { border-collapse: collapse; width: 100%; font-size: 8pt; color: black; }
          th, td { border: 1px solid #333 !important; padding: 1px 3px !important; color: black !important; }
          th { background-color: #dde3ea !important; }
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
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <div>
              <h2 className="text-xl font-bold text-slate-800">आम्दानी खाता</h2>
              <p className="text-slate-500 text-xs">Aamdani Khata — Income Register</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Fiscal Year (आ.व.)</label>
              <select
                value={selectedFiscalYear}
                onChange={e => setSelectedFiscalYear(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
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
              <Printer className="w-4 h-4" /> Print A3 Landscape
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div id="amd-print-root" className="overflow-x-auto">
            <table className="border-collapse text-xs w-full">
              <thead>
                {/* School Name */}
                <tr>
                  <td
                    colSpan={totalCols}
                    className="text-center font-bold border border-slate-400 bg-slate-50 py-2 text-sm text-black"
                    style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}
                  >
                    {SCHOOL_NAME}
                  </td>
                </tr>
                {/* Fiscal Year */}
                <tr>
                  <td
                    colSpan={totalCols}
                    className="text-center font-semibold border border-slate-400 bg-slate-50 py-1 text-xs text-black"
                    style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}
                  >
                    आ व {selectedFiscalYear}
                  </td>
                </tr>
                {/* Report Title */}
                <tr>
                  <td
                    colSpan={totalCols}
                    className="text-center font-bold border border-emerald-600 bg-emerald-50 py-1.5 text-sm text-black"
                    style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}
                  >
                    आम्दानी खाता
                  </td>
                </tr>
                <tr><td colSpan={totalCols} className="border-0 py-0.5 bg-white" /></tr>

                {/* Group headers row 1 */}
                <tr className="bg-slate-200 text-center text-[10px] font-bold text-black">
                  <th rowSpan={2} className="border border-slate-500 px-1 py-1 text-black" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>मिति</th>
                  <th rowSpan={2} className="border border-slate-500 px-2 py-1 min-w-[140px] text-black" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>विवरण</th>
                  <th rowSpan={2} className="border border-slate-500 px-1 py-1 text-black" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>भौचर नं</th>
                  {allSarkariCols.length > 0 && (
                    <th
                      colSpan={allSarkariCols.length}
                      className="border border-slate-500 px-2 py-1 text-black bg-blue-100"
                      style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}
                    >
                      सरकारी बजेट
                    </th>
                  )}
                  {allAntarikCols.length > 0 && (
                    <th
                      colSpan={allAntarikCols.length}
                      className="border border-slate-500 px-2 py-1 text-black bg-amber-100"
                      style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}
                    >
                      आन्तरिक स्रोत
                    </th>
                  )}
                  <th rowSpan={2} className="border border-slate-500 px-2 py-1 text-black" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>जम्मा</th>
                </tr>

                {/* Sub-column headers row 2 */}
                <tr className="bg-slate-200 text-center text-[10px] font-bold text-black">
                  {allSarkariCols.map(c => (
                    <th key={c.id} className="border border-slate-500 px-1 py-1 text-black bg-blue-50" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>
                      {c.name}
                    </th>
                  ))}
                  {allAntarikCols.map(c => (
                    <th key={c.id} className="border border-slate-500 px-1 py-1 text-black bg-amber-50" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={totalCols} className="text-center py-12 text-slate-400 border border-slate-300 text-sm">
                      No income vouchers found for fiscal year {selectedFiscalYear}. Please add entry vouchers first.
                    </td>
                  </tr>
                ) : (
                  vouchers.map(v => {
                    const rowAmt = getRowAmount(v);
                    return (
                      <tr key={v.id} className="hover:bg-emerald-50/20 transition-colors">
                        <td className="border border-slate-400 px-1 py-1 whitespace-nowrap text-black text-[11px]">{v.date}</td>
                        <td className="border border-slate-400 px-2 py-1 text-black text-[11px]" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>
                          {v.description || getTopicName(v.topic_id)}
                        </td>
                        <td className="border border-slate-400 px-1 py-1 text-center font-mono text-black text-[11px]">{v.voucher_number}</td>
                        {allSarkariCols.map(c => (
                          <td key={c.id} className="border border-slate-400 px-1 py-1 text-right font-mono text-black text-[11px]">
                            {getAmountForCol(v, c.id) > 0 ? fmt(getAmountForCol(v, c.id)) : ""}
                          </td>
                        ))}
                        {allAntarikCols.map(c => (
                          <td key={c.id} className="border border-slate-400 px-1 py-1 text-right font-mono text-black text-[11px]">
                            {getAmountForCol(v, c.id) > 0 ? fmt(getAmountForCol(v, c.id)) : ""}
                          </td>
                        ))}
                        <td className="border border-slate-400 px-2 py-1 text-right font-mono font-bold text-black text-[11px]">
                          {rowAmt > 0 ? fmt(rowAmt) : ""}
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Grand Total Row */}
                {vouchers.length > 0 && (
                  <tr className="total-row bg-yellow-200 font-bold text-xs text-black">
                    <td
                      colSpan={3}
                      className="border border-slate-500 px-3 py-2 text-right font-bold text-black"
                      style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}
                    >
                      जम्मा
                    </td>
                    {allSarkariCols.map(c => (
                      <td key={c.id} className="border border-slate-500 px-1 py-2 text-right font-mono font-bold text-black">
                        {fmt(colTotal(c.id))}
                      </td>
                    ))}
                    {allAntarikCols.map(c => (
                      <td key={c.id} className="border border-slate-500 px-1 py-2 text-right font-mono font-bold text-black">
                        {fmt(colTotal(c.id))}
                      </td>
                    ))}
                    <td className="border border-slate-500 px-2 py-2 text-right font-mono font-bold text-black">
                      {fmt(grandTotal)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
