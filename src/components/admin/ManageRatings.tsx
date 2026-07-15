"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Star, MessageSquare, Trash2, Calendar, User } from "lucide-react";

type Rating = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  created_at: string;
};

export default function ManageRatings() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ average: 0, total: 0 });

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const fetchedRatings = data || [];
      setRatings(fetchedRatings);
      
      if (fetchedRatings.length > 0) {
        const total = fetchedRatings.length;
        const sum = fetchedRatings.reduce((acc, curr) => acc + curr.rating, 0);
        setStats({
          average: Number((sum / total).toFixed(1)),
          total
        });
      } else {
        setStats({ average: 0, total: 0 });
      }
      
    } catch (error) {
      console.error("Error fetching ratings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rating? This cannot be undone.")) return;
    
    try {
      const { error } = await supabase
        .from("ratings")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      // Update local state instead of refetching for better UX
      const newRatings = ratings.filter(r => r.id !== id);
      setRatings(newRatings);
      
      if (newRatings.length > 0) {
        const sum = newRatings.reduce((acc, curr) => acc + curr.rating, 0);
        setStats({
          average: Number((sum / newRatings.length).toFixed(1)),
          total: newRatings.length
        });
      } else {
        setStats({ average: 0, total: 0 });
      }
    } catch (error) {
      console.error("Error deleting rating:", error);
      alert("Failed to delete rating. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-500" />
            Manage Ratings & Reviews
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            View what people are saying about the school and manage public reviews.
          </p>
        </div>
        
        {/* Stats Summary */}
        <div className="flex items-center gap-6 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-1">
              {stats.average} <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average</div>
          </div>
          <div className="w-px h-10 bg-slate-200"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {ratings.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No reviews yet</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              When people submit ratings on the landing page, they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ratings.map((rating) => (
              <div 
                key={rating.id} 
                className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Rating Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold text-lg">
                      {rating.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1">
                        {rating.name}
                      </h4>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${i < rating.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(rating.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Comment Body */}
                <div className="flex-1 mb-4">
                  {rating.comment ? (
                    <p className="text-slate-700 text-sm italic">"{rating.comment}"</p>
                  ) : (
                    <p className="text-slate-400 text-sm italic">No comment provided.</p>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(rating.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5" />
                    {rating.rating} / 5
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
