import { Student, EmulationLog, AttendanceRecord, AttendanceStatus, Commendation, ParentLog, TeacherLog, ClassTask, ClassConfig, PeriodConfig, PeriodConfigHistory, TeacherProfile, SeatingChart, SchoolRankingEntry, ClassRulesConfig } from '../types';
import { INITIAL_STUDENTS, INITIAL_EMULATION_LOGS, INITIAL_COMMENDATIONS, INITIAL_TASKS, INITIAL_CLASS_CONFIG } from '../data/mockData';

const STORAGE_KEYS = {
  STUDENTS: 'so_chu_nhiem_students',
  EMULATION_LOGS: 'so_chu_nhiem_emulation_logs',
  COMMENDATIONS: 'so_chu_nhiem_commendations',
  TASKS: 'so_chu_nhiem_tasks',
  PARENT_LOGS: 'so_chu_nhiem_parent_logs',
  TEACHER_LOGS: 'so_chu_nhiem_teacher_logs',
  ATTENDANCE: 'so_chu_nhiem_attendance',
  CLASS_CONFIG: 'so_chu_nhiem_class_config',
  PERIOD_CONFIG: 'so_chu_nhiem_period_config',
  PERIOD_CONFIG_HISTORY: 'so_chu_nhiem_period_config_history',
  OPERATING_DATE: 'so_chu_nhiem_operating_date',
  TEACHER_PROFILES: 'so_chu_nhiem_teacher_profiles',
  AUTH_SESSION: 'so_chu_nhiem_auth_session',
  CURRENT_USER: 'so_chu_nhiem_user',
  SCHOOL_YEARS: 'so_chu_nhiem_school_years',
  SEATING_CHARTS: 'so_chu_nhiem_seating_charts'
};

export const generateDefault35Weeks = (): Record<number, { startDate: string; endDate: string }> => {
  const result: Record<number, { startDate: string; endDate: string }> = {};
  let start = new Date(2026, 7, 17); // Aug 17, 2026 (Monday)
  for (let w = 1; w <= 35; w++) {
    const startStr = start.toISOString().slice(0, 10);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const endStr = end.toISOString().slice(0, 10);
    result[w] = { startDate: startStr, endDate: endStr };
    start.setDate(start.getDate() + 7);
  }
  return result;
};

export const DEFAULT_PERIOD_CONFIG: PeriodConfig = {
  weeks: generateDefault35Weeks(),
  months: {
    8: { startDate: '2026-08-01', endDate: '2026-08-31' },
    9: { startDate: '2026-09-01', endDate: '2026-09-30' },
    10: { startDate: '2026-10-01', endDate: '2026-10-31' },
    11: { startDate: '2026-11-01', endDate: '2026-11-30' },
    12: { startDate: '2026-12-01', endDate: '2026-12-31' },
    1: { startDate: '2027-01-01', endDate: '2027-01-31' },
    2: { startDate: '2027-02-01', endDate: '2027-02-28' },
    3: { startDate: '2027-03-01', endDate: '2027-03-31' },
    4: { startDate: '2027-04-01', endDate: '2027-04-30' },
    5: { startDate: '2027-05-01', endDate: '2027-05-31' },
  },
  semester1: { startDate: '2026-08-17', endDate: '2026-12-20' },
  semester2: { startDate: '2026-12-21', endDate: '2027-04-18' },
};

export function loadPeriodConfig(schoolYear: string): PeriodConfig {
  try {
    const key = `${STORAGE_KEYS.PERIOD_CONFIG}_${schoolYear}`;
    const data = localStorage.getItem(key);
    if (!data) return DEFAULT_PERIOD_CONFIG;
    const parsed: PeriodConfig = JSON.parse(data);

    // Merge default 35 weeks with any existing customized weeks
    const default35 = generateDefault35Weeks();
    const mergedWeeks = { ...default35, ...parsed.weeks };

    return {
      ...DEFAULT_PERIOD_CONFIG,
      ...parsed,
      weeks: mergedWeeks,
    };
  } catch (e) {
    return DEFAULT_PERIOD_CONFIG;
  }
}

