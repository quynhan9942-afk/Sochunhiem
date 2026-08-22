import { Student, EmulationLog, TeamNumber, PeriodConfig } from '../types';
import { DEFAULT_PERIOD_CONFIG } from './storage';

export interface StudentEmulationStats {
  student: Student;
  startingScore: number;
  addedPoints: number;
  deductedPoints: number;
  netPoints: number;
  endingScore: number;
  positiveCount: number;
  negativeCount: number;
  rank: number;
}

export interface TeamEmulationStats {
  team: TeamNumber;
  memberCount: number;
  addedPoints: number;
  deductedPoints: number;
  netPoints: number;
  averageScore: number;
  rank: number;
}

export interface LockedWeek {
  weekNumber: number;
  schoolYear: string;
  className: string;
  lockedAt: string; // YYYY-MM-DD HH:mm
  lockedBy: string;
}

// Base school year start date for 2026-2027: August 17, 2026 (Monday)
export const SCHOOL_YEAR_START_DATE = new Date('2026-08-17T00:00:00');

/**
 * Checks if a Date falls strictly within a configured YYYY-MM-DD start and end date range
 */
export function isDateInPeriodRange(date: Date, startDateStr: string, endDateStr: string): boolean {
  if (!startDateStr || !endDateStr || isNaN(date.getTime())) return false;
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T23:59:59.999');
  return date >= start && date <= end;
}

/**
 * Calculates start and end Date for a given week number (1-16+) using PeriodConfig
 */
export function getWeekDateRange(
  weekNum: number, 
  periodConfig?: PeriodConfig
): { startDate: Date; endDate: Date; label: string; dateRangeStr: string; startDateStr: string; endDateStr: string } {
  const cfg = periodConfig || DEFAULT_PERIOD_CONFIG;
  const weekRange = cfg.weeks[weekNum];

  let start: Date;
  let end: Date;
  let startDateStr = '';
  let endDateStr = '';

  if (weekRange && weekRange.startDate && weekRange.endDate) {
    startDateStr = weekRange.startDate;
    endDateStr = weekRange.endDate;
    start = new Date(weekRange.startDate + 'T00:00:00');
    end = new Date(weekRange.endDate + 'T23:59:59.999');
  } else {
    // Fallback formula
    start = new Date(SCHOOL_YEAR_START_DATE);
    start.setDate(start.getDate() + (weekNum - 1) * 7);
    end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    const formatYMD = (d: Date) => d.toISOString().split('T')[0];
    startDateStr = formatYMD(start);
    endDateStr = formatYMD(end);
  }

  const formatDateDisplay = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const dateRangeStr = `${formatDateDisplay(start)} – ${formatDateDisplay(end)}`;
  const label = `Tuần ${weekNum}: ${dateRangeStr}`;

  return { startDate: start, endDate: end, label, dateRangeStr, startDateStr, endDateStr };
}

/**
 * Derives week number from a date string or timestamp using periodConfig
 */
export function getWeekNumberFromDate(dateInput: string | Date, periodConfig?: PeriodConfig): number {
  const d = parseLogDate(typeof dateInput === 'string' ? dateInput : dateInput.toISOString());
  const cfg = periodConfig || DEFAULT_PERIOD_CONFIG;

  // Check if date falls in any defined week in periodConfig
  for (const [wNumStr, range] of Object.entries(cfg.weeks)) {
    if (isDateInPeriodRange(d, range.startDate, range.endDate)) {
      return parseInt(wNumStr, 10);
    }
  }

  // Fallback math
  const diffMs = d.getTime() - SCHOOL_YEAR_START_DATE.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 1;
  
  const weekNum = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(weekNum, 1), 35);
}

/**
 * Normalizes log date to JS Date object
 */
