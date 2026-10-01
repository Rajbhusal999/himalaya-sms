"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Loader2, Eye, Pencil, Trash2, X, Save, RefreshCw,
  CheckCircle, AlertTriangle, ChevronLeft, ChevronRight
} from "lucide-react";

type Voucher = {
  id: string;
  date: string;
  voucher_number: string;
  description: string;
  source_type: string;
  topic_id: string;
  topic_type: string;
  fiscal_year: string;
  cash_debit: number;
  cash_credit: number;
  bank_debit: number;
  bank_credit: number;
  kharcha_debit: number;
  kharcha_credit: number;
  bibidh_debit: number;
  bibidh_credit: number;
  created_at: string;
};

type Topic = { id: string; name: string; type: string };

const FISCAL_YEARS = ["2081/2082", "2082/2083", "2083/2084", "2084/2085", "2085/2086"];
const PAGE_SIZE = 15;

const fmt = (n: number) =>
  !n ? "—" : `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function VoucherList() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterFY, setFilterFY] = useState("2083/2084");
  const [filterType, setFilterType] = useState<"" | "Income" | "Expense">("");
  const [search, setSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);

  // View modal
  const [viewVoucher, setViewVoucher] = useState<Voucher | null>(null);

  // Edit modal
  const [editVoucher, setEditVoucher] = useState<Voucher | null>(null);
  const [editForm, setEditForm] = useState<Partial<Voucher>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterFY, filterType]);

  const fetchData = async () => {
    setLoading(true);
    setPage(1);
    let q = supabase
      .from("accounting_vouchers")
      .select("*")
      .eq("fiscal_year", filterFY)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (filterType) q = q.eq("topic_type", filterType);
    const { data, error } = await q;
    if (!error) setVouchers(data || []);

    const { data: tData } = await supabase.from("accounting_topics").select("id,name,type");
    setTopics(tData || []);
    setLoading(false);
  };

  const getTopicName = (id: string) => topics.find(t => t.id === id)?.name || "—";

  // Filtered + searched vouchers
  const filtered = vouchers.filter(v => {
    const q = search.toLowerCase();
    return (
      !q ||
      v.voucher_number?.toLowerCase().includes(q) ||
      v.description?.toLowerCase().includes(q) ||
      getTopicName(v.topic_id).toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Edit ──────────────────────────────────────────────────────────────────────
  const openEdit = (v: Voucher) => {
    setEditVoucher(v);
    setEditForm({ ...v });
    setSaveSuccess(false);
  };

  const handleEditSave = async () => {
    if (!editVoucher) return;
    setSaving(true);
    const { error } = await supabase
      .from("accounting_vouchers")
      .update({
        date: editForm.date,
        voucher_number: editForm.voucher_number,
        description: editForm.description,
        source_type: editForm.source_type,
        fiscal_year: editForm.fiscal_year,
        cash_debit: Number(editForm.cash_debit) || 0,
        cash_credit: Number(editForm.cash_credit) || 0,
        bank_debit: Number(editForm.bank_debit) || 0,
        bank_credit: Number(editForm.bank_credit) || 0,
        kharcha_debit: Number(editForm.kharcha_debit) || 0,
        kharcha_credit: Number(editForm.kharcha_credit) || 0,
        bibidh_debit: Number(editForm.bibidh_debit) || 0,
        bibidh_credit: Number(editForm.bibidh_credit) || 0,
      })
      .eq("id", editVoucher.id);

    if (!error) {
      setSaveSuccess(true);
      fetchData();
      setTimeout(() => {
        setEditVoucher(null);
        setSaveSuccess(false);
      }, 1200);
    } else {
      alert("Error saving: " + error.message);
    }
    setSaving(false);
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("accounting_vouchers").delete().eq("id", deleteId);
    if (!error) {
      setVouchers(prev => prev.filter(v => v.id !== deleteId));
    } else {
      alert("Error deleting: " + error.message);
    }
    setDeleteId(null);
    setDeleting(false);
  };

  const ef = (field: keyof Voucher, val: string) =>
    setEditForm(f => ({ ...f, [field]: val }));

  return (
    <div className="space-y-6">
      {/* ── Header + Filters ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Saved Vouchers</h2>
            <p className="text-slate-500 text-sm mt-0.5">View, edit or delete existing voucher entries.</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-bold">
            {filtered.length} records
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Fiscal Year */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Fiscal Year</label>
            <select
              value={filterFY}
              onChange={e => { setFilterFY(e.target.value); }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            >
              {FISCAL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {/* Type */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            >
              <option value="">All Types</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Voucher no., description, topic..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <AlertTriangle className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium">No vouchers found</p>
            <p className="text-sm">Try changing the fiscal year or search term.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-left">
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase">Date</th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase">Voucher No.</th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase">Topic</th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase">Description</th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase">Type</th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase">Source</th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase text-right">Amount</th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.map(v => {
                    const amount = v.kharcha_debit || v.kharcha_credit || v.cash_debit || v.bank_debit || v.bibidh_debit || 0;
                    return (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap font-mono text-xs">{v.date}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-slate-100 rounded font-mono text-xs font-bold text-slate-700"># {v.voucher_number}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 text-xs">{getTopicName(v.topic_id)}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs max-w-[180px] truncate">{v.description || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            v.topic_type === "Income"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}>
                            {v.topic_type === "Income" ? "Income" : "Expense"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600" style={{ fontFamily: "Kalimati, sans-serif" }}>
                          {v.source_type || "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-slate-800">
                          {amount > 0 ? `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setViewVoucher(v)}
                              title="View"
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEdit(v)}
                              title="Edit"
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(v.id)}
                              title="Delete"
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
                <span className="text-xs text-slate-500">
                  Page {page} of {totalPages} — {filtered.length} total records
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══════════ VIEW MODAL ═══════════ */}
      {viewVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Voucher Details</h3>
                <p className="text-slate-500 text-sm">#{viewVoucher.voucher_number}</p>
              </div>
              <button onClick={() => setViewVoucher(null)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Date (मिति)", viewVoucher.date],
                  ["Voucher No.", `#${viewVoucher.voucher_number}`],
                  ["Topic", getTopicName(viewVoucher.topic_id)],
                  ["Type", viewVoucher.topic_type],
                  ["Source", viewVoucher.source_type || "—"],
                  ["Fiscal Year", viewVoucher.fiscal_year || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">{label}</p>
                    <p className="text-sm font-semibold text-slate-800" style={{ fontFamily: "Kalimati, sans-serif" }}>{value}</p>
                  </div>
                ))}
              </div>

              {viewVoucher.description && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Description</p>
                  <p className="text-sm text-slate-800">{viewVoucher.description}</p>
                </div>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-4 py-2 text-left text-xs font-bold text-slate-600">Ledger</th>
                      <th className="px-4 py-2 text-right text-xs font-bold text-slate-600">Debit (Rs.)</th>
                      <th className="px-4 py-2 text-right text-xs font-bold text-slate-600">Credit (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ["Cash (नगद)", viewVoucher.cash_debit, viewVoucher.cash_credit],
                      ["Bank (बैंक)", viewVoucher.bank_debit, viewVoucher.bank_credit],
                      [viewVoucher.topic_type === "Income" ? "Aamdani (आम्दानी)" : "Kharcha (खर्च)", viewVoucher.kharcha_debit, viewVoucher.kharcha_credit],
                      ["Bibidh (विविध)", viewVoucher.bibidh_debit, viewVoucher.bibidh_credit],
                    ].map(([label, d, c]) => (
                      <tr key={label as string} className={(!d && !c) ? "opacity-30" : ""}>
                        <td className="px-4 py-2 text-slate-700 font-medium">{label as string}</td>
                        <td className="px-4 py-2 text-right font-mono text-emerald-700">{d ? `${(d as number).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}</td>
                        <td className="px-4 py-2 text-right font-mono text-rose-700">{c ? `${(c as number).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ EDIT MODAL ═══════════ */}
      {editVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Edit Voucher</h3>
                <p className="text-slate-500 text-sm">#{editVoucher.voucher_number}</p>
              </div>
              <button onClick={() => setEditVoucher(null)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Basic fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Date</label>
                  <input type="text" value={editForm.date || ""} onChange={e => ef("date", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Voucher No.</label>
                  <input type="text" value={editForm.voucher_number || ""} onChange={e => ef("voucher_number", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Source Type</label>
                  <select value={editForm.source_type || ""} onChange={e => ef("source_type", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
                    <option value="आन्तरिक स्रोत">आन्तरिक स्रोत</option>
                    <option value="सरकारी">सरकारी</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Fiscal Year</label>
                  <select value={editForm.fiscal_year || ""} onChange={e => ef("fiscal_year", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
                    {FISCAL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                <input type="text" value={editForm.description || ""} onChange={e => ef("description", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>

              {/* Amount fields */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2">
                  <p className="text-xs font-bold text-slate-600 uppercase">Ledger Amounts</p>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  {([
                    ["Cash Debit", "cash_debit"], ["Cash Credit", "cash_credit"],
                    ["Bank Debit", "bank_debit"], ["Bank Credit", "bank_credit"],
                    [editForm.topic_type === "Income" ? "Aamdani Debit" : "Kharcha Debit", "kharcha_debit"],
                    [editForm.topic_type === "Income" ? "Aamdani Credit" : "Kharcha Credit", "kharcha_credit"],
                    ["Bibidh Debit", "bibidh_debit"], ["Bibidh Credit", "bibidh_credit"],
                  ] as [string, keyof Voucher][]).map(([label, field]) => (
                    <div key={field}>
                      <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label>
                      <input
                        type="number" step="0.01" min="0"
                        value={(editForm[field] as number) || ""}
                        onChange={e => ef(field, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {saveSuccess && (
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl font-semibold text-sm border border-emerald-200">
                  <CheckCircle className="w-4 h-4" /> Voucher updated successfully!
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setEditVoucher(null)}
                  className="px-5 py-2.5 border border-slate-300 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleEditSave} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow transition-colors disabled:opacity-50">
                  {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ DELETE CONFIRM MODAL ═══════════ */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Delete Voucher?</h3>
                <p className="text-slate-500 text-sm">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow transition-colors disabled:opacity-50">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
