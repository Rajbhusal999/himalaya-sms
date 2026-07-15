"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Star, Send, User, MessageSquare } from "lucide-react";

type Rating = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  created_at: string;
};

export default function PublicRatings() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      
      if (error) throw error;
      setRatings(data || []);
    } catch (err) {
      console.error("Error fetching ratings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("ratings")
        .insert([{ name, rating, comment }]);
      
      if (error) throw error;
      
      setSubmitted(true);
      setName("");
      setComment("");
      setRating(5);
      fetchRatings();
      
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to submit rating.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-brand-600 font-bold tracking-widest uppercase text-sm mb-3">Testimonials</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">What People Say About Us</h3>
          <p className="text-lg text-slate-600 leading-relaxed">
            Read what our community thinks about our school, and feel free to leave your own feedback!
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          
          {/* Submit Rating Form */}
          <div className="lg:col-span-1 bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <h4 className="text-xl font-bold text-slate-900 mb-6">Rate Our School</h4>
            
            {submitted ? (
              <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-xl text-center">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 fill-current" />
                </div>
                <p className="font-bold mb-1">Thank you!</p>
                <p className="text-sm">Your feedback has been submitted successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Your Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star 
                          className={`w-8 h-8 ${
                            (hoverRating || rating) >= star 
                              ? "fill-amber-400 text-amber-400" 
                              : "text-slate-300"
                          } transition-colors`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Your Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Review (Optional)</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <MessageSquare className="h-5 w-5 text-slate-400" />
                    </div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="pl-10 w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none"
                      placeholder="Share your thoughts..."
                    ></textarea>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Review
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Ratings Display */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
              </div>
            ) : ratings.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-slate-700 mb-2">No reviews yet</h4>
                <p className="text-slate-500">Be the first to share your thoughts about our school!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {ratings.map((item) => (
                  <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < item.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} 
                        />
                      ))}
                    </div>
                    {item.comment && (
                      <p className="text-slate-700 mb-4 line-clamp-3 italic">"{item.comment}"</p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-bold">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
