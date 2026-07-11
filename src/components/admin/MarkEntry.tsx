"use client";

import { useState } from "react";
import { Folder, ChevronRight, GraduationCap } from "lucide-react";

const CATEGORIES = [
  { id: "nursery", name: "Nursery", classes: ["Nursery"], color: "bg-pink-100 text-pink-600 border-pink-200" },
  { id: "kg", name: "KG", classes: ["KG"], color: "bg-purple-100 text-purple-600 border-purple-200" },
  { id: "1-3", name: "Class 1 to 3", classes: ["1", "2", "3"], color: "bg-blue-100 text-blue-600 border-blue-200" },
  { id: "4-5", name: "Class 4 & 5", classes: ["4", "5"], color: "bg-emerald-100 text-emerald-600 border-emerald-200" },
  { id: "6-8", name: "Class 6 to 8", classes: ["6", "7", "8"], color: "bg-amber-100 text-amber-600 border-amber-200" }
];

export default function MarkEntry() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <GraduationCap className="w-6 h-6 mr-2 text-brand-600" />
            Mark Entry
          </h2>
          <p className="text-sm text-slate-500 mt-1">Select a category and class to enter marks.</p>
        </div>
      </div>

      {!selectedCategory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => (
            <div 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md transition-shadow group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-xl border ${cat.color}`}>
                  <Folder className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{cat.name}</h3>
                  <p className="text-sm text-slate-500">{cat.classes.length} {cat.classes.length === 1 ? 'Class' : 'Classes'}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-600 transition-colors" />
            </div>
          ))}
        </div>
      ) : !selectedClass ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {CATEGORIES.find(c => c.id === selectedCategory)?.name} - Select Class
              </h3>
            </div>
            <button 
              onClick={() => setSelectedCategory(null)}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              &larr; Back to Categories
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {CATEGORIES.find(c => c.id === selectedCategory)?.classes.map((cls) => (
              <div 
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className="p-4 border border-slate-200 rounded-lg text-center cursor-pointer hover:bg-brand-50 hover:border-brand-200 transition-colors"
              >
                <div className="text-xl font-bold text-slate-700 mb-1">{cls.match(/^\d+$/) ? `Class ${cls}` : cls}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
           <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Class {selectedClass} - Mark Entry
              </h3>
              <p className="text-sm text-slate-500 mt-1">Enter marks for students in this class.</p>
            </div>
            <button 
              onClick={() => setSelectedClass(null)}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              &larr; Back to Class Selection
            </button>
          </div>
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
            <p className="text-slate-500">Mark entry table implementation goes here...</p>
          </div>
        </div>
      )}
    </div>
  );
}
