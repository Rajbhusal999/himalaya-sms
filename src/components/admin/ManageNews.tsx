"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Plus, Trash2, Loader2, AlertCircle } from "lucide-react";

type News = {
  id: string;
  content: string;
  created_at: string;
};

export default function ManageNews() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching news:", error);
      setError("Failed to load news");
    } else {
      setNews(data || []);
    }
    setLoading(false);
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    const { data, error } = await supabase
      .from('news')
      .insert([{ content: newContent.trim() }])
      .select();
      
    if (error) {
      console.error("Error adding news:", error);
      setError("Failed to add news");
    } else if (data) {
      setNews([data[0], ...news]);
      setNewContent("");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this news?")) return;
    
    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error("Error deleting news:", error);
      alert("Failed to delete news");
    } else {
      setNews(news.filter(n => n.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Add News / Announcement</h2>
        <p className="text-sm text-slate-500 mb-4">This will be displayed as a sliding ticker on the landing page for 1 week.</p>
        
        <form onSubmit={handleAddNews} className="space-y-4">
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">
              News Content
            </label>
            <textarea
              id="content"
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none text-slate-900 bg-white"
              placeholder="Enter the news or announcement..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              required
            />
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !newContent.trim()}
              className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Publish News
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">Recent News</h2>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        ) : news.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {news.map((item) => (
              <li key={item.id} className="p-6 flex justify-between items-start hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <p className="text-slate-800 font-medium">{item.content}</p>
                  <p className="text-xs text-slate-500">
                    Posted on {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-4 flex-shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-12 text-center text-slate-500">
            No news or announcements found.
          </div>
        )}
      </div>
    </div>
  );
}
