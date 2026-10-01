"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Save, Loader2, RefreshCw } from "lucide-react";
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

export default function EntryVoucher() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [lastVoucher, setLastVoucher] = useState<string>("");

  // Form states
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [selectedSubtopicId, setSelectedSubtopicId] = useState("");
  const [date, setDate] = useState(getCurrentBsDate());
  const [voucherNumber, setVoucherNumber] = useState("");
  const [description, setDescription] = useState("");
  
  const [cashDebit, setCashDebit] = useState("");
  const [cashCredit, setCashCredit] = useState("");
  const [bankDebit, setBankDebit] = useState("");
  const [bankCredit, setBankCredit] = useState("");
  const [kharchaDebit, setKharchaDebit] = useState("");
  const [kharchaCredit, setKharchaCredit] = useState("");
  const [bibidhDebit, setBibidhDebit] = useState("");
  const [bibidhCredit, setBibidhCredit] = useState("");

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

  const selectedTopic = topics.find(t => t.id === selectedTopicId);
  const filteredSubtopics = subtopics.filter(s => s.topic_id === selectedTopicId);

  // Auto-select first subtopic if available when topic changes
  useEffect(() => {
    if (filteredSubtopics.length > 0 && !filteredSubtopics.find(s => s.id === selectedSubtopicId)) {
      setSelectedSubtopicId(filteredSubtopics[0].id);
    } else if (filteredSubtopics.length === 0) {
      setSelectedSubtopicId("");
    }
  }, [selectedTopicId, filteredSubtopics, selectedSubtopicId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId || !voucherNumber.trim()) {
      alert("Please select a topic and enter a voucher number.");
      return;
    }

    setSaving(true);
    setSuccess(false);

    try {
      const { error } = await supabase.from("accounting_vouchers").insert([{
        topic_id: selectedTopicId,
        subtopic_id: selectedSubtopicId || null,
        date,
        voucher_number: voucherNumber.trim(),
        description: description.trim(),
        cash_debit: parseFloat(cashDebit) || 0,
        cash_credit: parseFloat(cashCredit) || 0,
        bank_debit: parseFloat(bankDebit) || 0,
        bank_credit: parseFloat(bankCredit) || 0,
        kharcha_debit: parseFloat(kharchaDebit) || 0,
        kharcha_credit: parseFloat(kharchaCredit) || 0,
        bibidh_debit: parseFloat(bibidhDebit) || 0,
        bibidh_credit: parseFloat(bibidhCredit) || 0,
      }]);

      if (error) throw error;
      
      setSuccess(true);
      setLastVoucher(voucherNumber.trim());
      
      // Reset form amounts and desc
      setVoucherNumber("");
      setDescription("");
      setCashDebit("");
      setCashCredit("");
      setBankDebit("");
      setBankCredit("");
      setKharchaDebit("");
      setKharchaCredit("");
      setBibidhDebit("");
      setBibidhCredit("");

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
        {/* Top Section: Categorization and Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
          
          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-slate-700 mb-2">Topic</label>
            <select
              required
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-900"
            >
              <option value="" disabled>Select a topic...</option>
              {topics.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-slate-700 mb-2">Subtopic</label>
            <select
              value={selectedSubtopicId}
              onChange={(e) => setSelectedSubtopicId(e.target.value)}
              disabled={filteredSubtopics.length === 0}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-900 disabled:opacity-50"
            >
              <option value="">{filteredSubtopics.length === 0 ? "No subtopics" : "Select..."}</option>
              {filteredSubtopics.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-slate-700 mb-2">Source Type</label>
            <div className="w-full px-4 py-2 bg-slate-200 border border-slate-300 rounded-lg text-slate-600 font-medium">
              {selectedTopic ? selectedTopic.source_type : "—"}
            </div>
          </div>

          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-slate-700 mb-2">Nepali Date</label>
            <NepaliDatePicker
              value={date}
              onChange={setDate}
            />
          </div>
        </div>

        {/* Middle Section: Details */}
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
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <h4 className="font-bold text-emerald-800 mb-3 text-center">Cash (नगद)</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Debit (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cashDebit}
                    onChange={(e) => setCashDebit(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Credit (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cashCredit}
                    onChange={(e) => setCashCredit(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Bank */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <h4 className="font-bold text-blue-800 mb-3 text-center">Bank (बैंक)</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Debit (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bankDebit}
                    onChange={(e) => setBankDebit(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Credit (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bankCredit}
                    onChange={(e) => setBankCredit(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Kharcha */}
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
              <h4 className="font-bold text-rose-800 mb-3 text-center">Kharcha (खर्च)</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Debit (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={kharchaDebit}
                    onChange={(e) => setKharchaDebit(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-rose-500 text-slate-900 font-mono"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Credit (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={kharchaCredit}
                    onChange={(e) => setKharchaCredit(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-rose-500 text-slate-900 font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Bibidh */}
            <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
              <h4 className="font-bold text-purple-800 mb-3 text-center">Bibidh (विविध)</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Debit (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bibidhDebit}
                    onChange={(e) => setBibidhDebit(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-purple-500 text-slate-900 font-mono"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Credit (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bibidhCredit}
                    onChange={(e) => setBibidhCredit(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-purple-500 text-slate-900 font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>
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
