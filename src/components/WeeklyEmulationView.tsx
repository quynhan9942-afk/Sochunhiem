import React, { useState } from 'react';
import { Calendar, Lock, Unlock, Trophy, FileText, ChevronLeft, ChevronRight, CheckCircle2, ShieldCheck, Printer, Download } from 'lucide-react';
import { Student, EmulationLog, UserRole } from '../types';
import { getWeekDateRange, computeStudentStatsForPeriod, parseLogDate, LockedWeek } from '../utils/emulationUtils';
import { WeeklyReportModal } from './WeeklyReportModal';

interface WeeklyEmulationViewProps {
  students?: Student[];
  emulationLogs?: EmulationLog[];
  onSelectStudent: (student: Student) => void;
  currentUserRole?: UserRole;
  currentTeacherName?: string;
  lockedWeeks?: LockedWeek[];
  onToggleLockWeek?: (weekNumber: number, isLock: boolean) => void;
  className?: string;
}

export const WeeklyEmulationView: React.FC<WeeklyEmulationViewProps> = ({
  students = [],
  emulationLogs = [],
  onSelectStudent,
  currentUserRole = 'GIÁO VIÊN',
  currentTeacherName = 'Cô Lê Thị Quỳnh An',
  lockedWeeks = [],
  onToggleLockWeek,
  className = '6a3',
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  const studentList = Array.isArray(students) ? students : [];
  const logList = Array.isArray(emulationLogs) ? emulationLogs : [];

  const { startDate, endDate, dateRangeStr } = getWeekDateRange(selectedWeek);

  // Filter logs in this week
  const weekStats = computeStudentStatsForPeriod(
    studentList,
    logList,
    (logDate) => logDate >= startDate && logDate <= endDate
  );

  const isLocked = lockedWeeks.some(w => w.weekNumber === selectedWeek);
  const lockInfo = lockedWeeks.find(w => w.weekNumber === selectedWeek);

  const top1 = weekStats[0];
  const top2 = weekStats[1];
  const top3 = weekStats[2];

  const totalClassAdded = weekStats.reduce((sum, s) => sum + s.addedPoints, 0);
  const totalClassDeducted = weekStats.reduce((sum, s) => sum + s.deductedPoints, 0);
  const totalClassNet = totalClassAdded - totalClassDeducted;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-sky-700 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold mb-2">
            <Calendar className="w-3.5 h-3.5 text-amber-300" /> Báo Cáo Thi Đua Hàng Tuần
          </span>
          <h2 className="text-2xl font-black tracking-tight">
            📊 THI ĐUA TUẦN {selectedWeek} ({dateRangeStr})
          </h2>
          <p className="text-indigo-100 text-xs mt-1">
            Theo dõi diễn biến điểm thi đua rèn luyện theo từng tuần học, tự động xếp hạng và chốt sổ thi đua.
          </p>
        </div>

        {/* Lock & Report Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lock / Unlock Button */}
          {isLocked ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-amber-400 text-amber-950 rounded-2xl text-xs font-bold flex items-center gap-1 shadow-xs">
                <Lock className="w-3.5 h-3.5" /> Đã chốt điểm
              </span>
              {(currentUserRole === 'ADMIN' || currentUserRole === 'GIÁO VIÊN') && onToggleLockWeek && (
                <button
                  onClick={() => onToggleLockWeek(selectedWeek, false)}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-xs font-bold backdrop-blur border border-white/20 transition-all flex items-center gap-1"
                >
                  <Unlock className="w-3.5 h-3.5" /> MỞ KHÓA TUẦN
                </button>
              )}
            </div>
          ) : (
            onToggleLockWeek && (
              <button
                onClick={() => onToggleLockWeek(selectedWeek, true)}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-2xl text-xs font-black shadow-md transition-all flex items-center gap-1.5"
              >
                <Lock className="w-4 h-4" /> 🔒 CHỐT ĐIỂM TUẦN
              </button>
            )
          )}

          {/* Report Button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2 bg-white text-indigo-900 hover:bg-indigo-50 rounded-2xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-indigo-600" /> 📋 TỔNG KẾT TUẦN
          </button>
        </div>
      </div>

      {/* Week Selector Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between gap-4">
        <button
          onClick={() => setSelectedWeek(prev => Math.max(1, prev - 1))}
          disabled={selectedWeek <= 1}
          className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-2xl mx-auto">
          {Array.from({ length: 35 }, (_, i) => i + 1).map((wNum) => {
            const isCurrent = wNum === selectedWeek;
            const wLocked = lockedWeeks.some(l => l.weekNumber === wNum);
            return (
              <button
                key={wNum}
                onClick={() => setSelectedWeek(wNum)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-md scale-105'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                Tuần {wNum}
                {wLocked && <Lock className="w-3 h-3 text-amber-300" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setSelectedWeek(prev => Math.min(35, prev + 1))}
          disabled={selectedWeek >= 35}
          className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Lock Warning Notice if locked */}
      {isLocked && lockInfo && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>Tuần {selectedWeek} đã được chốt sổ thi đua!</strong> Dữ liệu tuần này đã được khóa an toàn bởi <strong>{lockInfo.lockedBy}</strong> vào lúc {lockInfo.lockedAt}.
            </span>
          </div>
        </div>
      )}

      {/* Podium Top 3 Students of Week */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs">
        <h3 className="text-center text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-4 flex items-center justify-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-500" />
          TOP 3 THI ĐUA XUẤT SẮC NHẤT TUẦN {selectedWeek}
        </h3>

        <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto items-end pt-2 pb-2">
          {/* Top 2 */}
          {top2 && (
            <div onClick={() => onSelectStudent(top2.student)} className="flex flex-col items-center cursor-pointer group">
              <div className="relative mb-2">
                <img src={top2.student.avatar} alt={top2.student.fullName} className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-4 ring-slate-300 shadow-md group-hover:scale-105 transition-transform" />
                <span className="absolute -top-2 -right-2 bg-slate-200 text-slate-800 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">🥈</span>
              </div>
              <div className="text-center">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate max-w-[100px]">{top2.student.fullName}</div>
                <div className="text-[11px] font-black text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full mt-0.5 inline-block">+{top2.netPoints} đ tuần</div>
              </div>
              <div className="w-full h-20 bg-slate-200 dark:bg-slate-700 rounded-t-2xl mt-2 flex items-center justify-center font-bold text-slate-500 text-lg">2</div>
            </div>
          )}

          {/* Top 1 */}
          {top1 && (
            <div onClick={() => onSelectStudent(top1.student)} className="flex flex-col items-center cursor-pointer group -mt-4">
              <div className="relative mb-2">
                <img src={top1.student.avatar} alt={top1.student.fullName} className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-amber-400 shadow-lg group-hover:scale-105 transition-transform" />
                <span className="absolute -top-2 -right-2 bg-amber-400 text-amber-950 font-black text-sm w-7 h-7 rounded-full flex items-center justify-center border-2 border-white">🥇</span>
              </div>
              <div className="text-center">
                <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[120px]">{top1.student.fullName}</div>
                <div className="text-xs font-black text-amber-900 bg-amber-300 px-2.5 py-0.5 rounded-full mt-0.5 inline-block">+{top1.netPoints} đ tuần</div>
              </div>
              <div className="w-full h-28 bg-gradient-to-t from-amber-400 to-amber-300 text-amber-950 rounded-t-2xl mt-2 flex items-center justify-center font-black text-2xl shadow-sm">1</div>
            </div>
          )}

          {/* Top 3 */}
          {top3 && (
            <div onClick={() => onSelectStudent(top3.student)} className="flex flex-col items-center cursor-pointer group">
              <div className="relative mb-2">
                <img src={top3.student.avatar} alt={top3.student.fullName} className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-4 ring-amber-700/40 shadow-md group-hover:scale-105 transition-transform" />
                <span className="absolute -top-2 -right-2 bg-amber-700 text-white font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">🥉</span>
              </div>
              <div className="text-center">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate max-w-[100px]">{top3.student.fullName}</div>
                <div className="text-[11px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full mt-0.5 inline-block">+{top3.netPoints} đ tuần</div>
              </div>
              <div className="w-full h-16 bg-amber-100 dark:bg-amber-950 rounded-t-2xl mt-2 flex items-center justify-center font-bold text-amber-800 text-base">3</div>
            </div>
          )}
        </div>
      </div>

      {/* Full Weekly Leaderboard Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between font-bold text-sm text-slate-800 dark:text-slate-100">
          <span>Bảng Tổng Hợp Điểm Thi Đua Tuần {selectedWeek}</span>
          <span className="text-xs font-normal text-slate-400">
            Cả lớp: <strong className="text-emerald-600">+{totalClassAdded}đ</strong> cộng | <strong className="text-rose-600">-{totalClassDeducted}đ</strong> trừ | <strong className="text-blue-600">{totalClassNet > 0 ? `+${totalClassNet}` : totalClassNet}đ</strong> ròng
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 text-center w-12">Hạng</th>
                <th className="p-3">Học Sinh</th>
                <th className="p-3 text-center">Tổ</th>
                <th className="p-3 text-right">Đầu Tuần</th>
                <th className="p-3 text-right text-emerald-600">Cộng (+)</th>
                <th className="p-3 text-right text-rose-600">Trừ (-)</th>
                <th className="p-3 text-right font-black">Phát Sinh Tuần</th>
                <th className="p-3 text-right font-black">Cuối Tuần</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {weekStats.map((st) => (
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
                          {st.student.studentCode} • STT: {st.student.stt}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 text-center font-medium text-slate-500">
                    {st.student.team}
                  </td>

                  <td className="p-3 text-right font-mono text-slate-500">
                    {st.startingScore}
                  </td>

                  <td className="p-3 text-right font-black text-emerald-600">
                    +{st.addedPoints}
                  </td>

                  <td className="p-3 text-right font-black text-rose-600">
                    -{st.deductedPoints}
                  </td>

                  <td className="p-3 text-right">
                    <span className={`px-2 py-0.5 rounded-lg font-black ${
                      st.netPoints > 0 ? 'bg-emerald-100 text-emerald-800' :
                      st.netPoints < 0 ? 'bg-rose-100 text-rose-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {st.netPoints > 0 ? `+${st.netPoints}` : st.netPoints}
                    </span>
                  </td>

                  <td className="p-3 text-right font-black text-blue-600 dark:text-blue-400 text-sm">
                    {st.endingScore > 0 ? `+${st.endingScore}` : st.endingScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly Report Modal */}
      {showReportModal && (
        <WeeklyReportModal
          selectedWeek={selectedWeek}
          weekStats={weekStats}
          students={studentList}
          emulationLogs={logList}
          onClose={() => setShowReportModal(false)}
          teacherName={currentTeacherName}
          className={className}
        />
      )}
    </div>
  );
};
