export type AttendanceStatus = 'present' | 'excused' | 'unexcused' | 'late';

export type StatusTag = 'Tốt' | 'Khá' | 'Cần cố gắng';

export type TeamNumber = 'Tổ 1' | 'Tổ 2' | 'Tổ 3' | 'Tổ 4';

export type NeedsAttentionCategory = 
  | 'Chuyên cần' 
  | 'Rèn luyện' 
  | 'Hoàn cảnh' 
  | 'Quan hệ bạn bè' 
  | 'Cần hỗ trợ khác';

export type UserRole = 'ADMIN' | 'GIÁO VIÊN';

export type AuthMode = 'TEACHER' | 'GUEST';

export interface TeacherProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  schoolId: string;
  assignedClasses: string[]; // e.g. ['6a3', '6a4']
  createdAt: string;
  lastLoginAt: string;
  isAuthorized: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  assignedClasses: string[]; // e.g. ['6a3', '6a4']
}

export interface Student {
  id: string;
  studentCode: string; // e.g., HS06A301
  stt: number;
  fullName: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  dob: string; // DD/MM/YYYY or YYYY-MM-DD
  avatar: string;
  team: TeamNumber;
  address: string;
  accessCode?: string; // Secret PIN / token for parent access e.g., 8899
  
  // Ethnicity & Family Background
  ethnicity?: string; // e.g., 'Kinh', 'Ê đê', 'Ba Na', etc. (Default: 'Kinh')
  familyBackground?: string; // e.g., 'Bình thường', 'Hộ nghèo', 'Hộ cận nghèo', 'Mồ côi cha/mẹ', 'Khó khăn đột xuất', 'Khuyết tật', 'Con thương binh/liệt sĩ' (Default: 'Bình thường')

  // Hometown & Detailed Parents Info (Requirements 82-83)
  hometown?: string;
  fatherName?: string;
  fatherPhone?: string;
  motherName?: string;
  motherPhone?: string;

  // Parent Info (legacy/fallback)
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  parentJob?: string;

  // Homeroom & Status
  emulationScore: number;
  statusTag: StatusTag;
  statusNote: string;
  attendanceToday: AttendanceStatus;
  
  // Needs Attention
  isNeedsAttention: boolean;
  needsAttentionCategory?: NeedsAttentionCategory;
  needsAttentionNote?: string;
  needsAttentionDate?: string;
}

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface PeriodConfig {
  weeks: Record<number, DateRange>; // week number -> { startDate, endDate }
  months: Record<number, DateRange>; // month (1-12) -> { startDate, endDate }
  semester1: DateRange; // HK 1
  semester2: DateRange; // HK 2
}

export interface PeriodConfigHistory {
  id: string;
  modifiedBy: string;
  modifiedAt: string;
  note?: string;
  oldConfigSummary: string;
  newConfigSummary: string;
}

export interface ClassRuleItem {
  id: string;
  type: 'BONUS' | 'PENALTY';
  category: string;
  title: string;
  points: number;
  isTeamRule?: boolean;
}

export interface ClassRulesConfig {
  baseScore: number;
  specialNote: string;
  rules: ClassRuleItem[];
  updatedAt?: string;
}

export interface EmulationLog {
  id: string;
  transactionId?: string;
  studentId: string;
  studentName: string;
  timestamp: string; // ISO string or format DD/MM/YYYY HH:mm
  scoreDiff: number; // e.g., +2 or -1
  reasonCategory: string;
  reasonDetail: string;
  teacherName: string;
  weekNumber?: number;
  month?: number;

  // Standalone Transaction attributes
  classId?: string;
  schoolId?: string;
  schoolYearId?: string;
  teacherId?: string;
  type?: 'positive' | 'negative';
  points?: number;
  reason?: string;
  note?: string;
  date?: string; // YYYY-MM-DD
  createdAt?: string;
  updatedAt?: string;
}

export interface SchoolRankingEntry {
  rankingId: string;
  schoolId: string;
  schoolYearId: string;
  periodType: 'week' | 'month' | 'semester';
  periodKey: string; // e.g. 'week_1', 'month_8', 'semester_1'
  startDate: string;
  endDate: string;
  classId: string;
  className: string;
  grade: string;
  rank: number;
  totalClasses: number;
  score: number;
  averageScore: number;
  note: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
}

export interface Commendation {
  id: string;
  studentId: string;
  studentName: string;
  achievementTitle: string;
  date: string;
  details: string;
  format: 'Giấy khen' | 'Tuyên dương trước lớp' | 'Phần quà' | 'Cờ thi đua';
}

export interface ParentLog {
  id: string;
  studentId: string;
  date: string;
  channel: 'Điện thoại' | 'Zalo' | 'Gặp trực tiếp' | 'Khác';
  summary: string;
  teacherName?: string;
}

export interface TeacherLog {
  id: string;
  studentId?: string;
  studentName?: string;
  team?: TeamNumber;
  date: string;
  title?: string;
  content: string;
  teacherName: string;
  imageUrls?: string[];
  publicForParents?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeskItem {
  id: string;
  row: number;
  col: number;
  seats: (string | null)[];
}

export interface SeatingChart {
  id: string;
  name: string;
  schoolYear: string;
  className: string;
  isDefault: boolean;
  rows: number;
  cols: number;
  seatsPerDesk: number;
  desks: DeskItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ClassConfig {
  schoolName: string;
  className: string;
  schoolYear: string;
  teacherName: string;
  homeroomTeacherName?: string;
  totalStudents?: number;
  numberOfTeams?: number;
  teamNames?: string[];
  classLogo?: string;
  classDescription?: string;
  rankingMethod?: 'AVERAGE' | 'TOTAL';
  initialScore?: number;
  schoolId?: string;
  teacherId?: string;
}

export interface ClassTask {
  id: string;
  title: string;
  dueDate: string;
  assignee?: string;
  status?: 'Chưa làm' | 'Đang làm' | 'Hoàn thành';
  completed?: boolean;
  category?: 'Điểm danh' | 'Thu sổ sách' | 'Họp PH' | 'Phong trào' | 'Khác';
}

export interface UpcomingActivity {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
}

