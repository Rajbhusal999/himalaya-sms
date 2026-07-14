"use client";

import { useState } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  GraduationCap, 
  FileText,
  BarChart3,
  CircleDot
} from "lucide-react";

export default function ReportsDashboard() {
  const [openSection, setOpenSection] = useState<string>("exam");
  const [activeReport, setActiveReport] = useState<string>("");

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? "" : section);
  };

  const examReports = [
    { id: "subject-grade", title: "Subjectwise Grade" },
    { id: "gpa-interval", title: "GPA Interval" },
    { id: "avg-gpa", title: "Average GPA" },
    { id: "agg-ng", title: "Aggregated NG" },
    { id: "subj-ng", title: "Subjectwise NG Report" },
    { id: "student-ng", title: "Studentwise NG Report" },
    { id: "school-analysis", title: "Schoolwise Analysis Report" }
  ];

  const studentReports = [
    { id: "attendance", title: "Attendance Report" },
    { id: "demographics", title: "Student Demographics" }
  ];

  const renderPlaceholder = () => {
    if (!activeReport) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <BarChart3 className="w-16 h-16 mb-4 opacity-50" />
          <h3 className="text-xl font-medium text-slate-500">Select a Report</h3>
          <p className="text-sm mt-2">Choose a report from the sidebar to view data.</p>
        </div>
      );
    }

    const reportTitle = [...examReports, ...studentReports].find(r => r.id === activeReport)?.title;

    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">{reportTitle}</h2>
        <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <p className="text-slate-500 font-medium">This report is currently under construction.</p>
          <p className="text-sm text-slate-400 mt-2">Data visualization and export features will be available here.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
      {/* Sub-Sidebar for Reports Navigation */}
      <div className="w-72 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-shrink-0">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 text-lg flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-brand-600" />
            Report Categories
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Student Related */}
          <div className="rounded-lg overflow-hidden border border-slate-100">
            <button 
              onClick={() => toggleSection("student")}
              className="w-full flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center text-slate-800 font-medium">
                <GraduationCap className="w-4 h-4 mr-2 text-brand-500" />
                Student Related
              </div>
              {openSection === "student" ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>
            {openSection === "student" && (
              <div className="bg-slate-50 py-2 px-3 space-y-1">
                {studentReports.map(report => (
                  <button
                    key={report.id}
                    onClick={() => setActiveReport(report.id)}
                    className={`w-full flex items-center p-2 rounded-md text-sm transition-colors text-left pl-6 ${
                      activeReport === report.id 
                        ? "bg-brand-100 text-brand-700 font-medium" 
                        : "text-slate-600 hover:bg-slate-200 hover:text-slate-800"
                    }`}
                  >
                    <CircleDot className={`w-3 h-3 mr-2 ${activeReport === report.id ? "text-brand-600" : "text-slate-400"}`} />
                    {report.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Examination Related */}
          <div className="rounded-lg overflow-hidden border border-slate-100">
            <button 
              onClick={() => toggleSection("exam")}
              className="w-full flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center text-slate-800 font-medium">
                <FileText className="w-4 h-4 mr-2 text-brand-500" />
                Examination Related
              </div>
              {openSection === "exam" ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>
            {openSection === "exam" && (
              <div className="bg-slate-50 py-2 px-3 space-y-1">
                {examReports.map(report => (
                  <button
                    key={report.id}
                    onClick={() => setActiveReport(report.id)}
                    className={`w-full flex items-center p-2 rounded-md text-sm transition-colors text-left pl-6 ${
                      activeReport === report.id 
                        ? "bg-brand-100 text-brand-700 font-medium" 
                        : "text-slate-600 hover:bg-slate-200 hover:text-slate-800"
                    }`}
                  >
                    <CircleDot className={`w-3 h-3 mr-2 ${activeReport === report.id ? "text-brand-600" : "text-slate-400"}`} />
                    {report.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {renderPlaceholder()}
      </div>
    </div>
  );
}
