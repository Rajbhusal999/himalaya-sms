import { supabase } from "@/lib/supabase/client";
import { calculateStudentGrades } from "./gradeCalculations";

export const getAggregatedReports = async (academicYear: string, selectedClass: string, term: string) => {
  // Fetch class data
  const { data: students, error: stdErr } = await supabase
    .from("students")
    .select("*")
    .eq("class", selectedClass)
    .order("roll_no", { ascending: true });

  const { data: subjects, error: subErr } = await supabase
    .from("subjects")
    .select("*")
    .eq("class", selectedClass)
    .order("id", { ascending: true });

  const { data: marksData, error: markErr } = await supabase
    .from("marks")
    .select("*")
    .eq("term", term);

  if (stdErr || subErr || markErr) {
    throw new Error("Failed to fetch report data");
  }

  const marksMap: Record<string, Record<string, any>> = {};
  marksData?.forEach((m) => {
    if (!marksMap[m.student_id]) marksMap[m.student_id] = {};
    marksMap[m.student_id][m.subject_id] = {
      written: m.written?.toString() ?? "",
      oral: m.oral?.toString() ?? "",
      cu: m.cu?.toString() ?? "",
      total: m.total?.toString() ?? "",
      attendance: m.attendance?.toString() ?? "",
      activity: m.activity?.toString() ?? "",
      project16: m.project16?.toString() ?? "",
      project20: m.project20?.toString() ?? "",
      termExam: m.term_exam?.toString() ?? "",
      firstTerm: m.first_term?.toString() ?? "",
      secondTerm: m.second_term?.toString() ?? "",
      writtenFinal: m.written_final?.toString() ?? "",
    };
  });

  // Calculate grades for all students in the class
  const studentReports = (students || []).map(student => {
    const calc = calculateStudentGrades(student, subjects || [], marksMap, selectedClass, term);
    return {
      student,
      ...calc
    };
  });

  // 1. Subjectwise Grade
  const subjectGrades: Record<string, Record<string, number>> = {};
  subjects?.forEach(sub => {
    subjectGrades[sub.subject_name] = {
      "A+": 0, "A": 0, "B+": 0, "B": 0, "C+": 0, "C": 0, "D": 0, "NG": 0
    };
  });

  studentReports.forEach(sr => {
    sr.subjectResults.forEach(res => {
      if (subjectGrades[res.subjectName] && subjectGrades[res.subjectName][res.grade] !== undefined) {
        subjectGrades[res.subjectName][res.grade]++;
      }
    });
  });

  // 2. GPA Interval
  const gpaIntervals = {
    "3.6 - 4.0": 0,
    "3.2 - 3.6": 0,
    "2.8 - 3.2": 0,
    "2.4 - 2.8": 0,
    "2.0 - 2.4": 0,
    "1.6 - 2.0": 0,
    "Below 1.6 (NG)": 0,
  };

  studentReports.forEach(sr => {
    const gpa = sr.finalGPA;
    if (sr.hasNG || gpa < 1.6) gpaIntervals["Below 1.6 (NG)"]++;
    else if (gpa >= 3.6) gpaIntervals["3.6 - 4.0"]++;
    else if (gpa >= 3.2) gpaIntervals["3.2 - 3.6"]++;
    else if (gpa >= 2.8) gpaIntervals["2.8 - 3.2"]++;
    else if (gpa >= 2.4) gpaIntervals["2.4 - 2.8"]++;
    else if (gpa >= 2.0) gpaIntervals["2.0 - 2.4"]++;
    else gpaIntervals["1.6 - 2.0"]++;
  });

  // 3. Average GPA
  const validGPAs = studentReports.filter(sr => !sr.hasNG && sr.finalGPA > 0).map(sr => sr.finalGPA);
  const averageGPA = validGPAs.length > 0
    ? (validGPAs.reduce((a, b) => a + b, 0) / validGPAs.length).toFixed(2)
    : "0.00";

  // 4. Aggregated NG
  const aggregatedNGCount = studentReports.filter(sr => sr.hasNG).length;

  // 5. Subjectwise NG Report
  const subjectNGs: Record<string, any[]> = {};
  subjects?.forEach(sub => {
    subjectNGs[sub.subject_name] = [];
  });

  studentReports.forEach(sr => {
    sr.subjectResults.forEach(res => {
      if (res.grade === "NG") {
        subjectNGs[res.subjectName].push({
          name: sr.student.name,
          roll: sr.student.roll_no || sr.student.displayRollNo
        });
      }
    });
  });

  // 6. Studentwise NG Report
  const studentNGs = studentReports
    .filter(sr => sr.hasNG)
    .map(sr => ({
      name: sr.student.name,
      roll: sr.student.roll_no || sr.student.displayRollNo,
      failedSubjects: sr.subjectResults.filter(r => r.grade === "NG").map(r => r.subjectName)
    }));

  return {
    totalStudents: studentReports.length,
    subjectGrades,
    gpaIntervals,
    averageGPA,
    aggregatedNGCount,
    subjectNGs,
    studentNGs
  };
};

export const getSchoolwiseAnalysis = async (academicYear: string, term: string) => {
  // We need to fetch all active classes, their students, subjects, and marks.
  const classes = ["Nursery", "KG", "ECD", "1", "2", "3", "4", "5", "6", "7", "8"];
  const schoolStats = [];

  for (const cls of classes) {
    try {
      const stats = await getAggregatedReports(academicYear, cls, term);
      if (stats.totalStudents > 0) {
        schoolStats.push({
          className: cls,
          totalStudents: stats.totalStudents,
          passCount: stats.totalStudents - stats.aggregatedNGCount,
          failCount: stats.aggregatedNGCount,
          passPercentage: ((stats.totalStudents - stats.aggregatedNGCount) / stats.totalStudents * 100).toFixed(1),
          averageGPA: stats.averageGPA
        });
      }
    } catch (e) {
      console.error(`Failed to aggregate stats for class ${cls}`, e);
    }
  }

  return schoolStats;
};

export const getStudentAttendanceReport = async (academicYear: string, selectedClass: string, term: string) => {
  const { data: students, error: stdErr } = await supabase
    .from("students")
    .select("id, name, roll_no")
    .eq("class", selectedClass)
    .order("roll_no", { ascending: true });

  const { data: attendanceData, error: attErr } = await supabase
    .from("attendance")
    .select("student_id, attendance_days")
    .eq("exam_term", term);

  if (stdErr || attErr) {
    throw new Error("Failed to fetch attendance data");
  }

  const attendanceMap: Record<string, string> = {};
  attendanceData?.forEach(record => {
    attendanceMap[record.student_id] = record.attendance_days || "0";
  });

  return (students || []).map(student => ({
    name: student.name,
    roll: student.roll_no,
    attendanceDays: attendanceMap[student.id] || "N/A"
  }));
};

export const getStudentDemographicsReport = async (academicYear: string, selectedClass: string) => {
  const { data: students, error: stdErr } = await supabase
    .from("students")
    .select("*")
    .eq("class", selectedClass)
    .order("roll_no", { ascending: true });

  if (stdErr) {
    throw new Error("Failed to fetch demographics data");
  }

  return (students || []).map(student => ({
    name: student.name,
    roll: student.roll_no,
    gender: student.gender || "N/A",
    dob: student.dob || "N/A",
    motherTongue: student.mother_tongue || "N/A",
    disabilityType: student.disability_type || "N/A",
    address: student.permanent_address || "N/A",
    guardianContact: student.guardian_contact_number || "N/A",
  }));
};
