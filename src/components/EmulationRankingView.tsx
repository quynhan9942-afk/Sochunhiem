import React, { useState } from 'react';
import { Trophy, Medal, Award, Flame, Search, Filter } from 'lucide-react';
import { Student } from '../types';

interface EmulationRankingViewProps {
  students?: Student[];
  onSelectStudent: (student: Student) => void;
}

export const EmulationRankingView: React.FC<EmulationRankingViewProps> = ({
  students = [],
  onSelectStudent,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'semester'>('week');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  const studentList = Array.isArray(students) ? students : [];

  const filteredStudents = studentList
    .filter(s => teamFilter === 'all' || s.team === teamFilter)
    .sort((a, b) => b.emulationScore - a.emulationScore);

  const top1 = filteredStudents[0];
  const top2 = filteredStudents[1];
  const top3 = filteredStudents[2];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-lg shadow-amber-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold mb-2">
            🏆 Bảng Vàng Rèn Luyện Lớp
          </span>
          <h2 className="text-2xl font-black">
            Bảng Xếp Hạng Thi Đua Học Sinh
          </h2>
          <p className="text-amber-100 text-xs mt-1">
            Ghi nhận và vinh danh những cá nhân xuất sắc có thành tích rèn luyện tốt trong tuần/tháng
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Tabs */}
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-2xl text-xs font-bold border border-white/20">
            <button
              onClick={() => setFilterPeriod('week')}
              className={`px-3 py-1.5 rounded-xl transition-all ${filterPeriod === 'week' ? 'bg-white text-amber-900 shadow-xs' : 'text-amber-100 hover:text-white'}`}
            >
              Theo Tuần
            </button>
            <button
              onClick={() => setFilterPeriod('month')}
              className={`px-3 py-1.5 rounded-xl transition-all ${filterPeriod === 'month' ? 'bg-white text-amber-900 shadow-xs' : 'text-amber-100 hover:text-white'}`}
            >
              Theo Tháng
            </button>
            <button
              onClick={() => setFilterPeriod('semester')}
              className={`px-3 py-1.5 rounded-xl transition-all ${filterPeriod === 'semester' ? 'bg-white text-amber-900 shadow-xs' : 'text-amber-100 hover:text-white'}`}
            >
              Học Kỳ
            </button>
          </div>

          {/* Team Filter */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-black/20 text-white text-xs font-bold border border-white/20 cursor-pointer focus:outline-none"
          >
            <option value="all" className="text-slate-900 bg-white">Tất cả các tổ</option>
            <option value="Tổ 1" className="text-slate-900 bg-white">Tổ 1</option>
            <option value="Tổ 2" className="text-slate-900 bg-white">Tổ 2</option>
            <option value="Tổ 3" className="text-slate-900 bg-white">Tổ 3</option>
            <option value="Tổ 4" className="text-slate-900 bg-white">Tổ 4</option>
          </select>
        </div>
      </div>

      {/* Podium Display 🥇🥈🥉 */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-2xl mx-auto pt-6 pb-2">
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
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-slate-300 dark:ring-slate-600 shadow-md group-hover:scale-105 transition-transform"
                />
                <span className="absolute -top-2 -right-2 bg-slate-200 text-slate-800 font-bold text-sm w-7 h-7 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs">
                  🥈
                </span>
              </div>
              <div className="text-center">
                <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate max-w-[110px] group-hover:text-blue-600">
                  {top2.fullName}
                </div>
                <div className="text-[11px] font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-full mt-1 inline-block">
                  +{top2.emulationScore} đ
                </div>
              </div>
              <div className="w-full h-24 bg-gradient-to-t from-slate-300 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-t-2xl mt-3 flex items-center justify-center font-black text-slate-700 dark:text-slate-200 text-2xl shadow-inner">
                2
              </div>
            </div>
          )}

          {/* Top 1 - Gold */}
          {top1 && (
            <div 
              onClick={() => onSelectStudent(top1)}
              className="flex flex-col items-center cursor-pointer group -mt-6"
            >
              <div className="relative mb-2">
                <img 
                  src={top1.avatar} 
                  alt={top1.fullName} 
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-amber-400 shadow-xl shadow-amber-500/30 group-hover:scale-105 transition-transform"
                />
                <span className="absolute -top-3 -right-3 bg-amber-400 text-amber-950 font-black text-base w-8 h-8 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-md">
                  🥇
                </span>
              </div>
              <div className="text-center">
                <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-[130px] group-hover:text-blue-600">
                  {top1.fullName}
                </div>
                <div className="text-xs font-black text-amber-900 bg-amber-300 dark:bg-amber-500 dark:text-amber-950 px-3 py-0.5 rounded-full mt-1 inline-block shadow-2xs">
                  +{top1.emulationScore} điểm
                </div>
              </div>
              <div className="w-full h-32 bg-gradient-to-t from-amber-500 via-amber-400 to-amber-300 text-amber-950 rounded-t-2xl mt-3 flex items-center justify-center font-black text-3xl shadow-md">
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
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-amber-700/50 shadow-md group-hover:scale-105 transition-transform"
                />
                <span className="absolute -top-2 -right-2 bg-amber-700 text-white font-bold text-sm w-7 h-7 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs">
                  🥉
                </span>
              </div>
              <div className="text-center">
                <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate max-w-[110px] group-hover:text-blue-600">
                  {top3.fullName}
                </div>
                <div className="text-[11px] font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full mt-1 inline-block">
                  +{top3.emulationScore} đ
                </div>
              </div>
              <div className="w-full h-20 bg-gradient-to-t from-amber-200 to-amber-100 dark:from-amber-900 dark:to-amber-950/60 rounded-t-2xl mt-3 flex items-center justify-center font-black text-amber-900 dark:text-amber-200 text-xl shadow-inner">
                3
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Leaderboard Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-slate-100">
          Danh Sách Xếp Hạng Thi Đua Đầy Đủ
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {filteredStudents.map((st, idx) => (
            <div
              key={st.id}
              onClick={() => onSelectStudent(st)}
              className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                idx < 3 ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                  idx === 0 ? 'bg-amber-400 text-amber-950' :
                  idx === 1 ? 'bg-slate-300 text-slate-800' :
                  idx === 2 ? 'bg-amber-700 text-white' :
                  'bg-slate-100 dark:bg-slate-700 text-slate-500'
                }`}>
                  {idx + 1}
                </span>

                <img src={st.avatar} alt={st.fullName} className="w-10 h-10 rounded-xl object-cover" />

                <div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {st.fullName}
                    <span className="text-xs font-normal text-slate-400">({st.studentCode})</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Tổ {st.team} • STT: {st.stt}
                  </div>
                </div>
              </div>

              <div className="text-right flex items-center gap-3">
                <span className={`px-3 py-1 rounded-xl text-xs font-black ${
                  st.emulationScore >= 10 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                  st.emulationScore >= 5 ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                  st.emulationScore >= 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {st.emulationScore > 0 ? `+${st.emulationScore}` : st.emulationScore} điểm
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
