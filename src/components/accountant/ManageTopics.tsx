"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Plus, Trash2, Edit2, Loader2, Save, X, Folder, FileText } from "lucide-react";

type Topic = {
  id: string;
  name: string;
  type: "Income" | "Expense";
};

type Subtopic = {
  id: string;
  topic_id: string;
  name: string;
};

export default function ManageTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicType, setNewTopicType] = useState<"Income" | "Expense">("Income");

  const [isAddingSubtopicFor, setIsAddingSubtopicFor] = useState<string | null>(null);
  const [newSubtopicName, setNewSubtopicName] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: tData, error: tErr } = await supabase.from("accounting_topics").select("*").order("created_at", { ascending: true });
      if (tErr) throw tErr;
      
      const { data: sData, error: sErr } = await supabase.from("accounting_subtopics").select("*").order("created_at", { ascending: true });
      if (sErr) throw sErr;

      setTopics(tData || []);
      setSubtopics(sData || []);
    } catch (err) {
      console.error("Error fetching topics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTopic = async () => {
    if (!newTopicName.trim()) return;
    try {
      const { data, error } = await supabase.from("accounting_topics").insert([{
        name: newTopicName.trim(),
        type: newTopicType
      }]).select();

      if (error) throw error;
      if (data) setTopics([...topics, data[0]]);
      
      setNewTopicName("");
      setIsAddingTopic(false);
    } catch (err) {
      console.error("Error adding topic:", err);
      alert("Failed to add topic.");
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm("Are you sure? This will delete all subtopics inside it as well.")) return;
    try {
      const { error } = await supabase.from("accounting_topics").delete().eq("id", id);
      if (error) throw error;
      
      setTopics(topics.filter(t => t.id !== id));
      setSubtopics(subtopics.filter(s => s.topic_id !== id));
    } catch (err) {
      console.error("Error deleting topic:", err);
      alert("Failed to delete topic.");
    }
  };

  const handleAddSubtopic = async (topicId: string) => {
    if (!newSubtopicName.trim()) return;
    try {
      const { data, error } = await supabase.from("accounting_subtopics").insert([{
        topic_id: topicId,
        name: newSubtopicName.trim()
      }]).select();

      if (error) throw error;
      if (data) setSubtopics([...subtopics, data[0]]);
      
      setNewSubtopicName("");
      setIsAddingSubtopicFor(null);
    } catch (err) {
      console.error("Error adding subtopic:", err);
      alert("Failed to add subtopic.");
    }
  };

  const handleDeleteSubtopic = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subtopic?")) return;
    try {
      const { error } = await supabase.from("accounting_subtopics").delete().eq("id", id);
      if (error) throw error;
      
      setSubtopics(subtopics.filter(s => s.id !== id));
    } catch (err) {
      console.error("Error deleting subtopic:", err);
      alert("Failed to delete subtopic.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manage Topics & Subtopics</h2>
          <p className="text-slate-500 text-sm mt-1">Set up your accounting categories for vouchers and reports.</p>
        </div>
        {!isAddingTopic && (
          <button
            onClick={() => setIsAddingTopic(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" /> Add New Topic
          </button>
        )}
      </div>

      {isAddingTopic && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 mb-8 flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Topic Name</label>
            <input
              type="text"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="e.g., Tuition Fees, Salary, Utilities"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type</label>
            <select
              value={newTopicType}
              onChange={(e) => setNewTopicType(e.target.value as "Income" | "Expense")}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-800"
            >
              <option value="Income">Income (Revenue)</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleAddTopic}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Save className="w-4 h-4" /> Save
            </button>
            <button
              onClick={() => setIsAddingTopic(false)}
              className="flex items-center justify-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {topics.length === 0 && !isAddingTopic ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <Folder className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">No Topics Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">Create topics to categorize your accounting vouchers properly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map(topic => (
            <div key={topic.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${topic.type === 'Income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {topic.type}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Folder className="w-5 h-5 text-slate-400" />
                    {topic.name}
                  </h3>
                </div>
                <button
                  onClick={() => handleDeleteTopic(topic.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  title="Delete Topic"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Subtopics</h4>
                
                <ul className="space-y-2 mb-4 flex-1">
                  {subtopics.filter(s => s.topic_id === topic.id).length === 0 ? (
                    <li className="text-sm text-slate-500 italic">No subtopics yet</li>
                  ) : (
                    subtopics.filter(s => s.topic_id === topic.id).map(sub => (
                      <li key={sub.id} className="flex justify-between items-center group text-sm">
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <FileText className="w-4 h-4 text-slate-400" />
                          {sub.name}
                        </div>
                        <button
                          onClick={() => handleDeleteSubtopic(sub.id)}
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))
                  )}
                </ul>

                {isAddingSubtopicFor === topic.id ? (
                  <div className="mt-auto flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={newSubtopicName}
                      onChange={(e) => setNewSubtopicName(e.target.value)}
                      placeholder="Subtopic name..."
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSubtopic(topic.id);
                        if (e.key === 'Escape') setIsAddingSubtopicFor(null);
                      }}
                    />
                    <button
                      onClick={() => handleAddSubtopic(topic.id)}
                      className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-1.5 rounded-md transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsAddingSubtopicFor(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsAddingSubtopicFor(topic.id);
                      setNewSubtopicName("");
                    }}
                    className="mt-auto flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 py-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add Subtopic
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