export function savePeriodConfig(schoolYear: string, config: PeriodConfig) {
  try {
    const key = `${STORAGE_KEYS.PERIOD_CONFIG}_${schoolYear}`;
    localStorage.setItem(key, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving period config:', e);
  }
}

export function loadPeriodConfigHistory(schoolYear: string): PeriodConfigHistory[] {
  try {
    const key = `${STORAGE_KEYS.PERIOD_CONFIG_HISTORY}_${schoolYear}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function savePeriodConfigHistory(schoolYear: string, history: PeriodConfigHistory[]) {
  try {
    const key = `${STORAGE_KEYS.PERIOD_CONFIG_HISTORY}_${schoolYear}`;
    localStorage.setItem(key, JSON.stringify(history));
  } catch (e) {
    console.error('Error saving period config history:', e);
  }
}

export function loadOperatingDate(): string {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.OPERATING_DATE);
    if (data) return data;
  } catch (e) {}
  // Default to today in YYYY-MM-DD
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function saveOperatingDate(dateStr: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.OPERATING_DATE, dateStr);
  } catch (e) {
    console.error('Error saving operating date:', e);
  }
}

// Teacher Profiles and Authorization Whitelist
export const DEFAULT_AUTHORIZED_TEACHERS: TeacherProfile[] = [
  {
    uid: 'google_uid_001',
    email: 'quynhan9942@gmail.com',
    displayName: 'Cô Lê Thị Quỳnh An',
    role: 'ADMIN',
    schoolId: 'THCS_NVC',
    assignedClasses: ['6a3', '6a4'],
    createdAt: '2026-08-15',
    lastLoginAt: new Date().toISOString(),
    isAuthorized: true,
  },
  {
    uid: 'google_uid_002',
    email: 'teacher@nguyenvancu.edu.vn',
    displayName: 'Cô Lê Thị Quỳnh An',
    role: 'GIÁO VIÊN',
    schoolId: 'THCS_NVC',
    assignedClasses: ['6a3'],
    createdAt: '2026-08-15',
    lastLoginAt: new Date().toISOString(),
    isAuthorized: true,
  }
];

export function loadAuthorizedTeachers(): TeacherProfile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TEACHER_PROFILES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.TEACHER_PROFILES, JSON.stringify(DEFAULT_AUTHORIZED_TEACHERS));
      return DEFAULT_AUTHORIZED_TEACHERS;
    }
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_AUTHORIZED_TEACHERS;
  }
}

export function saveAuthorizedTeachers(teachers: TeacherProfile[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TEACHER_PROFILES, JSON.stringify(teachers));
  } catch (e) {
    console.error('Error saving teacher profiles:', e);
  }
}


export function enrichStudentData(st: Student, index?: number): Student {
  const stt = st.stt || (index !== undefined ? index + 1 : 1);
  const codeNum = stt < 10 ? `0${stt}` : `${stt}`;
  const init = INITIAL_STUDENTS.find(i => i.id === st.id || i.studentCode === st.studentCode || i.fullName === st.fullName);

  const fatherName = st.fatherName || init?.fatherName || (st.parentName ? st.parentName.replace(/\s*\((Bố|Mẹ)\)/i, '') : `Bố học sinh ${st.fullName}`);
  const fatherPhone = st.fatherPhone || init?.fatherPhone || st.parentPhone || '0903123456';
  const motherName = st.motherName || init?.motherName || `Mẹ học sinh ${st.fullName}`;
  const motherPhone = st.motherPhone || init?.motherPhone || (fatherPhone ? fatherPhone.slice(0, 8) + '88' : '0918234888');

  return {
    ...st,
    stt,
    studentCode: st.studentCode || `HS06A1${codeNum}`,
    accessCode: st.accessCode || `${100 + stt}`,
    ethnicity: st.ethnicity || init?.ethnicity || 'Kinh',
    familyBackground: st.familyBackground || init?.familyBackground || 'Bình thường',
    hometown: st.hometown || init?.hometown || 'Phường Nguyễn Văn Cừ, Quy Nhơn, Bình Định',
    fatherName,
    fatherPhone,
    motherName,
    motherPhone,
    parentName: st.parentName || `${fatherName} (Bố)`,
    parentPhone: st.parentPhone || fatherPhone,
  };
}

export function getScopedKey(baseKey: string, schoolYear: string, className: string): string {
  return `${baseKey}_${schoolYear}_${className}`;
}

export function loadStudents(schoolYear: string, className: string): Student[] {
  try {
    const key = getScopedKey(STORAGE_KEYS.STUDENTS, schoolYear, className);
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length >= 2) {
      return parsed.map((st: Student, idx: number) => enrichStudentData(st, idx));
    }
    localStorage.setItem(key, JSON.stringify(INITIAL_STUDENTS));
    return INITIAL_STUDENTS;
  } catch (e) {
    console.error('Error loading students:', e);
    return INITIAL_STUDENTS;
  }
}

export function saveStudents(schoolYear: string, className: string, students: Student[]) {
  try {
    const key = getScopedKey(STORAGE_KEYS.STUDENTS, schoolYear, className);
    localStorage.setItem(key, JSON.stringify(students));
  } catch (e) {
    console.error('Error saving students:', e);
  }
}

export function loadEmulationLogs(schoolYear: string, className: string): EmulationLog[] {
  try {
    const key = getScopedKey(STORAGE_KEYS.EMULATION_LOGS, schoolYear, className);
    const data = localStorage.getItem(key);
    if (!data) {
      if (schoolYear === INITIAL_CLASS_CONFIG.schoolYear && className === INITIAL_CLASS_CONFIG.className) {
        localStorage.setItem(key, JSON.stringify(INITIAL_EMULATION_LOGS));
        return INITIAL_EMULATION_LOGS;
      }
      return [];
    }
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_EMULATION_LOGS;
  }
}

export function saveEmulationLogs(schoolYear: string, className: string, logs: EmulationLog[]) {
  try {
    const key = getScopedKey(STORAGE_KEYS.EMULATION_LOGS, schoolYear, className);
    localStorage.setItem(key, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving emulation logs:', e);
  }
}

export function loadCommendations(schoolYear: string, className: string): Commendation[] {
  try {
    const key = getScopedKey(STORAGE_KEYS.COMMENDATIONS, schoolYear, className);
    const data = localStorage.getItem(key);
    if (!data) {
      if (schoolYear === INITIAL_CLASS_CONFIG.schoolYear && className === INITIAL_CLASS_CONFIG.className) {
        localStorage.setItem(key, JSON.stringify(INITIAL_COMMENDATIONS));
        return INITIAL_COMMENDATIONS;
      }
      return [];
    }
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_COMMENDATIONS;
  }
}

export function saveCommendations(schoolYear: string, className: string, list: Commendation[]) {
  try {
    const key = getScopedKey(STORAGE_KEYS.COMMENDATIONS, schoolYear, className);
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving commendations:', e);
  }
}

export function loadTasks(schoolYear: string, className: string): ClassTask[] {
  try {
    const key = getScopedKey(STORAGE_KEYS.TASKS, schoolYear, className);
    const data = localStorage.getItem(key);
    if (!data) {
      if (schoolYear === INITIAL_CLASS_CONFIG.schoolYear && className === INITIAL_CLASS_CONFIG.className) {
        localStorage.setItem(key, JSON.stringify(INITIAL_TASKS));
        return INITIAL_TASKS;
      }
      return [];
    }
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_TASKS;
  }
}

export function saveTasks(schoolYear: string, className: string, tasks: ClassTask[]) {
  try {
    const key = getScopedKey(STORAGE_KEYS.TASKS, schoolYear, className);
    localStorage.setItem(key, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving tasks:', e);
  }
}

export function loadParentLogs(schoolYear: string, className: string): ParentLog[] {
  try {
    const key = getScopedKey(STORAGE_KEYS.PARENT_LOGS, schoolYear, className);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveParentLogs(schoolYear: string, className: string, logs: ParentLog[]) {
  try {
    const key = getScopedKey(STORAGE_KEYS.PARENT_LOGS, schoolYear, className);
    localStorage.setItem(key, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving parent logs:', e);
  }
}

export function loadTeacherLogs(schoolYear: string, className: string): TeacherLog[] {
  try {
    const key = getScopedKey(STORAGE_KEYS.TEACHER_LOGS, schoolYear, className);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveTeacherLogs(schoolYear: string, className: string, logs: TeacherLog[]) {
  try {
    const key = getScopedKey(STORAGE_KEYS.TEACHER_LOGS, schoolYear, className);
    localStorage.setItem(key, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving teacher logs:', e);
  }
}

export type AttendanceDayMap = Record<string, Record<string, { status: AttendanceStatus; note?: string }>>;

export function loadAttendanceMap(schoolYear: string, className: string): AttendanceDayMap {
  try {
    const key = getScopedKey(STORAGE_KEYS.ATTENDANCE, schoolYear, className);
    const data = localStorage.getItem(key);
    if (!data) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const initialMap: AttendanceDayMap = {};
      initialMap[todayStr] = {};
      INITIAL_STUDENTS.forEach(s => {
        initialMap[todayStr][s.id] = { status: s.attendanceToday || 'present' };
      });
      localStorage.setItem(key, JSON.stringify(initialMap));
      return initialMap;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading attendance map:', e);
    return {};
  }
}

export function saveAttendanceMap(schoolYear: string, className: string, map: AttendanceDayMap) {
  try {
    const key = getScopedKey(STORAGE_KEYS.ATTENDANCE, schoolYear, className);
    localStorage.setItem(key, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving attendance map:', e);
  }
}

export function loadConfig(): ClassConfig {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CLASS_CONFIG);
    if (!data) return INITIAL_CLASS_CONFIG;
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_CLASS_CONFIG;
  }
}

export function saveConfig(config: ClassConfig) {
  try {
    localStorage.setItem(STORAGE_KEYS.CLASS_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving config:', e);
  }
}

// CSV Export Helper
export function exportStudentsToCSV(students: Student[], className: string) {
  const headers = ['STT', 'Mã HS', 'Họ và tên', 'Giới tính', 'Ngày sinh', 'Tổ', 'Điểm thi đua', 'Trạng thái', 'Địa chỉ', 'Phụ huynh', 'SĐT Phụ huynh'];
  const rows = students.map(s => [
    s.stt,
    s.studentCode,
    `"${s.fullName}"`,
    s.gender,
    s.dob,
    s.team,
    s.emulationScore,
    s.statusTag,
    `"${s.address}"`,
    `"${s.parentName}"`,
    `"${s.parentPhone}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Danh_sach_hoc_sinh_${className}_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function loadSeatingCharts(schoolYear: string, className: string): SeatingChart[] {
  try {
    const key = getScopedKey(STORAGE_KEYS.SEATING_CHARTS, schoolYear, className);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveSeatingCharts(schoolYear: string, className: string, charts: SeatingChart[]) {
  try {
    const key = getScopedKey(STORAGE_KEYS.SEATING_CHARTS, schoolYear, className);
    localStorage.setItem(key, JSON.stringify(charts));
  } catch (e) {
    console.error('Error saving seating charts:', e);
  }
}

export function loadSchoolRankings(schoolYear: string, periodKey: string): SchoolRankingEntry[] {
  try {
    const key = `so_chu_nhiem_school_rankings_${schoolYear}_${periodKey}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveSchoolRankings(schoolYear: string, periodKey: string, rankings: SchoolRankingEntry[]) {
  try {
    const key = `so_chu_nhiem_school_rankings_${schoolYear}_${periodKey}`;
    localStorage.setItem(key, JSON.stringify(rankings));
  } catch (e) {
    console.error('Error saving school rankings:', e);
  }
}

export interface CustomClassRank {
  rank: number;
  totalClasses: number;
}

export function loadCustomClassRank(schoolYear: string, className: string): CustomClassRank | null {
  try {
    const key = `so_chu_nhiem_custom_class_rank_${schoolYear}_${className}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

export function saveCustomClassRank(schoolYear: string, className: string, customRank: CustomClassRank) {
  try {
    const key = `so_chu_nhiem_custom_class_rank_${schoolYear}_${className}`;
    localStorage.setItem(key, JSON.stringify(customRank));
  } catch (e) {
    console.error('Error saving custom class rank:', e);
  }
}

export interface WeeklyClassRanking {
  id: string;
  weekNumber: number; // 1..35
  rank: number;
  totalClasses: number;
  points: number;
  notes: string;
}

export function loadWeeklyClassRankings(schoolYear: string, className: string): WeeklyClassRanking[] {
  try {
    const key = `so_chu_nhiem_weekly_rankings_${schoolYear}_${className}`;
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading weekly class rankings:', e);
  }

  // Seed default rankings for 35 weeks
  const defaultList: WeeklyClassRanking[] = Array.from({ length: 35 }, (_, index) => {
    const w = index + 1;
    let r = (w % 5) + 1;
    if (w === 1) r = 3;
    if (w === 2) r = 2;
    if (w === 3) r = 1;
    if (w === 4) r = 4;
    if (w === 5) r = 2;
    if (w === 6) r = 3;
    if (w === 7) r = 1;
    if (w === 8) r = 2;

    let pts = 95 + (6 - r) * 4 + (w % 3);
    if (r === 1) pts = 118;

    let note = "Duy trì phong trào thi đua tốt";
    if (r === 1) note = "Xuất sắc dẫn đầu toàn trường, đạt Cờ thi đua!";
    else if (r === 2) note = "Tuyên dương nếp sống văn minh & vệ sinh lớp sạch đẹp";
    else if (r === 3) note = "Nề nếp tốt, cần chú ý tác phong kỷ luật";
    else if (r >= 4) note = "Cần cố gắng hơn trong các hoạt động phong trào";

    return {
      id: `week-${w}`,
      weekNumber: w,
      rank: r,
      totalClasses: 24,
      points: pts,
      notes: note,
    };
  });

  return defaultList;
}

export function saveWeeklyClassRankings(schoolYear: string, className: string, rankings: WeeklyClassRanking[]) {
  try {
    const key = `so_chu_nhiem_weekly_rankings_${schoolYear}_${className}`;
    localStorage.setItem(key, JSON.stringify(rankings));
  } catch (e) {
    console.error('Error saving weekly class rankings:', e);
  }
}

export const DEFAULT_CLASS_RULES_CONFIG: ClassRulesConfig = {
  baseScore: 100,
  specialNote: "Học sinh vô lễ, mang điện thoại khi chưa cho phép, không tham gia phong trào hoặc làm mất sổ đầu bài sẽ bị hạ 1 bậc thi đua.",
  rules: [
    // Bonus Rules (+)
    { id: 'rule_b1', type: 'BONUS', category: 'Khen thưởng cá nhân', title: 'Phát biểu đúng trong giờ học', points: 2 },
    { id: 'rule_b2', type: 'BONUS', category: 'Khen thưởng cá nhân', title: 'Phát biểu xây dựng bài (chưa đúng)', points: 1 },
    { id: 'rule_b3', type: 'BONUS', category: 'Khen thưởng cá nhân', title: 'Kiểm tra miệng đạt 8 - 9 điểm', points: 3 },
    { id: 'rule_b4', type: 'BONUS', category: 'Khen thưởng cá nhân', title: 'Kiểm tra miệng đạt 10 điểm', points: 5 },
    { id: 'rule_b5', type: 'BONUS', category: 'Khen thưởng cá nhân', title: 'Nhặt được của rơi trả người bị mất', points: 5 },
    { id: 'rule_b6', type: 'BONUS', category: 'Thưởng Tập Thể Tổ', title: 'Tổ không vi phạm đồng phục trong tuần', points: 50, isTeamRule: true },
    { id: 'rule_b7', type: 'BONUS', category: 'Thưởng Tập Thể Tổ', title: 'Tổ không vi phạm tác phong, ngôn phong trong tuần', points: 50, isTeamRule: true },
    { id: 'rule_b8', type: 'BONUS', category: 'Thưởng Tập Thể Tổ', title: 'Tổ ổn định tốt 15 phút ôn bài đầu giờ', points: 50, isTeamRule: true },
    { id: 'rule_b9', type: 'BONUS', category: 'Thưởng Tập Thể Tổ', title: 'Tổ xuất sắc hoàn thành trực nhật, vệ sinh', points: 50, isTeamRule: true },
    { id: 'rule_b10', type: 'BONUS', category: 'Thưởng Tập Thể Tổ', title: 'Tổ đạt thành tích phong trào thi đua tuần', points: 30, isTeamRule: true },

    // Penalty Rules (-)
    { id: 'rule_p1', type: 'PENALTY', category: 'a) Chuyên cần', title: 'Đi học trễ, vào lớp sau GV', points: 5 },
    { id: 'rule_p2', type: 'PENALTY', category: 'a) Chuyên cần', title: 'Vắng học không phép', points: 5 },
    { id: 'rule_p3', type: 'PENALTY', category: 'a) Chuyên cần', title: 'Trốn học, cúp tiết', points: 20 },
    { id: 'rule_p4', type: 'PENALTY', category: 'b) Học tập', title: 'Kiểm tra miệng kém (0,1,2đ)', points: 10 },
    { id: 'rule_p5', type: 'PENALTY', category: 'b) Học tập', title: 'Kiểm tra miệng yếu (3,4đ)', points: 5 },
    { id: 'rule_p6', type: 'PENALTY', category: 'b) Học tập', title: 'Quay cóp trong giờ kiểm tra', points: 10 },
    { id: 'rule_p7', type: 'PENALTY', category: 'b) Học tập', title: 'Không chép bài / BTVN', points: 5 },
    { id: 'rule_p8', type: 'PENALTY', category: 'b) Học tập', title: 'Không chuẩn bị bài trước', points: 5 },
    { id: 'rule_p9', type: 'PENALTY', category: 'c) Đạo đức & Tác phong', title: 'Làm lớp bị giờ B / giờ C', points: 5 },
    { id: 'rule_p10', type: 'PENALTY', category: 'c) Đạo đức & Tác phong', title: 'Không mặc áo đồng phục', points: 10 },
    { id: 'rule_p11', type: 'PENALTY', category: 'c) Đạo đức & Tác phong', title: 'Mất trật tự giờ học/Chào cờ', points: 5 },
    { id: 'rule_p12', type: 'PENALTY', category: 'c) Đạo đức & Tác phong', title: 'Bị ghi tên Sổ đầu bài', points: 10 },
    { id: 'rule_p13', type: 'PENALTY', category: 'c) Đạo đức & Tác phong', title: 'Không tham gia lao động/trực nhật', points: 20 },
    { id: 'rule_p14', type: 'PENALTY', category: 'c) Đạo đức & Tác phong', title: 'Vi phạm an toàn giao thông', points: 10 },
    { id: 'rule_p15', type: 'PENALTY', category: 'c) Đạo đức & Tác phong', title: 'Xả rác / Mang đồ ăn vào lớp', points: 5 },
    { id: 'rule_p16', type: 'PENALTY', category: 'c) Đạo đức & Tác phong', title: 'Viết vẽ bậy lên tường, bàn ghế', points: 5 },
    { id: 'rule_p17', type: 'PENALTY', category: 'c) Đạo đức & Tác phong', title: 'Ngồi lên bàn / Xô đổ bàn ghế', points: 5 },
    { id: 'rule_p18', type: 'PENALTY', category: 'c) Đạo đức & Tác phong', title: 'Nói tục, chửi thề', points: 10 },
    { id: 'rule_p19', type: 'PENALTY', category: 'Trừ Tập Thể Tổ', title: 'Tổ nhiều thành viên vi phạm tác phong', points: 20, isTeamRule: true },
    { id: 'rule_p20', type: 'PENALTY', category: 'Trừ Tập Thể Tổ', title: 'Tổ 15 phút đầu giờ mất trật tự', points: 30, isTeamRule: true },
    { id: 'rule_p21', type: 'PENALTY', category: 'Trừ Tập Thể Tổ', title: 'Tổ không hoàn thành trực nhật lớp', points: 30, isTeamRule: true },
    { id: 'rule_p22', type: 'PENALTY', category: 'Trừ Tập Thể Tổ', title: 'Tổ vi phạm nghiêm trọng nội quy tuần', points: 50, isTeamRule: true },
  ]
};

export function loadClassRulesConfig(schoolYear: string, className: string): ClassRulesConfig {
  try {
    const key = `so_chu_nhiem_class_rules_${schoolYear}_${className}`;
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.rules)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading class rules config:', e);
  }
  return DEFAULT_CLASS_RULES_CONFIG;
}

export function saveClassRulesConfig(schoolYear: string, className: string, config: ClassRulesConfig) {
  try {
    const key = `so_chu_nhiem_class_rules_${schoolYear}_${className}`;
    localStorage.setItem(key, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving class rules config:', e);
  }
}

