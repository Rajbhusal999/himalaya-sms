"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Lock, LogIn, ArrowLeft, AlertCircle, ShieldCheck, User } from "lucide-react";
import { setSession, clearSession } from "@/app/actions/auth";

export default function AccountantLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clear session when login page mounts
    clearSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Verify against accountant_credentials table
      const { data, error: fetchError } = await supabase
        .from("accountant_credentials")
        .select("*")
        .eq("username", username.trim())
        .eq("password", password)
        .single();

      if (fetchError || !data) {
        setError("Invalid accountant username or password. Please try again.");
        setLoading(false);
        return;
      }

      // Finalize Session
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);

      // Fetch IP + geolocation (best-effort)
      let ipAddress: string | null = null;
      let city: string | null = null;
      let country: string | null = null;
      try {
        const geoRes = await fetch("https://ipapi.co/json/", { cache: "no-store" });
        if (geoRes.ok) {
          const geo = await geoRes.json();
          ipAddress = geo.ip ?? null;
          city = geo.city ?? null;
          country = geo.country_name ?? null;
        }
      } catch {
        // Ignore geo errors
      }

      await supabase.from("active_sessions").insert([{
        id: sessionId,
        role: "accountant",
        expires_at: expiresAt.toISOString(),
        user_agent: navigator.userAgent,
        ip_address: ipAddress,
        city,
        country,
      }]);

      await setSession(sessionId, expiresAt);
      router.replace("/accountant/dashboard");

    } catch (err) {
      console.error("Authentication error:", err);
      setError("Failed to authenticate with database.");
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
          Back to Home
        </Link>

        <div className="relative glass-panel rounded-2xl p-8 md:p-10 shadow-2xl border border-white/10">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-white/10 rounded-full border border-white/20">
              <ShieldCheck className="w-10 h-10 text-brand-200" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Accountant Login</h1>
            <p className="text-brand-200">Sign in to the accounting portal</p>
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
                Accountant ID / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-brand-300" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl leading-5 bg-white/5 text-white placeholder-brand-300/50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 sm:text-sm transition-all"
                  placeholder="e.g. accountant"
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
                "Verifying..."
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
