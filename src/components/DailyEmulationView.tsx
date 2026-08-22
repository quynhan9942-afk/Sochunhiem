import React, { useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, Users, Search, Filter, Award, Sparkles, AlertCircle } from 'lucide-react';
import { Student, EmulationLog, TeamNumber } from '../types';
import { parseLogDate } from '../utils/emulationUtils';

interface DailyEmulationViewProps {
  students?: Student[];
  emulationLogs?: EmulationLog[];
  onSelectStudent: (student: Student) => void;
  onOpenAddPoint: (student: Student) => void;
  onOpenDeductPoint: (student: Student) => void;
}

export const DailyEmulationView: React.FC<DailyEmulationViewProps> = ({
  students = [],
  emulationLogs = [],
  onSelectStudent,
  onOpenAddPoint,
  onOpenDeductPoint,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const studentList = Array.isArray(students) ? students : [];
  const logList = Array.isArray(emulationLogs) ? emulationLogs : [];

  // Filter logs for today (or selected date)
  const todayStr = new Date().toLocaleDateString('vi-VN');
  
  // Get all logs for today
  const todayLogs = logList.filter(log => {
    const logDate = parseLogDate(log.timestamp);
    const isToday = logDate.toDateString() === new Date().toDateString();
    return isToday;
  });

  // Calculate daily stats
  const totalPositive = todayLogs
    .filter(l => l.scoreDiff > 0)
    .reduce((sum, l) => sum + l.scoreDiff, 0);

  const totalNegative = todayLogs
    .filter(l => l.scoreDiff < 0)
    .reduce((sum, l) => sum + Math.abs(l.scoreDiff), 0);

  const netPoints = totalPositive - totalNegative;

  // Find student with most positive and negative points today
  const pointsPerStudentToday: Record<string, { pos: number; neg: number; student: Student | undefined }> = {};
  
  todayLogs.forEach(log => {
    if (!pointsPerStudentToday[log.studentId]) {
      const st = studentList.find(s => s.id === log.studentId);
      pointsPerStudentToday[log.studentId] = { pos: 0, neg: 0, student: st };
    }
    if (log.scoreDiff > 0) pointsPerStudentToday[log.studentId].pos += log.scoreDiff;
    if (log.scoreDiff < 0) pointsPerStudentToday[log.studentId].neg += Math.abs(log.scoreDiff);
  });

  const sortedByPos = Object.values(pointsPerStudentToday).sort((a, b) => b.pos - a.pos);
  const sortedByNeg = Object.values(pointsPerStudentToday).sort((a, b) => b.neg - a.neg);

  const topPosStudent = sortedByPos[0]?.pos > 0 ? sortedByPos[0] : null;
  const topNegStudent = sortedByNeg[0]?.neg > 0 ? sortedByNeg[0] : null;

  // Filter today logs list by user criteria
  const filteredLogs = todayLogs.filter(log => {
    const student = studentList.find(s => s.id === log.studentId);
    
    // Team filter
    if (selectedTeam !== 'all' && student?.team !== selectedTeam) return false;
    
    // Type filter
    if (selectedType === 'positive' && log.scoreDiff <= 0) return false;
    if (selectedType === 'negative' && log.scoreDiff >= 0) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = log.studentName?.toLowerCase().includes(q) || student?.fullName.toLowerCase().includes(q);
      const reasonMatch = log.reasonCategory?.toLowerCase().includes(q) || log.reasonDetail?.toLowerCase().includes(q);
      if (!nameMatch && !reasonMatch) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold mb-2">
            <Calendar className="w-4 h-4 text-amber-300" /> Báo Cáo Thi Đua Hàng Ngày
          </span>
          <h2 className="text-2xl font-black tracking-tight">
            📅 THI ĐUA HÔM NAY ({todayStr})
          </h2>
          <p className="text-blue-100 text-xs mt-1">
            Tổng hợp ghi nhận thưởng phạt, di chuyển điểm thi đua và giao dịch rèn luyện trong ngày của học sinh.
          </p>
        </div>
      </div>

      {/* Daily Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Positive */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <span>ĐIỂM CỘNG HÔM NAY</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            +{totalPositive}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {todayLogs.filter(l => l.scoreDiff > 0).length} lượt cộng điểm
          </div>
        </div>

        {/* Total Negative */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-xs bg-rose-50/20">
          <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-400">
            <span>ĐIỂM TRỪ HÔM NAY</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
            -{totalNegative}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {todayLogs.filter(l => l.scoreDiff < 0).length} lượt trừ điểm
          </div>
        </div>

        {/* Net Points */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-5 rounded-3xl shadow-sm">
          <div className="text-xs font-bold text-indigo-100">
            ĐIỂM RÒNG HÔM NAY
          </div>
          <div className="text-3xl font-black mt-2">
            {netPoints > 0 ? `+${netPoints}` : netPoints}
          </div>
          <div className="text-[11px] text-indigo-200 mt-1">
            Tổng thay đổi của cả lớp
          </div>
        </div>

        {/* Top Rewarded Student */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-amber-200/80 dark:border-amber-800/60 shadow-xs">
          <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
            <Award className="w-4 h-4 text-amber-500" /> CỘNG NHIỀU NHẤT
          </div>
          {topPosStudent?.student ? (
            <div className="mt-2 flex items-center gap-2">
              <img src={topPosStudent.student.avatar} alt={topPosStudent.student.fullName} className="w-9 h-9 rounded-xl object-cover" />
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                  {topPosStudent.student.fullName}
                </div>
                <div className="text-[11px] font-black text-emerald-600">
                  +{topPosStudent.pos} điểm
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-2 italic">Chưa có lượt cộng</div>
          )}
        </div>

        {/* Top Penalized Student */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4 text-rose-500" /> TRỪ NHIỀU NHẤT
          </div>
          {topNegStudent?.student ? (
            <div className="mt-2 flex items-center gap-2">
              <img src={topNegStudent.student.avatar} alt={topNegStudent.student.fullName} className="w-9 h-9 rounded-xl object-cover" />
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                  {topNegStudent.student.fullName}
                </div>
                <div className="text-[11px] font-black text-rose-600">
                  -{topNegStudent.neg} điểm
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-2 italic">Không có lượt trừ</div>
          )}
        </div>
      </div>

      {/* Transaction List with Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            Lịch Sử Giao Dịch Điểm Thi Đua Hôm Nay ({filteredLogs.length})
          </h3>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên HS, lý do..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            {/* Team Filter */}
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="all">Tất cả tổ</option>
              <option value="Tổ 1">Tổ 1</option>
              <option value="Tổ 2">Tổ 2</option>
              <option value="Tổ 3">Tổ 3</option>
              <option value="Tổ 4">Tổ 4</option>
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="all">Tất cả giao dịch</option>
              <option value="positive">Chỉ điểm cộng (+)</option>
              <option value="negative">Chỉ điểm trừ (-)</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            Chưa có giao dịch thi đua nào ghi nhận hôm nay phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {filteredLogs.map((log) => {
              const student = studentList.find(s => s.id === log.studentId);
              return (
                <div key={log.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 px-2 rounded-2xl transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={student?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'} alt={log.studentName} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <button
                          onClick={() => student && onSelectStudent(student)}
                          className="hover:text-blue-600 dark:hover:text-blue-400 text-left"
                        >
                          {log.studentName || student?.fullName}
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({student?.team || 'Tổ 1'})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        <strong className="text-slate-800 dark:text-slate-200">{log.reasonCategory}:</strong> {log.reasonDetail}
                      </p>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        ⏰ {log.timestamp} • Người thực hiện: {log.teacherName}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`px-3 py-1 rounded-xl text-xs font-black inline-block ${
                      log.scoreDiff > 0
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {log.scoreDiff > 0 ? `+${log.scoreDiff}` : log.scoreDiff} điểm
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
