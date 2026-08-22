import React, { useState } from 'react';
import { Award, Trophy, TrendingUp, TrendingDown, Sparkles, Star } from 'lucide-react';
import { Student, EmulationLog } from '../types';
import { computeStudentStatsForPeriod, parseLogDate } from '../utils/emulationUtils';

interface SemesterEmulationViewProps {
  students?: Student[];
  emulationLogs?: EmulationLog[];
  onSelectStudent: (student: Student) => void;
}

export const SemesterEmulationView: React.FC<SemesterEmulationViewProps> = ({
  students = [],
  emulationLogs = [],
  onSelectStudent,
}) => {
  const [period, setPeriod] = useState<'hk1' | 'hk2' | 'year'>('hk1');

  const studentList = Array.isArray(students) ? students : [];
  const logList = Array.isArray(emulationLogs) ? emulationLogs : [];

  // Define semester date boundaries
  // HK1: Aug 17, 2026 to Jan 15, 2027
  // HK2: Jan 16, 2027 to May 31, 2027
  const filterFn = (logDate: Date) => {
    const month = logDate.getMonth() + 1;
    const year = logDate.getFullYear();

    if (period === 'hk1') {
      return (year === 2026 && month >= 8) || (year === 2027 && month === 1);
    } else if (period === 'hk2') {
      return year === 2027 && month >= 2 && month <= 5;
    } else {
      // Full year
      return (year === 2026 && month >= 8) || (year === 2027 && month <= 6);
    }
  };

  const periodStats = computeStudentStatsForPeriod(
    studentList,
    logList,
    filterFn
  );

  const totalPos = periodStats.reduce((sum, s) => sum + s.addedPoints, 0);
  const totalNeg = periodStats.reduce((sum, s) => sum + s.deductedPoints, 0);
  const netPoints = totalPos - totalNeg;
  const totalPosCount = periodStats.reduce((sum, s) => sum + s.positiveCount, 0);
  const totalNegCount = periodStats.reduce((sum, s) => sum + s.negativeCount, 0);

  const top3 = periodStats.slice(0, 3);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 rounded-3xl p-6 text-white shadow-lg shadow-purple-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-300" /> Tổng Kết Thi Đua Rèn Luyện Toàn Khóa
          </span>
          <h2 className="text-2xl font-black tracking-tight">
            🏆 THI ĐUA {period === 'hk1' ? 'HỌC KỲ I' : period === 'hk2' ? 'HỌC KỲ II' : 'CẢ NĂM HỌC 2026-2027'}
          </h2>
          <p className="text-purple-100 text-xs mt-1">
            Kết quả thi đua rèn luyện tổng hợp toàn diện. Lưu ý: Đây hoàn toàn là điểm thi đua/rèn luyện nề nếp, không phải điểm số học tập môn học.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center bg-black/20 p-1.5 rounded-2xl backdrop-blur shrink-0">
          <button
            onClick={() => setPeriod('hk1')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              period === 'hk1' ? 'bg-white text-purple-900 shadow-md' : 'text-white/80 hover:text-white'
            }`}
          >
            Học Kỳ I
          </button>
          <button
            onClick={() => setPeriod('hk2')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              period === 'hk2' ? 'bg-white text-purple-900 shadow-md' : 'text-white/80 hover:text-white'
            }`}
          >
            Học Kỳ II
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              period === 'year' ? 'bg-white text-purple-900 shadow-md' : 'text-white/80 hover:text-white'
            }`}
          >
            Cả Năm
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
          <span className="text-xs font-bold text-emerald-600 block uppercase">TỔNG ĐIỂM CỘNG</span>
          <div className="text-3xl font-black text-emerald-600 mt-2">+{totalPos}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{totalPosCount} lượt khen thưởng</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-xs">
          <span className="text-xs font-bold text-rose-600 block uppercase">TỔNG ĐIỂM TRỪ</span>
          <div className="text-3xl font-black text-rose-600 mt-2">-{totalNeg}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{totalNegCount} lượt nhắc nhở</span>
        </div>

        <div className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-5 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-purple-200 block uppercase">ĐIỂM RÒNG HỌC KỲ</span>
          <div className="text-3xl font-black mt-2">{netPoints > 0 ? `+${netPoints}` : netPoints}</div>
          <span className="text-[11px] text-purple-200 mt-1 block">Điểm thi đua rèn luyện chung</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-amber-200/80 dark:border-amber-800/60 shadow-xs lg:col-span-2 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-2xl shrink-0">
            🥇
          </div>
          <div>
            <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase block">Học sinh dẫn đầu thi đua học kỳ</span>
            <strong className="text-base font-black text-slate-800 dark:text-slate-100">
              {top3[0]?.student.fullName} ({top3[0]?.student.team})
            </strong>
            <span className="block text-xs font-bold text-emerald-600 mt-0.5">
              +{top3[0]?.netPoints} điểm rèn luyện ròng
            </span>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-slate-100">
          Bảng Xếp Hạng Thi Đua Rèn Luyện {period === 'hk1' ? 'Học Kỳ I' : period === 'hk2' ? 'Học Kỳ II' : 'Cả Năm'}
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
                <th className="p-3 text-center">Số Lượt Cộng/Trừ</th>
                <th className="p-3 text-right font-black">Điểm Rèn Luyện</th>
                <th className="p-3 text-center">Thành Tích Nổi Bật</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {periodStats.map((st) => (
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
                          {st.student.studentCode}
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

                  <td className="p-3 text-center text-slate-500 font-medium">
                    <span className="text-emerald-600 font-bold">{st.positiveCount} lần cộng</span> / <span className="text-rose-600 font-bold">{st.negativeCount} lần trừ</span>
                  </td>

                  <td className="p-3 text-right">
                    <span className={`px-2.5 py-1 rounded-xl font-black text-xs ${
                      st.netPoints > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      st.netPoints < 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {st.netPoints > 0 ? `+${st.netPoints}` : st.netPoints} đ
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    {st.rank <= 3 ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                        🌟 Gương mẫu tiêu biểu
                      </span>
                    ) : st.netPoints >= 10 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                        ✨ Hoàn thành xuất sắc
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Thường</span>
                    )}
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
