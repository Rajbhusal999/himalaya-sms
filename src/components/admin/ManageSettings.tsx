import { useState } from "react";
import { Save, User, Bell, Lock, Globe, Key, Shield, Smartphone, Laptop, History } from "lucide-react";

export default function ManageSettings() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "profile" ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <User className="w-4 h-4" /> Profile
        </button>
        <button 
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "notifications" ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <Bell className="w-4 h-4" /> Notifications
        </button>
        <button 
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "security" ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <Lock className="w-4 h-4" /> Security
        </button>
        <button 
          onClick={() => setActiveTab("system")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "system" ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <Globe className="w-4 h-4" /> System
        </button>
      </div>

      <div className="p-8">
        {activeTab === "profile" && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Profile Settings</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input type="text" defaultValue="Admin" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input type="text" defaultValue="User" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input type="email" defaultValue="admin@himalaya.edu.np" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500" />
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
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
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-brand-600" /> Change Password
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500" />
                  </div>
                </div>
                <button className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium text-sm">
                  Update Password
                </button>
              </div>
            </div>

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
                <input type="text" defaultValue="Shree Himalaya Basic School" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Active Academic Year</label>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-white" defaultValue="2026/2027">
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
