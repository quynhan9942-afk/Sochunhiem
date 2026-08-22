import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  HeartHandshake, 
  Trophy, 
  TrendingUp, 
  Plus, 
  ChevronRight, 
  Sparkles,
  CheckCircle2,
  ListTodo,
  Edit3,
  Trash2,
  Award,
  ShieldAlert,
  User,
  Medal
} from 'lucide-react';
import { Student, ClassTask, EmulationLog, ClassConfig, AuthMode, TeamNumber, ClassRulesConfig, PeriodConfig } from '../types';
import { loadCustomClassRank } from '../utils/storage';
import { computeTeamStatsForPeriod, getWeekFilterFn, getMonthFilterFn, getSemesterFilterFn, getWeekNumberFromDate } from '../utils/emulationUtils';
import { TeamEmulationModal } from './TeamEmulationModal';

interface DashboardProps {
  students?: Student[];
  tasks?: ClassTask[];
  authMode?: AuthMode;
  operatingDate?: string;
  periodConfig?: PeriodConfig;
  onToggleTask?: (taskId: string) => void;
  onAddTask?: (task: ClassTask) => void;
  onUpdateTask?: (task: ClassTask) => void;
  onUpdateTaskStatus?: (taskId: string, status: 'Chưa làm' | 'Đang làm' | 'Hoàn thành') => void;
  onDeleteTask?: (taskId: string) => void;
  emulationLogs?: EmulationLog[];
  onSelectStudent: (student: Student) => void;
  onNavigateTab: (tab: string) => void;
  config?: ClassConfig;
  onOpenAddPoint?: (student: Student) => void;
  onOpenDeductPoint?: (student: Student) => void;
  onSubmitTeamEmulation?: (
    team: TeamNumber | 'ALL_TEAMS',
    scoreDiff: number,
    reasonCategory: string,
    reasonDetail: string
  ) => void;
  classRulesConfig?: ClassRulesConfig;
}

