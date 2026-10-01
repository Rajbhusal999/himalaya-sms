"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Save, Loader2, RefreshCw, Plus, Trash2 } from "lucide-react";
import NepaliDatePicker from "@/components/common/NepaliDatePicker";
import { getCurrentBsDate } from "@/lib/nepaliDate";

type Topic = {
  id: string;
  name: string;
  type: string;
  source_type: string;
};

type Subtopic = {
  id: string;
  topic_id: string;
  name: string;
};

type AmountRow = { id: string; debit: string; credit: string };
type SingleAmountRow = { id: string; amount: string };

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function EntryVoucher() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [lastVoucher, setLastVoucher] = useState<string>("");

  // Form states
  const [voucherType, setVoucherType] = useState<"Income" | "Expense">("Income");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [selectedSourceType, setSelectedSourceType] = useState<"सरकारी" | "आन्तरिक स्रोत">("आन्तरिक स्रोत");
  const [date, setDate] = useState(getCurrentBsDate());
  const [voucherNumber, setVoucherNumber] = useState("");
  const [description, setDescription] = useState("");
  
  // Ledger Arrays - initialize with 2 rows as requested
  const [cashRows, setCashRows] = useState<AmountRow[]>([{ id: generateId(), debit: "", credit: "" }, { id: generateId(), debit: "", credit: "" }]);
  const [bankRows, setBankRows] = useState<AmountRow[]>([{ id: generateId(), debit: "", credit: "" }, { id: generateId(), debit: "", credit: "" }]);
  const [bibidhRows, setBibidhRows] = useState<AmountRow[]>([{ id: generateId(), debit: "", credit: "" }, { id: generateId(), debit: "", credit: "" }]);
  const [kharchaRows, setKharchaRows] = useState<SingleAmountRow[]>([{ id: generateId(), amount: "" }, { id: generateId(), amount: "" }]);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoadingData(true);
    try {
      const { data: tData } = await supabase.from("accounting_topics").select("*").order("name");
      const { data: sData } = await supabase.from("accounting_subtopics").select("*").order("name");
      const { data: vData } = await supabase.from("accounting_vouchers")
        .select("voucher_number")
        .order("created_at", { ascending: false })
        .limit(1);

      if (tData) setTopics(tData);
      if (sData) setSubtopics(sData);
      if (vData && vData.length > 0) setLastVoucher(vData[0].voucher_number);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const filteredTopics = topics.filter(t => t.type === voucherType);

  // Auto-select first topic if available when voucher type changes
  useEffect(() => {
    if (filteredTopics.length > 0 && !filteredTopics.find(t => t.id === selectedTopicId)) {
      setSelectedTopicId(filteredTopics[0].id);
      setSelectedSourceType((filteredTopics[0].source_type as "सरकारी" | "आन्तरिक स्रोत") || "आन्तरिक स्रोत");
    } else if (filteredTopics.length === 0) {
      setSelectedTopicId("");
    }
  }, [voucherType, filteredTopics, selectedTopicId]);

  // Sync source type when topic changes manually
  useEffect(() => {
    const topic = topics.find(t => t.id === selectedTopicId);
    if (topic && topic.source_type) {
      setSelectedSourceType(topic.source_type as "सरकारी" | "आन्तरिक स्रोत");
    }
  }, [selectedTopicId, topics]);

  const calculateTotal = (rows: any[], field: string) => {
    return rows.reduce((acc, row) => acc + (parseFloat(row[field]) || 0), 0);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId || !voucherNumber.trim()) {
      alert("Please select a topic and enter a voucher number.");
      return;
    }

    setSaving(true);
    setSuccess(false);

    try {
      const details = {
        cash: cashRows.filter(r => r.debit || r.credit),
        bank: bankRows.filter(r => r.debit || r.credit),
        kharcha: kharchaRows.filter(r => r.amount),
        bibidh: bibidhRows.filter(r => r.debit || r.credit),
      };

      const { error } = await supabase.from("accounting_vouchers").insert([{
        topic_id: selectedTopicId,
        source_type: selectedSourceType,
        date,
        voucher_number: voucherNumber.trim(),
        description: description.trim(),
        details,
        cash_debit: calculateTotal(cashRows, 'debit'),
        cash_credit: calculateTotal(cashRows, 'credit'),
        bank_debit: calculateTotal(bankRows, 'debit'),
        bank_credit: calculateTotal(bankRows, 'credit'),
        kharcha_debit: calculateTotal(kharchaRows, 'amount'), // Store all single kharcha amounts as debit by default
        kharcha_credit: 0, 
        bibidh_debit: calculateTotal(bibidhRows, 'debit'),
        bibidh_credit: calculateTotal(bibidhRows, 'credit'),
      }]);

      if (error) throw error;
      
      setSuccess(true);
      setLastVoucher(voucherNumber.trim());
      
      // Reset form amounts and desc
      setVoucherNumber("");
      setDescription("");
      setCashRows([{ id: generateId(), debit: "", credit: "" }, { id: generateId(), debit: "", credit: "" }]);
      setBankRows([{ id: generateId(), debit: "", credit: "" }, { id: generateId(), debit: "", credit: "" }]);
      setBibidhRows([{ id: generateId(), debit: "", credit: "" }, { id: generateId(), debit: "", credit: "" }]);
      setKharchaRows([{ id: generateId(), amount: "" }, { id: generateId(), amount: "" }]);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving voucher:", err);
      alert("Failed to save voucher. " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Enter Voucher</h2>
        <p className="text-slate-500 text-sm mt-1">Record incoming fees and outgoing expenses.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-slate-700 mb-2">Topic</label>
            <select
              value={voucherType}
              onChange={(e) => setVoucherType(e.target.value as "Income" | "Expense")}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-900"
            >
              <option value="Income">Income</option>
              <option value="Expense">Expenditure</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-slate-700 mb-2">Subtopic</label>
            <select
              required
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              disabled={filteredTopics.length === 0}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-900 disabled:opacity-50"
            >
              <option value="" disabled>{filteredTopics.length === 0 ? "No subtopics" : "Select..."}</option>
              {filteredTopics.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-slate-700 mb-2">Source Type</label>
            <select
              value={selectedSourceType}
              onChange={(e) => setSelectedSourceType(e.target.value as "सरकारी" | "आन्तरिक स्रोत")}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-900"
            >
              <option value="आन्तरिक स्रोत">आन्तरिक स्रोत</option>
              <option value="सरकारी">सरकारी</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-slate-700 mb-2">Nepali Date</label>
            <NepaliDatePicker
              value={date}
              onChange={setDate}
              hideToday={true}
            />
          </div>
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-bold text-slate-700">Voucher Number</label>
              {lastVoucher && (
                <span className="text-xs text-slate-400 font-medium">Last used: #{lastVoucher}</span>
              )}
            </div>
            <input
              type="text"
              required
              value={voucherNumber}
              onChange={(e) => setVoucherNumber(e.target.value)}
              placeholder="Enter voucher no."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">Description / Particulars</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the transaction..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900"
            />
          </div>
        </div>

        {/* Ledger Amount Section */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Ledger Amounts</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Cash */}
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex flex-col">
              <h4 className="font-bold text-emerald-800 mb-3 text-center">Cash (नगद)</h4>
              <div className="space-y-4 flex-1">
                {cashRows.map((row, idx) => (
                  <div key={row.id} className="relative group">
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Debit (Rs.)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.debit}
                          onChange={(e) => {
                            const newRows = [...cashRows];
                            newRows[idx].debit = e.target.value;
                            setCashRows(newRows);
                          }}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Credit (Rs.)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.credit}
                          onChange={(e) => {
                            const newRows = [...cashRows];
                            newRows[idx].credit = e.target.value;
                            setCashRows(newRows);
                          }}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    {cashRows.length > 1 && (
                      <button type="button" onClick={() => setCashRows(cashRows.filter(r => r.id !== row.id))} className="absolute -right-2 -top-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setCashRows([...cashRows, { id: generateId(), debit: "", credit: "" }])}
                className="mt-4 flex items-center justify-center w-full py-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Row
              </button>
            </div>

            {/* Bank */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col">
              <h4 className="font-bold text-blue-800 mb-3 text-center">Bank (बैंक)</h4>
              <div className="space-y-4 flex-1">
                {bankRows.map((row, idx) => (
                  <div key={row.id} className="relative group">
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Debit (Rs.)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.debit}
                          onChange={(e) => {
                            const newRows = [...bankRows];
                            newRows[idx].debit = e.target.value;
                            setBankRows(newRows);
                          }}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Credit (Rs.)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.credit}
                          onChange={(e) => {
                            const newRows = [...bankRows];
                            newRows[idx].credit = e.target.value;
                            setBankRows(newRows);
                          }}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    {bankRows.length > 1 && (
                      <button type="button" onClick={() => setBankRows(bankRows.filter(r => r.id !== row.id))} className="absolute -right-2 -top-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setBankRows([...bankRows, { id: generateId(), debit: "", credit: "" }])}
                className="mt-4 flex items-center justify-center w-full py-1.5 text-xs font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Row
              </button>
            </div>

            {/* Kharcha (Single Amount Column) */}
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 flex flex-col">
              <h4 className="font-bold text-rose-800 mb-3 text-center">Kharcha (खर्च)</h4>
              <div className="space-y-4 flex-1">
                {kharchaRows.map((row, idx) => (
                  <div key={row.id} className="relative group">
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Amount (Rs.)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.amount}
                          onChange={(e) => {
                            const newRows = [...kharchaRows];
                            newRows[idx].amount = e.target.value;
                            setKharchaRows(newRows);
                          }}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-rose-500 text-slate-900 font-mono text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    {kharchaRows.length > 1 && (
                      <button type="button" onClick={() => setKharchaRows(kharchaRows.filter(r => r.id !== row.id))} className="absolute -right-2 -top-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setKharchaRows([...kharchaRows, { id: generateId(), amount: "" }])}
                className="mt-4 flex items-center justify-center w-full py-1.5 text-xs font-bold text-rose-600 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Row
              </button>
            </div>

            {/* Bibidh */}
            <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex flex-col">
              <h4 className="font-bold text-purple-800 mb-3 text-center">Bibidh (विविध)</h4>
              <div className="space-y-4 flex-1">
                {bibidhRows.map((row, idx) => (
                  <div key={row.id} className="relative group">
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Debit (Rs.)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.debit}
                          onChange={(e) => {
                            const newRows = [...bibidhRows];
                            newRows[idx].debit = e.target.value;
                            setBibidhRows(newRows);
                          }}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-purple-500 text-slate-900 font-mono text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Credit (Rs.)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.credit}
                          onChange={(e) => {
                            const newRows = [...bibidhRows];
                            newRows[idx].credit = e.target.value;
                            setBibidhRows(newRows);
                          }}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-purple-500 text-slate-900 font-mono text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    {bibidhRows.length > 1 && (
                      <button type="button" onClick={() => setBibidhRows(bibidhRows.filter(r => r.id !== row.id))} className="absolute -right-2 -top-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setBibidhRows([...bibidhRows, { id: generateId(), debit: "", credit: "" }])}
                className="mt-4 flex items-center justify-center w-full py-1.5 text-xs font-bold text-purple-600 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Row
              </button>
            </div>

          </div>
        </div>

        <div className="pt-4 border-t flex justify-end items-center gap-4">
          {success && (
            <span className="text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
              Voucher Saved Successfully!
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {saving ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-5 h-5" /> Save Entry Voucher</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
