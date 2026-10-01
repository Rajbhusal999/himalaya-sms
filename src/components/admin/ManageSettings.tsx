"use client";

import { useState, useEffect, useRef } from "react";
import { Save, User, Bell, Lock, Globe, Key, Shield, Smartphone, Laptop, History, CheckCircle, RefreshCw, AlertCircle, QrCode, X, ShieldCheck, ShieldOff, Copy, Monitor, Tablet, Trash2, TriangleAlert } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import {
  verifyAdminPassword,
  updateAdminPasswordHash,
  generateTOTPSecret,
  getTOTPUri,
  verifyTOTPToken,
  get2FAStatus,
  enable2FA,
  disable2FA,
} from "@/lib/authCrypto";
import { getSessionId } from "@/app/actions/auth";
import QRCode from "qrcode";

export default function ManageSettings() {
  const [activeTab, setActiveTab] = useState("profile");

  // Admin Profile state (Saved to Supabase admin_profile table)
  const [firstName, setFirstName] = useState("Himalaya Basic");
  const [lastName, setLastName] = useState("School");
  const [email, setEmail] = useState("himalayabasicschool01@gmail.com");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Accountant Credentials state
  const [accountantUsername, setAccountantUsername] = useState("");
  const [accountantPassword, setAccountantPassword] = useState("");
  const [accountantSaving, setAccountantSaving] = useState(false);
  const [accountantSaveSuccess, setAccountantSaveSuccess] = useState(false);

  // Security & Password state (Saved as SHA-256 hash to Supabase admin_credentials table)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // 2FA State
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(true);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);

  // Setup 2FA wizard states
  const [setupStep, setSetupStep] = useState<1 | 2 | 3 | 4>(1); // 1=verify pwd, 2=scan QR, 3=verify TOTP, 4=success
  const [setupPassword, setSetupPassword] = useState("");
  const [setupPasswordError, setSetupPasswordError] = useState<string | null>(null);
  const [pendingSecret, setPendingSecret] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [setupTotpCode, setSetupTotpCode] = useState("");
  const [setupTotpError, setSetupTotpError] = useState<string | null>(null);
  const [setupSaving, setSetupSaving] = useState(false);

  // Disable 2FA states
  const [disablePassword, setDisablePassword] = useState("");
  const [disableTotpCode, setDisableTotpCode] = useState("");
  const [disableError, setDisableError] = useState<string | null>(null);
  const [disableSaving, setDisableSaving] = useState(false);

  // Active Sessions state
  type SessionRow = {
    id: string; role: string; created_at: string; expires_at: string;
    user_agent: string | null; ip_address: string | null; city: string | null; country: string | null;
  };
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // System Settings state (school_settings table)
  const [systemSchoolName, setSystemSchoolName] = useState("Shree Himalaya Basic School");
  const [systemAcademicYear, setSystemAcademicYear] = useState("2026/2027");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [systemSaving, setSystemSaving] = useState(false);
  const [systemSaveSuccess, setSystemSaveSuccess] = useState(false);

  // Notification Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [notificationsSaving, setNotificationsSaving] = useState(false);
  const [notificationsSaveSuccess, setNotificationsSaveSuccess] = useState(false);

  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch admin profile from Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("admin_profile")
          .select("*")
          .eq("id", "default_admin")
          .single();

        if (data && !error) {
          if (data.first_name) setFirstName(data.first_name);
          if (data.last_name) setLastName(data.last_name);
          if (data.email) setEmail(data.email);
        }
      } catch (err) {
        console.error("Error fetching admin profile from Supabase:", err);
      }
    };
    fetchProfile();
  }, []);

  // Fetch accountant credentials
  useEffect(() => {
    const fetchAccountant = async () => {
      try {
        const { data, error } = await supabase
          .from("accountant_credentials")
          .select("*")
          .eq("id", "default")
          .single();

        if (data && !error) {
          if (data.username) setAccountantUsername(data.username);
          if (data.password) setAccountantPassword(data.password);
        }
      } catch (err) {
        console.error("Error fetching accountant credentials:", err);
      }
    };
    fetchAccountant();
  }, []);

  // Fetch 2FA status from Supabase
  useEffect(() => {
    const fetch2FA = async () => {
      setTwoFALoading(true);
      try {
        const { enabled } = await get2FAStatus();
        setTwoFAEnabled(enabled);
      } catch {
        setTwoFAEnabled(false);
      } finally {
        setTwoFALoading(false);
      }
    };
    fetch2FA();
  }, []);

  // Fetch real active sessions from Supabase
  useEffect(() => {
    const fetchSessions = async () => {
      setSessionsLoading(true);
      try {
        const [{ data }, sessionId] = await Promise.all([
          supabase
            .from("active_sessions")
            .select("id, role, created_at, expires_at, user_agent, ip_address, city, country")
            .eq("role", "admin")
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false }),
          getSessionId(),
        ]);
        setSessions((data as SessionRow[]) || []);
        setCurrentSessionId(sessionId);
      } catch (err) {
        console.error("Error fetching sessions:", err);
      } finally {
        setSessionsLoading(false);
      }
    };
    fetchSessions();
  }, []);

  // Fetch system settings from Supabase
  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("school_settings")
          .select("*")
          .eq("id", "default")
          .single();
        if (data && !error) {
          if (data.school_name) setSystemSchoolName(data.school_name);
          if (data.active_academic_year) setSystemAcademicYear(data.active_academic_year);
          setMaintenanceMode(data.maintenance_mode ?? false);
        }
      } catch (err) {
        console.error("Error fetching system settings:", err);
      }
    };
    fetchSystemSettings();
  }, []);

  // Fetch notification settings from Supabase
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("admin_notification_settings")
          .select("*")
          .eq("id", "default_admin")
          .single();
        if (data && !error) {
          setEmailNotifications(data.email_notifications ?? true);
          setPushNotifications(data.push_notifications ?? true);
          setSmsAlerts(data.sms_alerts ?? false);
        }
      } catch (err) {
        console.error("Error fetching notification settings:", err);
      }
    };
    fetchNotifications();
  }, []);

  /** Parse a user-agent string into a friendly label */
  const parseDevice = (ua: string | null): { label: string; icon: "laptop" | "smartphone" | "tablet" | "monitor" } => {
    if (!ua) return { label: "Unknown Device", icon: "monitor" };
    const u = ua.toLowerCase();
    const isMobile = /mobile|android|iphone/.test(u);
    const isTablet = /ipad|tablet/.test(u);
    const isWindows = /windows/.test(u);
    const isMac = /macintosh|mac os/.test(u);
    const isLinux = /linux/.test(u);
    const isAndroid = /android/.test(u);
    const isIOS = /iphone|ipad/.test(u);
    const browser = /edg/.test(u) ? "Edge" : /opr\/|opera/.test(u) ? "Opera" : /firefox/.test(u) ? "Firefox" : /chrome/.test(u) ? "Chrome" : /safari/.test(u) ? "Safari" : "Browser";
    let os = "Unknown OS";
    if (isWindows) os = "Windows";
    else if (isMac) os = "macOS";
    else if (isAndroid) os = "Android";
    else if (isIOS) os = /ipad/.test(u) ? "iPad" : "iPhone";
    else if (isLinux) os = "Linux";
    const icon: "laptop" | "smartphone" | "tablet" | "monitor" = isTablet ? "tablet" : isMobile ? "smartphone" : isWindows || isMac || isLinux ? "laptop" : "monitor";
    return { label: `${os} · ${browser}`, icon };
  };

  /** Format a timestamp as relative time */
  const relativeTime = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Active just now";
    if (mins < 60) return `Active ${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Active ${hrs} hr${hrs > 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    return `Active ${days} day${days > 1 ? "s" : ""} ago`;
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await supabase.from("active_sessions").delete().eq("id", sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error("Failed to revoke session:", err);
    } finally {
      setRevokingId(null);
    }
  };

  const handleSaveSystemSettings = async () => {
    setSystemSaving(true);
    setSystemSaveSuccess(false);
    try {
      const { error } = await supabase
        .from("school_settings")
        .upsert(
          {
            id: "default",
            school_name: systemSchoolName,
            active_academic_year: systemAcademicYear,
            maintenance_mode: maintenanceMode,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      if (error) throw error;
      setSystemSaveSuccess(true);
      setTimeout(() => setSystemSaveSuccess(false), 4000);
    } catch (err: any) {
      alert("Failed to save system settings: " + (err.message || err));
    } finally {
      setSystemSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setNotificationsSaving(true);
    setNotificationsSaveSuccess(false);
    try {
      const { error } = await supabase
        .from("admin_notification_settings")
        .upsert(
          {
            id: "default_admin",
            email_notifications: emailNotifications,
            push_notifications: pushNotifications,
            sms_alerts: smsAlerts,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      if (error) throw error;
      setNotificationsSaveSuccess(true);
      setTimeout(() => setNotificationsSaveSuccess(false), 4000);
    } catch (err: any) {
      alert("Failed to save notification settings: " + (err.message || err));
    } finally {
      setNotificationsSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        id: "default_admin",
        first_name: firstName,
        last_name: lastName,
        email: email,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("admin_profile")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert("Failed to save profile settings to Supabase: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccountant = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountantSaving(true);
    setAccountantSaveSuccess(false);

    try {
      const payload = {
        id: "default",
        username: accountantUsername,
        password: accountantPassword,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("accountant_credentials")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;

      setAccountantSaveSuccess(true);
      setTimeout(() => setAccountantSaveSuccess(false), 4000);
    } catch (err: any) {
      alert("Failed to save accountant credentials: " + (err.message || err));
    } finally {
      setAccountantSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const isValid = await verifyAdminPassword(currentPassword);
      if (!isValid) {
        setPasswordError("Current password is incorrect.");
        setPasswordSaving(false);
        return;
      }

      await updateAdminPasswordHash(newPassword);

      setPasswordSuccess("Password updated successfully! Salted SHA-256 encrypted hash saved to Supabase database.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError("Failed to update password in Supabase: " + (err.message || err));
    } finally {
      setPasswordSaving(false);
    }
  };

  // ── 2FA Setup Wizard ─────────────────────────────────────────────────────

  const openSetup2FA = () => {
    setSetupStep(1);
    setSetupPassword("");
    setSetupPasswordError(null);
    setPendingSecret(null);
    setQrCodeDataUrl(null);
    setSetupTotpCode("");
    setSetupTotpError(null);
    setShowSetup2FA(true);
  };

  const handleSetupStep1 = async () => {
    setSetupPasswordError(null);
    if (!setupPassword) {
      setSetupPasswordError("Please enter your admin password to continue.");
      return;
    }
    const valid = await verifyAdminPassword(setupPassword);
    if (!valid) {
      setSetupPasswordError("Incorrect admin password. Please try again.");
      return;
    }

    // Generate a new TOTP secret and QR code (using admin email as label)
    const secret = generateTOTPSecret();
    const uri = getTOTPUri(secret, email); // email = admin email from profile state
    const dataUrl = await QRCode.toDataURL(uri, { width: 220, margin: 2, color: { dark: "#1e293b", light: "#ffffff" } });

    setPendingSecret(secret);
    setQrCodeDataUrl(dataUrl);
    setSetupStep(2);
  };

  const handleSetupStep3Verify = async () => {
    setSetupTotpError(null);
    if (setupTotpCode.length !== 6 || !/^\d{6}$/.test(setupTotpCode)) {
      setSetupTotpError("Please enter the 6-digit code from your authenticator app.");
      return;
    }
    if (!pendingSecret) return;

    const valid = verifyTOTPToken(pendingSecret, setupTotpCode);
    if (!valid) {
      setSetupTotpError("Invalid code. Make sure your phone clock is accurate and try again.");
      return;
    }

    setSetupSaving(true);
    try {
      await enable2FA(pendingSecret);
      setTwoFAEnabled(true);
      setSetupStep(4);
    } catch (err: any) {
      setSetupTotpError("Failed to save 2FA to Supabase: " + (err.message || err));
    } finally {
      setSetupSaving(false);
    }
  };

  const closeSetup = () => {
    setShowSetup2FA(false);
    setSetupStep(1);
    setSetupPassword("");
    setPendingSecret(null);
    setQrCodeDataUrl(null);
    setSetupTotpCode("");
  };

  // ── Disable 2FA ───────────────────────────────────────────────────────────

  const openDisable2FA = () => {
    setDisablePassword("");
    setDisableTotpCode("");
    setDisableError(null);
    setShowDisable2FA(true);
  };

  const handleDisable2FA = async () => {
    setDisableError(null);
    if (!disablePassword) {
      setDisableError("Please enter your admin password.");
      return;
    }
    if (disableTotpCode.length !== 6 || !/^\d{6}$/.test(disableTotpCode)) {
      setDisableError("Please enter the 6-digit code from your authenticator app.");
      return;
    }

    setDisableSaving(true);
    try {
      const pwValid = await verifyAdminPassword(disablePassword);
      if (!pwValid) {
        setDisableError("Incorrect admin password.");
        setDisableSaving(false);
        return;
      }

      const { secret } = await get2FAStatus();
      if (!secret) throw new Error("No 2FA secret found.");

      const codeValid = verifyTOTPToken(secret, disableTotpCode);
      if (!codeValid) {
        setDisableError("Invalid authenticator code. Please try again.");
        setDisableSaving(false);
        return;
      }

      await disable2FA();
      setTwoFAEnabled(false);
      setShowDisable2FA(false);
    } catch (err: any) {
      setDisableError("Failed to disable 2FA: " + (err.message || err));
    } finally {
      setDisableSaving(false);
    }
  };

  const copySecret = () => {
    if (pendingSecret) {
      navigator.clipboard.writeText(pendingSecret);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "profile" ? "border-brand-600 text-brand-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <User className="w-4 h-4" /> Profile
        </button>
        <button
          onClick={() => setActiveTab("accountant")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "accountant" ? "border-brand-600 text-brand-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <ShieldCheck className="w-4 h-4" /> Accountant
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "notifications" ? "border-brand-600 text-brand-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <Bell className="w-4 h-4" /> Notifications
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "security" ? "border-brand-600 text-brand-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <Lock className="w-4 h-4" /> Security
        </button>
        <button
          onClick={() => setActiveTab("system")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "system" ? "border-brand-600 text-brand-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <Globe className="w-4 h-4" /> System
        </button>
      </div>

      <div className="p-8">
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="max-w-2xl space-y-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Profile Settings</h2>

            {saveSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                Profile settings updated and saved to Supabase successfully!
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Himalaya Basic"
                  className="w-full px-4 py-2.5 border-2 border-blue-400 bg-blue-50/20 text-blue-700 font-bold rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="School"
                  className="w-full px-4 py-2.5 border-2 border-blue-400 bg-blue-50/20 text-blue-700 font-bold rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition-all text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@himalaya.edu.np"
                  className="w-full px-4 py-2.5 border-2 border-blue-400 bg-blue-50/20 text-blue-700 font-bold rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold shadow-md disabled:opacity-50"
            >
              {saving ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </form>
        )}

        {activeTab === "accountant" && (
          <form onSubmit={handleSaveAccountant} className="max-w-2xl space-y-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Accountant Login Details</h2>
            <p className="text-slate-500 text-sm mb-4">Set the login ID and password for the Accountant Portal. The accountant will use these credentials to access their dashboard.</p>

            {accountantSaveSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                Accountant credentials saved successfully!
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Accountant Login ID (Username)</label>
                <input
                  type="text"
                  required
                  value={accountantUsername}
                  onChange={(e) => setAccountantUsername(e.target.value)}
                  placeholder="e.g. accountant"
                  className="w-full px-4 py-2.5 border-2 border-slate-200 bg-slate-50 text-slate-800 font-medium rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white focus:outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Accountant Password</label>
                <input
                  type="text"
                  required
                  value={accountantPassword}
                  onChange={(e) => setAccountantPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border-2 border-slate-200 bg-slate-50 text-slate-800 font-medium rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white focus:outline-none transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={accountantSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-all font-bold shadow-md disabled:opacity-50 mt-4"
            >
              {accountantSaving ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Accountant Details</>
              )}
            </button>
          </form>
        )}

        {activeTab === "notifications" && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Notification Preferences</h2>
            
            {notificationsSaveSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                Notification preferences saved to Supabase successfully!
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="font-semibold text-slate-800">Email Notifications</h4>
                  <p className="text-sm text-slate-500">Receive daily summaries and critical alerts via email.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="font-semibold text-slate-800">Push Notifications</h4>
                  <p className="text-sm text-slate-500">Instant alerts for new admissions and teacher updates.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={pushNotifications} onChange={(e) => setPushNotifications(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="font-semibold text-slate-800">SMS Alerts</h4>
                  <p className="text-sm text-slate-500">Receive important security codes and urgent alerts.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>
            </div>

            <button
              onClick={handleSaveNotifications}
              disabled={notificationsSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-bold mt-6 shadow-md disabled:opacity-50"
            >
              {notificationsSaving
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                : <><Save className="w-4 h-4" /> Save Preferences</>
              }
            </button>
          </div>
        )}

        {activeTab === "security" && (
          <div className="max-w-2xl space-y-8">
            {/* Change Password */}
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-brand-600" /> Change Password
              </h2>

              {passwordError && (
                <div className="p-3.5 bg-red-50 border border-red-300 text-red-800 rounded-xl text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-10 border-2 border-blue-400 bg-blue-50/20 text-blue-700 font-bold rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition-all text-sm"
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-xl">
                    {showCurrentPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 pr-10 border-2 border-blue-400 bg-blue-50/20 text-blue-700 font-bold rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition-all text-sm"
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-xl">
                      {showNewPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 pr-10 border-2 border-blue-400 bg-blue-50/20 text-blue-700 font-bold rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition-all text-sm"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-xl">
                      {showConfirmPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all font-bold text-sm shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {passwordSaving ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Encrypting & Updating...</>
                ) : (
                  <><Key className="w-4 h-4" /> Update Password</>
                )}
              </button>
            </form>

            {/* 2FA Section */}
            <div className="pt-6 border-t border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-600" /> Two-Factor Authentication (2FA)
              </h2>

              {twoFALoading ? (
                <div className="flex items-center gap-2 text-slate-500 p-4">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Checking 2FA status...
                </div>
              ) : (
                <div className={`flex items-center justify-between p-5 border-2 rounded-xl ${twoFAEnabled ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50/50"}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-full ${twoFAEnabled ? "bg-emerald-100" : "bg-slate-100"}`}>
                      {twoFAEnabled
                        ? <ShieldCheck className="w-6 h-6 text-emerald-600" />
                        : <Shield className="w-6 h-6 text-slate-400" />
                      }
                    </div>
                    <div>
                      <h4 className={`font-bold text-base ${twoFAEnabled ? "text-emerald-800" : "text-slate-800"}`}>
                        {twoFAEnabled ? "2FA is Active ✓" : "Enable 2FA"}
                      </h4>
                      <p className={`text-sm ${twoFAEnabled ? "text-emerald-700" : "text-slate-500"}`}>
                        {twoFAEnabled
                          ? "Your account is protected with Google Authenticator / Authy."
                          : "Secure your admin account with an authenticator app (Google Authenticator, Authy)."}
                      </p>
                    </div>
                  </div>
                  {twoFAEnabled ? (
                    <button
                      onClick={openDisable2FA}
                      className="flex items-center gap-2 px-4 py-2.5 border-2 border-red-400 text-red-600 bg-white hover:bg-red-50 rounded-xl font-bold text-sm transition-all"
                    >
                      <ShieldOff className="w-4 h-4" /> Disable 2FA
                    </button>
                  ) : (
                    <button
                      onClick={openSetup2FA}
                      className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm shadow-md transition-all"
                    >
                      <QrCode className="w-4 h-4" /> Setup 2FA
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Active Sessions — Real data from Supabase */}
            <div className="pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-brand-600" /> Active Sessions
                </h2>
                <span className="text-xs text-slate-400 font-medium">{sessions.length} active session{sessions.length !== 1 ? "s" : ""}</span>
              </div>

              {sessionsLoading ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm p-3">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Loading sessions...
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-slate-400 text-sm p-3">No active sessions found.</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => {
                    const isCurrent = session.id === currentSessionId;
                    const { label, icon } = parseDevice(session.user_agent);
                    const DeviceIcon = icon === "smartphone" ? Smartphone : icon === "tablet" ? Tablet : icon === "monitor" ? Monitor : Laptop;
                    return (
                      <div
                        key={session.id}
                        className={`flex items-center gap-4 p-3.5 border-2 rounded-xl transition-all ${
                          isCurrent
                            ? "border-brand-200 bg-brand-50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <DeviceIcon className={`w-6 h-6 shrink-0 ${isCurrent ? "text-brand-600" : "text-slate-400"}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm truncate ${isCurrent ? "text-slate-900" : "text-slate-700"}`}>
                            {label}
                          </p>
                          {/* Location row */}
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap">
                            {session.city || session.country ? (
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                                  <circle cx="12" cy="10" r="3"/>
                                </svg>
                                <span className="font-medium text-slate-600">
                                  {[session.city, session.country].filter(Boolean).join(", ")}
                                </span>
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Location unavailable</span>
                            )}
                            {" · "}
                            <span className="text-slate-400">{relativeTime(session.created_at)}</span>
                            {" · "}
                            <span className="text-slate-400">Expires {new Date(session.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          </p>
                          {/* IP address */}
                          {session.ip_address && (
                            <p className="text-xs text-slate-400 mt-0.5 font-mono">{session.ip_address}</p>
                          )}
                        </div>
                        {isCurrent ? (
                          <span className="text-xs font-bold text-brand-600 bg-brand-100 px-2.5 py-1 rounded-full shrink-0">
                            Current
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            disabled={revokingId === session.id}
                            className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50 shrink-0"
                          >
                            {revokingId === session.id
                              ? <><RefreshCw className="w-3 h-3 animate-spin" /> Revoking...</>
                              : <><Trash2 className="w-3 h-3" /> Revoke</>
                            }
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "system" && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">System Preferences</h2>

            {systemSaveSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                System settings saved to Supabase successfully!
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
                <input
                  type="text"
                  value={systemSchoolName}
                  onChange={(e) => setSystemSchoolName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-blue-700 font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Active Academic Year</label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-white text-blue-700 font-bold"
                  value={systemAcademicYear}
                  onChange={(e) => setSystemAcademicYear(e.target.value)}
                >
                  <option value="2025/2026">2025/2026</option>
                  <option value="2026/2027">2026/2027 (Current)</option>
                  <option value="2027/2028">2027/2028</option>
                </select>
              </div>

              {/* Maintenance Mode Toggle */}
              <div className={`flex items-start justify-between p-5 border-2 rounded-xl transition-all ${
                maintenanceMode
                  ? "border-amber-400 bg-amber-50"
                  : "border-slate-200 bg-slate-50/50"
              }`}>
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TriangleAlert className={`w-4 h-4 ${maintenanceMode ? "text-amber-600" : "text-slate-400"}`} />
                    <h4 className={`font-bold text-sm ${maintenanceMode ? "text-amber-800" : "text-slate-800"}`}>
                      Maintenance Mode
                      {maintenanceMode && (
                        <span className="ml-2 text-xs font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">🔴 ACTIVE</span>
                      )}
                    </h4>
                  </div>
                  <p className={`text-sm mt-1 ${maintenanceMode ? "text-amber-700" : "text-slate-500"}`}>
                    {maintenanceMode
                      ? "Public website is currently showing the Under Construction page. Admin panel remains accessible."
                      : "When enabled, the public website will show an \"Under Construction\" page. Admin panel stays accessible."}
                  </p>
                  {maintenanceMode && (
                    <a
                      href="/maintenance"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-xs text-amber-700 underline hover:text-amber-900 font-medium"
                    >
                      Preview maintenance page →
                    </a>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                  />
                  <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            <button
              onClick={handleSaveSystemSettings}
              disabled={systemSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-bold mt-6 shadow-md disabled:opacity-50"
            >
              {systemSaving
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                : <><Save className="w-4 h-4" /> Save System Settings</>
              }
            </button>
          </div>
        )}
      </div>

      {/* ── Setup 2FA Modal ─────────────────────────────────────────────────── */}
      {showSetup2FA && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-brand-600 to-brand-700">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" /> Setup Two-Factor Authentication
              </h3>
              <button onClick={closeSetup} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex border-b border-slate-100">
              {[
                { n: 1, label: "Verify" },
                { n: 2, label: "Scan QR" },
                { n: 3, label: "Enter Code" },
                { n: 4, label: "Done" },
              ].map((s) => (
                <div key={s.n} className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-colors ${
                  setupStep === s.n
                    ? "border-brand-600 text-brand-600"
                    : setupStep > s.n
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-slate-400"
                }`}>
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs mr-1 ${
                    setupStep > s.n ? "bg-emerald-500" : setupStep === s.n ? "bg-brand-600" : "bg-slate-300"
                  }`}>{setupStep > s.n ? "✓" : s.n}</span>
                  {s.label}
                </div>
              ))}
            </div>

            <div className="p-6">
              {/* Step 1: Verify password */}
              {setupStep === 1 && (
                <div className="space-y-4">
                  <p className="text-slate-600 text-sm">To set up 2FA, first confirm your admin password.</p>
                  {setupPasswordError && (
                    <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-xl text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {setupPasswordError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Admin Password</label>
                    <input
                      type="password"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSetupStep1()}
                      placeholder="Enter your current password"
                      className="w-full px-4 py-2.5 border-2 border-blue-400 bg-blue-50/20 text-blue-700 font-bold rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-sm"
                    />
                  </div>
                  <button
                    onClick={handleSetupStep1}
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all"
                  >
                    Continue →
                  </button>
                </div>
              )}

              {/* Step 2: Scan QR */}
              {setupStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-slate-700 font-semibold mb-1">Scan with your Authenticator App</p>
                    <p className="text-slate-500 text-xs mb-4">Use Google Authenticator, Authy, or any TOTP app to scan this QR code.</p>
                    {qrCodeDataUrl && (
                      <div className="inline-block p-3 border-2 border-brand-200 rounded-2xl bg-white shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrCodeDataUrl} alt="2FA QR Code" className="w-48 h-48" />
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1 font-medium">Can&apos;t scan? Enter this secret manually:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono text-slate-700 break-all bg-white border border-slate-200 rounded-lg px-2 py-1.5">
                        {pendingSecret}
                      </code>
                      <button
                        onClick={copySecret}
                        title="Copy secret"
                        className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => { setSetupTotpCode(""); setSetupTotpError(null); setSetupStep(3); }}
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all"
                  >
                    I&apos;ve scanned the QR code →
                  </button>
                  <p className="text-xs text-slate-400 text-center">After scanning, click the button above to enter your verification code.</p>
                </div>
              )}

              {/* Step 3: Verify TOTP code */}
              {setupStep === 3 && (
                <div className="space-y-4">
                  <p className="text-slate-700 text-sm">Enter the <strong>6-digit code</strong> from your authenticator app to confirm setup.</p>
                  {setupTotpError && (
                    <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-xl text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {setupTotpError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">6-Digit Authenticator Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={setupTotpCode}
                      onChange={(e) => setSetupTotpCode(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && handleSetupStep3Verify()}
                      placeholder="000000"
                      className="w-full px-4 py-3 border-2 border-blue-400 bg-blue-50/20 text-blue-700 font-bold rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-2xl text-center tracking-[0.5em]"
                    />
                  </div>
                  <button
                    onClick={handleSetupStep3Verify}
                    disabled={setupSaving}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {setupSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying...</> : <><CheckCircle className="w-4 h-4" /> Verify & Enable 2FA</>}
                  </button>
                  <button onClick={() => setSetupStep(2)} className="w-full py-2 text-slate-500 hover:text-slate-700 text-sm font-medium">
                    ← Back to QR Code
                  </button>
                </div>
              )}

              {/* Step 4: Success */}
              {setupStep === 4 && (
                <div className="text-center space-y-4 py-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-emerald-100 rounded-full">
                      <ShieldCheck className="w-12 h-12 text-emerald-600" />
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800">2FA Enabled Successfully!</h4>
                  <p className="text-slate-500 text-sm">Your account is now protected with two-factor authentication. You&apos;ll need to enter a code from your authenticator app every time you log in.</p>
                  <button
                    onClick={closeSetup}
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Disable 2FA Modal ───────────────────────────────────────────────── */}
      {showDisable2FA && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-red-600 to-red-700">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <ShieldOff className="w-5 h-5" /> Disable Two-Factor Authentication
              </h3>
              <button onClick={() => setShowDisable2FA(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Disabling 2FA will remove the extra layer of security from your admin account. You must verify both your password and your current authenticator code.</span>
              </div>

              {disableError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {disableError}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Admin Password</label>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-4 py-2.5 border-2 border-blue-400 bg-blue-50/20 text-blue-700 font-bold rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Authenticator Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={disableTotpCode}
                  onChange={(e) => setDisableTotpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full px-4 py-3 border-2 border-slate-300 text-slate-800 font-bold rounded-xl focus:ring-2 focus:ring-slate-400 focus:outline-none text-2xl text-center tracking-[0.5em]"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDisable2FA(false)}
                  className="flex-1 py-2.5 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisable2FA}
                  disabled={disableSaving}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {disableSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Disabling...</> : <><ShieldOff className="w-4 h-4" /> Disable 2FA</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <canvas ref={qrCanvasRef} className="hidden" />
    </div>
  );
}
