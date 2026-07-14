import { useState } from "react";
import { Save, User, Bell, Lock, Globe } from "lucide-react";

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
        
        {activeTab !== "profile" && (
          <div className="text-center py-12 text-slate-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <Lock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">Under Development</h3>
            <p>This settings section is currently being updated.</p>
          </div>
        )}
      </div>
    </div>
  );
}
