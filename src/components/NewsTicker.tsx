"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

type News = {
  id: string;
  content: string;
};

const dailyColors = [
  'text-red-800',     // Sunday
  'text-blue-800',    // Monday
  'text-green-800',   // Tuesday
  'text-purple-800',  // Wednesday
  'text-orange-800',  // Thursday
  'text-rose-800',    // Friday
  'text-indigo-800'   // Saturday
];

export default function NewsTicker() {
  const [news, setNews] = useState<News[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [textColor, setTextColor] = useState('text-red-800');

  useEffect(() => {
    setIsMounted(true);
    setTextColor(dailyColors[new Date().getDay()]);
    
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

  if (!isMounted) return null;

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
      <div className="fixed top-20 w-full bg-white text-slate-900 overflow-hidden py-2 flex items-center z-[40] border-b border-slate-200 shadow-sm">
        <div className="px-4 font-bold uppercase tracking-wider text-sm bg-white z-10 shrink-0 border-r border-slate-200 text-brand-700 flex items-center h-full absolute left-0 shadow-[10px_0_15px_5px_rgba(255,255,255,1)]">
          <span className="hidden sm:inline">Latest News</span>
          <span className="sm:hidden">News</span>
        </div>
        <div className="w-full flex-1 overflow-hidden ml-24 sm:ml-32">
          <div className={`whitespace-nowrap animate-marquee hover:[animation-play-state:paused] inline-block font-semibold ${textColor}`}>
            <span className="inline-block px-8 text-sm">
              <span className="mr-2 text-brand-500">•</span>
              Welcome to Shree Himalaya Basic School
            </span>
            <span className="inline-block px-8 text-sm">
              <span className="mr-2 text-brand-500">•</span>
              श्री हिमालय आधारभूत विद्यालयमा हार्दिक स्वागत छ
            </span>
            {news.map((item) => (
              <span key={item.id} className="inline-block px-8 text-sm">
                <span className="mr-2 text-brand-500">•</span>
                {item.content}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
