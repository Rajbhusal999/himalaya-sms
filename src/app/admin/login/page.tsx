"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Mail, Lock, LogIn, ArrowLeft, AlertCircle, ShieldCheck, Shield } from "lucide-react";
import { setSession, clearSession } from "@/app/actions/auth";
import { verifyAdminPassword, get2FAStatus, verifyTOTPToken } from "@/lib/authCrypto";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2FA Step
  const [loginStep, setLoginStep] = useState<"credentials" | "totp">("credentials");
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  // Keep validated email+password so we can finalize session on 2FA success
  const [validatedEmail, setValidatedEmail] = useState<string | null>(null);

  useEffect(() => {
    // Clear session when login page mounts (prevents forward button bypassing login)
    clearSession();
  }, []);

  const finalizeSession = async () => {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    // Fetch IP + geolocation (free, no permission needed)
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
      // Geolocation is best-effort — don't block login if it fails
    }

    await supabase.from("active_sessions").insert([{
      id: sessionId,
      role: "admin",
      expires_at: expiresAt.toISOString(),
      user_agent: navigator.userAgent,
      ip_address: ipAddress,
      city,
      country,
    }]);

    await setSession(sessionId, expiresAt);
    router.replace("/admin/dashboard");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Fetch admin email from admin_profile table
      const { data: profile } = await supabase
        .from("admin_profile")
        .select("email")
        .eq("id", "default_admin")
        .single();

      const validEmail = profile?.email?.trim().toLowerCase() || "himalayabasicschool01@gmail.com";
      const inputEmail = email.trim().toLowerCase();

      // Verify SHA-256 password hash stored in Supabase
      const isPasswordValid = await verifyAdminPassword(password);

      const emailOk = inputEmail === validEmail || inputEmail === "himalayabasicschool01@gmail.com";

      if (emailOk && isPasswordValid) {
        // Check if 2FA is enabled
        const { enabled, secret } = await get2FAStatus();

        if (enabled && secret) {
          // Transition to TOTP step
          setTotpSecret(secret);
          setValidatedEmail(inputEmail);
          setLoginStep("totp");
          setLoading(false);
          return;
        }

        // No 2FA — finalize session directly
        await finalizeSession();
      } else {
        setError("Invalid admin email or password. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError("Failed to authenticate with database.");
      setLoading(false);
    }
  };

  const handleTotpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setTotpError(null);

    if (totpCode.length !== 6 || !/^\d{6}$/.test(totpCode)) {
      setTotpError("Please enter the 6-digit code from your authenticator app.");
      return;
    }

    setTotpLoading(true);
    try {
      if (!totpSecret) throw new Error("Missing 2FA secret.");

      const valid = verifyTOTPToken(totpSecret, totpCode);
      if (!valid) {
        setTotpError("Invalid authenticator code. Make sure your phone clock is accurate and try again.");
        setTotpLoading(false);
        return;
      }

      await finalizeSession();
    } catch (err) {
      console.error("2FA verification error:", err);
      setTotpError("Failed to verify 2FA code.");
      setTotpLoading(false);
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
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-white/10 rounded-full border border-white/20">
              {loginStep === "totp"
                ? <Shield className="w-10 h-10 text-brand-200" />
                : <ShieldCheck className="w-10 h-10 text-brand-200" />
              }
            </div>
          </div>

          {loginStep === "credentials" ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
                <p className="text-brand-200">Sign in to the administration panel</p>
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
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-brand-300" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl leading-5 bg-white/5 text-white placeholder-brand-300/50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 sm:text-sm transition-all"
                      placeholder="admin@school.com"
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
            </>
          ) : (
            /* ── TOTP / 2FA Step ── */
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">Two-Factor Authentication</h1>
                <p className="text-brand-200 text-sm">
                  Open your authenticator app and enter the 6-digit code for <strong className="text-white">Himalaya SMS</strong>.
                </p>
              </div>

              {totpError && (
                <div className="mb-5 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3 text-red-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{totpError}</p>
                </div>
              )}

              <form onSubmit={handleTotpVerify} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-brand-100 mb-2 text-center">
                    Authenticator Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    autoFocus
                    className="block w-full px-4 py-4 border border-white/20 rounded-xl bg-white/5 text-white text-3xl text-center font-bold tracking-[0.5em] placeholder-brand-300/30 focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all"
                    placeholder="000000"
                  />
                  <p className="text-center text-xs text-brand-300 mt-2">Code refreshes every 30 seconds</p>
                </div>

                <button
                  type="submit"
                  disabled={totpLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover-glow"
                >
                  {totpLoading ? (
                    "Verifying Code..."
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 mr-2" />
                      Verify & Sign In
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setLoginStep("credentials"); setTotpCode(""); setTotpError(null); }}
                  className="w-full text-brand-300 hover:text-white text-sm font-medium transition-colors py-1"
                >
                  ← Back to login
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
