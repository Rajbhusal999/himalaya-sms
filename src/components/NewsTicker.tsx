"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { FileText } from "lucide-react";

type News = {
  id: string;
  content: string;
  file_url?: string;
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
      <div className="fixed top-20 w-full bg-gradient-to-r from-slate-100 via-white to-slate-100 overflow-hidden py-3 flex items-center z-[40] border-b border-slate-300 shadow-md">
        <div className="px-4 sm:px-6 font-black uppercase tracking-widest text-sm bg-gradient-to-r from-brand-700 to-brand-600 text-white z-20 shrink-0 shadow-[4px_0_15px_rgba(0,0,0,0.15)] flex items-center h-full absolute left-0 border-r-4 border-brand-800">
          <span className="hidden sm:flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse shadow-[0_0_8px_rgba(248,113,113,0.8)]"></span>
            LATEST NEWS
          </span>
          <span className="sm:hidden flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
            NEWS
          </span>
        </div>
        <div className="w-full flex-1 overflow-hidden ml-[120px] sm:ml-[200px]">
          <div className={`whitespace-nowrap animate-marquee hover:[animation-play-state:paused] inline-block font-bold ${textColor}`}>
            <span className="inline-block px-8 text-lg">
              <span className="mr-3 text-red-500 text-xl">✦</span>
              Welcome to Shree Himalaya Basic School
            </span>
            <span className="inline-block px-8 text-lg">
              <span className="mr-3 text-red-500 text-xl">✦</span>
              श्री हिमालय आधारभूत विद्यालयमा हार्दिक स्वागत छ
            </span>
            {news.map((item) => (
              <span key={item.id} className="inline-block px-8 text-lg">
                <span className="mr-3 text-red-500 text-xl">✦</span>
                {item.content}
                {item.file_url && (
                  <a 
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 inline-flex items-center gap-1.5 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 px-3 py-1 rounded-full transition-colors shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    View PDF
                  </a>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
