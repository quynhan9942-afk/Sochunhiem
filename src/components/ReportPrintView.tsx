import React, { useState } from 'react';
import { 
  Printer, 
  FileText, 
  Download, 
  CheckCircle2, 
  Award, 
  Calendar, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet,
  Users,
  Clock,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { Student, EmulationLog, ClassConfig, PeriodConfig, ClassRulesConfig } from '../types';
import { AttendanceDayMap } from '../utils/storage';
import { getWeekDateRange, computeStudentStatsForPeriod, getWeekNumberFromDate } from '../utils/emulationUtils';

interface ReportPrintViewProps {
  students: Student[];
  emulationLogs: EmulationLog[];
  config: ClassConfig;
  attendanceMap?: AttendanceDayMap;
  periodConfig?: PeriodConfig;
  classRulesConfig?: ClassRulesConfig;
}

export const ReportPrintView: React.FC<ReportPrintViewProps> = ({
  students = [],
  emulationLogs = [],
  config,
  attendanceMap = {},
  periodConfig,
  classRulesConfig,
}) => {
  // Report types: 3 required options
  const [reportType, setReportType] = useState<'weekly_emulation' | 'class_list' | 'full_homeroom_log'>('weekly_emulation');
  
  // Selected week for Weekly Emulation Report (1 to 35)
  const currentWeekNum = getWeekNumberFromDate(new Date(), periodConfig);
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeekNum || 1);

  const handlePrint = () => {
    window.print();
  };

  // Week Date Range calculations
  const { startDate, endDate, startDateStr, endDateStr, dateRangeStr } = getWeekDateRange(selectedWeek, periodConfig);

  // Compute emulation stats for selected week
  const weekStats = computeStudentStatsForPeriod(
    students,
    emulationLogs,
    (logDate) => logDate >= startDate && logDate <= endDate
  );

  // Merge attendance records for the selected week into student week data
  const studentWeekData = weekStats.map((stStat) => {
    const stId = stStat.student.id;
    let lateCount = 0;
    let excusedCount = 0;
    let unexcusedCount = 0;
    let presentCount = 0;

    // Scan dates in attendanceMap that fall within [startDateStr, endDateStr]
    Object.entries(attendanceMap || {}).forEach(([dateStr, dayRecord]) => {
      if (dateStr >= startDateStr && dateStr <= endDateStr) {
        const status = dayRecord[stId]?.status;
        if (status === 'late') lateCount++;
        else if (status === 'excused') excusedCount++;
        else if (status === 'unexcused') unexcusedCount++;
        else if (status === 'present') presentCount++;
      }
    });

    // Attendance penalty rule: -5 points per late, -5 points per unexcused
    const attendancePenalty = (lateCount * 5) + (unexcusedCount * 5);

    return {
      ...stStat,
      lateCount,
      excusedCount,
      unexcusedCount,
      presentCount,
      attendancePenalty,
    };
  });

  // Class-wide Attendance & Emulation Metrics for selected week
  const totalStudents = students.length;
  const totalClassLate = studentWeekData.reduce((sum, s) => sum + s.lateCount, 0);
  const totalClassExcused = studentWeekData.reduce((sum, s) => sum + s.excusedCount, 0);
  const totalClassUnexcused = studentWeekData.reduce((sum, s) => sum + s.unexcusedCount, 0);
  const totalClassPresent = studentWeekData.reduce((sum, s) => sum + s.presentCount, 0);
  const totalClassRecorded = totalClassPresent + totalClassLate + totalClassExcused + totalClassUnexcused;
  const presencePercent = totalClassRecorded > 0 ? Math.round(((totalClassPresent + totalClassLate) / totalClassRecorded) * 100) : 100;

  const totalClassAdded = studentWeekData.reduce((sum, s) => sum + s.addedPoints, 0);
  const totalClassDeducted = studentWeekData.reduce((sum, s) => sum + s.deductedPoints, 0);
  const totalClassNet = totalClassAdded - totalClassDeducted;

  // Export CSV Handler
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (reportType === 'weekly_emulation') {
      headers = [
        'STT', 'Mã HS', 'Họ và Tên', 'Tổ', 
        'Trễ (lượt)', 'Vắng CP (buổi)', 'Vắng KP (buổi)', 'Trừ chuyên cần (đ)',
        'Cộng (+)', 'Trừ (-)', 'Điểm ròng', 'Xếp hạng', 'Ghi chú'
      ];
      rows = studentWeekData.map(s => [
        s.student.stt,
        s.student.studentCode,
        `"${s.student.fullName}"`,
        s.student.team,
        s.lateCount,
        s.excusedCount,
        s.unexcusedCount,
        s.attendancePenalty > 0 ? -s.attendancePenalty : 0,
        s.addedPoints,
        s.deductedPoints,
        s.netPoints,
        s.rank,
        `"${s.student.statusNote || ''}"`
      ]);
    } else if (reportType === 'class_list') {
      headers = [
        'STT', 'Mã HS', 'Họ và Tên', 'Giới Tính', 'Ngày Sinh', 
        'Dân Tộc', 'Hoàn Cảnh', 'Tổ', 'Họ Tên Phụ Huynh', 'SĐT Phụ Huynh'
      ];
      rows = students.map(st => [
        st.stt,
        st.studentCode,
        `"${st.fullName}"`,
        st.gender,
        st.dob,
        st.ethnicity || 'Kinh',
        st.familyBackground || 'Bình thường',
        st.team,
        `"${st.parentName}"`,
        st.parentPhone
      ]);
    } else {
      headers = ['STT', 'Mã HS', 'Họ và Tên', 'Tổ', 'Điểm thi đua ròng', 'Xếp loại', 'Ghi chú'];
      rows = students.map(st => [
        st.stt,
        st.studentCode,
        `"${st.fullName}"`,
        st.team,
        st.emulationScore,
        st.statusTag,
        `"${st.statusNote || ''}"`
      ]);
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Cao_${reportType}_Lop_${config.className}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Action Header Banner (Hidden when Printing) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Printer className="w-6 h-6 text-blue-600" />
            Báo Cáo & In Ấn Sổ Chủ Nhiệm Điện Tử
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tổng hợp chuyên cần, thi đua và hồ sơ lớp học chuẩn khổ A4 ready-to-print
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Report Type Selector Switcher (Requirement 1: 3 exact options) */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setReportType('weekly_emulation')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                reportType === 'weekly_emulation' 
                  ? 'bg-blue-600 text-white shadow-xs font-black' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              📊 Thi Đua Tuần
            </button>
            <button
              onClick={() => setReportType('class_list')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                reportType === 'class_list' 
                  ? 'bg-blue-600 text-white shadow-xs font-black' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              📋 Danh Sách Lớp
            </button>
            <button
              onClick={() => setReportType('full_homeroom_log')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                reportType === 'full_homeroom_log' 
                  ? 'bg-blue-600 text-white shadow-xs font-black' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              📔 Sổ Chủ Nhiệm A4
            </button>
          </div>

          {/* Export & Print Controls */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Xuất bảng dữ liệu ra file Excel (.CSV)"
          >
            <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" /> In Báo Cáo A4 / Xuất PDF
          </button>
        </div>
      </div>

      {/* Week Selector Bar for "weekly_emulation" */}
      {reportType === 'weekly_emulation' && (
        <div className="bg-blue-50/80 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-blue-900 dark:text-blue-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              Chọn Tuần Học In Báo Cáo:
            </span>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl text-xs font-black text-blue-900 dark:text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => {
                const range = getWeekDateRange(w, periodConfig);
                return (
                  <option key={w} value={w}>
                    Tuần {w} ({range.dateRangeStr})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedWeek(prev => Math.max(1, prev - 1))}
              disabled={selectedWeek <= 1}
              className="p-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-blue-800 dark:text-blue-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-blue-200 dark:border-blue-800">
              {dateRangeStr}
            </span>
            <button
              onClick={() => setSelectedWeek(prev => Math.min(35, prev + 1))}
              disabled={selectedWeek >= 35}
              className="p-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 cursor-pointer"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Printable Paper Canvas (Styled as clean white A4 document) */}
      <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xl max-w-5xl mx-auto font-sans leading-relaxed text-xs print:p-0 print:shadow-none print:border-0 print:max-w-none print:w-full">
        
        {/* Document Official Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
          <div className="text-left font-serif">
            <div className="uppercase text-xs font-bold tracking-wider">{config.schoolName}</div>
            <div className="text-sm font-black mt-0.5">LỚP CHỦ NHIỆM: {config.className}</div>
            <div className="text-xs text-slate-600">Năm học: {config.schoolYear}</div>
          </div>

          <div className="text-right font-serif">
            <div className="text-xs font-bold uppercase tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div className="text-[11px] font-semibold italic">Độc lập - Tự do - Hạnh phúc</div>
            <div className="text-xs text-slate-600 mt-2">GVCN: <strong>{config.teacherName}</strong></div>
          </div>
        </div>

        {/* Title Section */}
        <div className="text-center my-5 space-y-1">
          <h1 className="text-lg sm:text-xl font-black uppercase tracking-wide">
            {reportType === 'weekly_emulation' && `BÁO CÁO THI ĐUA VÀ CHUYÊN CẦN TUẦN ${selectedWeek}`}
            {reportType === 'class_list' && 'DANH SÁCH SƠ YẾU LÍ LỊCH HỌC SINH LỚP CHỦ NHIỆM'}
            {reportType === 'full_homeroom_log' && 'SỔ TỔNG HỢP THEO DÕI CHỦ NHIỆM VÀ RÈN LUYỆN'}
          </h1>
          <p className="text-xs font-semibold text-slate-700">
            {reportType === 'weekly_emulation' && `Thời gian: ${dateRangeStr} • Mức điểm gốc chuẩn: ${classRulesConfig?.baseScore || 100} điểm/tuần`}
            {reportType === 'class_list' && `Sĩ số lớp: ${students.length} học sinh • Lớp: ${config.className}`}
            {reportType === 'full_homeroom_log' && `Tổng hợp dữ liệu rèn luyện học kỳ • Lớp ${config.className}`}
          </p>
          <p className="text-[11px] italic text-slate-500">
            Ngày lập báo cáo: {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>

        {/* ==================== PATTERN 1: WEEKLY EMULATION & ATTENDANCE ==================== */}
        {reportType === 'weekly_emulation' && (
          <div className="space-y-5">
            
            {/* Requirement 2c: Khối Tóm Tắt Nhanh Chuyên Cần & Thi Đua Toàn Lớp */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Sĩ số & Có mặt</span>
                <strong className="text-sm font-black text-slate-900">{totalStudents} HS</strong>
                <span className="text-[11px] text-emerald-700 font-bold block">Tỷ lệ: {presencePercent}%</span>
              </div>

              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Tổng lượt vắng tuần</span>
                <strong className="text-sm font-black text-rose-700">{totalClassExcused + totalClassUnexcused} buổi</strong>
                <span className="text-[11px] text-slate-600 block">Có phép: {totalClassExcused} | Không phép: {totalClassUnexcused}</span>
              </div>

              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Lượt đi muộn</span>
                <strong className="text-sm font-black text-amber-700">{totalClassLate} lượt</strong>
                <span className="text-[11px] text-slate-600 block">Nhắc nhở tác phong</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Tổng điểm thi đua tuần</span>
                <strong className="text-sm font-black text-blue-800">
                  +{totalClassAdded}đ / -{totalClassDeducted}đ
                </strong>
                <span className="text-[11px] font-bold block text-slate-700">
                  Ròng: {totalClassNet > 0 ? `+${totalClassNet}` : totalClassNet}đ
                </span>
              </div>
            </div>

            {/* Requirement 2b: Detailed Student Table with Attendance Columns */}
            <table className="w-full text-left text-[11px] border-collapse border border-slate-900">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 font-bold uppercase text-slate-900">
                  <th className="p-1.5 border border-slate-900 text-center w-7">STT</th>
                  <th className="p-1.5 border border-slate-900 text-center w-16">Mã HS</th>
                  <th className="p-1.5 border border-slate-900">Họ và Tên</th>
                  <th className="p-1.5 border border-slate-900 text-center w-10">Tổ</th>
                  <th className="p-1.5 border border-slate-900 text-center w-11" title="Đi muộn (số lần)">Trễ</th>
                  <th className="p-1.5 border border-slate-900 text-center w-12" title="Vắng có phép (buổi)">Vắng CP</th>
                  <th className="p-1.5 border border-slate-900 text-center w-12" title="Vắng không phép (buổi)">Vắng KP</th>
                  <th className="p-1.5 border border-slate-900 text-center w-14" title="Trừ điểm chuyên cần">Trừ CC</th>
                  <th className="p-1.5 border border-slate-900 text-center w-12 text-emerald-800" title="Điểm thưởng / cộng">Thưởng</th>
                  <th className="p-1.5 border border-slate-900 text-center w-12 text-rose-800" title="Điểm phạt / trừ">Phạt</th>
                  <th className="p-1.5 border border-slate-900 text-center w-14 font-black" title="Điểm ròng trong tuần">Điểm Tuần</th>
                  <th className="p-1.5 border border-slate-900 text-center w-12 font-black">Hạng</th>
                  <th className="p-1.5 border border-slate-900">Ghi Chú</th>
                </tr>
              </thead>
              <tbody>
                {studentWeekData.map((st) => (
                  <tr key={st.student.id} className="border-b border-slate-400 hover:bg-slate-50">
                    <td className="p-1.5 border border-slate-400 text-center font-bold">{st.student.stt}</td>
                    <td className="p-1.5 border border-slate-400 text-center font-mono text-[10px]">{st.student.studentCode}</td>
                    <td className="p-1.5 border border-slate-400 font-bold">{st.student.fullName}</td>
                    <td className="p-1.5 border border-slate-400 text-center">{st.student.team}</td>
                    
                    {/* Attendance Columns */}
                    <td className={`p-1.5 border border-slate-400 text-center font-bold ${st.lateCount > 0 ? 'text-amber-700 bg-amber-50' : 'text-slate-400'}`}>
                      {st.lateCount > 0 ? st.lateCount : '-'}
                    </td>
                    <td className={`p-1.5 border border-slate-400 text-center font-bold ${st.excusedCount > 0 ? 'text-blue-700 bg-blue-50' : 'text-slate-400'}`}>
                      {st.excusedCount > 0 ? st.excusedCount : '-'}
                    </td>
                    <td className={`p-1.5 border border-slate-400 text-center font-bold ${st.unexcusedCount > 0 ? 'text-rose-700 bg-rose-50' : 'text-slate-400'}`}>
                      {st.unexcusedCount > 0 ? st.unexcusedCount : '-'}
                    </td>
                    <td className={`p-1.5 border border-slate-400 text-center font-bold ${st.attendancePenalty > 0 ? 'text-rose-700 font-black' : 'text-slate-400'}`}>
                      {st.attendancePenalty > 0 ? `-${st.attendancePenalty}đ` : '0đ'}
                    </td>

                    {/* Emulation Points Columns */}
                    <td className="p-1.5 border border-slate-400 text-center font-bold text-emerald-700">
                      {st.addedPoints > 0 ? `+${st.addedPoints}đ` : '0đ'}
                    </td>
                    <td className="p-1.5 border border-slate-400 text-center font-bold text-rose-700">
                      {st.deductedPoints > 0 ? `-${st.deductedPoints}đ` : '0đ'}
                    </td>
                    <td className="p-1.5 border border-slate-400 text-center font-black text-xs">
                      <span className={st.netPoints > 0 ? 'text-emerald-800' : st.netPoints < 0 ? 'text-rose-800' : 'text-slate-700'}>
                        {st.netPoints > 0 ? `+${st.netPoints}` : st.netPoints}đ
                      </span>
                    </td>
                    <td className="p-1.5 border border-slate-400 text-center font-black">
                      {st.rank === 1 ? '🥇 1' : st.rank === 2 ? '🥈 2' : st.rank === 3 ? '🥉 3' : st.rank}
                    </td>
                    <td className="p-1.5 border border-slate-400 italic text-[10px] text-slate-700">
                      {st.student.statusNote || (st.unexcusedCount > 0 ? 'Vắng không phép' : st.lateCount > 0 ? 'Đi học muộn' : 'Rèn luyện tốt')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== PATTERN 2: CLASS LIST ==================== */}
        {reportType === 'class_list' && (
          <div className="space-y-4">
            <table className="w-full text-left text-[11px] border-collapse border border-slate-900">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 font-bold uppercase text-slate-900">
                  <th className="p-2 border border-slate-900 text-center w-8">STT</th>
                  <th className="p-2 border border-slate-900 text-center w-16">Mã HS</th>
                  <th className="p-2 border border-slate-900">Họ và Tên</th>
                  <th className="p-2 border border-slate-900 text-center w-12">Giới</th>
                  <th className="p-2 border border-slate-900 text-center w-20">Ngày Sinh</th>
                  <th className="p-2 border border-slate-900 text-center w-16">Dân Tộc</th>
                  <th className="p-2 border border-slate-900 text-center w-24">Hoàn Cảnh</th>
                  <th className="p-2 border border-slate-900 text-center w-12">Tổ</th>
                  <th className="p-2 border border-slate-900">Họ Tên Phụ Huynh</th>
                  <th className="p-2 border border-slate-900 text-center w-24">SĐT Phụ Huynh</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
                  <tr key={st.id} className="border-b border-slate-400 hover:bg-slate-50">
                    <td className="p-2 border border-slate-400 text-center font-bold">{st.stt}</td>
                    <td className="p-2 border border-slate-400 text-center font-mono text-[10px]">{st.studentCode}</td>
                    <td className="p-2 border border-slate-400 font-bold">{st.fullName}</td>
                    <td className="p-2 border border-slate-400 text-center">{st.gender}</td>
                    <td className="p-2 border border-slate-400 text-center">{st.dob}</td>
                    <td className="p-2 border border-slate-400 text-center">{st.ethnicity || 'Kinh'}</td>
                    <td className="p-2 border border-slate-400 text-center text-[10px]">{st.familyBackground || 'Bình thường'}</td>
                    <td className="p-2 border border-slate-400 text-center font-semibold">{st.team}</td>
                    <td className="p-2 border border-slate-400">{st.parentName}</td>
                    <td className="p-2 border border-slate-400 text-center font-mono font-bold">{st.parentPhone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== PATTERN 3: FULL HOMEROOM LOG A4 ==================== */}
        {reportType === 'full_homeroom_log' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs">
              <div>
                <p className="font-bold text-slate-900 uppercase mb-1">1. Sơ lược tình hình lớp học:</p>
                <ul className="space-y-1 text-slate-700">
                  <li>• Tổng sĩ số: <strong>{students.length} học sinh</strong> (Nam: {students.filter(s => s.gender === 'Nam').length}, Nữ: {students.filter(s => s.gender === 'Nữ').length})</li>
                  <li>• Số tổ thi đua: <strong>4 Tổ</strong> (Tổ 1, Tổ 2, Tổ 3, Tổ 4)</li>
                  <li>• Điểm chuẩn rèn luyện: <strong>{classRulesConfig?.baseScore || 100} điểm gốc / tuần</strong></li>
                </ul>
              </div>

              <div>
                <p className="font-bold text-slate-900 uppercase mb-1">2. Thống kê xếp loại thi đua:</p>
                <ul className="space-y-1 text-slate-700">
                  <li>• Xếp loại Tốt: <strong>{students.filter(s => s.statusTag === 'Tốt').length} HS</strong></li>
                  <li>• Xếp loại Khá: <strong>{students.filter(s => s.statusTag === 'Khá').length} HS</strong></li>
                  <li>• Cần cố gắng: <strong>{students.filter(s => s.statusTag === 'Cần cố gắng').length} HS</strong></li>
                </ul>
              </div>
            </div>

            <table className="w-full text-left text-[11px] border-collapse border border-slate-900">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 font-bold uppercase text-slate-900">
                  <th className="p-2 border border-slate-900 text-center w-8">STT</th>
                  <th className="p-2 border border-slate-900">Mã HS</th>
                  <th className="p-2 border border-slate-900">Họ và Tên</th>
                  <th className="p-2 border border-slate-900 text-center">Tổ</th>
                  <th className="p-2 border border-slate-900 text-center">Điểm Thi Đua Tích Lũy</th>
                  <th className="p-2 border border-slate-900 text-center">Xếp Loại Rèn Luyện</th>
                  <th className="p-2 border border-slate-900">Ghi Chú Nổi Bật</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
                  <tr key={st.id} className="border-b border-slate-400">
                    <td className="p-2 border border-slate-400 text-center font-bold">{st.stt}</td>
                    <td className="p-2 border border-slate-400 font-mono text-[10px]">{st.studentCode}</td>
                    <td className="p-2 border border-slate-400 font-bold">{st.fullName}</td>
                    <td className="p-2 border border-slate-400 text-center">{st.team}</td>
                    <td className="p-2 border border-slate-400 text-center font-black">
                      {st.emulationScore > 0 ? `+${st.emulationScore}` : st.emulationScore}đ
                    </td>
                    <td className="p-2 border border-slate-400 text-center font-bold">{st.statusTag}</td>
                    <td className="p-2 border border-slate-400 italic text-[10px]">{st.statusNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Official Signatures Section */}
        <div className="mt-10 flex justify-between items-start text-xs font-serif pt-6 border-t border-slate-200">
          <div className="text-center w-1/3">
            <p className="font-bold uppercase">LỚP TRƯỞNG</p>
            <p className="italic text-[10px] text-slate-500">(Ký và ghi rõ họ tên)</p>
            <div className="h-14"></div>
          </div>

          <div className="text-center w-1/3">
            <p className="font-bold uppercase">ĐẠI DIỆN BGH / PHHS</p>
            <p className="italic text-[10px] text-slate-500">(Ký và ghi rõ họ tên)</p>
            <div className="h-14"></div>
          </div>

          <div className="text-center w-1/3">
            <p className="font-bold uppercase">GIÁO VIÊN CHỦ NHIỆM</p>
            <p className="italic text-[10px] text-slate-500">(Ký và ghi rõ họ tên)</p>
            <div className="h-14"></div>
            <p className="font-bold text-xs">{config.teacherName}</p>
          </div>
        </div>

      </div>
    </div>
  );
};
