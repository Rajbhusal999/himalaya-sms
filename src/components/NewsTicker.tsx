"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

type News = {
  id: string;
  content: string;
};

export default function NewsTicker() {
  const [news, setNews] = useState<News[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchActiveNews = async () => {
      // Calculate date 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });
        
      if (data && !error) {
        setNews(data);
      }
    };
    
    fetchActiveNews();
  }, []);

  if (!isMounted || news.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
      <div className="fixed bottom-0 w-full bg-brand-950 text-brand-100 overflow-hidden py-2 flex items-center z-[100] border-t border-brand-800 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)]">
        <div className="px-4 font-bold uppercase tracking-wider text-sm bg-brand-950 z-10 shrink-0 border-r border-brand-800 text-accent-400 flex items-center h-full absolute left-0 shadow-[10px_0_15px_-3px_rgba(0,0,0,0.5)]">
          <span className="hidden sm:inline">Latest News</span>
          <span className="sm:hidden">News</span>
        </div>
        <div className="w-full flex-1 overflow-hidden ml-24 sm:ml-32">
          <div className="whitespace-nowrap animate-marquee hover:[animation-play-state:paused] inline-block">
            {news.map((item, idx) => (
              <span key={item.id} className="inline-block px-8 text-sm">
                <span className="mr-2 text-accent-400">•</span>
                {item.content}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
