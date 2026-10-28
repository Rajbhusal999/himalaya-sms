"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Lock, KeyRound, AlertCircle } from "lucide-react";
import { changeOwnPassword, completeForcedPasswordChange, clearSession } from "@/app/actions/auth";
import { validatePasswordStrength } from "@/lib/authIdentity";

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const weak = validatePasswordStrength(newPassword);
    if (weak) return setError(weak);
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    try {
      const changed = await changeOwnPassword(newPassword);
      if (!changed.ok) throw new Error(changed.error);

      const done = await completeForcedPasswordChange();
      if (!done.ok || !done.role) throw new Error(done.error ?? "Could not finish password change.");

      // Pull a fresh JWT so the cleared must_change_password flag takes effect.
      await supabase.auth.refreshSession();
      window.location.assign(`/${done.role}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    await clearSession();
    window.location.assign("/");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 p-4">
      <div className="w-full max-w-md">
        <div className="relative glass-panel rounded-2xl p-8 md:p-10 shadow-2xl border border-white/10">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-white/10 rounded-full border border-white/20">
              <KeyRound className="w-10 h-10 text-brand-200" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Set a New Password</h1>
            <p className="text-brand-200 text-sm">
              For your security you must choose a new password before continuing.
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3 text-red-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { id: "new-password", label: "New Password", value: newPassword, set: setNewPassword },
              { id: "confirm-password", label: "Confirm New Password", value: confirmPassword, set: setConfirmPassword },
            ].map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-sm font-medium text-brand-100 mb-1.5 ml-1">
                  {f.label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-brand-300" />
                  </div>
                  <input
                    id={f.id}
                    type="password"
                    required
                    autoComplete="new-password"
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl leading-5 bg-white/5 text-white placeholder-brand-300/50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            ))}

            <p className="text-xs text-brand-300 ml-1">At least 8 characters, with a letter and a number.</p>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover-glow"
            >
              {loading ? "Saving..." : "Save Password & Continue"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="w-full text-brand-300 hover:text-white text-sm font-medium transition-colors py-1"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
