import React, { useState } from 'react';
import { Calendar, Save, History, X, AlertCircle, Clock, UserCheck, Zap, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { PeriodConfig, PeriodConfigHistory, UserRole } from '../types';

interface PeriodConfigModalProps {
  periodConfig: PeriodConfig;
  history: PeriodConfigHistory[];
  schoolYear: string;
  userRole: UserRole;
  currentTeacherName: string;
  operatingDate?: string;
  onClose: () => void;
  onSaveConfig: (newConfig: PeriodConfig, historyItem: PeriodConfigHistory) => void;
}

export const PeriodConfigModal: React.FC<PeriodConfigModalProps> = ({
  periodConfig,
  history,
  schoolYear,
  userRole,
  currentTeacherName,
  operatingDate,
  onClose,
  onSaveConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'weeks' | 'months' | 'semesters' | 'history'>('weeks');
  
  // Clone current config for editing
  const [config, setConfig] = useState<PeriodConfig>(JSON.parse(JSON.stringify(periodConfig)));
  const [changeNote, setChangeNote] = useState<string>('');
  
  // Auto-generation controls state
  const [startDateWeek1, setStartDateWeek1] = useState<string>(
    config.weeks[1]?.startDate || '2026-08-17'
  );
  const [weekFormat, setWeekFormat] = useState<'7_DAYS' | '6_DAYS'>('7_DAYS');
  const [weekFilter, setWeekFilter] = useState<'ALL' | 'CURRENT' | 'HK1' | 'HK2'>('ALL');
  const [autoGenSuccessToast, setAutoGenSuccessToast] = useState<string | null>(null);

  // Weeks list (1..35)
  const weekNumbers = Array.from({ length: 35 }, (_, i) => i + 1);

  // Months list (8, 9, 10, 11, 12, 1, 2, 3, 4, 5)
  const monthNumbers = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5];

  // Helper: Get weekday name in Vietnamese
  const getWeekdayName = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return '';
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      return days[d.getDay()];
    } catch {
      return '';
    }
  };

  // Helper: Detect current week
  const todayStr = operatingDate || new Date().toISOString().slice(0, 10);
  const getCurrentWeekNum = (): number | null => {
    for (let w = 1; w <= 35; w++) {
      const wCfg = config.weeks[w];
      if (wCfg && wCfg.startDate && wCfg.endDate) {
        if (todayStr >= wCfg.startDate && todayStr <= wCfg.endDate) {
          return w;
        }
      }
    }
    return null;
  };
  const currentWeekNum = getCurrentWeekNum();

  // 1. Auto calculate & generate 35 weeks
  const handleAutoFill35Weeks = () => {
    if (!startDateWeek1) {
      alert('Vui lòng chọn Ngày bắt đầu cho Tuần 1');
      return;
    }

    const parts = startDateWeek1.split('-');
    if (parts.length !== 3) return;

    const baseYear = parseInt(parts[0], 10);
    const baseMonth = parseInt(parts[1], 10) - 1;
    const baseDay = parseInt(parts[2], 10);

    const baseDate = new Date(baseYear, baseMonth, baseDay);
    const daysInWeek = weekFormat === '6_DAYS' ? 5 : 6; // 6 days = Mon..Sat (+5 days), 7 days = Mon..Sun (+6 days)

    const newWeeks: Record<number, { startDate: string; endDate: string }> = {};
    let currentStart = new Date(baseDate);

    for (let w = 1; w <= 35; w++) {
      const y = currentStart.getFullYear();
      const m = String(currentStart.getMonth() + 1).padStart(2, '0');
      const d = String(currentStart.getDate()).padStart(2, '0');
      const startStr = `${y}-${m}-${d}`;

      const currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + daysInWeek);

      const endY = currentEnd.getFullYear();
      const endM = String(currentEnd.getMonth() + 1).padStart(2, '0');
      const endD = String(currentEnd.getDate()).padStart(2, '0');
      const endStr = `${endY}-${endM}-${endD}`;

      newWeeks[w] = { startDate: startStr, endDate: endStr };

      // Advance start by 7 days for next week
      currentStart.setDate(currentStart.getDate() + 7);
    }

    // Auto allocate semesters:
    // Học kỳ 1: Tuần 1 -> Tuần 18
    // Học kỳ 2: Tuần 19 -> Tuần 35
    const semester1 = {
      startDate: newWeeks[1].startDate,
      endDate: newWeeks[18].endDate,
    };
    const semester2 = {
      startDate: newWeeks[19].startDate,
      endDate: newWeeks[35].endDate,
    };

    // Auto generate month boundaries
    const y1 = baseYear;
    const y2 = y1 + 1;
    const months: Record<number, { startDate: string; endDate: string }> = {
      8: { startDate: `${y1}-08-01`, endDate: `${y1}-08-31` },
      9: { startDate: `${y1}-09-01`, endDate: `${y1}-09-30` },
      10: { startDate: `${y1}-10-01`, endDate: `${y1}-10-31` },
      11: { startDate: `${y1}-11-01`, endDate: `${y1}-11-30` },
      12: { startDate: `${y1}-12-01`, endDate: `${y1}-12-31` },
      1: { startDate: `${y2}-01-01`, endDate: `${y2}-01-31` },
      2: { startDate: `${y2}-02-01`, endDate: `${y2}-02-28` },
      3: { startDate: `${y2}-03-01`, endDate: `${y2}-03-31` },
      4: { startDate: `${y2}-04-01`, endDate: `${y2}-04-30` },
      5: { startDate: `${y2}-05-01`, endDate: `${y2}-05-31` },
    };

    setConfig(prev => ({
      ...prev,
      weeks: newWeeks,
      semester1,
      semester2,
      months,
    }));

    setAutoGenSuccessToast(`⚡ Đã tự động tính chính xác 35 tuần học! HK1 (T1-T18: ${semester1.startDate} → ${semester1.endDate}), HK2 (T19-T35: ${semester2.startDate} → ${semester2.endDate})`);
    setTimeout(() => setAutoGenSuccessToast(null), 5000);
  };

  const handleWeekChange = (wNum: number, field: 'startDate' | 'endDate', val: string) => {
    setConfig(prev => ({
      ...prev,
      weeks: {
        ...prev.weeks,
        [wNum]: {
          ...(prev.weeks[wNum] || { startDate: '', endDate: '' }),
          [field]: val
        }
      }
    }));
  };

  const handleMonthChange = (mNum: number, field: 'startDate' | 'endDate', val: string) => {
    setConfig(prev => ({
      ...prev,
      months: {
        ...prev.months,
        [mNum]: {
          ...(prev.months[mNum] || { startDate: '', endDate: '' }),
          [field]: val
        }
      }
    }));
  };

  const handleSemesterChange = (semesterKey: 'semester1' | 'semester2', field: 'startDate' | 'endDate', val: string) => {
    setConfig(prev => ({
      ...prev,
      [semesterKey]: {
        ...prev[semesterKey],
        [field]: val
      }
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (userRole !== 'ADMIN' && userRole !== 'GIÁO VIÊN') {
      alert('Bạn không có quyền thực hiện thay đổi cấu hình kỳ thi đua.');
      return;
    }

    const historyItem: PeriodConfigHistory = {
      id: 'cfg_hist_' + Date.now(),
      modifiedBy: currentTeacherName || 'Giáo viên/Admin',
      modifiedAt: new Date().toLocaleString('vi-VN'),
      note: changeNote || 'Tự động tính & cập nhật chu kỳ 35 tuần thi đua năm học',
      oldConfigSummary: `HK1: ${periodConfig.semester1.startDate} → ${periodConfig.semester1.endDate}, HK2: ${periodConfig.semester2.startDate} → ${periodConfig.semester2.endDate}`,
      newConfigSummary: `HK1: ${config.semester1.startDate} → ${config.semester1.endDate}, HK2: ${config.semester2.startDate} → ${config.semester2.endDate}`,
    };

    onSaveConfig(config, historyItem);
    onClose();
  };

  // Filtered week numbers based on weekFilter state
  const visibleWeekNumbers = weekNumbers.filter(wNum => {
    if (weekFilter === 'CURRENT') return currentWeekNum ? wNum === currentWeekNum : true;
    if (weekFilter === 'HK1') return wNum <= 18;
    if (weekFilter === 'HK2') return wNum >= 19;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 p-5 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur rounded-2xl">
              <Calendar className="w-6 h-6 text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">⚙️ THIẾT LẬP KỲ THI ĐUA 35 TUẦN</h2>
                <span className="px-2.5 py-0.5 bg-cyan-400/20 text-cyan-100 rounded-full text-xs font-bold border border-cyan-300/30">
                  {schoolYear}
                </span>
              </div>
              <p className="text-xs text-blue-100/90 mt-0.5">
                Tự động tính toán & quản lý chu kỳ 35 tuần thi đua từ Ngày bắt đầu Tuần 1
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl p-2 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 pt-3 gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('weeks')}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'weeks'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-2xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>Danh Sách 35 Tuần ({visibleWeekNumbers.length})</span>
            {currentWeekNum && (
              <span className="px-1.5 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-extrabold">
                Tuần {currentWeekNum}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('months')}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'months'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-2xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>Theo Tháng (8 → 5)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('semesters')}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'semesters'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-2xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span>Học Kỳ I & Học Kỳ II</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-2xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-purple-500" />
            <span>Lịch Sử Cấu Hình ({history.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: WEEKS */}
          {activeTab === 'weeks' && (
            <div className="space-y-5">
              {/* Auto Generation Engine Control Card */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 border border-blue-200/80 dark:border-blue-800/60 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-blue-200/60 dark:border-blue-800/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-blue-500/20" />
                    <h3 className="font-extrabold text-sm text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                      ⚡ Công Cụ Tự Động Tính Chu Kỳ 35 Tuần Năm Học
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2.5 py-1 rounded-full">
                    Chỉ cần 1 cú nhấp
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 items-end">
                  {/* Start date week 1 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ngày bắt đầu Tuần 1:
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={startDateWeek1}
                        onChange={(e) => setStartDateWeek1(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      {startDateWeek1 && (
                        <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1 flex items-center gap-1">
                          <span>📅 {getWeekdayName(startDateWeek1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Week format option */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Định dạng tuần học:
                    </label>
                    <select
                      value={weekFormat}
                      onChange={(e) => setWeekFormat(e.target.value as '7_DAYS' | '6_DAYS')}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="7_DAYS">7 ngày/tuần (Thứ 2 đến Chủ Nhật)</option>
                      <option value="6_DAYS">6 ngày/tuần (Thứ 2 đến Thứ 7)</option>
                    </select>
                  </div>

                  {/* Execute Button */}
                  <div>
                    <button
                      type="button"
                      onClick={handleAutoFill35Weeks}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>⚡ Tự động tính & áp dụng cho 35 tuần</span>
                    </button>
                  </div>
                </div>

                {autoGenSuccessToast && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-start gap-2 animate-in fade-in zoom-in-95">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{autoGenSuccessToast}</span>
                  </div>
                )}
              </div>

              {/* Week Filter Bar & Current Week Indicator */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Lọc tuần:</span>
                  </span>
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0">
                    <button
                      type="button"
                      onClick={() => setWeekFilter('ALL')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        weekFilter === 'ALL' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Tất cả (35 tuần)
                    </button>
                    {currentWeekNum && (
                      <button
                        type="button"
                        onClick={() => setWeekFilter('CURRENT')}
                        className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                          weekFilter === 'CURRENT' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                      >
                        <span>⚡ Tuần Hiện Tại (Tuần {currentWeekNum})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setWeekFilter('HK1')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        weekFilter === 'HK1' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Học kỳ I (Tuần 1-18)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeekFilter('HK2')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        weekFilter === 'HK2' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Học kỳ II (Tuần 19-35)
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-medium shrink-0">
                  💡 Bạn có thể chỉnh sửa thủ công ngày bất kỳ tuần nào (ví dụ: nghỉ lễ/Tết).
                </div>
              </div>

              {/* Grid of 35 Weeks */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {visibleWeekNumbers.map((wNum) => {
                  const wConfig = config.weeks[wNum] || { startDate: '', endDate: '' };
                  const isCurrent = wNum === currentWeekNum;
                  const isHK1 = wNum <= 18;

                  return (
                    <div
                      key={wNum}
                      className={`p-3.5 rounded-2xl space-y-2 transition-all border ${
                        isCurrent
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-400/20'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-lg font-black text-xs ${
                            isCurrent
                              ? 'bg-emerald-600 text-white'
                              : isHK1 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'
                          }`}>
                            Tuần {wNum}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            {isHK1 ? 'Học kỳ I' : 'Học kỳ II'}
                          </span>
                        </div>

                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-emerald-500 text-white font-extrabold text-[10px] rounded-full shadow-2xs flex items-center gap-1 animate-pulse">
                            ⚡ Tuần Hiện Tại
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5 font-bold">
                            Bắt đầu:
                          </label>
                          <input
                            type="date"
                            value={wConfig.startDate || ''}
                            onChange={(e) => handleWeekChange(wNum, 'startDate', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5 font-bold">
                            Kết thúc:
                          </label>
                          <input
                            type="date"
                            value={wConfig.endDate || ''}
                            onChange={(e) => handleWeekChange(wNum, 'endDate', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MONTHS */}
          {activeTab === 'months' && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  Hệ thống tự động xác định mốc thời gian từng tháng thi đua (Từ tháng 8 đến tháng 5 năm sau). Bạn có thể chỉnh sửa linh hoạt theo kế hoạch của trường.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {monthNumbers.map((mNum) => {
                  const mConfig = config.months[mNum] || { startDate: '', endDate: '' };
                  const monthName = mNum >= 8 ? `Tháng ${String(mNum).padStart(2, '0')} (Năm 1)` : `Tháng ${String(mNum).padStart(2, '0')} (Năm 2)`;
                  return (
                    <div
                      key={mNum}
                      className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2 hover:border-amber-400 transition-colors"
                    >
                      <div className="font-bold text-sm text-amber-600 dark:text-amber-400 flex items-center justify-between">
                        <span>{monthName}</span>
                        <span className="text-xs font-semibold text-slate-500">
                          {mConfig.startDate} → {mConfig.endDate}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-slate-500 mb-1 font-bold">Ngày bắt đầu:</label>
                          <input
                            type="date"
                            value={mConfig.startDate || ''}
                            onChange={(e) => handleMonthChange(mNum, 'startDate', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1 font-bold">Ngày kết thúc:</label>
                          <input
                            type="date"
                            value={mConfig.endDate || ''}
                            onChange={(e) => handleMonthChange(mNum, 'endDate', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SEMESTERS */}
          {activeTab === 'semesters' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-xs text-emerald-800 dark:text-emerald-300">
                Thiết lập khoảng thời gian Học Kỳ I (Tuần 1 - 18) & Học Kỳ II (Tuần 19 - 35). Báo cáo và bảng xếp hạng tổng kết học kỳ sẽ tự động tổng hợp dữ liệu trong mốc thời gian này.
              </div>

              {/* Semester 1 */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                <h3 className="font-extrabold text-base text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>Học Kỳ I (Tuần 1 đến Tuần 18)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ngày bắt đầu Học Kỳ I:
                    </label>
                    <input
                      type="date"
                      value={config.semester1.startDate}
                      onChange={(e) => handleSemesterChange('semester1', 'startDate', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ngày kết thúc Học Kỳ I:
                    </label>
                    <input
                      type="date"
                      value={config.semester1.endDate}
                      onChange={(e) => handleSemesterChange('semester1', 'endDate', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Semester 2 */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                <h3 className="font-extrabold text-base text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>Học Kỳ II (Tuần 19 đến Tuần 35)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ngày bắt đầu Học Kỳ II:
                    </label>
                    <input
                      type="date"
                      value={config.semester2.startDate}
                      onChange={(e) => handleSemesterChange('semester2', 'startDate', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ngày kết thúc Học Kỳ II:
                    </label>
                    <input
                      type="date"
                      value={config.semester2.endDate}
                      onChange={(e) => handleSemesterChange('semester2', 'endDate', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-600" />
                  <span>Nhật Ký Thay Đổi Cấu Hình Kỳ Thi Đua ({history.length})</span>
                </h3>
                <span className="text-xs text-slate-500">Mọi thao tác đều được lưu vết chi tiết</span>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Chưa có lịch sử thay đổi cấu hình kỳ thi đua.</p>
                  <p className="text-xs text-slate-500 mt-1">Lịch sử sẽ tự động ghi vết mỗi khi bạn bấm Lưu Cấu Hình.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4" />
                          <span>{item.modifiedBy}</span>
                        </span>
                        <span className="text-slate-500">{item.modifiedAt}</span>
                      </div>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{item.note}</p>
                      <div className="text-xs space-y-1 font-mono bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80">
                        <div className="text-red-500 line-through">Cấu hình cũ: {item.oldConfigSummary}</div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-bold">Cấu hình mới: {item.newConfigSummary}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Change Note Input */}
          {activeTab !== 'history' && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Lý do thay đổi cấu hình (ghi vào nhật ký):
              </label>
              <input
                type="text"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="Ví dụ: Tự động tính toán lại 35 tuần học cho năm học 2026-2027 từ ngày 17/08/2026"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Actions Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Người thực hiện: <strong>{currentTeacherName || 'Giáo viên/Admin'}</strong></span>
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              {activeTab !== 'history' && (
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>LƯU CẤU HÌNH & ĐỒNG BỘ 35 TUẦN</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
