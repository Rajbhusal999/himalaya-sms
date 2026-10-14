"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Printer, FileSpreadsheet, ArrowLeft } from "lucide-react";

type VoucherRaw = {
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
  details: {
    cash?:    { id: string; debit: string; credit: string }[];
    bank?:    { id: string; debit: string; credit: string }[];
    bibidh?:  { id: string; debit: string; credit: string }[];
    aamdani?: { id: string; amount: string }[];
    kharcha?: { id: string; amount: string }[];
  } | null;
};

// One display row in the table (one per sub-entry in a voucher)
type DisplayRow = {
  key: string;
  date: string;
  voucher_number: string;
  description: string;
  isFirst: boolean; // first sub-row of a voucher → show date/voucher/description
  cash_debit: number;
  cash_credit: number;
  bank_debit: number;
  bank_credit: number;
  kharcha_debit: number;
  bibidh_debit: number;
  bibidh_credit: number;
};

type Props = {
  onBack: () => void;
};

const SCHOOL_NAME = "श्री हिमालय आधारभूत विद्यालय , भरतपुर -११ , चितवन";
const REPORT_TITLE = "नगद / बैंक खाता (१)";
const ROWS_PER_PAGE = 18;

const safeAdd = (a: number, b: number) =>
  Math.round((a + b) * 100) / 100;

const n = (v: string | number | undefined) =>
  parseFloat((v as string) || "0") || 0;

