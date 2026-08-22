import React, { useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, Users, Award, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { Student, EmulationLog } from '../types';
import { computeStudentStatsForPeriod, computeTeamStatsForPeriod, parseLogDate } from '../utils/emulationUtils';

interface MonthlyEmulationViewProps {
  students?: Student[];
  emulationLogs?: EmulationLog[];
  onSelectStudent: (student: Student) => void;
}

const MONTH_OPTIONS = [
  { month: 8, year: 2026, label: 'Tháng 8/2026' },
  { month: 9, year: 2026, label: 'Tháng 9/2026' },
  { month: 10, year: 2026, label: 'Tháng 10/2026' },
  { month: 11, year: 2026, label: 'Tháng 11/2026' },
  { month: 12, year: 2026, label: 'Tháng 12/2026' },
  { month: 1, year: 2027, label: 'Tháng 1/2027' },
  { month: 2, year: 2027, label: 'Tháng 2/2027' },
  { month: 3, year: 2027, label: 'Tháng 3/2027' },
  { month: 4, year: 2027, label: 'Tháng 4/2027' },
  { month: 5, year: 2027, label: 'Tháng 5/2027' },
];

export const MonthlyEmulationView: React.FC<MonthlyEmulationViewProps> = ({
  students = [],
  emulationLogs = [],
  onSelectStudent,
}) => {
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(0);

  const studentList = Array.isArray(students) ? students : [];
  const logList = Array.isArray(emulationLogs) ? emulationLogs : [];

  const currentMonth = MONTH_OPTIONS[selectedMonthIdx];

  // Filter logs in selected month
  const monthFilter = (d: Date) => d.getMonth() + 1 === currentMonth.month && d.getFullYear() === currentMonth.year;

  const monthStudentStats = computeStudentStatsForPeriod(
    studentList,
    logList,
    monthFilter
  );

  const monthTeamStats = computeTeamStatsForPeriod(
    studentList,
    logList,
    monthFilter
  );

  const totalPos = monthStudentStats.reduce((sum, s) => sum + s.addedPoints, 0);
  const totalNeg = monthStudentStats.reduce((sum, s) => sum + s.deductedPoints, 0);
  const netMonthPoints = totalPos - totalNeg;
  const totalPosCount = monthStudentStats.reduce((sum, s) => sum + s.positiveCount, 0);
  const totalNegCount = monthStudentStats.reduce((sum, s) => sum + s.negativeCount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold mb-2">
            <Calendar className="w-3.5 h-3.5 text-amber-300" /> Báo Cáo Thi Đua Hàng Tháng
          </span>
          <h2 className="text-2xl font-black tracking-tight">
            📆 THI ĐUA {currentMonth.label.toUpperCase()}
          </h2>
          <p className="text-emerald-100 text-xs mt-1">
            Tổng hợp điểm rèn luyện phát sinh trong tháng, xếp hạng học sinh và đánh giá phong trào tập thể tổ.
          </p>
        </div>

        {/* Month Selector Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMonthIdx}
            onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
            className="px-4 py-2.5 rounded-2xl bg-white text-emerald-950 font-black text-xs shadow-md focus:outline-none"
          >
            {MONTH_OPTIONS.map((m, idx) => (
              <option key={m.label} value={idx}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs bg-emerald-50/20">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
            <span>TỔNG ĐIỂM CỘNG</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            +{totalPos}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalPosCount} lượt tuyên dương trong tháng
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-xs bg-rose-50/20">
          <div className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center justify-between">
            <span>TỔNG ĐIỂM TRỪ</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
            -{totalNeg}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalNegCount} lượt nhắc nhở trong tháng
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-3xl shadow-sm">
          <div className="text-xs font-bold text-emerald-100">
            ĐIỂM RÒNG THÁNG
          </div>
          <div className="text-3xl font-black mt-2">
            {netMonthPoints > 0 ? `+${netMonthPoints}` : netMonthPoints}
          </div>
          <div className="text-[11px] text-emerald-200 mt-1">
            Điểm tháng = Tổng cộng - Tổng trừ
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-amber-200/80 dark:border-amber-800/60 shadow-xs">
          <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
            <Trophy className="w-4 h-4 text-amber-500" /> TỔ ĐẪN ĐẦU THÁNG
          </div>
          <div className="text-xl font-black text-slate-800 dark:text-slate-100 mt-2">
            {monthTeamStats[0]?.team || 'Tổ 1'}
          </div>
          <div className="text-[11px] font-bold text-amber-600 mt-0.5">
            TB: +{monthTeamStats[0]?.averageScore || 0} điểm/HS
          </div>
        </div>
      </div>

      {/* Grid Layout: Student Ranking Table & Team Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Ranking Table (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center justify-between">
            <span>Bảng Xếp Hạng Thi Đua Học Sinh {currentMonth.label}</span>
            <span className="text-xs text-slate-400 font-normal">Sắp xếp theo Điểm ròng tháng</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 text-center w-12">Hạng</th>
                  <th className="p-3">Học Sinh</th>
                  <th className="p-3 text-center">Tổ</th>
                  <th className="p-3 text-right text-emerald-600">Cộng (+)</th>
                  <th className="p-3 text-right text-rose-600">Trừ (-)</th>
                  <th className="p-3 text-right font-black">Điểm Tháng</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {monthStudentStats.map((st) => (
                  <tr
                    key={st.student.id}
                    onClick={() => onSelectStudent(st.student)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer"
                  >
                    <td className="p-3 text-center">
                      <span className={`w-7 h-7 rounded-xl font-black text-xs inline-flex items-center justify-center ${
                        st.rank === 1 ? 'bg-amber-400 text-amber-950' :
                        st.rank === 2 ? 'bg-slate-300 text-slate-800' :
                        st.rank === 3 ? 'bg-amber-700 text-white' :
                        'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}>
                        {st.rank}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <img src={st.student.avatar} alt={st.student.fullName} className="w-8 h-8 rounded-xl object-cover" />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-100">
                            {st.student.fullName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Lượt cộng: {st.positiveCount} • Lượt trừ: {st.negativeCount}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-center font-medium text-slate-500">
                      {st.student.team}
                    </td>

                    <td className="p-3 text-right font-black text-emerald-600">
                      +{st.addedPoints}
                    </td>

                    <td className="p-3 text-right font-black text-rose-600">
                      -{st.deductedPoints}
                    </td>

                    <td className="p-3 text-right">
                      <span className={`px-2.5 py-1 rounded-xl font-black text-xs ${
                        st.netPoints > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        st.netPoints < 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {st.netPoints > 0 ? `+${st.netPoints}` : st.netPoints}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Team Rankings (1 col) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            Xếp Hạng Tổ Trong {currentMonth.label}
          </h3>

          <div className="space-y-3">
            {monthTeamStats.map((t) => (
              <div key={t.team} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center ${
                    t.rank === 1 ? 'bg-amber-400 text-amber-950' :
                    t.rank === 2 ? 'bg-slate-300 text-slate-800' :
                    t.rank === 3 ? 'bg-amber-700 text-white' :
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : t.rank === 3 ? '🥉' : t.rank}
                  </span>
                  <div>
                    <div className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                      {t.team}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {t.memberCount} học sinh • Ròng: {t.netPoints > 0 ? `+${t.netPoints}` : t.netPoints}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Điểm TB/HS</span>
                  <span className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                    +{t.averageScore} đ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
