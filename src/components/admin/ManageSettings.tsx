"use client";

import { useState, useEffect } from "react";
import { Save, User, Bell, Lock, Globe, Key, Shield, Smartphone, Laptop, History, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { verifyAdminPassword, updateAdminPasswordHash } from "@/lib/authCrypto";

export default function ManageSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  
  // Admin Profile state (Saved to Supabase admin_profile table)
  const [firstName, setFirstName] = useState("Himalaya Basic");
  const [lastName, setLastName] = useState("School");
  const [email, setEmail] = useState("himalayabasicschool01@gmail.com");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </button>
          </form>
        )}
        {activeTab === "notifications" && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Notification Preferences</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                <div>
                  <h4 className="font-semibold text-slate-800">Email Notifications</h4>
                  <p className="text-sm text-slate-500">Receive daily summaries and critical alerts via email.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                <div>
                  <h4 className="font-semibold text-slate-800">Push Notifications</h4>
                  <p className="text-sm text-slate-500">Instant alerts for new admissions and teacher updates.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                <div>
                  <h4 className="font-semibold text-slate-800">SMS Alerts</h4>
                  <p className="text-sm text-slate-500">Receive important security codes and urgent alerts.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium mt-6">
              <Save className="w-4 h-4" /> Save Preferences
            </button>
          </div>
        )}

        {activeTab === "security" && (
          <div className="max-w-2xl space-y-8">
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
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Encrypting & Updating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" /> Update Password
                  </>
                )}
              </button>
            </form>

            <div className="pt-6 border-t border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-600" /> Two-Factor Authentication (2FA)
              </h2>
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                <div>
                  <h4 className="font-semibold text-slate-800">Enable 2FA</h4>
                  <p className="text-sm text-slate-500">Secure your admin account with an authenticator app.</p>
                </div>
                <button className="px-4 py-2 border border-brand-600 text-brand-600 rounded-lg hover:bg-brand-50 transition-colors font-medium text-sm">
                  Setup 2FA
                </button>
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-brand-600" /> Active Sessions
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 border border-brand-200 bg-brand-50 rounded-xl">
                  <Laptop className="w-6 h-6 text-brand-600" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 text-sm">Windows PC - Chrome</p>
                    <p className="text-xs text-slate-500">Kathmandu, Nepal • Active now</p>
                  </div>
                  <span className="text-xs font-bold text-brand-600 bg-brand-100 px-2 py-1 rounded-full">Current</span>
                </div>
                <div className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl">
                  <Smartphone className="w-6 h-6 text-slate-400" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 text-sm">iPhone 13 - Safari</p>
                    <p className="text-xs text-slate-500">Kathmandu, Nepal • Last active 2 hours ago</p>
                  </div>
                  <button className="text-xs font-medium text-red-600 hover:underline">Revoke</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "system" && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">System Preferences</h2>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
                <input type="text" defaultValue="Shree Himalaya Basic School" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-blue-700 font-bold" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Active Academic Year</label>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-white text-blue-700 font-bold" defaultValue="2026/2027">
                  <option value="2025/2026">2025/2026</option>
                  <option value="2026/2027">2026/2027 (Current)</option>
                  <option value="2027/2028">2027/2028</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 border border-amber-200 rounded-xl bg-amber-50">
                <div>
                  <h4 className="font-semibold text-amber-800">Maintenance Mode</h4>
                  <p className="text-sm text-amber-700 mt-1">When enabled, the public website will show a "Under Construction" page.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium mt-6">
              <Save className="w-4 h-4" /> Save System Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
