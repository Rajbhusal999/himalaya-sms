"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Mail, Lock, LogIn, ArrowLeft, AlertCircle, ShieldCheck, Shield } from "lucide-react";
import { clearSession } from "@/app/actions/auth";
import { getRole, toLoginEmail } from "@/lib/authIdentity";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2FA step (Supabase native TOTP MFA)
  const [loginStep, setLoginStep] = useState<"credentials" | "totp">("credentials");
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);

  useEffect(() => {
    // Clear any existing session when the login page mounts (prevents forward-button bypass)
    clearSession();
  }, []);

  const goToDashboard = () => {
    router.replace("/admin/dashboard");
    router.refresh();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: toLoginEmail("admin", email),
        password,
      });

      // Same message for every failure so we never reveal which part was wrong.
      if (signInError || !data.user || getRole(data.user) !== "admin") {
        if (data?.user) await supabase.auth.signOut();
        setError("Invalid admin email or password. Please try again.");
        setLoading(false);
        return;
      }

      // Does this admin have a second factor that still needs to be verified?
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totp = factors?.totp?.find((f) => f.status === "verified");
        if (!totp) {
          await supabase.auth.signOut();
          setError("Two-factor setup is incomplete. Please contact the system owner.");
          setLoading(false);
          return;
        }
        setFactorId(totp.id);
        setLoginStep("totp");
        setLoading(false);
        return;
      }

      goToDashboard();
    } catch (err) {
      console.error("Authentication error:", err);
      setError("Failed to sign in. Please try again.");
      setLoading(false);
    }
  };

  const handleTotpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setTotpError(null);

    if (!/^\d{6}$/.test(totpCode)) {
      setTotpError("Please enter the 6-digit code from your authenticator app.");
      return;
    }

    setTotpLoading(true);
    try {
      if (!factorId) throw new Error("Missing 2FA factor.");

      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: totpCode,
      });

      if (verifyError) {
        setTotpError("Invalid authenticator code. Make sure your phone clock is accurate and try again.");
        setTotpLoading(false);
        return;
      }

      goToDashboard();
    } catch (err) {
      console.error("2FA verification error:", err);
      setTotpError("Failed to verify 2FA code.");
      setTotpLoading(false);
    }
  };

  const handleBackToCredentials = async () => {
    await supabase.auth.signOut();
    setLoginStep("credentials");
    setTotpCode("");
    setTotpError(null);
    setFactorId(null);
    setPassword("");
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
                <div role="alert" className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3 text-red-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="admin-email" className="block text-sm font-medium text-brand-100 mb-1.5 ml-1">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-brand-300" />
                    </div>
                    <input
                      id="admin-email"
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl leading-5 bg-white/5 text-white placeholder-brand-300/50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 sm:text-sm transition-all"
                      placeholder="admin@school.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="admin-password" className="block text-sm font-medium text-brand-100 mb-1.5 ml-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-brand-300" />
                    </div>
                    <input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-white/20 rounded-xl leading-5 bg-white/5 text-white placeholder-brand-300/50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 sm:text-sm transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
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
                <div role="alert" className="mb-5 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3 text-red-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{totpError}</p>
                </div>
              )}

              <form onSubmit={handleTotpVerify} className="space-y-5">
                <div>
                  <label htmlFor="admin-totp" className="block text-sm font-medium text-brand-100 mb-2 text-center">
                    Authenticator Code
                  </label>
                  <input
                    id="admin-totp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
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
                  onClick={handleBackToCredentials}
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