export const Dashboard: React.FC<DashboardProps> = ({
  students = [],
  tasks = [],
  authMode = 'TEACHER',
  operatingDate,
  periodConfig,
  onToggleTask,
  onAddTask,
  onUpdateTask,
  onUpdateTaskStatus,
  onDeleteTask,
  emulationLogs = [],
  onSelectStudent,
  onNavigateTab,
  config,
  onSubmitTeamEmulation,
  classRulesConfig,
}) => {
  const [rankingFilter, setRankingFilter] = useState<'week' | 'month' | 'semester'>('week');
  const [rankingViewMode, setRankingViewMode] = useState<'individual' | 'team'>('individual');
  const [teamRankingMethod, setTeamRankingMethod] = useState<'AVERAGE' | 'TOTAL'>('AVERAGE');
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ClassTask | null>(null);
  const [taskFormTitle, setTaskFormTitle] = useState('');
  const [taskFormAssignee, setTaskFormAssignee] = useState('Ban cán sự lớp');
  const [taskFormDueDate, setTaskFormDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [taskFormStatus, setTaskFormStatus] = useState<'Đang làm' | 'Hoàn thành' | 'Chưa làm'>('Đang làm');

  const isAdmin = authMode !== 'GUEST';

  const customRank = loadCustomClassRank(config?.schoolYear || '2026-2027', config?.className || '6a3');
  const displayRank = customRank ? customRank.rank : 3;
  const displayTotal = customRank ? customRank.totalClasses : 24;

  const studentList = Array.isArray(students) ? students : [];
  const taskList = Array.isArray(tasks) ? tasks : [];

  // Stats calculation
  const totalStudents = studentList.length;
  const maleCount = studentList.filter(s => s.gender === 'Nam').length;
  const femaleCount = studentList.filter(s => s.gender === 'Nữ').length;
  const presentCount = studentList.filter(s => s.attendanceToday === 'present').length;
  const absentCount = studentList.filter(s => s.attendanceToday === 'excused' || s.attendanceToday === 'unexcused').length;
  const lateCount = studentList.filter(s => s.attendanceToday === 'late').length;
  const needsAttentionCount = studentList.filter(s => s.isNeedsAttention).length;
  const totalClassScore = studentList.reduce((acc, s) => acc + (s.emulationScore || 0), 0);

  // Sorted students by emulation score
  const sortedStudents = [...studentList].sort((a, b) => b.emulationScore - a.emulationScore);
  const top1 = sortedStudents[0];
  const top2 = sortedStudents[1];
  const top3 = sortedStudents[2];
  const highPointsStudents = sortedStudents.slice(0, 6);
  const needsAttentionList = studentList.filter(s => s.isNeedsAttention);

  // Team Leaderboard Calculation
  const activeDate = operatingDate ? new Date(operatingDate) : new Date();
  const currentWeek = getWeekNumberFromDate(activeDate, periodConfig);
  const currentMonth = activeDate.getMonth() + 1;

  const teamFilterFn = (logDate: Date) => {
    if (rankingFilter === 'week') {
      return getWeekFilterFn(currentWeek, periodConfig)(logDate);
    } else if (rankingFilter === 'month') {
      return getMonthFilterFn(currentMonth, periodConfig)(logDate);
    } else {
      return getSemesterFilterFn('hk1', periodConfig)(logDate);
    }
  };

  const rawTeamStats = computeTeamStatsForPeriod(studentList, emulationLogs, teamFilterFn);

  const teamStats = [...rawTeamStats].sort((a, b) => {
    if (teamRankingMethod === 'AVERAGE') {
      return b.averageScore - a.averageScore || b.netPoints - a.netPoints;
    } else {
      return b.netPoints - a.netPoints || b.averageScore - a.averageScore;
    }
  }).map((t, idx) => ({ ...t, rank: idx + 1 }));

  const topTeam1 = teamStats[0];
  const topTeam2 = teamStats[1];
  const topTeam3 = teamStats[2];

  const getTeamLeaderName = (teamName: TeamNumber) => {
    const leader = studentList.find(
      s => s.team === teamName && (s.statusNote?.includes('Tổ trưởng') || s.statusNote?.includes('Tổ Trưởng'))
    );
    return leader ? leader.fullName : (studentList.find(s => s.team === teamName)?.fullName || 'Chưa phân công');
  };

  const getTeamColorTheme = (teamName: TeamNumber) => {
    switch (teamName) {
      case 'Tổ 1':
        return {
          cardBg: 'bg-rose-50/70 dark:bg-rose-950/40',
          border: 'border-rose-200 dark:border-rose-800',
          text: 'text-rose-800 dark:text-rose-200',
          badge: 'bg-rose-600 text-white',
          accentBg: 'bg-rose-100 dark:bg-rose-900/60'
        };
      case 'Tổ 2':
        return {
          cardBg: 'bg-blue-50/70 dark:bg-blue-950/40',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-200',
          badge: 'bg-blue-600 text-white',
          accentBg: 'bg-blue-100 dark:bg-blue-900/60'
        };
      case 'Tổ 3':
        return {
          cardBg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
          border: 'border-emerald-200 dark:border-emerald-800',
          text: 'text-emerald-800 dark:text-emerald-200',
          badge: 'bg-emerald-600 text-white',
          accentBg: 'bg-emerald-100 dark:bg-emerald-900/60'
        };
      case 'Tổ 4':
        return {
          cardBg: 'bg-purple-50/70 dark:bg-purple-950/40',
          border: 'border-purple-200 dark:border-purple-800',
          text: 'text-purple-800 dark:text-purple-200',
          badge: 'bg-purple-600 text-white',
          accentBg: 'bg-purple-100 dark:bg-purple-900/60'
        };
      default:
        return {
          cardBg: 'bg-slate-50 dark:bg-slate-900',
          border: 'border-slate-200 dark:border-slate-700',
          text: 'text-slate-800 dark:text-slate-100',
          badge: 'bg-slate-600 text-white',
          accentBg: 'bg-slate-100 dark:bg-slate-800'
        };
    }
  };

  // Task Handlers
  const handleOpenAddTaskModal = () => {
    setEditingTask(null);
    setTaskFormTitle('');
    setTaskFormAssignee('Ban cán sự lớp');
    setTaskFormDueDate(new Date().toISOString().slice(0, 10));
    setTaskFormStatus('Đang làm');
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTaskModal = (task: ClassTask) => {
    setEditingTask(task);
    setTaskFormTitle(task.title);
    setTaskFormAssignee(task.assignee || 'Ban cán sự lớp');
    setTaskFormDueDate(task.dueDate || new Date().toISOString().slice(0, 10));
    setTaskFormStatus(task.status || (task.completed ? 'Hoàn thành' : 'Đang làm'));
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormTitle.trim()) return;

    const isComp = taskFormStatus === 'Hoàn thành';

    if (editingTask) {
      if (onUpdateTask) {
        onUpdateTask({
          ...editingTask,
          title: taskFormTitle.trim(),
          assignee: taskFormAssignee.trim() || 'Ban cán sự lớp',
          dueDate: taskFormDueDate,
          status: taskFormStatus,
          completed: isComp,
        });
      } else if (onUpdateTaskStatus) {
        onUpdateTaskStatus(editingTask.id, taskFormStatus);
      }
    } else {
      if (onAddTask) {
        onAddTask({
          id: 'task_' + Date.now(),
          title: taskFormTitle.trim(),
          assignee: taskFormAssignee.trim() || 'Ban cán sự lớp',
          dueDate: taskFormDueDate,
          status: taskFormStatus,
          completed: isComp,
          category: 'Khác'
        });
      }
    }

    setIsTaskModalOpen(false);
  };

  const handleDeleteTaskItem = (taskId: string) => {
    if (!isAdmin) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này không?')) {
      if (onDeleteTask) {
        onDeleteTask(taskId);
      }
    }
  };

  const handleToggleTaskItem = (task: ClassTask) => {
    if (!isAdmin) return;
    if (onToggleTask) {
      onToggleTask(task.id);
    } else if (onUpdateTaskStatus) {
      const isComp = task.completed || task.status === 'Hoàn thành';
      onUpdateTaskStatus(task.id, isComp ? 'Đang làm' : 'Hoàn thành');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-sky-800 text-white p-6 md:p-8 shadow-lg shadow-blue-500/10">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold text-blue-100 mb-2 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Bảng Tổng Quan Báo Cáo Thi Đua Lớp
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Xin chào Giáo Viên Chủ Nhiệm 👋
            </h2>
            <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Theo dõi tình hình chuyên cần, thi đua rèn luyện và hỗ trợ các học sinh trong lớp bằng một góc nhìn tổng quan trực quan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('student_cards')}
              className="px-4 py-2.5 rounded-2xl bg-white text-blue-800 font-bold text-xs hover:bg-blue-50 transition-colors shadow-md flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Thẻ Học Sinh ({totalStudents})
            </button>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur transition-colors border border-white/20 flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Điểm Danh Hôm Nay
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div>
        <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          THỐNG KÊ NHANH
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Total Students */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs hover:border-blue-300 transition-colors">
            <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-500" /> Tổng số
            </div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
              {totalStudents}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Học sinh lớp</div>
          </div>

          {/* Male */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
            <div className="text-xs text-slate-500 font-medium">Nam</div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {maleCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">{totalStudents > 0 ? Math.round((maleCount/totalStudents)*100) : 0}% tổng số</div>
          </div>

          {/* Female */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
            <div className="text-xs text-slate-500 font-medium">Nữ</div>
            <div className="text-2xl font-black text-pink-500 dark:text-pink-400 mt-1">
              {femaleCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">{totalStudents > 0 ? Math.round((femaleCount/totalStudents)*100) : 0}% tổng số</div>
          </div>

          {/* Present */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 shadow-2xs bg-emerald-50/20">
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> Có mặt
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {presentCount}
            </div>
            <div className="text-[10px] text-emerald-600/80 mt-1">Hôm nay</div>
          </div>

          {/* Absent */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 shadow-2xs bg-rose-50/20">
            <div className="text-xs text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1">
              <UserX className="w-3.5 h-3.5" /> Vắng
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {absentCount}
            </div>
            <div className="text-[10px] text-rose-600/80 mt-1">Hôm nay</div>
          </div>

          {/* Late */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 shadow-2xs bg-amber-50/20">
            <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Đi muộn
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {lateCount}
            </div>
            <div className="text-[10px] text-amber-600/80 mt-1">Hôm nay</div>
          </div>

          {/* Needs Attention */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-amber-300 dark:border-amber-700 shadow-2xs bg-amber-50/30">
            <div className="text-xs text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5" /> Cần lưu ý
            </div>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">
              {needsAttentionCount}
            </div>
            <div className="text-[10px] text-amber-700/80 mt-1">Học sinh</div>
          </div>

          {/* Class Emulation Score */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white p-4 rounded-2xl shadow-sm">
            <div className="text-xs font-semibold text-indigo-100 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-300" /> Tổng thi đua
            </div>
            <div className="text-2xl font-black mt-1">
              +{totalClassScore}
            </div>
            <div className="text-[10px] text-indigo-200 mt-1">Điểm tích lũy</div>
          </div>
        </div>
      </div>

      {/* School Emulation Rank Banner Card (Requirement 77 & 78) */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold text-amber-100 border border-white/20">
            <Trophy className="w-3.5 h-3.5 text-amber-200" />
            🏆 XẾP HẠNG THI ĐUA CỦA LỚP
          </span>
          <h3 className="text-xl font-black">
            Lớp {config?.className || '6a3'}: <span className="text-amber-200">{displayRank === 1 ? '🥇' : displayRank === 2 ? '🥈' : displayRank === 3 ? '🥉' : '🏆'} Hạng {displayRank} / {displayTotal} lớp</span>
          </h3>
          <p className="text-xs text-amber-100 font-medium">
            Tháng 08/2026 (01/08/2026 – 31/08/2026) • ĐTB: +6.5 điểm/HS
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('emulation_summary')}
          className="px-5 py-2.5 rounded-2xl bg-white text-slate-900 font-black text-xs hover:bg-amber-50 transition-all shadow-md flex items-center gap-1.5 shrink-0"
        >
          <span>Xem chi tiết</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Grid: Left Ranking & Top Scores | Right Attention & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Podium & Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Bảng Xếp Hạng Thi Đua Lớp
                  </h3>
                </div>

                {/* View Mode Switcher (Cá Nhân / Tổ) */}
                <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl text-xs font-bold gap-1">
                  <button
                    onClick={() => setRankingViewMode('individual')}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                      rankingViewMode === 'individual'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    👤 Cá Nhân (Học Sinh)
                  </button>
                  <button
                    onClick={() => setRankingViewMode('team')}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                      rankingViewMode === 'team'
                        ? 'bg-amber-500 text-white shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    👥 Thi Đua Theo Tổ
                  </button>
                </div>
              </div>

              {/* Time Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl text-xs font-semibold">
                  <button
                    onClick={() => setRankingFilter('week')}
                    className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${rankingFilter === 'week' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500'}`}
                  >
                    Theo Tuần
                  </button>
                  <button
                    onClick={() => setRankingFilter('month')}
                    className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${rankingFilter === 'month' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500'}`}
                  >
                    Theo Tháng
                  </button>
                  <button
                    onClick={() => setRankingFilter('semester')}
                    className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${rankingFilter === 'semester' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500'}`}
                  >
                    Học Kỳ
                  </button>
                </div>
              </div>
            </div>

            {/* IF INDIVIDUAL VIEW */}
            {rankingViewMode === 'individual' && (
              <>
                {/* Podium Visual */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end mb-8 pt-4 max-w-xl mx-auto">
                  {/* Top 2 - Silver */}
                  {top2 && (
                    <div 
                      onClick={() => onSelectStudent(top2)}
                      className="flex flex-col items-center cursor-pointer group"
                    >
                      <div className="relative mb-2">
                        <img 
                          src={top2.avatar} 
                          alt={top2.fullName} 
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-4 ring-slate-300 dark:ring-slate-600 shadow-md group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute -top-2 -right-2 bg-slate-300 text-slate-800 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs">
                          🥈
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate max-w-[100px] group-hover:text-blue-600">
                          {top2.fullName}
                        </div>
                        <div className="text-[11px] font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full mt-0.5 inline-block">
                          +{top2.emulationScore} đ
                        </div>
                      </div>
                      <div className="w-full h-20 bg-slate-200 dark:bg-slate-700 rounded-t-2xl mt-2 flex items-center justify-center font-bold text-slate-400 text-lg">
                        2
                      </div>
                    </div>
                  )}

                  {/* Top 1 - Gold */}
                  {top1 && (
                    <div 
                      onClick={() => onSelectStudent(top1)}
                      className="flex flex-col items-center cursor-pointer group -mt-4"
                    >
                      <div className="relative mb-2">
                        <img 
                          src={top1.avatar} 
                          alt={top1.fullName} 
                          className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-amber-400 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute -top-2 -right-2 bg-amber-400 text-amber-950 font-bold text-sm w-7 h-7 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm">
                          🥇
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-[120px] group-hover:text-blue-600">
                          {top1.fullName}
                        </div>
                        <div className="text-xs font-black text-amber-700 bg-amber-100 dark:bg-amber-900/60 dark:text-amber-300 px-2.5 py-0.5 rounded-full mt-0.5 inline-block">
                          +{top1.emulationScore} đ
                        </div>
                      </div>
                      <div className="w-full h-28 bg-gradient-to-t from-amber-400 to-amber-300 dark:from-amber-600 dark:to-amber-500 text-amber-950 rounded-t-2xl mt-2 flex items-center justify-center font-black text-2xl shadow-sm">
                        1
                      </div>
                    </div>
                  )}

                  {/* Top 3 - Bronze */}
                  {top3 && (
                    <div 
                      onClick={() => onSelectStudent(top3)}
                      className="flex flex-col items-center cursor-pointer group"
                    >
                      <div className="relative mb-2">
                        <img 
                          src={top3.avatar} 
                          alt={top3.fullName} 
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-4 ring-amber-700/40 shadow-md group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute -top-2 -right-2 bg-amber-700 text-white font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs">
                          🥉
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate max-w-[100px] group-hover:text-blue-600">
                          {top3.fullName}
                        </div>
                        <div className="text-[11px] font-black text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-full mt-0.5 inline-block">
                          +{top3.emulationScore} đ
                        </div>
                      </div>
                      <div className="w-full h-16 bg-amber-100 dark:bg-amber-950/60 rounded-t-2xl mt-2 flex items-center justify-center font-bold text-amber-800 dark:text-amber-300 text-base">
                        3
                      </div>
                    </div>
                  )}
                </div>

                {/* Next Ranks List */}
                <div className="divide-y divide-slate-100 dark:divide-slate-700/60 pt-2">
                  {highPointsStudents.slice(3, 6).map((st, idx) => (
                    <div 
                      key={st.id}
                      onClick={() => onSelectStudent(st)}
                      className="py-2.5 px-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-xs text-slate-400 w-5 text-center">
                          #{idx + 4}
                        </span>
                        <img src={st.avatar} alt={st.fullName} className="w-9 h-9 rounded-xl object-cover" />
                        <div>
                          <div className="font-bold text-xs text-slate-800 dark:text-slate-100">
                            {st.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {st.team} • STT: {st.stt}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl">
                          +{st.emulationScore} điểm
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* IF TEAM VIEW */}
            {rankingViewMode === 'team' && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Controls Bar for Team Ranking */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500 uppercase">Chế độ tính điểm:</span>
                    <div className="inline-flex p-0.5 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold">
                      <button
                        onClick={() => setTeamRankingMethod('AVERAGE')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          teamRankingMethod === 'AVERAGE' 
                            ? 'bg-blue-600 text-white shadow-xs font-black' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Điểm TB / Thành Viên
                      </button>
                      <button
                        onClick={() => setTeamRankingMethod('TOTAL')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          teamRankingMethod === 'TOTAL' 
                            ? 'bg-blue-600 text-white shadow-xs font-black' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Tổng Điểm Cả Tổ
                      </button>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => setIsTeamModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      + Thưởng/Phạt Tổ
                    </button>
                  )}
                </div>

                {/* Team Podium */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-2 max-w-xl mx-auto">
                  {/* Top 2 Team - Silver */}
                  {topTeam2 && (() => {
                    const theme = getTeamColorTheme(topTeam2.team);
                    return (
                      <div className="flex flex-col items-center group">
                        <div className="relative mb-2 text-center">
                          <span className="absolute -top-3 -right-2 bg-slate-300 text-slate-800 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs z-10">
                            🥈
                          </span>
                          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 ${theme.border} ${theme.cardBg} flex flex-col items-center justify-center shadow-md`}>
                            <Users className={`w-6 h-6 ${theme.text}`} />
                            <span className={`text-[10px] font-black ${theme.text}`}>{topTeam2.team}</span>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                            {topTeam2.team}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[100px]">
                            {getTeamLeaderName(topTeam2.team)}
                          </div>
                          <div className="text-[11px] font-black text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                            {teamRankingMethod === 'AVERAGE' ? `+${topTeam2.averageScore} đ/HS` : `+${topTeam2.netPoints} đ`}
                          </div>
                        </div>

                        <div className="w-full h-20 bg-slate-200 dark:bg-slate-700 rounded-t-2xl mt-2 flex items-center justify-center font-black text-slate-400 text-lg">
                          2
                        </div>
                      </div>
                    );
                  })()}

                  {/* Top 1 Team - Gold */}
                  {topTeam1 && (() => {
                    const theme = getTeamColorTheme(topTeam1.team);
                    return (
                      <div className="flex flex-col items-center group -mt-4">
                        <div className="relative mb-2 text-center">
                          <span className="absolute -top-3 -right-2 bg-amber-400 text-amber-950 font-black text-sm w-7 h-7 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-md z-10">
                            🥇
                          </span>
                          <div className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl border-2 ring-4 ring-amber-400 ${theme.border} ${theme.cardBg} flex flex-col items-center justify-center shadow-lg`}>
                            <Trophy className="w-8 h-8 text-amber-500" />
                            <span className="text-xs font-black text-amber-800 dark:text-amber-300">{topTeam1.team}</span>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                            {topTeam1.team}
                          </div>
                          <div className="text-[11px] text-amber-800 dark:text-amber-300 font-bold truncate max-w-[120px]">
                            {getTeamLeaderName(topTeam1.team)}
                          </div>
                          <div className="text-xs font-black text-amber-800 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-0.5 rounded-full mt-1 inline-block">
                            {teamRankingMethod === 'AVERAGE' ? `+${topTeam1.averageScore} đ/HS` : `+${topTeam1.netPoints} đ`}
                          </div>
                        </div>

                        <div className="w-full h-28 bg-gradient-to-t from-amber-400 to-amber-300 dark:from-amber-600 dark:to-amber-500 text-amber-950 rounded-t-2xl mt-2 flex items-center justify-center font-black text-2xl shadow-sm">
                          1
                        </div>
                      </div>
                    );
                  })()}

                  {/* Top 3 Team - Bronze */}
                  {topTeam3 && (() => {
                    const theme = getTeamColorTheme(topTeam3.team);
                    return (
                      <div className="flex flex-col items-center group">
                        <div className="relative mb-2 text-center">
                          <span className="absolute -top-3 -right-2 bg-amber-700 text-white font-black text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs z-10">
                            🥉
                          </span>
                          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 ${theme.border} ${theme.cardBg} flex flex-col items-center justify-center shadow-md`}>
                            <Users className={`w-6 h-6 ${theme.text}`} />
                            <span className={`text-[10px] font-black ${theme.text}`}>{topTeam3.team}</span>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                            {topTeam3.team}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[100px]">
                            {getTeamLeaderName(topTeam3.team)}
                          </div>
                          <div className="text-[11px] font-black text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full mt-1 inline-block">
                            {teamRankingMethod === 'AVERAGE' ? `+${topTeam3.averageScore} đ/HS` : `+${topTeam3.netPoints} đ`}
                          </div>
                        </div>

                        <div className="w-full h-16 bg-amber-100 dark:bg-amber-950/60 rounded-t-2xl mt-2 flex items-center justify-center font-bold text-amber-800 dark:text-amber-300 text-base">
                          3
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Team Ranking Summary Table */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <th className="p-2.5 text-center w-16">Thứ Hạng</th>
                        <th className="p-2.5">Tên Tổ & Cán Bộ</th>
                        <th className="p-2.5 text-center">Sĩ Số</th>
                        <th className="p-2.5 text-right text-emerald-600">Cộng (+)</th>
                        <th className="p-2.5 text-right text-rose-600">Trừ (-)</th>
                        <th className="p-2.5 text-right font-black text-blue-600">
                          {teamRankingMethod === 'AVERAGE' ? 'ĐTB / HS' : 'Tổng Điểm Net'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {teamStats.map((t) => {
                        const theme = getTeamColorTheme(t.team);
                        const leader = getTeamLeaderName(t.team);
                        return (
                          <tr key={t.team} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                            <td className="p-2.5 text-center font-black">
                              {t.rank === 1 ? '🥇 Hạng 1' : t.rank === 2 ? '🥈 Hạng 2' : t.rank === 3 ? '🥉 Hạng 3' : `Hạng ${t.rank}`}
                            </td>
                            <td className="p-2.5 font-bold text-slate-800 dark:text-slate-100">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${theme.badge}`}>
                                  {t.team}
                                </span>
                                <div>
                                  <div className="font-extrabold">{t.team}</div>
                                  <div className="text-[10px] text-slate-400">Tổ trưởng: {leader}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-2.5 text-center font-semibold text-slate-500">
                              {t.memberCount} em
                            </td>
                            <td className="p-2.5 text-right font-bold text-emerald-600">
                              +{t.addedPoints}
                            </td>
                            <td className="p-2.5 text-right font-bold text-rose-600">
                              -{t.deductedPoints}
                            </td>
                            <td className="p-2.5 text-right font-black text-blue-600 text-sm">
                              {teamRankingMethod === 'AVERAGE' ? `+${t.averageScore} đ/HS` : `+${t.netPoints} đ`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            <button
              onClick={() => onNavigateTab('emulation_summary')}
              className="w-full mt-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
            >
              Xem Bảng Tổng Hợp Thi Đua Đầy Đủ
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Col: Needs Attention Watchlist & Daily Tasks */}
        <div className="space-y-6">
          {/* Watchlist Section */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-amber-200 dark:border-amber-800/60 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-amber-500" />
                Học Sinh Cần Quan Tâm ({needsAttentionList.length})
              </h3>
              <button 
                onClick={() => onNavigateTab('needs_attention')}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                Xem hết
              </button>
            </div>

            {needsAttentionList.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Chưa có học sinh nào cần lưu ý đặc biệt.
              </div>
            ) : (
              <div className="space-y-3">
                {needsAttentionList.slice(0, 4).map((st) => (
                  <div
                    key={st.id}
                    onClick={() => onSelectStudent(st)}
                    className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 hover:border-amber-400 transition-colors cursor-pointer flex items-start gap-3"
                  >
                    <img src={st.avatar} alt={st.fullName} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center justify-between">
                        <span className="truncate">{st.fullName}</span>
                        <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full shrink-0">
                          {st.needsAttentionCategory || 'Cần quan tâm'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 italic">
                        "{st.needsAttentionNote || st.statusNote}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* NEW SECTION: NHIỆM VỤ LỚP CẬP NHẬT (Replaces Hoạt Động Sắp Tới & Old Task Block) */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-indigo-100 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    📋 Nhiệm Vụ & Kế Hoạch Lớp Cần Thực Hiện
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Phân công bộ phận phụ trách, hạn chót và trạng thái hoàn thành
                  </p>
                </div>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleOpenAddTaskModal}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm nhiệm vụ mới</span>
                </button>
              )}
            </div>

            {/* Task List */}
            <div className="space-y-3">
              {taskList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Chưa có nhiệm vụ nào được tạo. {isAdmin && 'Bấm "Thêm nhiệm vụ mới" để tạo nhiệm vụ cho lớp.'}
                </div>
              ) : (
                taskList.map((t) => {
                  const isCompleted = t.completed || t.status === 'Hoàn thành';
                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCompleted
                          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                          : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        {/* Checkbox */}
                        <button
                          type="button"
                          disabled={!isAdmin}
                          onClick={() => handleToggleTaskItem(t)}
                          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors mt-0.5 sm:mt-0 ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                          } ${!isAdmin ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                          title={isAdmin ? (isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành') : 'Trạng thái nhiệm vụ'}
                        >
                          {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className={`font-bold text-xs text-slate-800 dark:text-slate-100 ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                            {t.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-900/50">
                              👤 {t.assignee || 'Ban cán sự'}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 font-mono">
                              🗓️ Hạn: {t.dueDate || 'Hôm nay'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/60">
                        {/* Status Badge */}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {isCompleted ? '✓ Đã hoàn thành' : '⏳ Đang thực hiện'}
                        </span>

                        {/* Admin actions */}
                        {isAdmin && (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditTaskModal(t)}
                              className="p-1.5 rounded-xl text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                              title="Sửa nhiệm vụ"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTaskItem(t.id)}
                              className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              title="Xóa nhiệm vụ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => onNavigateTab('tasks')}
              className="w-full mt-2 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
            >
              Quản Lý Chi Tiết Tất Cả Nhiệm Vụ Lớp
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Thêm / Sửa Nhiệm Vụ */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-indigo-500" />
                {editingTask ? 'Chỉnh Sửa Nhiệm Vụ Lớp' : 'Thêm Nhiệm Vụ Mới Cho Lớp'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Tên công việc / Nhiệm vụ *
                </label>
                <input
                  type="text"
                  required
                  value={taskFormTitle}
                  onChange={(e) => setTaskFormTitle(e.target.value)}
                  placeholder="Ví dụ: Thu sổ liên lạc, Trực nhật tuần, Nộp danh sách BHYT..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Người / Tổ phụ trách
                  </label>
                  <input
                    type="text"
                    list="assignee-suggestions"
                    value={taskFormAssignee}
                    onChange={(e) => setTaskFormAssignee(e.target.value)}
                    placeholder="Ban cán sự, Tổ 1, Cả lớp..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <datalist id="assignee-suggestions">
                    <option value="Ban cán sự lớp" />
                    <option value="Tổ 1" />
                    <option value="Tổ 2" />
                    <option value="Tổ 3" />
                    <option value="Tổ 4" />
                    <option value="Cả lớp" />
                    <option value="Lớp trưởng" />
                    <option value="Lớp phó" />
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Hạn hoàn thành
                  </label>
                  <input
                    type="date"
                    value={taskFormDueDate}
                    onChange={(e) => setTaskFormDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Trạng thái
                </label>
                <select
                  value={taskFormStatus}
                  onChange={(e) => setTaskFormStatus(e.target.value as 'Đang làm' | 'Hoàn thành' | 'Chưa làm')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Đang làm">⏳ Đang thực hiện</option>
                  <option value="Hoàn thành">✓ Đã hoàn thành</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md"
                >
                  {editingTask ? 'Lưu cập nhật' : 'Tạo nhiệm vụ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Thưởng / Phạt Tổ */}
      {onSubmitTeamEmulation && (
        <TeamEmulationModal
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
          students={studentList}
          onSubmitTeamEmulation={onSubmitTeamEmulation}
          classRulesConfig={classRulesConfig}
        />
      )}
    </div>
  );
};
