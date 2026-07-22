"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Mail, Lock, LogIn, ArrowLeft, AlertCircle } from "lucide-react";
import { setSession, clearSession } from "@/app/actions/auth";

export default function TeacherLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clear session when login page mounts (prevents forward button bypassing login)
    clearSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Query the teachers table directly
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("username", email)
        .eq("password", password)
        .single();

      if (error || !data) {
        throw new Error("Invalid username or password");
      }

      const sessionId = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1); // 1 day

      const { error: sessionError } = await supabase
        .from("active_sessions")
        .insert([{
          id: sessionId,
          user_id: data.id,
          role: "teacher",
          expires_at: expiresAt.toISOString(),
        }]);

      if (sessionError) throw new Error("Failed to create session");

      await setSession(sessionId, expiresAt);
      
      router.replace("/teacher/dashboard");
    } catch (err: any) {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 p-4">
      <div className="w-full max-w-md">
        <Link 
          href="/" 
          className="inline-flex items-center text-brand-200 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Portal
        </Link>
        
        <div className="relative glass-panel rounded-2xl p-8 md:p-10 shadow-2xl border border-white/10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Teacher Login</h1>
            <p className="text-brand-200">Sign in to access your dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3 text-red-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-100 mb-1.5 ml-1">
                Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-brand-300" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl leading-5 bg-white/5 text-white placeholder-brand-300/50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 sm:text-sm transition-all"
                  placeholder="username or email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-100 mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-brand-300" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-white/20 rounded-xl leading-5 bg-white/5 text-white placeholder-brand-300/50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 sm:text-sm transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xl"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4 hover-glow"
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