const fmt = (val: number) => {
  if (!val || val === 0) return "";
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Expand a single voucher (which may have multiple sub-rows in `details`)
 * into individual DisplayRows — one per non-zero sub-entry across all ledgers.
 */
function expandVoucher(v: VoucherRaw): DisplayRow[] {
  const rows: DisplayRow[] = [];
  const d = v.details;

  const cashRows    = d?.cash    ?? [];
  const bankRows    = d?.bank    ?? [];
  const bibidhRows  = d?.bibidh  ?? [];
  const aamdaniRows = d?.aamdani ?? [];
  const kharchaRows = d?.kharcha ?? [];

  const maxLen = Math.max(
    cashRows.length,
    bankRows.length,
    bibidhRows.length,
    aamdaniRows.length,
    kharchaRows.length,
    1
  );

  for (let i = 0; i < maxLen; i++) {
    const cash    = cashRows[i];
    const bank    = bankRows[i];
    const bibidh  = bibidhRows[i];
    const aamdani = aamdaniRows[i];
    const kharcha = kharchaRows[i];

    const cashD   = n(cash?.debit);
    const cashC   = n(cash?.credit);
    const bankD   = n(bank?.debit);
    const bankC   = n(bank?.credit);
    const bibD    = n(bibidh?.debit);
    const bibC    = n(bibidh?.credit);
    const khrcAmt = n(kharcha?.amount);

    // Skip entirely empty sub-rows (but always include at least the first)
    if (
      i > 0 &&
      cashD === 0 && cashC === 0 &&
      bankD === 0 && bankC === 0 &&
      bibD  === 0 && bibC  === 0 &&
      khrcAmt === 0
    ) {
      continue;
    }

    rows.push({
      key:            `${v.id}-${i}`,
      date:           v.date,
      voucher_number: v.voucher_number,
      description:    v.description || "",
      isFirst:        i === 0,
      cash_debit:     cashD,
      cash_credit:    cashC,
      bank_debit:     bankD,
      bank_credit:    bankC,
      kharcha_debit:  khrcAmt,
      bibidh_debit:   bibD,
      bibidh_credit:  bibC,
    });
  }

  // Fallback for old vouchers that have no `details` column
  if (rows.length === 0) {
    rows.push({
      key:            `${v.id}-0`,
      date:           v.date,
      voucher_number: v.voucher_number,
      description:    v.description || "",
      isFirst:        true,
      cash_debit:     v.cash_debit    || 0,
      cash_credit:    v.cash_credit   || 0,
      bank_debit:     v.bank_debit    || 0,
      bank_credit:    v.bank_credit   || 0,
      kharcha_debit:  v.kharcha_debit || 0,
      bibidh_debit:   v.bibidh_debit  || 0,
      bibidh_credit:  v.bibidh_credit || 0,
    });
  }

  return rows;
}

export default function BankNagadiKitab({ onBack }: Props) {
  const [vouchers, setVouchers] = useState<VoucherRaw[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("accounting_vouchers")
      .select(
        "id,date,voucher_number,description,cash_debit,cash_credit,bank_debit,bank_credit,kharcha_debit,kharcha_credit,bibidh_debit,bibidh_credit,details"
      )
      .order("date", { ascending: true })
      .order("voucher_number", { ascending: true });

    if (error) console.error("Error fetching vouchers:", error);
    else setVouchers((data as VoucherRaw[]) || []);
    setLoading(false);
  };

  // All display rows (expanded from individual sub-entries)
  const allDisplayRows: DisplayRow[] = vouchers.flatMap(expandVoucher);

  // Grand totals — always use the reliable DB-summed columns
  const grandCashD  = vouchers.reduce((s, v) => safeAdd(s, v.cash_debit    || 0), 0);
  const grandCashC  = vouchers.reduce((s, v) => safeAdd(s, v.cash_credit   || 0), 0);
  const grandBankD  = vouchers.reduce((s, v) => safeAdd(s, v.bank_debit    || 0), 0);
  const grandBankC  = vouchers.reduce((s, v) => safeAdd(s, v.bank_credit   || 0), 0);
  const grandKharch = vouchers.reduce((s, v) => safeAdd(s, v.kharcha_debit || 0), 0);
  const grandBibD   = vouchers.reduce((s, v) => safeAdd(s, v.bibidh_debit  || 0), 0);
  const grandBibC   = vouchers.reduce((s, v) => safeAdd(s, v.bibidh_credit || 0), 0);

  // Paginate display rows
  const pages: DisplayRow[][] = [];
  for (let i = 0; i < allDisplayRows.length; i += ROWS_PER_PAGE) {
    pages.push(allDisplayRows.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const handlePrint  = () => window.print();

  const handleExport = () => {
    const headers = [
      "मिति", "भौचर नं", "विवरण",
      "नगद डेबिट", "नगद क्रेडिट",
      "बैंक डेबिट", "बैंक क्रेडिट",
      "बजेट खर्च",
      "विविध डेबिट", "विविध क्रेडिट",
    ];
    const rows = allDisplayRows.map((r) => [
      r.isFirst ? r.date           : "",
      r.isFirst ? r.voucher_number : "",
      r.isFirst ? r.description    : "",
      r.cash_debit    || "",
      r.cash_credit   || "",
      r.bank_debit    || "",
      r.bank_credit   || "",
      r.kharcha_debit || "",
      r.bibidh_debit  || "",
      r.bibidh_credit || "",
    ]);
    const totals = [
      "जम्मा", "", "",
      grandCashD, grandCashC,
      grandBankD, grandBankC,
      grandKharch,
      grandBibD, grandBibC,
    ];
    const csv = [
      [SCHOOL_NAME], [REPORT_TITLE], [],
      headers, ...rows, [], totals,
    ]
      .map((r) => r.join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "bank-nagadi-kitab.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const ColumnHeaders = () => (
    <>
      <tr>
        <td
          colSpan={10}
          className="text-center font-bold border border-slate-400 bg-slate-50 py-2 text-sm text-black"
          style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}
        >
          {SCHOOL_NAME}
        </td>
      </tr>
      <tr>
        <td
          colSpan={10}
          className="text-center font-semibold border border-slate-400 bg-slate-50 py-1 text-xs text-black"
          style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}
        >
          {REPORT_TITLE}
        </td>
      </tr>
      <tr><td colSpan={10} className="border-0 py-1 bg-white" /></tr>
      <tr className="bg-slate-200 text-center text-[11px] font-bold text-black">
        <th rowSpan={2} className="border border-slate-500 px-2 py-1 text-black" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>मिति</th>
        <th rowSpan={2} className="border border-slate-500 px-2 py-1 text-black" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>भौचर&nbsp;नं</th>
        <th rowSpan={2} className="border border-slate-500 px-3 py-1 min-w-[160px] text-black" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>विवरण</th>
        <th colSpan={2} className="border border-slate-500 px-2 py-1 text-black" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>नगद मौजदात</th>
        <th colSpan={2} className="border border-slate-500 px-2 py-1 text-black" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>बैंक मौजदात</th>
        <th rowSpan={2} className="border border-slate-500 px-2 py-1 text-black" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>बजेट&nbsp;खर्च<br />रकम</th>
        <th colSpan={2} className="border border-slate-500 px-2 py-1 text-black" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>विविध</th>
      </tr>
      <tr className="bg-slate-200 text-center text-[11px] font-bold text-black">
        {["डेबिट", "क्रेडिट", "डेबिट", "क्रेडिट", "डेबिट", "क्रेडिट"].map((h, i) => (
          <th key={i} className="border border-slate-500 px-2 py-1 text-black" style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}>{h}</th>
        ))}
      </tr>
    </>
  );

  return (
    <>
      {/* ── Print Styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #bnk-print-root, #bnk-print-root * { visibility: visible !important; color: black !important; }
          #bnk-print-root { position: fixed; inset: 0; overflow: visible; }
          @page { size: A4 landscape; margin: 10mm 8mm; }
          .no-print { display: none !important; }
          .page-section {
            page-break-after: always;
            page-break-inside: avoid;
          }
          .page-section:last-child { page-break-after: auto; }
          table { border-collapse: collapse; width: 100%; font-size: 9pt; color: black; }
          th, td { border: 1px solid #333 !important; padding: 2px 4px !important; color: black !important; }
          th { background-color: #e2e8f0 !important; }
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
              <h2 className="text-xl font-bold text-slate-800">बैंक नगदी किताब</h2>
              <p className="text-slate-500 text-xs">नगद / बैंक खाता — individual row view</p>
            </div>
          </div>
          <div className="flex gap-2">
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
              <Printer className="w-4 h-4" /> Print A4 Landscape
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div id="bnk-print-root" className="overflow-x-auto">
            {pages.map((pageRows, pageIdx) => {
              // Running page subtotals using display rows
              const upToRows   = allDisplayRows.slice(0, (pageIdx + 1) * ROWS_PER_PAGE);
              const pageCashD  = upToRows.reduce((s, r) => safeAdd(s, r.cash_debit),    0);
              const pageCashC  = upToRows.reduce((s, r) => safeAdd(s, r.cash_credit),   0);
              const pageBankD  = upToRows.reduce((s, r) => safeAdd(s, r.bank_debit),    0);
              const pageBankC  = upToRows.reduce((s, r) => safeAdd(s, r.bank_credit),   0);
              const pageKharch = upToRows.reduce((s, r) => safeAdd(s, r.kharcha_debit), 0);
              const pageBibD   = upToRows.reduce((s, r) => safeAdd(s, r.bibidh_debit),  0);
              const pageBibC   = upToRows.reduce((s, r) => safeAdd(s, r.bibidh_credit), 0);

              const isLast        = pageIdx === pages.length - 1;
              const subtotalLabel = isLast ? "जम्मा (Grand Total)" : `जम्मा (पृ. ${pageIdx + 1})`;

              // Grand Total row always uses DB-reliable summed columns
              const totalCashD  = isLast ? grandCashD  : pageCashD;
              const totalCashC  = isLast ? grandCashC  : pageCashC;
              const totalBankD  = isLast ? grandBankD  : pageBankD;
              const totalBankC  = isLast ? grandBankC  : pageBankC;
              const totalKharch = isLast ? grandKharch : pageKharch;
              const totalBibD   = isLast ? grandBibD   : pageBibD;
              const totalBibC   = isLast ? grandBibC   : pageBibC;

              return (
                <div
                  key={pageIdx}
                  className={`page-section mb-10 ${!isLast ? "border-b-2 border-dashed border-slate-300 pb-10" : ""}`}
                >
                  <table className="border-collapse text-xs w-full">
                    <thead>
                      <ColumnHeaders />
                    </thead>
                    <tbody>
                      {pageRows.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center py-12 text-slate-400 border border-slate-300">
                            No voucher entries found. Please add entry vouchers first.
                          </td>
                        </tr>
                      ) : (
                        pageRows.map((row) => (
                          <tr
                            key={row.key}
                            className={`transition-colors ${
                              row.isFirst
                                ? "hover:bg-blue-50/20"
                                : "bg-slate-50/30 hover:bg-slate-100/40"
                            }`}
                          >
                            {/* Date — only on the first sub-row of a voucher */}
                            <td className="border border-slate-400 px-2 py-1 whitespace-nowrap text-black">
                              {row.isFirst ? row.date : ""}
                            </td>
                            {/* Voucher number */}
                            <td className="border border-slate-400 px-2 py-1 text-center font-mono text-black">
                              {row.isFirst ? row.voucher_number : ""}
                            </td>
                            {/* Description */}
                            <td
                              className="border border-slate-400 px-3 py-1 text-black"
                              style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}
                            >
                              {row.isFirst ? (row.description || "—") : ""}
                            </td>
                            <td className="border border-slate-400 px-2 py-1 text-right font-mono text-black">{fmt(row.cash_debit)}</td>
                            <td className="border border-slate-400 px-2 py-1 text-right font-mono text-black">{fmt(row.cash_credit)}</td>
                            <td className="border border-slate-400 px-2 py-1 text-right font-mono text-black">{fmt(row.bank_debit)}</td>
                            <td className="border border-slate-400 px-2 py-1 text-right font-mono text-black">{fmt(row.bank_credit)}</td>
                            <td className="border border-slate-400 px-2 py-1 text-right font-mono text-black">{fmt(row.kharcha_debit)}</td>
                            <td className="border border-slate-400 px-2 py-1 text-right font-mono text-black">{fmt(row.bibidh_debit)}</td>
                            <td className="border border-slate-400 px-2 py-1 text-right font-mono text-black">{fmt(row.bibidh_credit)}</td>
                          </tr>
                        ))
                      )}

                      {/* ── Page Subtotal / Grand Total Row ── */}
                      {pageRows.length > 0 && (
                        <tr className={`font-bold text-xs ${isLast ? "bg-slate-700 text-white" : "bg-amber-100 text-black"}`}>
                          <td
                            colSpan={3}
                            className={`border px-3 py-1.5 text-right ${isLast ? "border-slate-600 text-white" : "border-slate-500 text-black"}`}
                            style={{ fontFamily: "Kalimati, 'Arial Unicode MS', sans-serif" }}
                          >
                            {subtotalLabel}
                          </td>
                          <td className={`border px-2 py-1.5 text-right font-mono ${isLast ? "border-slate-600 text-white" : "border-slate-500 text-black"}`}>{fmt(totalCashD)}</td>
                          <td className={`border px-2 py-1.5 text-right font-mono ${isLast ? "border-slate-600 text-white" : "border-slate-500 text-black"}`}>{fmt(totalCashC)}</td>
                          <td className={`border px-2 py-1.5 text-right font-mono ${isLast ? "border-slate-600 text-white" : "border-slate-500 text-black"}`}>{fmt(totalBankD)}</td>
                          <td className={`border px-2 py-1.5 text-right font-mono ${isLast ? "border-slate-600 text-white" : "border-slate-500 text-black"}`}>{fmt(totalBankC)}</td>
                          <td className={`border px-2 py-1.5 text-right font-mono ${isLast ? "border-slate-600 text-white" : "border-slate-500 text-black"}`}>{fmt(totalKharch)}</td>
                          <td className={`border px-2 py-1.5 text-right font-mono ${isLast ? "border-slate-600 text-white" : "border-slate-500 text-black"}`}>{fmt(totalBibD)}</td>
                          <td className={`border px-2 py-1.5 text-right font-mono ${isLast ? "border-slate-600 text-white" : "border-slate-500 text-black"}`}>{fmt(totalBibC)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {!isLast && (
                    <p className="no-print text-center text-xs text-slate-400 mt-2 italic">
                      — Page {pageIdx + 1} ends here — Running totals shown above —
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
