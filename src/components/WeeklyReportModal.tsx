import React from 'react';
import { X, Printer, Download, FileSpreadsheet, Award, CheckCircle, AlertTriangle } from 'lucide-react';
import { Student, EmulationLog } from '../types';
import { StudentEmulationStats, getWeekDateRange, computeTeamStatsForPeriod } from '../utils/emulationUtils';

interface WeeklyReportModalProps {
  selectedWeek: number;
  weekStats: StudentEmulationStats[];
  students: Student[];
  emulationLogs: EmulationLog[];
  onClose: () => void;
  teacherName: string;
  className: string;
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({
  selectedWeek,
  weekStats,
  students,
  emulationLogs,
  onClose,
  teacherName,
  className,
}) => {
  const { startDate, endDate, dateRangeStr } = getWeekDateRange(selectedWeek);

  const totalStudents = students.length;
  const totalAdded = weekStats.reduce((sum, s) => sum + s.addedPoints, 0);
  const totalDeducted = weekStats.reduce((sum, s) => sum + s.deductedPoints, 0);
  const netClassPoints = totalAdded - totalDeducted;

  const topStudent = weekStats[0];

  // Calculate top team
  const teamStats = computeTeamStatsForPeriod(
    students,
    emulationLogs,
    (d) => d >= startDate && d <= endDate
  );
  const topTeam = teamStats[0];

  // Highlights
  const standoutStudents = weekStats.filter(s => s.addedPoints >= 3);
  const needsAttentionStudents = weekStats.filter(s => s.deductedPoints >= 2 || s.netPoints < 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['STT', 'Họ và tên', 'Mã HS', 'Tổ', 'Điểm đầu tuần', 'Cộng (+)', 'Trừ (-)', 'Điểm tuần', 'Cuối tuần', 'Xếp hạng'];
    const rows = weekStats.map(s => [
      s.student.stt,
      `"${s.student.fullName}"`,
      s.student.studentCode,
      s.student.team,
      s.startingScore,
      s.addedPoints,
      s.deductedPoints,
      s.netPoints,
      s.endingScore,
      s.rank
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Cao_Thi_Dua_Tuan_${selectedWeek}_Lop_${className}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fadeIn print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative max-h-[90vh] flex flex-col print:shadow-none print:border-none print:max-h-none print:w-full">
        {/* Actions header in preview mode */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 print:hidden shrink-0">
          <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            📋 BÁO CÁO TỔNG KẾT THI ĐUA TUẦN {selectedWeek}
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" /> In A4 / PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Printable Document Body */}
        <div className="overflow-y-auto space-y-5 p-2 text-slate-800 dark:text-slate-100 text-xs print:overflow-visible">
          {/* Header Document info */}
          <div className="text-center border-b pb-4 border-slate-200 dark:border-slate-700">
            <h1 className="text-xl font-black uppercase text-slate-900 dark:text-white tracking-wide">
              BÁO CÁO TỔNG KẾT THI ĐUA RÈN LUYỆN
            </h1>
            <p className="font-bold text-slate-600 dark:text-slate-300 mt-1 text-sm">
              Lớp: {className} • Tuần số: {selectedWeek} ({dateRangeStr})
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              GVCN: {teacherName} • THCS Nguyễn Văn Cừ
            </p>
          </div>

          {/* Key Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Sĩ số học sinh</span>
              <span className="text-base font-black text-slate-800 dark:text-slate-100">{totalStudents} em</span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[10px] text-emerald-600 font-bold uppercase block">Tổng điểm cộng</span>
              <span className="text-base font-black text-emerald-600">+{totalAdded} điểm</span>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-100 dark:border-rose-900/40">
              <span className="text-[10px] text-rose-600 font-bold uppercase block">Tổng điểm trừ</span>
              <span className="text-base font-black text-rose-600">-{totalDeducted} điểm</span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/40">
              <span className="text-[10px] text-blue-600 font-bold uppercase block">Điểm ròng cả lớp</span>
              <span className="text-base font-black text-blue-600">{netClassPoints > 0 ? `+${netClassPoints}` : netClassPoints} điểm</span>
            </div>
          </div>

          {/* Leader Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-lg">
                🥇
              </div>
              <div>
                <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase block">Học sinh đứng đầu tuần</span>
                <strong className="text-sm font-black text-slate-800 dark:text-slate-100">
                  {topStudent?.student.fullName} ({topStudent?.student.team})
                </strong>
                <span className="block text-[11px] text-amber-700 dark:text-amber-400 font-bold">
                  +{topStudent?.netPoints} điểm phát sinh tuần
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                🏆
              </div>
              <div>
                <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold uppercase block">Tổ thi đua đứng đầu</span>
                <strong className="text-sm font-black text-slate-800 dark:text-slate-100">
                  {topTeam?.team} (TB: +{topTeam?.averageScore} đ/HS)
                </strong>
                <span className="block text-[11px] text-indigo-600 dark:text-indigo-400">
                  Tổng điểm ròng tổ: +{topTeam?.netPoints} điểm
                </span>
              </div>
            </div>
          </div>

          {/* Standout Achievements */}
          <div>
            <h4 className="font-bold text-xs uppercase text-slate-500 mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-500" /> Học sinh có thành tích nổi bật ({standoutStudents.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {standoutStudents.length > 0 ? (
                standoutStudents.map(s => (
                  <span key={s.student.id} className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold">
                    ✨ {s.student.fullName} (+{s.addedPoints}đ)
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic">Không có</span>
              )}
            </div>
          </div>

          {/* Contents to Note */}
          <div>
            <h4 className="font-bold text-xs uppercase text-slate-500 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Nội dung cần lưu ý & Nhắc nhở ({needsAttentionStudents.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {needsAttentionStudents.length > 0 ? (
                needsAttentionStudents.map(s => (
                  <span key={s.student.id} className="px-3 py-1 rounded-xl bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold">
                    ⚠️ {s.student.fullName} (Trừ -{s.deductedPoints}đ)
                  </span>
                ))
              ) : (
                <span className="text-emerald-600 font-semibold">Tất cả học sinh đều duy trì nề nếp rất tốt!</span>
              )}
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-700 flex justify-between text-center font-bold">
            <div>
              <span className="block text-slate-500 text-[11px]">ĐẠI DIỆN LỚP</span>
              <span className="block mt-12 text-slate-800 dark:text-slate-200">Lớp trưởng</span>
            </div>

            <div>
              <span className="block text-slate-500 text-[11px]">GIÁO VIÊN CHỦ NHIỆM</span>
              <span className="block mt-12 text-slate-800 dark:text-slate-200">{teacherName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
