import React, { useState } from 'react';
import { Trophy, Users, Award, Calendar, ChevronRight } from 'lucide-react';
import { Student, EmulationLog, TeamNumber } from '../types';
import { computeTeamStatsForPeriod, getWeekDateRange } from '../utils/emulationUtils';

interface TeamEmulationViewProps {
  students?: Student[];
  emulationLogs?: EmulationLog[];
  onSelectStudent?: (student: Student) => void;
}

export const TeamEmulationView: React.FC<TeamEmulationViewProps> = ({
  students = [],
  emulationLogs = [],
  onSelectStudent,
}) => {
  const [scope, setScope] = useState<'week' | 'month' | 'semester'>('week');
  const [weekNum, setWeekNum] = useState<number>(1);
  const [monthNum, setMonthNum] = useState<number>(8);

  const studentList = Array.isArray(students) ? students : [];
  const logList = Array.isArray(emulationLogs) ? emulationLogs : [];

  // Filter function by scope
  const filterFn = (logDate: Date) => {
    if (scope === 'week') {
      const { startDate, endDate } = getWeekDateRange(weekNum);
      return logDate >= startDate && logDate <= endDate;
    } else if (scope === 'month') {
      return logDate.getMonth() + 1 === monthNum;
    } else {
      // Semester 1
      const m = logDate.getMonth() + 1;
      return m >= 8 || m === 1;
    }
  };

  const teamStats = computeTeamStatsForPeriod(
    studentList,
    logList,
    filterFn
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 text-white shadow-lg shadow-amber-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-200" /> Bảng Xếp Hạng Phong Trào Tập Thể
          </span>
          <h2 className="text-2xl font-black tracking-tight">
            🏆 BẢNG THI ĐUA CÁC TỔ
          </h2>
          <p className="text-amber-100 text-xs mt-1">
            So sánh phong trào nề nếp thi đua giữa các tổ dựa trên Điểm Trung Bình/Học Sinh để đảm bảo công bằng khi quy mô sĩ số khác nhau.
          </p>
        </div>

        {/* Scope Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-black/20 p-1.5 rounded-2xl backdrop-blur">
          <button
            onClick={() => setScope('week')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              scope === 'week' ? 'bg-white text-amber-950 shadow-md' : 'text-white/80 hover:text-white'
            }`}
          >
            Theo Tuần
          </button>
          <button
            onClick={() => setScope('month')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              scope === 'month' ? 'bg-white text-amber-950 shadow-md' : 'text-white/80 hover:text-white'
            }`}
          >
            Theo Tháng
          </button>
          <button
            onClick={() => setScope('semester')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              scope === 'semester' ? 'bg-white text-amber-950 shadow-md' : 'text-white/80 hover:text-white'
            }`}
          >
            Học Kỳ I
          </button>
        </div>
      </div>

      {/* Sub Filter Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-500 uppercase tracking-wider">
          Phạm vi xem thi đua:
        </span>

        {scope === 'week' && (
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">Chọn Tuần:</span>
            <select
              value={weekNum}
              onChange={(e) => setWeekNum(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
            >
              {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>Tuần {w}</option>
              ))}
            </select>
          </div>
        )}

        {scope === 'month' && (
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">Chọn Tháng:</span>
            <select
              value={monthNum}
              onChange={(e) => setMonthNum(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
            >
              <option value={8}>Tháng 8/2026</option>
              <option value={9}>Tháng 9/2026</option>
              <option value={10}>Tháng 10/2026</option>
              <option value={11}>Tháng 11/2026</option>
              <option value={12}>Tháng 12/2026</option>
              <option value={1}>Tháng 1/2027</option>
            </select>
          </div>
        )}

        {scope === 'semester' && (
          <span className="font-bold text-blue-600 dark:text-blue-400">
            Tổng hợp toàn bộ Học kỳ I (2026 - 2027)
          </span>
        )}
      </div>

      {/* Cards Display for Teams */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {teamStats.map((t) => (
          <div
            key={t.team}
            className={`p-5 rounded-3xl border shadow-xs relative flex flex-col justify-between ${
              t.rank === 1
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-amber-300 dark:border-amber-800'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center ${
                  t.rank === 1 ? 'bg-amber-400 text-amber-950' :
                  t.rank === 2 ? 'bg-slate-300 text-slate-800' :
                  t.rank === 3 ? 'bg-amber-700 text-white' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : t.rank === 3 ? '🥉' : t.rank}
                </span>
                <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                  {t.team}
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {t.memberCount} học sinh
              </span>
            </div>

            <div className="my-4 space-y-2 text-xs">
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                <span className="font-semibold">Tổng điểm cộng:</span>
                <strong className="font-black">+{t.addedPoints} đ</strong>
              </div>
              <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                <span className="font-semibold">Tổng điểm trừ:</span>
                <strong className="font-black">-{t.deductedPoints} đ</strong>
              </div>
              <div className="flex justify-between items-center text-slate-800 dark:text-slate-200 pt-1 border-t border-slate-100 dark:border-slate-700">
                <span className="font-bold">Tổng điểm ròng:</span>
                <strong className="font-black text-sm">{t.netPoints > 0 ? `+${t.netPoints}` : t.netPoints} đ</strong>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900/60 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">ĐIỂM TRUNG BÌNH / HỌC SINH</span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                +{t.averageScore} đ
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-slate-100">
          Bảng So Sánh Chi Tiết Thi Đua Các Tổ
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 text-center w-16">Xếp Hạng</th>
                <th className="p-3">Tên Tổ</th>
                <th className="p-3 text-center">Sĩ Số</th>
                <th className="p-3 text-right text-emerald-600">Cộng (+)</th>
                <th className="p-3 text-right text-rose-600">Trừ (-)</th>
                <th className="p-3 text-right font-bold">Tổng Điểm Ròng</th>
                <th className="p-3 text-right font-black text-blue-600">Điểm TB / HS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {teamStats.map((t) => (
                <tr key={t.team} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="p-3 text-center">
                    <span className="font-black text-sm">
                      {t.rank === 1 ? '🥇 Hạng 1' : t.rank === 2 ? '🥈 Hạng 2' : t.rank === 3 ? '🥉 Hạng 3' : `Hạng ${t.rank}`}
                    </span>
                  </td>
                  <td className="p-3 font-extrabold text-slate-800 dark:text-slate-100">
                    {t.team}
                  </td>
                  <td className="p-3 text-center font-medium text-slate-500">
                    {t.memberCount} em
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-600">
                    +{t.addedPoints}
                  </td>
                  <td className="p-3 text-right font-bold text-rose-600">
                    -{t.deductedPoints}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">
                    {t.netPoints > 0 ? `+${t.netPoints}` : t.netPoints} đ
                  </td>
                  <td className="p-3 text-right font-black text-blue-600 text-sm">
                    +{t.averageScore} đ/HS
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
