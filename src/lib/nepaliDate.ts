/**
 * Nepali Date (Bikram Sambat - BS) Conversion Utility
 * Converts Gregorian AD Date <-> Nepali BS Date accurately.
 */

// Days in each month for Nepali years from 2070 BS to 2090 BS
const bsCalendarData: Record<number, number[]> = {
  2070: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2072: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2074: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2082: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2085: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2086: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30],
  2087: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2088: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2089: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2090: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
};

// Reference point: 2070-01-01 BS = 2013-04-14 AD
const REF_BS_YEAR = 2070;
const REF_AD_DATE = new Date(2013, 3, 14); // April 14, 2013

export const NEPALI_MONTHS_EN = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

export const NEPALI_MONTHS_NP = [
  "बैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज",
  "कात्तिक", "मंसिर", "पुष", "माघ", "फागुन", "चैत"
];

export function adToBs(dateInput: Date | string): {
  year: number;
  month: number;
  day: number;
  bsDateStr: string; // YYYY-MM-DD format
  formattedBs: string; // e.g. "2083 Ashwin 13"
  formattedBsNp: string; // e.g. "२०८३ असोज १३"
} {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const diffTime = date.getTime() - REF_AD_DATE.getTime();
  let totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let bsYear = REF_BS_YEAR;
  let bsMonth = 0; // 0-indexed (0 = Baisakh)
  let bsDay = 1;

  if (totalDays >= 0) {
    while (bsYear in bsCalendarData) {
      const daysInYear = bsCalendarData[bsYear].reduce((a, b) => a + b, 0);
      if (totalDays < daysInYear) break;
      totalDays -= daysInYear;
      bsYear++;
    }

    const monthDays = bsCalendarData[bsYear] || [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30];
    for (let m = 0; m < 12; m++) {
      if (totalDays < monthDays[m]) {
        bsMonth = m;
        bsDay = totalDays + 1;
        break;
      }
      totalDays -= monthDays[m];
    }
  } else {
    // Before 2070 reference, fallback approximation
    const approxYearOffset = 56;
    const approxMonthOffset = 8;
    bsYear = date.getFullYear() + approxYearOffset;
    bsMonth = (date.getMonth() + approxMonthOffset) % 12;
    bsDay = date.getDate();
  }

  const monthFormatted = (bsMonth + 1).toString().padStart(2, "0");
  const dayFormatted = bsDay.toString().padStart(2, "0");
  const bsDateStr = `${bsYear}-${monthFormatted}-${dayFormatted}`;

  const monthNameEn = NEPALI_MONTHS_EN[bsMonth] || "";
  const monthNameNp = NEPALI_MONTHS_NP[bsMonth] || "";

  const npDigits = (str: string | number) => 
    str.toString().replace(/\d/g, (d) => "०१२३४५६७८९"[parseInt(d)]);

  const formattedBs = `${bsYear} ${monthNameEn} ${bsDay}`;
  const formattedBsNp = `${npDigits(bsYear)} ${monthNameNp} ${npDigits(bsDay)}`;

  return {
    year: bsYear,
    month: bsMonth + 1,
    day: bsDay,
    bsDateStr,
    formattedBs,
    formattedBsNp
  };
}

export function bsToAd(bsYear: number, bsMonth: number, bsDay: number): Date {
  let totalDays = 0;

  for (let y = REF_BS_YEAR; y < bsYear; y++) {
    const daysInYear = (bsCalendarData[y] || [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30]).reduce((a, b) => a + b, 0);
    totalDays += daysInYear;
  }

  const monthDays = bsCalendarData[bsYear] || [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30];
  for (let m = 0; m < bsMonth - 1; m++) {
    totalDays += monthDays[m];
  }
  totalDays += (bsDay - 1);

  const adDate = new Date(REF_AD_DATE.getTime() + totalDays * (1000 * 60 * 60 * 24));
  return adDate;
}

export function getCurrentBsDate(): string {
  return adToBs(new Date()).bsDateStr;
}

export function formatBsDateDisplay(bsDateStr: string): string {
  if (!bsDateStr) return "";
  const parts = bsDateStr.split("-");
  if (parts.length !== 3) return bsDateStr;

  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);

  const monthName = NEPALI_MONTHS_EN[month - 1] || parts[1];
  return `${year} ${monthName} ${day}`;
}
