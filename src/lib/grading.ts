export function getGradeAndGP(percentage: number): { grade: string; gp: number } {
  if (percentage >= 90) return { grade: "A+", gp: 4.0 };
  if (percentage >= 80) return { grade: "A", gp: 3.6 };
  if (percentage >= 70) return { grade: "B+", gp: 3.2 };
  if (percentage >= 60) return { grade: "B", gp: 2.8 };
  if (percentage >= 50) return { grade: "C+", gp: 2.4 };
  if (percentage >= 40) return { grade: "C", gp: 2.0 };
  if (percentage >= 35) return { grade: "D", gp: 1.6 };
  return { grade: "NG", gp: 0.0 };
}

export function calculateGPA(totalPercentage: number): number {
  return getGradeAndGP(totalPercentage).gp;
}

export function getRemarks(grade: string): string {
  switch (grade) {
    case "A+": return "OUTSTANDING";
    case "A": return "EXCELLENT";
    case "B+": return "VERY GOOD";
    case "B": return "GOOD";
    case "C+": return "SATISFACTORY";
    case "C": return "ACCEPTABLE";
    case "D": return "PARTIALLY ACCEPTABLE";
    default: return "NOT GRADED";
  }
}
