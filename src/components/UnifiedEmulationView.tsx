import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Trophy,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  Search,
  Printer,
  Download,
  Plus,
  Minus,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Filter,
  Sparkles,
  School,
  Building2,
  HelpCircle,
  ArrowUpDown,
  Tag,
  Trash2,
  Pencil
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Student, EmulationLog, PeriodConfig, UserRole, TeamNumber, ClassConfig } from '../types';
import {
  loadCustomClassRank,
  saveCustomClassRank,
  CustomClassRank,
  loadWeeklyClassRankings,
  saveWeeklyClassRankings,
  WeeklyClassRanking
} from '../utils/storage';
import {
  computeStudentStatsForPeriod,
  computeTeamStatsForPeriod,
  getWeekDateRange,
  parseLogDate,
  isDateInPeriodRange,
  StudentEmulationStats,
  TeamEmulationStats
} from '../utils/emulationUtils';

export type TimeMode = 'day' | 'week' | 'month' | 'semester';

interface UnifiedEmulationViewProps {
  students: Student[];
  emulationLogs: EmulationLog[];
  periodConfig: PeriodConfig;
  operatingDate: string; // YYYY-MM-DD
  userRole?: UserRole;
  currentTeacherName?: string;
  className?: string;
  schoolYear?: string;
  config?: ClassConfig;
  onSelectStudent: (student: Student) => void;
  onOpenEmulationModal: (student: Student, mode: 'add' | 'deduct') => void;
  onOpenPeriodConfigModal?: () => void;
}

// Full 24 classes in school
const ALL_SCHOOL_CLASSES = [
  { classId: '6A1', grade: 'Khối 6', studentCount: 32, seedBonus: 12 },
  { classId: '6A2', grade: 'Khối 6', studentCount: 30, seedBonus: 5 },
  { classId: '6A3', grade: 'Khối 6', studentCount: 31, seedBonus: -2 },
  { classId: '6A4', grade: 'Khối 6', studentCount: 33, seedBonus: 8 },
  { classId: '7A1', grade: 'Khối 7', studentCount: 30, seedBonus: 15 },
  { classId: '7A2', grade: 'Khối 7', studentCount: 32, seedBonus: 22 },
  { classId: '7A3', grade: 'Khối 7', studentCount: 29, seedBonus: -5 },
  { classId: '7A4', grade: 'Khối 7', studentCount: 31, seedBonus: 10 },
  { classId: '8A1', grade: 'Khối 8', studentCount: 32, seedBonus: 0 },
  { classId: '8A2', grade: 'Khối 8', studentCount: 33, seedBonus: 18 },
  { classId: '8A3', grade: 'Khối 8', studentCount: 30, seedBonus: 7 },
  { classId: '8A4', grade: 'Khối 8', studentCount: 31, seedBonus: -8 },
  { classId: '9A1', grade: 'Khối 9', studentCount: 32, seedBonus: 25 },
  { classId: '9A2', grade: 'Khối 9', studentCount: 30, seedBonus: 14 },
  { classId: '9A3', grade: 'Khối 9', studentCount: 31, seedBonus: 3 },
  { classId: '9A4', grade: 'Khối 9', studentCount: 29, seedBonus: -3 },
  { classId: '10A1', grade: 'Khối 10', studentCount: 35, seedBonus: 19 },
  { classId: '10A2', grade: 'Khối 10', studentCount: 34, seedBonus: 11 },
  { classId: '11A1', grade: 'Khối 11', studentCount: 35, seedBonus: 16 },
  { classId: '11A2', grade: 'Khối 11', studentCount: 36, seedBonus: 4 },
  { classId: '12A1', grade: 'Khối 12', studentCount: 34, seedBonus: 28 },
  { classId: '12A2', grade: 'Khối 12', studentCount: 35, seedBonus: 20 },
  { classId: '12A3', grade: 'Khối 12', studentCount: 33, seedBonus: 9 },
  { classId: '12A4', grade: 'Khối 12', studentCount: 32, seedBonus: -1 },
];