export function parseLogDate(timestampStr: string): Date {
  if (!timestampStr) return new Date();
  
  // Format: "22/08/2026 08:15" or "2026-08-22" or ISO
  if (timestampStr.includes('/')) {
    const spaceSplit = timestampStr.split(' ');
    const dateParts = spaceSplit[0].split('/');
    const timeParts = spaceSplit[1] ? spaceSplit[1].split(':') : ['00', '00'];
    
    if (dateParts.length === 3) {
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const year = parseInt(dateParts[2], 10);
      const hour = parseInt(timeParts[0], 10) || 0;
      const min = parseInt(timeParts[1], 10) || 0;
      return new Date(year, month, day, hour, min);
    }
  }

  const parsed = new Date(timestampStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Calculates student total score strictly from emulation logs
 */
export function calculateStudentTotalScore(studentId: string, logs: EmulationLog[], baseScore: number = 0): number {
  const studentLogs = logs.filter(l => l.studentId === studentId);
  const netFromLogs = studentLogs.reduce((sum, log) => sum + (log.scoreDiff || 0), 0);
  return baseScore + netFromLogs;
}

/**
 * Filter generator for Week using PeriodConfig date ranges
 */
export function getWeekFilterFn(weekNum: number, periodConfig?: PeriodConfig): (logDate: Date) => boolean {
  const { startDateStr, endDateStr } = getWeekDateRange(weekNum, periodConfig);
  return (logDate: Date) => isDateInPeriodRange(logDate, startDateStr, endDateStr);
}

/**
 * Filter generator for Month using PeriodConfig date ranges
 */
export function getMonthFilterFn(monthNum: number, periodConfig?: PeriodConfig): (logDate: Date) => boolean {
  const cfg = periodConfig || DEFAULT_PERIOD_CONFIG;
  const monthRange = cfg.months[monthNum];
  if (monthRange) {
    return (logDate: Date) => isDateInPeriodRange(logDate, monthRange.startDate, monthRange.endDate);
  }
  return (logDate: Date) => (logDate.getMonth() + 1) === monthNum;
}

/**
 * Filter generator for Semester using PeriodConfig date ranges
 */
export function getSemesterFilterFn(semesterKey: 'hk1' | 'hk2' | 'all', periodConfig?: PeriodConfig): (logDate: Date) => boolean {
  const cfg = periodConfig || DEFAULT_PERIOD_CONFIG;
  if (semesterKey === 'hk1') {
    return (logDate: Date) => isDateInPeriodRange(logDate, cfg.semester1.startDate, cfg.semester1.endDate);
  } else if (semesterKey === 'hk2') {
    return (logDate: Date) => isDateInPeriodRange(logDate, cfg.semester2.startDate, cfg.semester2.endDate);
  }
  return () => true;
}

/**
 * Computes detailed student stats for a period (Day, Week, Month, Semester)
 */
export function computeStudentStatsForPeriod(
  students: Student[],
  logs: EmulationLog[],
  filterFn: (logDate: Date) => boolean
): StudentEmulationStats[] {
  const statsMap: Record<string, { added: number; deducted: number; posCount: number; negCount: number }> = {};

  students.forEach(s => {
    statsMap[s.id] = { added: 0, deducted: 0, posCount: 0, negCount: 0 };
  });

  logs.forEach(log => {
    const logDate = parseLogDate(log.timestamp);
    if (filterFn(logDate)) {
      if (!statsMap[log.studentId]) {
        statsMap[log.studentId] = { added: 0, deducted: 0, posCount: 0, negCount: 0 };
      }
      if (log.scoreDiff > 0) {
        statsMap[log.studentId].added += log.scoreDiff;
        statsMap[log.studentId].posCount += 1;
      } else if (log.scoreDiff < 0) {
        statsMap[log.studentId].deducted += Math.abs(log.scoreDiff);
        statsMap[log.studentId].negCount += 1;
      }
    }
  });

  const result: StudentEmulationStats[] = students.map(student => {
    const st = statsMap[student.id] || { added: 0, deducted: 0, posCount: 0, negCount: 0 };
    const netPoints = st.added - st.deducted;
    const currentScore = calculateStudentTotalScore(student.id, logs, 0);

    return {
      student,
      startingScore: currentScore - netPoints,
      addedPoints: st.added,
      deductedPoints: st.deducted,
      netPoints,
      endingScore: currentScore,
      positiveCount: st.posCount,
      negativeCount: st.negCount,
      rank: 0,
    };
  });

  // Sort descending by netPoints, then endingScore
  result.sort((a, b) => {
    if (b.netPoints !== a.netPoints) return b.netPoints - a.netPoints;
    return b.endingScore - a.endingScore;
  });

  result.forEach((item, index) => {
    item.rank = index + 1;
  });

  return result;
}

/**
 * Computes Team performance stats for a given period
 */
export function computeTeamStatsForPeriod(
  students: Student[],
  logs: EmulationLog[],
  filterFn: (logDate: Date) => boolean
): TeamEmulationStats[] {
  const teams: TeamNumber[] = ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'];
  
  const teamMap: Record<TeamNumber, { members: Student[]; added: number; deducted: number }> = {
    'Tổ 1': { members: [], added: 0, deducted: 0 },
    'Tổ 2': { members: [], added: 0, deducted: 0 },
    'Tổ 3': { members: [], added: 0, deducted: 0 },
    'Tổ 4': { members: [], added: 0, deducted: 0 },
  };

  students.forEach(s => {
    if (teamMap[s.team]) {
      teamMap[s.team].members.push(s);
    }
  });

  // Calculate scores per student in period
  const studentStats = computeStudentStatsForPeriod(students, logs, filterFn);
  studentStats.forEach(st => {
    if (teamMap[st.student.team]) {
      teamMap[st.student.team].added += st.addedPoints;
      teamMap[st.student.team].deducted += st.deductedPoints;
    }
  });

  const result: TeamEmulationStats[] = teams.map(team => {
    const data = teamMap[team];
    const memberCount = data.members.length || 1;
    const netPoints = data.added - data.deducted;
    const averageScore = Math.round((netPoints / memberCount) * 10) / 10;

    return {
      team,
      memberCount,
      addedPoints: data.added,
      deductedPoints: data.deducted,
      netPoints,
      averageScore,
      rank: 0,
    };
  });

  // Rank teams by averageScore descending
  result.sort((a, b) => b.averageScore - a.averageScore);
  result.forEach((t, i) => {
    t.rank = i + 1;
  });

  return result;
}

