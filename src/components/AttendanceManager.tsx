import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Calendar as CalendarIcon, 
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Search, 
  CheckCheck,
  RotateCcw,
  Edit3,
  MessageSquare,
  Sparkles,
  Info
} from 'lucide-react';
import { Student, AttendanceStatus, ClassConfig, AuthMode, PeriodConfig } from '../types';
import { AttendanceDayMap } from '../utils/storage';
import { getWeekNumberFromDate, getWeekDateRange } from '../utils/emulationUtils';

interface AttendanceManagerProps {
  students: Student[];
  config?: ClassConfig;
  authMode?: AuthMode;
  operatingDate?: string;
  attendanceMap?: AttendanceDayMap;
  periodConfig?: PeriodConfig;
  onUpdateAttendanceDate?: (dateStr: string, studentId: string, status: AttendanceStatus, note?: string) => void;
  onBatchAttendanceDate?: (dateStr: string, studentId: string, status: AttendanceStatus) => void;
  onUpdateAttendance?: (studentId: string, status: AttendanceStatus) => void;
  onBatchAttendance?: (status: AttendanceStatus) => void;
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  students,
  config,
  authMode = 'TEACHER',
  operatingDate,
  attendanceMap = {},
  periodConfig,
  onUpdateAttendanceDate,
  onBatchAttendanceDate,
  onUpdateAttendance,
  onBatchAttendance,
}) => {
  const todayStr = operatingDate || new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [filterPeriod, setFilterPeriod] = useState<'day' | 'week' | 'month' | 'semester'>('day');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');

  // Modal / Inline note state
  const [noteModalStudent, setNoteModalStudent] = useState<Student | null>(null);
  const [noteInputValue, setNoteInputValue] = useState<string>('');

  const isAdmin = authMode !== 'GUEST';

  // Quick navigation buttons: Ngày trước, Hôm nay, Ngày sau
  const shiftDate = (days: number) => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      d.setDate(d.getDate() + days);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dateVal = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${y}-${m}-${dateVal}`);
    } catch {
      setSelectedDate(todayStr);
    }
  };

  const goToToday = () => {
    setSelectedDate(todayStr);
  };

  // Get Vietnamese formatted weekday string
  const getFormattedDateDisplay = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = daysOfWeek[d.getDay()];
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${dayName}, ngày ${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Get current day's record map
  const dayRecords = attendanceMap[selectedDate] || {};

  // Get student attendance status for selected date
  const getStudentStatus = (studentId: string): AttendanceStatus => {
    if (dayRecords[studentId] && dayRecords[studentId].status) {
      return dayRecords[studentId].status;
    }
    // Fallback: If selectedDate is todayStr, check student.attendanceToday, else default 'present'
    if (selectedDate === todayStr) {
      const st = students.find(s => s.id === studentId);
      if (st && st.attendanceToday) return st.attendanceToday;
    }
    return 'present';
  };

  // Get student note for selected date
  const getStudentNote = (studentId: string): string => {
    return dayRecords[studentId]?.note || '';
  };

  // Handle status update
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (!isAdmin) return;
    const currentNote = getStudentNote(studentId);
    if (onUpdateAttendanceDate) {
      onUpdateAttendanceDate(selectedDate, studentId, status, currentNote);
    } else if (onUpdateAttendance && selectedDate === todayStr) {
      onUpdateAttendance(studentId, status);
    }
  };

  // Handle batch all present
  const handleBatchAllPresent = () => {
    if (!isAdmin) return;
    if (onBatchAttendanceDate) {
      onBatchAttendanceDate(selectedDate, 'present');
    } else if (onBatchAttendance) {
      onBatchAttendance('present');
    }
  };

  // Open Note Modal
  const handleOpenNoteModal = (student: Student) => {
    setNoteModalStudent(student);
    setNoteInputValue(getStudentNote(student.id));
  };

  // Save Note
  const handleSaveNoteModal = () => {
    if (!isAdmin || !noteModalStudent) return;
    const currentStatus = getStudentStatus(noteModalStudent.id);
    if (onUpdateAttendanceDate) {
      onUpdateAttendanceDate(selectedDate, noteModalStudent.id, currentStatus, noteInputValue.trim());
    }
    setNoteModalStudent(null);
    setNoteInputValue('');
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.studentCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = selectedTeam === 'all' || s.team === selectedTeam;
    return matchesSearch && matchesTeam;
  });

  // Calculate quick stats for selected date
  const total = students.length;
  let presentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;
  let unexcusedCount = 0;

  students.forEach(s => {
    const status = getStudentStatus(s.id);
    if (status === 'present') presentCount++;
    else if (status === 'late') lateCount++;
    else if (status === 'excused') excusedCount++;
    else if (status === 'unexcused') unexcusedCount++;
  });

  // Calculate cumulative stats across all recorded dates in attendanceMap
  const getCumulativeStats = (studentId: string) => {
    const dates = Object.keys(attendanceMap);
    if (dates.length === 0) {
      return { presentDays: 1, totalDays: 1, absences: 0, lates: 0, percent: 100 };
    }
    let totalDays = 0;
    let presentDays = 0;
    let absences = 0;
    let lates = 0;

    dates.forEach(d => {
      const rec = attendanceMap[d]?.[studentId];
      if (rec) {
        totalDays++;
        if (rec.status === 'present') presentDays++;
        else if (rec.status === 'late') { presentDays++; lates++; }
        else if (rec.status === 'excused' || rec.status === 'unexcused') absences++;
      }
    });

    if (totalDays === 0) {
      return { presentDays: 1, totalDays: 1, absences: 0, lates: 0, percent: 100 };
    }
    const percent = Math.round((presentDays / totalDays) * 100);
    return { presentDays, totalDays, absences, lates, percent };
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner & Date Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-emerald-500" />
              Quản Lý Chuyên Cần Lớp Học
            </h2>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
              📅 Tuần {getWeekNumberFromDate(selectedDate, periodConfig)}: {getWeekDateRange(getWeekNumberFromDate(selectedDate, periodConfig), periodConfig).dateRangeStr}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Điểm danh linh hoạt theo bất kỳ ngày nào trong năm học và tự động lưu dữ liệu chi tiết
          </p>
        </div>

        {/* Date Selector & Period Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Date Navigation Controls */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 active:scale-95"
              title="Chuyển sang ngày trước đó"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ngày trước</span>
            </button>

            <button
              type="button"
              onClick={goToToday}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
                selectedDate === todayStr
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shadow-2xs'
              }`}
              title="Trở về ngày hôm nay"
            >
              Hôm Nay
            </button>

            <button
              type="button"
              onClick={() => shiftDate(1)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 active:scale-95"
              title="Chuyển sang ngày tiếp theo"
            >
              <span className="hidden sm:inline">Ngày sau</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Flexible Date Picker Input */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            />
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => setFilterPeriod('day')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${filterPeriod === 'day' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold' : 'text-slate-500'}`}
            >
              Theo Ngày
            </button>
            <button
              onClick={() => setFilterPeriod('week')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${filterPeriod === 'week' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold' : 'text-slate-500'}`}
            >
              Theo Tuần
            </button>
            <button
              onClick={() => setFilterPeriod('month')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${filterPeriod === 'month' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold' : 'text-slate-500'}`}
            >
              Theo Tháng
            </button>
            <button
              onClick={() => setFilterPeriod('semester')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${filterPeriod === 'semester' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold' : 'text-slate-500'}`}
            >
              Học Kỳ
            </button>
          </div>
        </div>
      </div>

      {/* Date Active Banner Indicator */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-indigo-950/30 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
            Đang hiển thị & điểm danh ngày: <span className="text-emerald-700 dark:text-emerald-300 font-black underline">{getFormattedDateDisplay(selectedDate)}</span>
          </span>
        </div>
        {selectedDate !== todayStr ? (
          <button
            onClick={goToToday}
            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <RotateCcw className="w-3 h-3" /> Quay về ngày hôm nay ({todayStr})
          </button>
        ) : (
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0 self-start sm:self-auto">
            ✓ Ngày hiện tại
          </span>
        )}
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">Sĩ Số Lớp</div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{total}</div>
          <div className="text-[10px] text-slate-400 font-medium">Học sinh</div>
        </div>

        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
          <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Có Mặt
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{presentCount}</div>
          <div className="text-[10px] text-emerald-600/80 font-bold">{Math.round((presentCount / total) * 100 || 0)}% sĩ số</div>
        </div>

        <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 shadow-2xs">
          <div className="text-xs text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Đi Muộn
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{lateCount}</div>
          <div className="text-[10px] text-amber-600/80 font-bold">{Math.round((lateCount / total) * 100 || 0)}% sĩ số</div>
        </div>

        <div className="bg-rose-50/50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-200/80 dark:border-rose-800/60 shadow-2xs">
          <div className="text-xs text-rose-800 dark:text-rose-300 font-semibold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Vắng Có Phép
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{excusedCount}</div>
          <div className="text-[10px] text-rose-600/80 font-bold">Ngày {selectedDate}</div>
        </div>

        <div className="bg-rose-100/60 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-300 dark:border-rose-800 shadow-2xs">
          <div className="text-xs text-rose-900 dark:text-rose-200 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Vắng Không Phép
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">{unexcusedCount}</div>
          <div className="text-[10px] text-rose-700/80 font-bold">Cần báo PH</div>
        </div>
      </div>

      {/* Action Bar & Quick Batch Attendance */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên hoặc mã học sinh..."
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-700 dark:text-slate-200"
          >
            <option value="all">Tất cả các tổ</option>
            <option value="Tổ 1">Tổ 1</option>
            <option value="Tổ 2">Tổ 2</option>
            <option value="Tổ 3">Tổ 3</option>
            <option value="Tổ 4">Tổ 4</option>
          </select>
        </div>

        {/* Batch Action Buttons */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Thao tác nhanh ({selectedDate}):</span>
            <button
              onClick={handleBatchAllPresent}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <CheckCheck className="w-4 h-4" /> Đánh Dấu Tất Cả Có Mặt
            </button>
          </div>
        )}
      </div>

      {/* Attendance Grid Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700 font-extrabold">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">STT</th>
                <th className="py-3.5 px-4">Họ Và Tên</th>
                <th className="py-3.5 px-4">Tổ</th>
                <th className="py-3.5 px-4 text-center min-w-[340px]">Điểm Danh Ngày {selectedDate}</th>
                <th className="py-3.5 px-4 text-center">Ghi Chú Ngày</th>
                <th className="py-3.5 px-4 text-center">Thống Kê Tích Lũy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                    Không tìm thấy học sinh phù hợp.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const currentStatus = getStudentStatus(st.id);
                  const currentNote = getStudentNote(st.id);
                  const cumStats = getCumulativeStats(st.id);

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                        {st.stt}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img src={st.avatar} alt={st.fullName} className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                          <div>
                            <div className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              {st.fullName}
                              {st.ethnicity && st.ethnicity !== 'Kinh' && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                                  {st.ethnicity}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">{st.studentCode}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-600 dark:text-slate-300">
                        {st.team}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-wrap items-center justify-center gap-1 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                          <button
                            type="button"
                            disabled={!isAdmin}
                            onClick={() => handleStatusChange(st.id, 'present')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                            } ${!isAdmin ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Có mặt
                          </button>

                          <button
                            type="button"
                            disabled={!isAdmin}
                            onClick={() => handleStatusChange(st.id, 'late')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
                              currentStatus === 'late'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                            } ${!isAdmin ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                          >
                            <Clock className="w-3.5 h-3.5" /> Đi muộn
                          </button>

                          <button
                            type="button"
                            disabled={!isAdmin}
                            onClick={() => handleStatusChange(st.id, 'excused')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
                              currentStatus === 'excused'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                            } ${!isAdmin ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Vắng (Có phép)
                          </button>

                          <button
                            type="button"
                            disabled={!isAdmin}
                            onClick={() => handleStatusChange(st.id, 'unexcused')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
                              currentStatus === 'unexcused'
                                ? 'bg-rose-800 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                            } ${!isAdmin ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                          >
                            <AlertCircle className="w-3.5 h-3.5" /> Không phép
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {currentNote ? (
                          <div
                            onClick={() => isAdmin && handleOpenNoteModal(st)}
                            className={`px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-medium cursor-pointer max-w-[180px] mx-auto truncate flex items-center gap-1 justify-center ${
                              isAdmin ? 'hover:border-amber-400' : ''
                            }`}
                            title={currentNote}
                          >
                            <MessageSquare className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate">{currentNote}</span>
                          </div>
                        ) : (
                          isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenNoteModal(st)}
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                              title="Thêm ghi chú điểm danh cho ngày này"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-semibold">Ghi chú</span>
                            </button>
                          )
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center text-xs font-extrabold">
                        <span className="text-emerald-600 dark:text-emerald-400">{cumStats.percent}% có mặt</span>
                        {cumStats.absences > 0 && (
                          <span className="text-rose-500 dark:text-rose-400 ml-1.5">• {cumStats.absences} vắng</span>
                        )}
                        {cumStats.lates > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 ml-1.5">• {cumStats.lates} muộn</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Attendance Note */}
      {noteModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                Ghi Chú Điểm Danh ({selectedDate})
              </h3>
              <button
                type="button"
                onClick={() => setNoteModalStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center gap-3">
                <img src={noteModalStudent.avatar} alt={noteModalStudent.fullName} className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <div className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{noteModalStudent.fullName}</div>
                  <div className="text-slate-400 font-mono">{noteModalStudent.studentCode} • {noteModalStudent.team}</div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Nội dung ghi chú ngày {selectedDate}
                </label>
                <textarea
                  rows={3}
                  value={noteInputValue}
                  onChange={(e) => setNoteInputValue(e.target.value)}
                  placeholder="Ví dụ: Phụ huynh gọi điện báo sốt siêu vi, Xe hỏng đến muộn 15 phút..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setNoteModalStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveNoteModal}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                Lưu ghi chú
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