export const UnifiedEmulationView: React.FC<UnifiedEmulationViewProps> = ({
  students = [],
  emulationLogs = [],
  periodConfig,
  operatingDate,
  userRole = 'GIÁO VIÊN',
  currentTeacherName = 'ThS. Nguyễn Quỳnh An',
  className = '6a3',
  schoolYear = '2026-2027',
  config,
  onSelectStudent,
  onOpenEmulationModal,
  onOpenPeriodConfigModal,
}) => {
  const isAdmin = userRole === 'ADMIN';

  // Custom Rank Override State
  const [customRank, setCustomRank] = useState<CustomClassRank | null>(() => 
    loadCustomClassRank(schoolYear || '2026-2027', className || '6a3')
  );

  // Edit Rank Modal State
  const [isEditRankModalOpen, setIsEditRankModalOpen] = useState(false);
  const [editRankInput, setEditRankInput] = useState<string>('');
  const [editTotalClassesInput, setEditTotalClassesInput] = useState<string>('');
  const [rankSaveSuccessMsg, setRankSaveSuccessMsg] = useState<string | null>(null);

  // Weekly Class Rankings State (Tuần 1 -> Tuần 35)
  const [weeklyClassRankings, setWeeklyClassRankings] = useState<WeeklyClassRanking[]>(() =>
    loadWeeklyClassRankings(schoolYear || '2026-2027', className || '6a3')
  );

  const [isWeeklyRankModalOpen, setIsWeeklyRankModalOpen] = useState(false);
  const [editingWeeklyRankItem, setEditingWeeklyRankItem] = useState<WeeklyClassRanking | null>(null);

  const [formWeekNum, setFormWeekNum] = useState<number>(1);
  const [formRankNum, setFormRankNum] = useState<number>(1);
  const [formTotalClassesNum, setFormTotalClassesNum] = useState<number>(24);
  const [formPointsNum, setFormPointsNum] = useState<number>(100);
  const [formNotesText, setFormNotesText] = useState<string>('');

  useEffect(() => {
    const loaded = loadCustomClassRank(schoolYear || '2026-2027', className || '6a3');
    setCustomRank(loaded);
    const loadedWeekly = loadWeeklyClassRankings(schoolYear || '2026-2027', className || '6a3');
    setWeeklyClassRankings(loadedWeekly);
  }, [schoolYear, className]);

  const handleOpenAddWeeklyModal = () => {
    if (!isAdmin) return;
    setEditingWeeklyRankItem(null);
    const existingWeeks = weeklyClassRankings.map((w) => w.weekNumber);
    let nextWeek = 1;
    while (existingWeeks.includes(nextWeek) && nextWeek <= 35) {
      nextWeek++;
    }
    setFormWeekNum(nextWeek > 35 ? 1 : nextWeek);
    setFormRankNum(3);
    setFormTotalClassesNum(24);
    setFormPointsNum(100);
    setFormNotesText('Duy trì nề nếp thi đua tốt');
    setIsWeeklyRankModalOpen(true);
  };

  const handleOpenEditWeeklyModal = (item: WeeklyClassRanking) => {
    if (!isAdmin) return;
    setEditingWeeklyRankItem(item);
    setFormWeekNum(item.weekNumber);
    setFormRankNum(item.rank);
    setFormTotalClassesNum(item.totalClasses);
    setFormPointsNum(item.points);
    setFormNotesText(item.notes);
    setIsWeeklyRankModalOpen(true);
  };

  const handleSaveWeeklyRank = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedList: WeeklyClassRanking[];

    if (editingWeeklyRankItem) {
      updatedList = weeklyClassRankings.map((item) => {
        if (item.id === editingWeeklyRankItem.id) {
          return {
            ...item,
            weekNumber: formWeekNum,
            rank: formRankNum,
            totalClasses: formTotalClassesNum,
            points: formPointsNum,
            notes: formNotesText,
          };
        }
        return item;
      });
    } else {
      const newItem: WeeklyClassRanking = {
        id: `week-${formWeekNum}-${Date.now()}`,
        weekNumber: formWeekNum,
        rank: formRankNum,
        totalClasses: formTotalClassesNum,
        points: formPointsNum,
        notes: formNotesText,
      };
      updatedList = [...weeklyClassRankings, newItem];
    }

    updatedList.sort((a, b) => a.weekNumber - b.weekNumber);

    saveWeeklyClassRankings(schoolYear || '2026-2027', className || '6a3', updatedList);
    setWeeklyClassRankings(updatedList);
    setIsWeeklyRankModalOpen(false);

    setRankSaveSuccessMsg(
      editingWeeklyRankItem
        ? `✅ Đã cập nhật kết quả xếp hạng Tuần ${formWeekNum}`
        : `➕ Đã thêm xếp hạng cho Tuần ${formWeekNum}`
    );
    setTimeout(() => setRankSaveSuccessMsg(null), 3500);
  };

  const handleDeleteWeeklyRank = (item: WeeklyClassRanking) => {
    if (!isAdmin) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa dữ liệu xếp hạng của Tuần ${item.weekNumber}?`)) {
      const updatedList = weeklyClassRankings.filter((w) => w.id !== item.id);
      saveWeeklyClassRankings(schoolYear || '2026-2027', className || '6a3', updatedList);
      setWeeklyClassRankings(updatedList);

      setRankSaveSuccessMsg(`🗑️ Đã xóa dòng dữ liệu xếp hạng Tuần ${item.weekNumber}`);
      setTimeout(() => setRankSaveSuccessMsg(null), 3500);
    }
  };
  // 1. Time Mode State ('day' | 'week' | 'month' | 'semester')
  const [timeMode, setTimeMode] = useState<TimeMode>('week');

  // Time Parameters
  const [selectedDay, setSelectedDay] = useState<string>(operatingDate || '2026-08-22');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // August
  const [selectedSemester, setSelectedSemester] = useState<'hk1' | 'hk2' | 'all'>('hk1');

  // Formula & Filters
  const [rankingMethod, setRankingMethod] = useState<'AVERAGE' | 'TOTAL'>(config?.rankingMethod || 'AVERAGE');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'students' | 'school' | 'chart'>('students');

  const studentList = useMemo(() => (Array.isArray(students) ? students : []), [students]);
  const logList = useMemo(() => (Array.isArray(emulationLogs) ? emulationLogs : []), [emulationLogs]);

  // ---------------------------------------------------------------------------
  // DATE RANGE COMPUTATION & FILTER FUNCTION BASED ON TIME MODE
  // ---------------------------------------------------------------------------
  const { dateRangeText, filterFn, reportTitle, periodTypeLabel, startDateStr, endDateStr } = useMemo(() => {
    if (timeMode === 'day') {
      const [y, m, d] = selectedDay.split('-');
      const formattedDay = `${d}/${m}/${y}`;
      return {
        dateRangeText: `Ngày ${formattedDay}`,
        reportTitle: `XẾP HẠNG THI ĐUA NGÀY ${formattedDay}`,
        periodTypeLabel: `Ngày ${formattedDay}`,
        startDateStr: selectedDay,
        endDateStr: selectedDay,
        filterFn: (logDate: Date) => {
          const logYMD = logDate.toISOString().split('T')[0];
          return logYMD === selectedDay;
        },
      };
    }

    if (timeMode === 'week') {
      const weekInfo = getWeekDateRange(selectedWeek, periodConfig);
      return {
        dateRangeText: `Tuần ${selectedWeek} (${weekInfo.dateRangeStr})`,
        reportTitle: `XẾP HẠNG THI ĐUA TUẦN ${selectedWeek} (${weekInfo.dateRangeStr})`,
        periodTypeLabel: `Tuần ${selectedWeek} (${weekInfo.dateRangeStr})`,
        startDateStr: weekInfo.startDateStr,
        endDateStr: weekInfo.endDateStr,
        filterFn: (logDate: Date) => isDateInPeriodRange(logDate, weekInfo.startDateStr, weekInfo.endDateStr),
      };
    }

    if (timeMode === 'month') {
      const monthRange = periodConfig?.months?.[selectedMonth];
      const year = selectedMonth >= 8 ? 2026 : 2027;
      const monthFormatted = String(selectedMonth).padStart(2, '0');
      const monthLabel = `Tháng ${monthFormatted}/${year}`;

      if (monthRange && monthRange.startDate && monthRange.endDate) {
        const [sy, sm, sd] = monthRange.startDate.split('-');
        const [ey, em, ed] = monthRange.endDate.split('-');
        const formattedRange = `${sd}/${sm}/${sy} → ${ed}/${em}/${ey}`;
        return {
          dateRangeText: `${monthLabel} (${formattedRange})`,
          reportTitle: `XẾP HẠNG THI ĐUA THÁNG ${monthFormatted}/${year} (${formattedRange})`,
          periodTypeLabel: `${monthLabel} (${formattedRange})`,
          startDateStr: monthRange.startDate,
          endDateStr: monthRange.endDate,
          filterFn: (logDate: Date) => isDateInPeriodRange(logDate, monthRange.startDate, monthRange.endDate),
        };
      }

      return {
        dateRangeText: monthLabel,
        reportTitle: `XẾP HẠNG THI ĐUA THÁNG ${monthFormatted}/${year}`,
        periodTypeLabel: monthLabel,
        startDateStr: `${year}-${monthFormatted}-01`,
        endDateStr: `${year}-${monthFormatted}-28`,
        filterFn: (logDate: Date) => logDate.getMonth() + 1 === selectedMonth,
      };
    }

    // semester mode
    if (selectedSemester === 'hk1') {
      const range = periodConfig.semester1;
      const [sy, sm, sd] = range.startDate.split('-');
      const [ey, em, ed] = range.endDate.split('-');
      const formattedRange = `${sd}/${sm}/${sy} → ${ed}/${em}/${ey}`;
      return {
        dateRangeText: `Học Kỳ I (${formattedRange})`,
        reportTitle: `XẾP HẠNG THI ĐUA HỌC KỲ I (${formattedRange})`,
        periodTypeLabel: `Học Kỳ I (${formattedRange})`,
        startDateStr: range.startDate,
        endDateStr: range.endDate,
        filterFn: (logDate: Date) => isDateInPeriodRange(logDate, range.startDate, range.endDate),
      };
    } else if (selectedSemester === 'hk2') {
      const range = periodConfig.semester2;
      const [sy, sm, sd] = range.startDate.split('-');
      const [ey, em, ed] = range.endDate.split('-');
      const formattedRange = `${sd}/${sm}/${sy} → ${ed}/${em}/${ey}`;
      return {
        dateRangeText: `Học Kỳ II (${formattedRange})`,
        reportTitle: `XẾP HẠNG THI ĐUA HỌC KỲ II (${formattedRange})`,
        periodTypeLabel: `Học Kỳ II (${formattedRange})`,
        startDateStr: range.startDate,
        endDateStr: range.endDate,
        filterFn: (logDate: Date) => isDateInPeriodRange(logDate, range.startDate, range.endDate),
      };
    } else {
      return {
        dateRangeText: `Cả Năm Học (${schoolYear})`,
        reportTitle: `XẾP HẠNG THI ĐUA CẢ NĂM HỌC (${schoolYear})`,
        periodTypeLabel: `Cả Năm Học (${schoolYear})`,
        startDateStr: '2026-08-01',
        endDateStr: '2027-05-31',
        filterFn: () => true,
      };
    }
  }, [timeMode, selectedDay, selectedWeek, selectedMonth, selectedSemester, periodConfig, schoolYear]);

  // ---------------------------------------------------------------------------
  // COMPUTE STUDENT & TEAM STATS FOR CURRENT CLASS
  // ---------------------------------------------------------------------------
  const studentStats: StudentEmulationStats[] = useMemo(() => {
    return computeStudentStatsForPeriod(studentList, logList, filterFn);
  }, [studentList, logList, filterFn]);

  const teamStats: TeamEmulationStats[] = useMemo(() => {
    return computeTeamStatsForPeriod(studentList, logList, filterFn);
  }, [studentList, logList, filterFn]);

  const periodLogs = useMemo(() => {
    return logList.filter((log) => filterFn(parseLogDate(log.timestamp)));
  }, [logList, filterFn]);

  const totalAddedPoints = useMemo(() => studentStats.reduce((sum, s) => sum + s.addedPoints, 0), [studentStats]);
  const totalDeductedPoints = useMemo(() => studentStats.reduce((sum, s) => sum + s.deductedPoints, 0), [studentStats]);
  const classNetPoints = totalAddedPoints - totalDeductedPoints;
  const currentClassStudentCount = studentList.length || 32;
  const currentClassAverageScore = Number((classNetPoints / currentClassStudentCount).toFixed(2));

  // ---------------------------------------------------------------------------
  // COMPUTE SCHOOL-WIDE RANKINGS (ALL 24 CLASSES)
  // Requirement 71, 72, 73, 74, 75
  // ---------------------------------------------------------------------------
  const schoolClassRankings = useMemo(() => {
    const timeKey = `${timeMode}_${selectedDay}_${selectedWeek}_${selectedMonth}_${selectedSemester}`;
    
    // Hash function to deterministically calculate baseline points for other classes
    const getHash = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };

    const calculatedAt = new Date().toISOString();

    const list = ALL_SCHOOL_CLASSES.map((cls) => {
      const isUserClass = cls.classId === className;
      
      let totalPos = 0;
      let totalNeg = 0;
      let netScore = 0;
      let stCount = cls.studentCount;

      if (isUserClass) {
        totalPos = totalAddedPoints;
        totalNeg = totalDeductedPoints;
        netScore = classNetPoints;
        stCount = currentClassStudentCount;
      } else {
        const seed = getHash(`${cls.classId}_${timeKey}`);
        totalPos = (seed % 35) + cls.seedBonus + 10;
        totalNeg = seed % 12;
        netScore = totalPos - totalNeg;
      }

      const averageScore = Number((netScore / stCount).toFixed(2));

      return {
        schoolId: config?.schoolId || 'THCS_LQD',
        schoolYearId: (schoolYear || '2026-2027').replace(/[^a-zA-Z0-9]/g, '_'),
        classId: cls.classId,
        grade: cls.grade,
        periodType: timeMode,
        startDate: startDateStr,
        endDate: endDateStr,
        totalPositive: totalPos,
        totalNegative: totalNeg,
        netScore,
        studentCount: stCount,
        averageScore,
        calculatedAt,
        isUserClass,
      };
    });

    // Sort according to selected ranking method (AVERAGE or TOTAL)
    list.sort((a, b) => {
      if (rankingMethod === 'AVERAGE') {
        return b.averageScore - a.averageScore || b.netScore - a.netScore;
      } else {
        return b.netScore - a.netScore || b.averageScore - a.averageScore;
      }
    });

    // Assign rank positions
    return list.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      totalClasses: list.length,
    }));
  }, [
    className,
    classNetPoints,
    currentClassStudentCount,
    totalAddedPoints,
    totalDeductedPoints,
    timeMode,
    selectedDay,
    selectedWeek,
    selectedMonth,
    selectedSemester,
    rankingMethod,
    startDateStr,
    endDateStr,
    config,
    schoolYear,
  ]);

  const calculatedRankingInfo = useMemo(() => {
    return schoolClassRankings.find((c) => c.isUserClass) || {
      rank: 3,
      totalClasses: 24,
      netScore: classNetPoints,
      averageScore: currentClassAverageScore,
      studentCount: currentClassStudentCount,
    };
  }, [schoolClassRankings, classNetPoints, currentClassAverageScore, currentClassStudentCount]);

  const userClassRankingInfo = useMemo(() => {
    if (customRank) {
      return {
        ...calculatedRankingInfo,
        rank: customRank.rank,
        totalClasses: customRank.totalClasses,
      };
    }
    return calculatedRankingInfo;
  }, [customRank, calculatedRankingInfo]);

  const handleOpenEditRankModal = () => {
    if (!isAdmin) return;
    setEditRankInput(String(userClassRankingInfo.rank));
    setEditTotalClassesInput(String(userClassRankingInfo.totalClasses));
    setIsEditRankModalOpen(true);
  };

  const handleSaveEditedRank = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newRank = parseInt(editRankInput, 10);
    const newTotal = parseInt(editTotalClassesInput, 10);

    if (isNaN(newRank) || newRank < 1) {
      alert('Vui lòng nhập thứ hạng hợp lệ (số nguyên lớn hơn 0).');
      return;
    }
    if (isNaN(newTotal) || newTotal < 1) {
      alert('Vui lòng nhập tổng số lớp hợp lệ (số nguyên lớn hơn 0).');
      return;
    }

    const updated: CustomClassRank = {
      rank: newRank,
      totalClasses: newTotal,
    };

    saveCustomClassRank(schoolYear || '2026-2027', className || '6a3', updated);
    setCustomRank(updated);
    setIsEditRankModalOpen(false);

    setRankSaveSuccessMsg(`✅ Đã cập nhật thứ hạng: HẠNG ${newRank} / ${newTotal}`);
    setTimeout(() => setRankSaveSuccessMsg(null), 3500);
  };

  const handleResetToAutoRank = () => {
    try {
      const key = `so_chu_nhiem_custom_class_rank_${schoolYear || '2026-2027'}_${className || '6a3'}`;
      localStorage.removeItem(key);
    } catch (e) {}
    setCustomRank(null);
    setIsEditRankModalOpen(false);
    setRankSaveSuccessMsg(`🔄 Đã khôi phục thứ hạng tự động.`);
    setTimeout(() => setRankSaveSuccessMsg(null), 3500);
  };

  // Filtered School Table by Grade
  const filteredSchoolRankings = useMemo(() => {
    if (gradeFilter === 'ALL') return schoolClassRankings;
    return schoolClassRankings.filter((c) => c.grade === gradeFilter);
  }, [schoolClassRankings, gradeFilter]);

  // Handlers for Time Controls
  const handlePrevTime = () => {
    if (timeMode === 'day') {
      const d = new Date(selectedDay);
      d.setDate(d.getDate() - 1);
      setSelectedDay(d.toISOString().split('T')[0]);
    } else if (timeMode === 'week') {
      setSelectedWeek((prev) => Math.max(1, prev - 1));
    } else if (timeMode === 'month') {
      const monthOrder = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5];
      const currentIdx = monthOrder.indexOf(selectedMonth);
      if (currentIdx > 0) setSelectedMonth(monthOrder[currentIdx - 1]);
    } else if (timeMode === 'semester') {
      setSelectedSemester('hk1');
    }
  };

  const handleNextTime = () => {
    if (timeMode === 'day') {
      const d = new Date(selectedDay);
      d.setDate(d.getDate() + 1);
      setSelectedDay(d.toISOString().split('T')[0]);
    } else if (timeMode === 'week') {
      setSelectedWeek((prev) => Math.min(16, prev + 1));
    } else if (timeMode === 'month') {
      const monthOrder = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5];
      const currentIdx = monthOrder.indexOf(selectedMonth);
      if (currentIdx < monthOrder.length - 1) setSelectedMonth(monthOrder[currentIdx + 1]);
    } else if (timeMode === 'semester') {
      setSelectedSemester('hk2');
    }
  };

  const handleResetCurrentTime = () => {
    if (timeMode === 'day') {
      setSelectedDay(operatingDate || new Date().toISOString().split('T')[0]);
    } else if (timeMode === 'week') {
      setSelectedWeek(1);
    } else if (timeMode === 'month') {
      setSelectedMonth(8);
    } else if (timeMode === 'semester') {
      setSelectedSemester('hk1');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER BANNER WITH TIME SELECTOR (Requirements 66.1, 67, 68, 69, 70) */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold text-amber-100 mb-2">
              🏆 Bảng Xếp Hạng Thi Đua Rèn Luyện
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              📊 {reportTitle}
            </h2>
            <p className="text-amber-100 text-xs md:text-sm mt-1">
              Khoảng thời gian: <strong>{dateRangeText}</strong>
            </p>
          </div>

          {/* TIME MODE TABS (Requirement 66.1) */}
          <div className="flex flex-wrap items-center gap-1 bg-black/25 p-1.5 rounded-2xl border border-white/20 self-start md:self-auto">
            <button
              onClick={() => setTimeMode('day')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                timeMode === 'day' ? 'bg-white text-slate-900 shadow-md' : 'text-amber-100 hover:text-white'
              }`}
            >
              📅 Ngày
            </button>
            <button
              onClick={() => setTimeMode('week')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                timeMode === 'week' ? 'bg-white text-slate-900 shadow-md' : 'text-amber-100 hover:text-white'
              }`}
            >
              📅 Tuần
            </button>
            <button
              onClick={() => setTimeMode('month')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                timeMode === 'month' ? 'bg-white text-slate-900 shadow-md' : 'text-amber-100 hover:text-white'
              }`}
            >
              📅 Tháng
            </button>
            <button
              onClick={() => setTimeMode('semester')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                timeMode === 'semester' ? 'bg-white text-slate-900 shadow-md' : 'text-amber-100 hover:text-white'
              }`}
            >
              📅 Học Kỳ
            </button>
          </div>
        </div>

        {/* TIME NAVIGATION BAR */}
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevTime}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl font-bold flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>
                {timeMode === 'day' && 'Ngày trước'}
                {timeMode === 'week' && 'Tuần trước'}
                {timeMode === 'month' && 'Tháng trước'}
                {timeMode === 'semester' && 'HK I'}
              </span>
            </button>

            <button
              onClick={handleResetCurrentTime}
              className="px-3 py-1.5 bg-amber-400 text-slate-900 font-extrabold rounded-xl hover:bg-amber-300 transition-colors"
            >
              Hôm nay / Hiện tại
            </button>

            <button
              onClick={handleNextTime}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl font-bold flex items-center gap-1 transition-colors"
            >
              <span>
                {timeMode === 'day' && 'Ngày sau'}
                {timeMode === 'week' && 'Tuần sau'}
                {timeMode === 'month' && 'Tháng sau'}
                {timeMode === 'semester' && 'HK II'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Specific controls according to Time Mode */}
          <div className="flex items-center gap-2">
            {timeMode === 'day' && (
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="px-3 py-1.5 bg-white text-slate-900 font-bold rounded-xl text-xs"
              />
            )}

            {timeMode === 'week' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="px-3 py-1.5 bg-white text-slate-900 font-extrabold rounded-xl text-xs shadow-xs border border-amber-200"
                >
                  {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      Tuần {w}
                    </option>
                  ))}
                </select>

                {onOpenPeriodConfigModal && (
                  <button
                    onClick={onOpenPeriodConfigModal}
                    className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold rounded-xl text-xs flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                    title="Chỉnh sửa khoảng thời gian các tuần thi đua"
                  >
                    <span>⚙️ Sửa tuần</span>
                  </button>
                )}
              </div>
            )}

            {timeMode === 'month' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 bg-white text-slate-900 font-bold rounded-xl text-xs"
              >
                {[8, 9, 10, 11, 12, 1, 2, 3, 4, 5].map((m) => (
                  <option key={m} value={m}>
                    Tháng {m < 10 ? `0${m}` : m}
                  </option>
                ))}
              </select>
            )}

            {timeMode === 'semester' && (
              <div className="flex gap-1">
                <button
                  onClick={() => setSelectedSemester('hk1')}
                  className={`px-3 py-1.5 rounded-xl font-bold ${
                    selectedSemester === 'hk1' ? 'bg-white text-slate-900' : 'bg-white/20'
                  }`}
                >
                  Học Kỳ I
                </button>
                <button
                  onClick={() => setSelectedSemester('hk2')}
                  className={`px-3 py-1.5 rounded-xl font-bold ${
                    selectedSemester === 'hk2' ? 'bg-white text-slate-900' : 'bg-white/20'
                  }`}
                >
                  Học Kỳ II
                </button>
                <button
                  onClick={() => setSelectedSemester('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold ${
                    selectedSemester === 'all' ? 'bg-white text-slate-900' : 'bg-white/20'
                  }`}
                >
                  Cả Năm
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PROMINENT SCHOOL CLASS RANKING CARD (Requirements 71 & 72) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-amber-300 dark:border-amber-700 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full text-xs font-extrabold uppercase tracking-wider">
              🏫 XẾP HẠNG CỦA LỚP TRONG TOÀN TRƯỜNG
            </span>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>Lớp {className}</span>
              <span className="text-slate-400 font-normal">({schoolYear})</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
              « Lớp <strong className="text-amber-600 dark:text-amber-400 font-black">{className}</strong> đang đứng thứ{' '}
              <strong className="text-amber-600 dark:text-amber-400 text-lg font-black">{userClassRankingInfo.rank}</strong> trong tổng số{' '}
              <strong className="font-bold">{userClassRankingInfo.totalClasses}</strong> lớp của trường. »
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span>
                Tổng điểm ròng: <strong className="text-indigo-600 font-bold">{classNetPoints > 0 ? `+${classNetPoints}` : classNetPoints} đ</strong>
              </span>
              <span>•</span>
              <span>
                Đội ngũ sĩ số: <strong className="font-bold">{currentClassStudentCount} học sinh</strong>
              </span>
              <span>•</span>
              <span>
                ĐTB/Học sinh: <strong className="text-emerald-600 font-bold">{currentClassAverageScore} đ</strong>
              </span>
            </div>
          </div>

          {/* Large Badge & Method Toggle */}
          <div className="flex flex-col items-center md:items-end gap-3 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={isAdmin ? handleOpenEditRankModal : undefined}
              disabled={!isAdmin}
              title={isAdmin ? "Bấm vào để chỉnh sửa nhanh thứ hạng và tổng số lớp (ADMIN)" : "Thứ hạng thi đua của lớp"}
              className={`px-6 py-4 bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 font-black text-2xl md:text-3xl rounded-3xl shadow-lg border-2 border-white flex items-center gap-3 transition-all text-left ${
                isAdmin 
                  ? 'cursor-pointer hover:scale-105 active:scale-95 hover:shadow-2xl hover:border-amber-200 ring-2 ring-amber-400/50 relative group' 
                  : 'cursor-default'
              }`}
            >
              <span className="text-3xl">
                {userClassRankingInfo.rank === 1 ? '🥇' : userClassRankingInfo.rank === 2 ? '🥈' : userClassRankingInfo.rank === 3 ? '🥉' : '🏆'}
              </span>
              <span className="flex items-center gap-2">
                <span>HẠNG {userClassRankingInfo.rank} / {userClassRankingInfo.totalClasses}</span>
                {isAdmin && (
                  <span className="text-xs bg-amber-950/20 text-amber-950 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 group-hover:bg-amber-950 group-hover:text-amber-300 transition-colors shrink-0">
                    ✏️ Sửa
                  </span>
                )}
              </span>
            </button>

            {/* Formula choice selector (Requirement 74) */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl text-[11px] font-bold border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 pl-2">Phương thức:</span>
              <button
                onClick={() => setRankingMethod('AVERAGE')}
                className={`px-2.5 py-1 rounded-xl transition-colors ${
                  rankingMethod === 'AVERAGE'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Điểm TB / Học sinh
              </button>
              <button
                onClick={() => setRankingMethod('TOTAL')}
                className={`px-2.5 py-1 rounded-xl transition-colors ${
                  rankingMethod === 'TOTAL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Tổng điểm lớp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW SUB-TABS */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👥 Xếp Hạng Học Sinh & Tổ</span>
          </button>

          <button
            onClick={() => setActiveTab('school')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'school'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>📅 Xếp Hạng Lớp Theo Tuần</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: STUDENTS & TEAMS RANKING */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* TEAM RANKINGS PODIUM (Requirement 67) */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                XẾP HẠNG CÁC TỔ LỚP {className} ({periodTypeLabel})
              </h4>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {teamStats.map((team, idx) => (
                <div
                  key={team.team}
                  className={`p-4 rounded-2xl border transition-all ${
                    idx === 0
                      ? 'bg-amber-50/50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                      {team.team}
                    </span>
                    <span className="text-xl">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '4️⃣'}
                    </span>
                  </div>

                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {team.netPoints >= 0 ? `+${team.netPoints}` : team.netPoints} <span className="text-xs font-normal text-slate-400">đ</span>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                    <span>Thành viên: {team.memberCount} HS</span>
                    <span>ĐTB: {team.averageScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STUDENT LEADERBOARD TABLE */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm tên học sinh..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                />
              </div>

              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">Tất cả các tổ</option>
                <option value="Tổ 1">Tổ 1</option>
                <option value="Tổ 2">Tổ 2</option>
                <option value="Tổ 3">Tổ 3</option>
                <option value="Tổ 4">Tổ 4</option>
              </select>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {studentStats
                .filter(s => teamFilter === 'ALL' || s.student.team === teamFilter)
                .filter(s => s.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((st) => (
                  <div
                    key={st.student.id}
                    onClick={() => onSelectStudent(st.student)}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        st.rank === 1 ? 'bg-amber-400 text-amber-950' :
                        st.rank === 2 ? 'bg-slate-300 text-slate-800' :
                        st.rank === 3 ? 'bg-amber-700 text-white' :
                        'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}>
                        {st.rank}
                      </span>

                      <img src={st.student.avatar} alt={st.student.fullName} className="w-10 h-10 rounded-xl object-cover" />

                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          {st.student.fullName}
                          <span className="text-xs font-normal text-slate-400">({st.student.studentCode})</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Tổ {st.student.team} • STT: {st.student.stt}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-600">+{st.addedPoints} cộng</div>
                        <div className="text-xs font-bold text-rose-600">-{st.deductedPoints} trừ</div>
                      </div>

                      <span className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                        st.netPoints >= 0 ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {st.netPoints >= 0 ? `+${st.netPoints}` : st.netPoints} đ
                      </span>

                      {/* Add/Deduct Buttons */}
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenEmulationModal(st.student, 'add'); }}
                          className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-xs font-bold"
                          title="+ Cộng điểm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenEmulationModal(st.student, 'deduct'); }}
                          className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs font-bold"
                          title="- Trừ điểm"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: BẢNG THEO DÕI XẾP HẠNG THI ĐUA CỦA LỚP THEO TUẦN (TOÀN TRƯỜNG) */}
      {activeTab === 'school' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <h4 className="font-black text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                📊 BẢNG THEO DÕI XẾP HẠNG THI ĐUA CỦA LỚP THEO TUẦN (TOÀN TRƯỜNG)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                📌 Bảng tổng hợp diễn biến thứ hạng thi đua qua 35 tuần học của Lớp <strong>{className}</strong> ({schoolYear}).
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenAddWeeklyModal}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>➕ Thêm Xếp Hạng Tuần Mới</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-extrabold uppercase border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 text-center w-28">Tuần Học</th>
                  <th className="p-3 text-center">Thứ Hạng Đạt Được</th>
                  <th className="p-3 text-center">Tổng Điểm Ròng / Điểm Tuần</th>
                  <th className="p-3">Nhận Xét / Ghi Chú</th>
                  {isAdmin && <th className="p-3 text-center w-32">Thao Tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {weeklyClassRankings.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="p-8 text-center text-slate-400">
                      Chưa có dữ liệu xếp hạng tuần nào. Bấm &quot;Thêm Xếp Hạng Tuần Mới&quot; để cập nhật.
                    </td>
                  </tr>
                ) : (
                  weeklyClassRankings.map((wk) => (
                    <tr
                      key={wk.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="p-3 text-center font-extrabold text-slate-800 dark:text-slate-100">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-black">
                          Tuần {wk.weekNumber}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-black text-xs ${
                          wk.rank === 1
                            ? 'bg-amber-400 text-amber-950 border border-amber-300 shadow-xs'
                            : wk.rank === 2
                            ? 'bg-slate-200 text-slate-800 border border-slate-300'
                            : wk.rank === 3
                            ? 'bg-amber-700 text-white border border-amber-800'
                            : 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        }`}>
                          <span>
                            {wk.rank === 1 ? '🥇' : wk.rank === 2 ? '🥈' : wk.rank === 3 ? '🥉' : '🏆'}
                          </span>
                          <span>HẠNG {wk.rank} / {wk.totalClasses || 24} lớp</span>
                        </span>
                      </td>

                      <td className="p-3 text-center font-black text-indigo-600 dark:text-indigo-400">
                        <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 rounded-xl text-indigo-700 dark:text-indigo-300 font-black">
                          {wk.points >= 0 ? `+${wk.points}` : wk.points} điểm
                        </span>
                      </td>

                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                        {wk.notes || '—'}
                      </td>

                      {isAdmin && (
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditWeeklyModal(wk)}
                              className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950 dark:text-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                              title="Sửa kết quả tuần này"
                            >
                              <span>✏️ Sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteWeeklyRank(wk)}
                              className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                              title="Xóa kết quả tuần này"
                            >
                              <span>🗑️ Xóa</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {rankSaveSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-600 text-white font-bold text-sm rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <span>{rankSaveSuccessMsg}</span>
          <button onClick={() => setRankSaveSuccessMsg(null)} className="ml-2 text-white hover:opacity-80 font-black">✕</button>
        </div>
      )}

      {/* EDIT RANK MODAL (ADMIN ONLY) */}
      {isEditRankModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200 dark:border-amber-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Trophy className="w-6 h-6" />
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">
                  Chỉnh Sửa Thứ Hạng Lớp (Admin)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditRankModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedRank} className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Cho phép sửa nhanh thứ hạng và tổng số lớp của <strong>Lớp {className}</strong> ({schoolYear}). Dữ liệu sửa xong tự động cập nhật ngay trên giao diện thẻ &quot;XẾP HẠNG CỦA LỚP TRONG TOÀN TRƯỜNG&quot; và lưu lại.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Thứ hạng mới (Hạng):
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editRankInput}
                  onChange={(e) => setEditRankInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-amber-600 dark:text-amber-400 text-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Ví dụ: 1, 2, 3..."
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tổng số lớp trong toàn trường:
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={editTotalClassesInput}
                  onChange={(e) => setEditTotalClassesInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-slate-800 dark:text-slate-100 text-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Ví dụ: 24"
                  required
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400">Chọn nhanh:</span>
                {[1, 2, 3, 5, 10].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setEditRankInput(String(r))}
                    className={`px-2.5 py-1 rounded-xl text-xs font-black transition-colors ${
                      editRankInput === String(r)
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Hạng {r}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                {customRank ? (
                  <button
                    type="button"
                    onClick={handleResetToAutoRank}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 underline"
                  >
                    Khôi phục tự động
                  </button>
                ) : <span />}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditRankModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-xl text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
                  >
                    <span>💾 Lưu Cập Nhật</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA XẾP HẠNG TUẦN (ADMIN ONLY) */}
      {isWeeklyRankModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-indigo-200 dark:border-indigo-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Trophy className="w-6 h-6" />
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">
                  {editingWeeklyRankItem ? `Sửa Xếp Hạng Tuần ${formWeekNum}` : 'Thêm Xếp Hạng Tuần Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWeeklyRankModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWeeklyRank} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tuần học (Tuần 1 - 35):
                  </label>
                  <select
                    value={formWeekNum}
                    onChange={(e) => setFormWeekNum(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                    required
                  >
                    {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        Tuần {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Thứ hạng đạt được:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formRankNum}
                    onChange={(e) => setFormRankNum(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-amber-600 dark:text-amber-400 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ví dụ: 1, 2, 3..."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tổng số lớp toàn trường:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={formTotalClassesNum}
                    onChange={(e) => setFormTotalClassesNum(parseInt(e.target.value, 10) || 24)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="24"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Điểm thi đua tuần:
                  </label>
                  <input
                    type="number"
                    value={formPointsNum}
                    onChange={(e) => setFormPointsNum(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-indigo-600 dark:text-indigo-400 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nhận xét / Ghi chú:
                </label>
                <textarea
                  rows={2}
                  value={formNotesText}
                  onChange={(e) => setFormNotesText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Nhập ghi chú cho tuần thi đua..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsWeeklyRankModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <span>💾 Lưu Kết Quả</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
