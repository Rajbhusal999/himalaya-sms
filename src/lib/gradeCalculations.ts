export const getGradeAndGP = (percent: number) => {
  if (percent >= 90) return { grade: "A+", gp: 4.0 };
  if (percent >= 80) return { grade: "A", gp: 3.6 };
  if (percent >= 70) return { grade: "B+", gp: 3.2 };
  if (percent >= 60) return { grade: "B", gp: 2.8 };
  if (percent >= 50) return { grade: "C+", gp: 2.4 };
  if (percent >= 40) return { grade: "C", gp: 2.0 };
  if (percent >= 35) return { grade: "D", gp: 1.6 };
  return { grade: "NG", gp: 0 };
};

export const getRemarks = (grade: string) => {
  switch (grade) {
    case "A+": return "OUTSTANDING";
    case "A": return "EXCELLENT";
    case "B+": return "VERY GOOD";
    case "B": return "GOOD";
    case "C+": return "SATISFACTORY";
    case "C": return "ACCEPTABLE";
    case "D": return "BASIC";
    default: return "NOT GRADED";
  }
};

export const calculateStudentGrades = (
  student: any, 
  subjects: any[], 
  marks: any, 
  selectedClass: string, 
  selectedTerm: string
) => {
  let totalWGP = 0;
  let totalCreditHours = 0;
  let hasNG = false;
  
  const isClass6to8 = ["6", "7", "8"].includes(selectedClass || "");
  const isClass1to5 = ["1", "2", "3", "4", "5"].includes(selectedClass || "");

  const subjectResults = subjects.map(sub => {
    const isComputer = sub.subject_name.toLowerCase().includes("computer");
    const m = marks[student.id]?.[sub.id] || {};
    const isOptional = sub.subject_name.toLowerCase().includes("opt");
    
    let creditHour = 4;
    if (isClass6to8) {
      if (selectedTerm === "Final") {
        creditHour = sub.credit_hour !== null ? sub.credit_hour : (isOptional ? 0 : (isComputer ? 2 : 5));
      } else {
        creditHour = sub.credit_hour !== null ? sub.credit_hour : (isOptional ? 0 : (isComputer ? 0 : 4));
      }
    } else if (isClass1to5) {
      creditHour = sub.credit_hour !== null ? sub.credit_hour : (isOptional ? 0 : 4);
    }

    let subjTotalGP = 0;
    let subjFinalGrade = "NG";

    if (isClass6to8) {
      if (selectedTerm === "Final") {
        const par = (parseFloat(m.attendance || "0") + parseFloat(m.activity || "0"));
        const pw = (parseFloat(m.project16 || "0") + parseFloat(m.project20 || "0"));
        const t1 = parseFloat(m.firstTerm || "0");
        const t2 = parseFloat(m.secondTerm || "0");
        const prTotal = par + pw + t1 + t2; 
        const thTotal = parseFloat(m.written || "0"); 
        const prMax = isComputer ? 25 : 50;
        const thMax = isComputer ? 25 : 50;
        const prPercent = (prMax > 0) ? (prTotal / prMax) * 100 : 0;
        const thPercent = (thMax > 0) ? (thTotal / thMax) * 100 : 0;
        const prGradeGP = getGradeAndGP(prPercent);
        const thGradeGP = getGradeAndGP(thPercent);
        
        subjTotalGP = isComputer ? (thGradeGP.gp + prGradeGP.gp) / 2 : ((thGradeGP.gp * (creditHour / 2)) + (prGradeGP.gp * (creditHour / 2))) / (creditHour || 1);
        const subjTotalMarks = prTotal + thTotal;
        subjFinalGrade = getGradeAndGP((subjTotalMarks / (isComputer ? 50 : 100)) * 100).grade;

        if (t1 < 2 || t2 < 2 || thGradeGP.grade === "NG" || prGradeGP.grade === "NG") {
          subjTotalGP = 0;
          subjFinalGrade = "NG";
        }
      } else {
        const par = (parseFloat(m.attendance || "0") + parseFloat(m.activity || "0"));
        const pw = (parseFloat(m.project16 || "0") + parseFloat(m.project20 || "0"));
        const term = parseFloat(m.termExam || "0");
        const total = par + pw + term;
        
        const percent = (total / 50) * 100;
        const { grade, gp } = getGradeAndGP(percent);
        subjTotalGP = gp;
        subjFinalGrade = grade;

        if (gp === 0 || grade === "NG") {
          subjTotalGP = 0;
          subjFinalGrade = "NG";
        }
      }
    } else {
      const cu = parseFloat(m.cu || "0"); 
      const om = parseFloat(m.total || "0"); 
      const percent = cu > 0 ? (om / cu) * 100 : 0; 
      const { grade, gp } = getGradeAndGP(percent);
      subjTotalGP = gp;
      subjFinalGrade = grade;
    }

    if (subjTotalGP === 0 || subjFinalGrade === "NG") {
      hasNG = true;
    }

    if (!isComputer) {
      totalWGP += subjTotalGP * creditHour; 
      totalCreditHours += creditHour;
    }

    return { 
      subjectId: sub.id,
      subjectName: sub.subject_name, 
      creditHour: creditHour, 
      gp: subjTotalGP, 
      grade: subjFinalGrade,
      remarks: getRemarks(subjFinalGrade),
      isComputer
    };
  });

  let finalGPA = totalCreditHours > 0 ? totalWGP / totalCreditHours : 0;
  if (hasNG) finalGPA = 0;

  let finalGrade = "NG";
  if (finalGPA >= 3.6) finalGrade = "A+";
  else if (finalGPA >= 3.2) finalGrade = "A";
  else if (finalGPA >= 2.8) finalGrade = "B+";
  else if (finalGPA >= 2.4) finalGrade = "B";
  else if (finalGPA >= 2.0) finalGrade = "C+";
  else if (finalGPA >= 1.6) finalGrade = "C";
  else if (finalGPA > 0) finalGrade = "D";
  
  if (hasNG || finalGPA === 0) {
    finalGrade = "NG";
  }
  const finalRemarks = getRemarks(finalGrade);

  return { 
    subjectResults, 
    finalGPA, 
    finalGrade,
    hasNG, 
    finalRemarks 
  };
};
