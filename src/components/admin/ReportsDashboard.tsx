"use client";

import { useState, useEffect } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  GraduationCap, 
  FileText,
  BarChart3,
  CircleDot,
  Loader2,
  Download
} from "lucide-react";
import { getAggregatedReports, getSchoolwiseAnalysis, getStudentAttendanceReport, getStudentDemographicsReport } from "@/lib/reportServices";

const EXAM_TERMS = ["First Term", "Second Term", "Final"];
const ACADEMIC_YEARS = Array.from({ length: 9 }, (_, i) => (2082 + i).toString());
const CLASSES = ["Nursery", "KG", "ECD", "1", "2", "3", "4", "5", "6", "7", "8"];

export default function ReportsDashboard() {
  const [openSection, setOpenSection] = useState<string>("exam");
  const [activeReport, setActiveReport] = useState<string>("");
  
  const [selectedYear, setSelectedYear] = useState(ACADEMIC_YEARS[0]);
  const [selectedTerm, setSelectedTerm] = useState(EXAM_TERMS[0]);
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [schoolData, setSchoolData] = useState<any[]>([]);

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

  useEffect(() => {
    async function loadData() {
      if (!activeReport) return;
      setLoading(true);
      try {
        if (activeReport === "school-analysis") {
          const stats = await getSchoolwiseAnalysis(selectedYear, selectedTerm);
          setSchoolData(stats);
        } else if (activeReport === "attendance") {
          const stats = await getStudentAttendanceReport(selectedYear, selectedClass, selectedTerm);
          setReportData(stats);
        } else if (activeReport === "demographics") {
          const stats = await getStudentDemographicsReport(selectedYear, selectedClass);
          setReportData(stats);
        } else if (examReports.find(r => r.id === activeReport)) {
          const stats = await getAggregatedReports(selectedYear, selectedClass, selectedTerm);
          setReportData(stats);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeReport, selectedYear, selectedTerm, selectedClass]);

  const renderSubjectwiseGrade = () => {
    if (!reportData) return null;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
            <tr>
              <th className="border p-3">Subject</th>
              <th className="border p-3 text-center">A+</th>
              <th className="border p-3 text-center">A</th>
              <th className="border p-3 text-center">B+</th>
              <th className="border p-3 text-center">B</th>
              <th className="border p-3 text-center">C+</th>
              <th className="border p-3 text-center">C</th>
              <th className="border p-3 text-center">D</th>
              <th className="border p-3 text-center text-red-600">NG</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(reportData.subjectGrades).map(([subject, grades]: [string, any], idx) => (
              <tr key={idx} className="border-b hover:bg-slate-50 text-black">
                <td className="border p-3 font-medium">{subject}</td>
                {["A+", "A", "B+", "B", "C+", "C", "D", "NG"].map(g => (
                  <td key={g} className={`border p-3 text-center ${g === "NG" && grades[g] > 0 ? "text-red-600 font-bold" : ""}`}>
                    {grades[g]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderGPAIntervals = () => {
    if (!reportData) return null;
    return (
      <div className="overflow-x-auto max-w-2xl mx-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
            <tr>
              <th className="border p-3">GPA Interval</th>
              <th className="border p-3 text-center">Number of Students</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(reportData.gpaIntervals).map(([interval, count]: [string, any], idx) => (
              <tr key={idx} className="border-b hover:bg-slate-50 text-black">
                <td className="border p-3 font-medium">{interval}</td>
                <td className="border p-3 text-center text-lg">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSubjectwiseNG = () => {
    if (!reportData) return null;
    return (
      <div className="space-y-6">
        {Object.entries(reportData.subjectNGs).map(([subject, students]: [string, any], idx) => (
          <div key={idx} className="border rounded-lg overflow-hidden text-black">
            <div className="bg-slate-100 p-3 border-b font-bold flex justify-between">
              <span>{subject}</span>
              <span>{students.length} Failures</span>
            </div>
            {students.length > 0 ? (
              <ul className="p-4 space-y-2">
                {students.map((s: any, i: number) => (
                  <li key={i} className="flex items-center text-sm text-black">
                    <span className="w-24 font-mono">{s.roll}</span>
                    <span className="font-medium">{s.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-sm text-emerald-600 font-medium">No NG cases in this subject.</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStudentwiseNG = () => {
    if (!reportData) return null;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
            <tr>
              <th className="border p-3 w-24">Roll No</th>
              <th className="border p-3">Student Name</th>
              <th className="border p-3 text-center">Failed Subjects Count</th>
              <th className="border p-3">Failed Subjects List</th>
            </tr>
          </thead>
          <tbody>
            {reportData.studentNGs.map((student: any, idx: number) => (
              <tr key={idx} className="border-b hover:bg-slate-50 text-black">
                <td className="border p-3 font-mono">{student.roll}</td>
                <td className="border p-3 font-medium">{student.name}</td>
                <td className="border p-3 text-center font-bold text-lg">{student.failedSubjects.length}</td>
                <td className="border p-3">
                  <div className="flex flex-wrap gap-1">
                    {student.failedSubjects.map((sub: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-slate-100 text-black border border-slate-300 rounded-md text-xs font-medium">{sub}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {reportData.studentNGs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-emerald-600 font-medium">
                  No students with NG found in this class!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSchoolwiseAnalysis = () => {
    if (!schoolData || schoolData.length === 0) return (
      <div className="p-12 text-center text-slate-500">No data found for the selected term.</div>
    );
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
            <tr>
              <th className="border p-3">Class</th>
              <th className="border p-3 text-center">Total Students</th>
              <th className="border p-3 text-center text-emerald-600">Passed</th>
              <th className="border p-3 text-center text-red-600">Failed (NG)</th>
              <th className="border p-3 text-center">Pass %</th>
              <th className="border p-3 text-center">Average GPA</th>
            </tr>
          </thead>
          <tbody>
            {schoolData.map((cls, idx) => (
              <tr key={idx} className="border-b hover:bg-slate-50 text-black">
                <td className="border p-3 font-bold">{cls.className}</td>
                <td className="border p-3 text-center font-medium">{cls.totalStudents}</td>
                <td className="border p-3 text-center text-emerald-600 font-bold">{cls.passCount}</td>
                <td className="border p-3 text-center text-red-600 font-bold">{cls.failCount}</td>
                <td className="border p-3 text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-16 bg-slate-200 rounded-full h-2 mr-2 overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${cls.passPercentage}%` }}></div>
                    </div>
                    <span className="font-mono text-xs text-black">{cls.passPercentage}%</span>
                  </div>
                </td>
                <td className="border p-3 text-center font-bold text-black">{cls.averageGPA}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAttendanceReport = () => {
    if (!reportData || !Array.isArray(reportData)) return null;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
            <tr>
              <th className="border p-3 w-24">Roll No</th>
              <th className="border p-3">Student Name</th>
              <th className="border p-3 text-center">Attendance Days</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((student: any, idx: number) => (
              <tr key={idx} className="border-b hover:bg-slate-50 text-black">
                <td className="border p-3 font-mono font-medium">{student.roll}</td>
                <td className="border p-3 font-bold">{student.name}</td>
                <td className="border p-3 text-center">{student.attendanceDays}</td>
              </tr>
            ))}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-500 font-medium">
                  No students found in this class.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDemographicsReport = () => {
    if (!reportData || !Array.isArray(reportData)) return null;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
            <tr>
              <th className="border p-3 w-20">Roll</th>
              <th className="border p-3">Name</th>
              <th className="border p-3">Gender</th>
              <th className="border p-3">DOB</th>
              <th className="border p-3">Mother Tongue</th>
              <th className="border p-3">Disability</th>
              <th className="border p-3">Address</th>
              <th className="border p-3">Guardian Contact</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((student: any, idx: number) => (
              <tr key={idx} className="border-b hover:bg-slate-50 text-black">
                <td className="border p-3 font-mono">{student.roll}</td>
                <td className="border p-3 font-bold">{student.name}</td>
                <td className="border p-3">{student.gender}</td>
                <td className="border p-3 whitespace-nowrap">{student.dob}</td>
                <td className="border p-3">{student.motherTongue}</td>
                <td className="border p-3">{student.disabilityType}</td>
                <td className="border p-3 text-xs">{student.address}</td>
                <td className="border p-3 text-xs whitespace-nowrap font-mono">{student.guardianContact}</td>
              </tr>
            ))}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                  No students found in this class.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderReportContent = () => {
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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{reportTitle}</h2>
            <p className="text-sm text-black font-medium mt-1">
              Data for Academic Year {selectedYear}, Term: {selectedTerm} {activeReport !== 'school-analysis' && `, Class: ${selectedClass}`}
            </p>
          </div>
          <button className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
        
        {/* Render Summary Cards for specific reports */}
        {activeReport === "avg-gpa" && reportData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl text-center">
              <div className="text-blue-500 text-sm font-bold uppercase tracking-wider mb-2">Class Average GPA</div>
              <div className="text-5xl font-extrabold text-blue-700">{reportData.averageGPA}</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl text-center">
              <div className="text-emerald-500 text-sm font-bold uppercase tracking-wider mb-2">Total Passed</div>
              <div className="text-5xl font-extrabold text-emerald-700">{reportData.totalStudents - reportData.aggregatedNGCount}</div>
            </div>
            <div className="bg-red-50 border border-red-100 p-6 rounded-xl text-center">
              <div className="text-red-500 text-sm font-bold uppercase tracking-wider mb-2">Total Failed</div>
              <div className="text-5xl font-extrabold text-red-700">{reportData.aggregatedNGCount}</div>
            </div>
          </div>
        )}

        {activeReport === "agg-ng" && reportData && (
          <div className="flex justify-center mb-8">
             <div className="bg-red-50 border border-red-100 p-8 rounded-xl text-center max-w-sm w-full shadow-sm">
              <div className="text-red-500 text-sm font-bold uppercase tracking-wider mb-2">Total NG Students</div>
              <div className="text-7xl font-extrabold text-red-700">{reportData.aggregatedNGCount}</div>
              <p className="text-red-400 text-sm mt-4">Out of {reportData.totalStudents} total students</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-brand-500" />
            <p>Compiling report data...</p>
          </div>
        ) : (
          <div className="report-content-body">
            {activeReport === "subject-grade" && renderSubjectwiseGrade()}
            {activeReport === "gpa-interval" && renderGPAIntervals()}
            {activeReport === "subj-ng" && renderSubjectwiseNG()}
            {activeReport === "student-ng" && renderStudentwiseNG()}
            {activeReport === "school-analysis" && renderSchoolwiseAnalysis()}
            
            {activeReport === "attendance" && renderAttendanceReport()}
            {activeReport === "demographics" && renderDemographicsReport()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-8rem)]">
      {/* Top Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Academic Year:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border-slate-300 rounded-md text-sm shadow-sm py-1.5 focus:border-brand-500 focus:ring-brand-500 text-black"
          >
            {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Exam Term:</label>
          <select 
            value={selectedTerm} 
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="border-slate-300 rounded-md text-sm shadow-sm py-1.5 focus:border-brand-500 focus:ring-brand-500 text-black"
          >
            {EXAM_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {activeReport !== "school-analysis" && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Class:</label>
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
              className="border-slate-300 rounded-md text-sm shadow-sm py-1.5 focus:border-brand-500 focus:ring-brand-500 text-black"
            >
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-6 flex-1">
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
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
}
