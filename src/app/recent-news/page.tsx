"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { FileText, ArrowLeft, Calendar, File, ExternalLink, Loader2 } from "lucide-react";

type News = {
  id: string;
  content: string;
  file_url?: string;
  created_at: string;
};

export default function RecentNewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (data && !error) {
        setNews(data);
      }
      setIsLoading(false);
    };
    
    fetchNews();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Recent News & Announcements</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Latest Updates</h2>
          <p className="text-slate-600 text-lg">Stay up to date with the latest news, announcements, and events from Shree Himalaya Basic School.</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-brand-600 mb-4" />
            <p className="font-medium">Loading recent news...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No news found</h3>
            <p className="text-slate-500">There are no recent announcements at the moment. Please check back later.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((item) => (
              <article key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-2 text-sm font-semibold text-brand-600 mb-4">
                    <Calendar className="w-4 h-4" />
                    <time dateTime={item.created_at}>
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 leading-snug">
                    {item.content}
                  </h3>
                  
                  {item.file_url && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <a 
                        href={item.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold rounded-xl transition-colors group/btn"
                      >
                        <File className="w-5 h-5" />
                        <span>View Attached File</span>
                        <ExternalLink className="w-4 h-4 ml-1 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
                      </a>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
