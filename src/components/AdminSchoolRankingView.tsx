import React, { useState, useEffect } from 'react';
import { 
  School, 
  Trophy, 
  Save, 
  Plus, 
  Trash2, 
  ArrowUpDown, 
  Calendar, 
  Check, 
  AlertCircle, 
  ShieldAlert, 
  Search,
  Award,
  Sparkles
} from 'lucide-react';
import { UserRole, ClassConfig, PeriodConfig, SchoolRankingEntry } from '../types';
import { loadSchoolRankings, saveSchoolRankings } from '../utils/storage';
import { saveSchoolRankingsToCloud } from '../utils/firebase';

interface AdminSchoolRankingViewProps {
  userRole?: UserRole;
  schoolYear?: string;
  config?: ClassConfig;
  periodConfig?: PeriodConfig;
  operatingDate?: string;
}

const DEFAULT_SCHOOL_CLASSES = [
  { classId: '6A1', className: '6A1', grade: 'Khối 6', totalClasses: 24, score: 120, averageScore: 3.75, note: 'Xuất sắc' },
  { classId: '6A2', className: '6A2', grade: 'Khối 6', totalClasses: 24, score: 112, averageScore: 3.50, note: 'Tốt' },
  { classId: '6A3', className: '6A3', grade: 'Khối 6', totalClasses: 24, score: 98, averageScore: 3.06, note: 'Khá' },
  { classId: '6A4', className: '6A4', grade: 'Khối 6', totalClasses: 24, score: 105, averageScore: 3.28, note: 'Tốt' },
  { classId: '7A1', className: '7A1', grade: 'Khối 7', totalClasses: 24, score: 125, averageScore: 3.90, note: 'Dẫn đầu khối 7' },
  { classId: '7A2', className: '7A2', grade: 'Khối 7', totalClasses: 24, score: 118, averageScore: 3.68, note: 'Tốt' },
  { classId: '7A3', className: '7A3', grade: 'Khối 7', totalClasses: 24, score: 92, averageScore: 2.87, note: 'Cần cố gắng' },
  { classId: '7A4', className: '7A4', grade: 'Khối 7', totalClasses: 24, score: 110, averageScore: 3.43, note: 'Tốt' },
  { classId: '8A1', className: '8A1', grade: 'Khối 8', totalClasses: 24, score: 115, averageScore: 3.59, note: 'Nỗ lực cao' },
  { classId: '8A2', className: '8A2', grade: 'Khối 8', totalClasses: 24, score: 122, averageScore: 3.81, note: 'Xuất sắc' },
  { classId: '8A3', className: '8A3', grade: 'Khối 8', totalClasses: 24, score: 108, averageScore: 3.37, note: 'Tốt' },
  { classId: '8A4', className: '8A4', grade: 'Khối 8', totalClasses: 24, score: 88, averageScore: 2.75, note: 'Nhắc nhở nề nếp' },
  { classId: '9A1', className: '9A1', grade: 'Khối 9', totalClasses: 24, score: 130, averageScore: 4.06, note: 'Dẫn đầu toàn trường' },
  { classId: '9A2', className: '9A2', grade: 'Khối 9', totalClasses: 24, score: 116, averageScore: 3.62, note: 'Tốt' },
  { classId: '9A3', className: '9A3', grade: 'Khối 9', totalClasses: 24, score: 102, averageScore: 3.18, note: 'Khá' },
  { classId: '9A4', className: '9A4', grade: 'Khối 9', totalClasses: 24, score: 96, averageScore: 3.00, note: 'Khá' },
  { classId: '10A1', className: '10A1', grade: 'Khối 10', totalClasses: 24, score: 121, averageScore: 3.78, note: 'Xuất sắc' },
  { classId: '10A2', className: '10A2', grade: 'Khối 10', totalClasses: 24, score: 114, averageScore: 3.56, note: 'Tốt' },
  { classId: '11A1', className: '11A1', grade: 'Khối 11', totalClasses: 24, score: 119, averageScore: 3.71, note: 'Tốt' },
  { classId: '11A2', className: '11A2', grade: 'Khối 11', totalClasses: 24, score: 106, averageScore: 3.31, note: 'Khá' },
  { classId: '12A1', className: '12A1', grade: 'Khối 12', totalClasses: 24, score: 128, averageScore: 4.00, note: 'Xuất sắc' },
  { classId: '12A2', className: '12A2', grade: 'Khối 12', totalClasses: 24, score: 120, averageScore: 3.75, note: 'Tốt' },
  { classId: '12A3', className: '12A3', grade: 'Khối 12', totalClasses: 24, score: 111, averageScore: 3.46, note: 'Tốt' },
  { classId: '12A4', className: '12A4', grade: 'Khối 12', totalClasses: 24, score: 95, averageScore: 2.96, note: 'Cần cố gắng' },
];

export const AdminSchoolRankingView: React.FC<AdminSchoolRankingViewProps> = ({
  userRole = 'ADMIN',
  schoolYear = '2026-2027',
  config,
  periodConfig,
  operatingDate,
}) => {
  const isAdmin = userRole === 'ADMIN';

  // Period Type selection
  const [periodType, setPeriodType] = useState<'week' | 'month' | 'semester'>('week');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(8);
  const [selectedSemester, setSelectedSemester] = useState<'hk1' | 'hk2'>('hk1');

  // Compute period key e.g. week_1, month_8, semester_hk1
  const periodKey = periodType === 'week' ? `week_${selectedWeek}` :
                    periodType === 'month' ? `month_${selectedMonth}` :
                    `semester_${selectedSemester}`;

  // Ranking data state for current selected period
  const [rankings, setRankings] = useState<SchoolRankingEntry[]>([]);
  const [filterGrade, setFilterGrade] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load ranking data whenever periodKey or schoolYear changes
  useEffect(() => {
    const loaded = loadSchoolRankings(schoolYear, periodKey);
    if (loaded && loaded.length > 0) {
      setRankings(loaded);
    } else {
      // Auto-generate default initial records for all 24 classes for this period
      const defaults: SchoolRankingEntry[] = DEFAULT_SCHOOL_CLASSES.map((c, idx) => ({
        rankingId: `rk_${periodKey}_${c.classId}`,
        schoolId: config?.schoolId || 'THCS_LQD',
        schoolYearId: schoolYear,
        periodType,
        periodKey,
        startDate: '2026-08-17',
        endDate: '2026-08-23',
        classId: c.classId,
        className: c.className,
        grade: c.grade,
        rank: idx + 1,
        totalClasses: 24,
        score: c.score,
        averageScore: c.averageScore,
        note: c.note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: 'Admin',
      }));
      // Sort initially by score desc
      defaults.sort((a, b) => b.score - a.score);
      defaults.forEach((item, index) => {
        item.rank = index + 1;
      });
      setRankings(defaults);
    }
  }, [periodKey, schoolYear, periodType, config?.schoolId]);

  // Handler to update a single row field
  const handleUpdateField = (rankingId: string, field: keyof SchoolRankingEntry, value: any) => {
    setRankings(prev => prev.map(item => {
      if (item.rankingId === rankingId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Auto re-rank classes based on score
  const handleAutoRank = () => {
    const sorted = [...rankings].sort((a, b) => b.score - a.score);
    const updated = sorted.map((item, index) => ({
      ...item,
      rank: index + 1,
      averageScore: Number((item.score / 32).toFixed(2))
    }));
    setRankings(updated);
    setSuccessMsg('✓ Đã tự động sắp xếp lại thứ hạng theo tổng điểm');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Add a new class row
  const handleAddClass = () => {
    const newId = `rk_${periodKey}_custom_${Date.now()}`;
    const newEntry: SchoolRankingEntry = {
      rankingId: newId,
      schoolId: config?.schoolId || 'THCS_LQD',
      schoolYearId: schoolYear,
      periodType,
      periodKey,
      startDate: '2026-08-17',
      endDate: '2026-08-23',
      classId: `Mới_${rankings.length + 1}`,
      className: `Lớp Mới ${rankings.length + 1}`,
      grade: 'Khối 6',
      rank: rankings.length + 1,
      totalClasses: rankings.length + 1,
      score: 100,
      averageScore: 3.12,
      note: 'Mới thêm',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: 'Admin',
    };
    setRankings(prev => [...prev, newEntry]);
  };

  // Delete a class row
  const handleDeleteClass = (rankingId: string) => {
    setRankings(prev => prev.filter(r => r.rankingId !== rankingId));
  };

  // Save Ranking Data to LocalStorage and Firebase
  const handleSaveAllRankings = async () => {
    if (!isAdmin) return;

    // Save to LocalStorage
    saveSchoolRankings(schoolYear, periodKey, rankings);

    // Save to Firebase
    await saveSchoolRankingsToCloud(schoolYear, periodKey, rankings, config?.schoolId || 'THCS_LQD');

    setSuccessMsg(`💾 Đã lưu thành công Bảng xếp hạng toàn trường cho kỳ [${periodKey.toUpperCase()}]!`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Filter rankings by grade and search query
  const filteredRankings = rankings
    .filter(r => filterGrade === 'ALL' || r.grade === filterGrade)
    .filter(r => r.className.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-600 text-white font-bold text-sm rounded-2xl shadow-xl flex items-center justify-between gap-2 animate-bounce">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-white hover:opacity-80">✕</button>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-3xl p-6 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold mb-2 text-cyan-100">
            🏫 QUẢN LÝ THI ĐUA TOÀN TRƯỜNG ({config?.schoolName || 'THCS Nguyễn Văn Cừ'})
          </span>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-300" />
            Xếp Hạng Thi Đua Toàn Trường
          </h2>
          <p className="text-blue-100 text-xs mt-1">
            Quản lý, cập nhật và lưu trữ kết quả xếp hạng thi đua tuần/tháng/học kỳ độc lập cho toàn bộ {rankings.length} lớp.
          </p>
        </div>

        {/* Access Role Badge */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 ${
            isAdmin ? 'bg-emerald-500 text-white shadow-md' : 'bg-amber-400 text-slate-900'
          }`}>
            <Sparkles className="w-4 h-4" />
            <span>Quyền hạn: <strong>{isAdmin ? 'ADMIN (Toàn quyền chỉnh sửa)' : 'GIÁO VIÊN (Chế độ xem)'}</strong></span>
          </div>

          {isAdmin && (
            <button
              onClick={handleSaveAllRankings}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 transition-transform active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>💾 LƯU XẾP HẠNG</span>
            </button>
          )}
        </div>
      </div>

      {/* PERIOD & TIME FILTER BAR */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Period Type Selection */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kỳ thi đua:</span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                onClick={() => setPeriodType('week')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  periodType === 'week' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                📅 TUẦN
              </button>
              <button
                onClick={() => setPeriodType('month')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  periodType === 'month' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                📅 THÁNG
              </button>
              <button
                onClick={() => setPeriodType('semester')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  periodType === 'semester' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                🎓 HỌC KỲ
              </button>
            </div>
          </div>

          {/* Specific Sub-Period Selectors */}
          <div className="flex items-center gap-3">
            {periodType === 'week' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Chọn tuần:</span>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-extrabold text-slate-800 dark:text-slate-100"
                >
                  {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>Tuần {w}</option>
                  ))}
                </select>
              </div>
            )}

            {periodType === 'month' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Chọn tháng:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-extrabold text-slate-800 dark:text-slate-100"
                >
                  {[8, 9, 10, 11, 12, 1, 2, 3, 4, 5].map(m => (
                    <option key={m} value={m}>Tháng {m < 10 ? `0${m}` : m}</option>
                  ))}
                </select>
              </div>
            )}

            {periodType === 'semester' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Chọn học kỳ:</span>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value as any)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-extrabold text-slate-800 dark:text-slate-100"
                >
                  <option value="hk1">Học Kỳ I</option>
                  <option value="hk2">Học Kỳ II</option>
                </select>
              </div>
            )}

            {/* Grade Filter */}
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">Tất cả các khối</option>
              <option value="Khối 6">Khối 6</option>
              <option value="Khối 7">Khối 7</option>
              <option value="Khối 8">Khối 8</option>
              <option value="Khối 9">Khối 9</option>
              <option value="Khối 10">Khối 10</option>
              <option value="Khối 11">Khối 11</option>
              <option value="Khối 12">Khối 12</option>
            </select>
          </div>
        </div>

        {/* Action Controls for Admin */}
        {isAdmin && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoRank}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Tự động xếp hạng 1, 2, 3... dựa trên điểm số"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Tự động xếp hạng theo điểm</span>
              </button>

              <button
                onClick={handleAddClass}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Lớp</span>
              </button>
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Đang chỉnh sửa dữ liệu kỳ: <strong className="text-indigo-600 dark:text-indigo-400 font-mono uppercase">{periodKey}</strong> ({filteredRankings.length} lớp)
            </div>
          </div>
        )}
      </div>

      {/* RANKING DATA TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>BẢNG KẾT QUẢ XẾP HẠNG LỚP TOÀN TRƯỜNG</span>
          </div>

          <div className="relative max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên lớp (ví dụ: 6a3)..."
              className="pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-extrabold uppercase border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 text-center w-16">Hạng</th>
                <th className="p-3 min-w-[100px]">Tên Lớp</th>
                <th className="p-3 min-w-[100px]">Khối</th>
                <th className="p-3 text-center min-w-[90px]">Sĩ số Lớp</th>
                <th className="p-3 text-center min-w-[110px]">Tổng Điểm</th>
                <th className="p-3 text-center min-w-[110px]">ĐTB / Học Sinh</th>
                <th className="p-3 min-w-[180px]">Ghi Chú / Đánh Giá</th>
                {isAdmin && <th className="p-3 text-center w-16">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredRankings.map((r) => {
                const isUserClass = r.className === (config?.className || '6a3');
                return (
                  <tr
                    key={r.rankingId}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      isUserClass ? 'bg-amber-50/50 dark:bg-amber-950/30 border-l-4 border-amber-500 font-bold' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="p-3 text-center">
                      {isAdmin ? (
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={r.rank}
                          onChange={(e) => handleUpdateField(r.rankingId, 'rank', Number(e.target.value) || 1)}
                          className="w-12 text-center py-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-black text-xs"
                        />
                      ) : (
                        <span className={`w-7 h-7 rounded-lg font-black inline-flex items-center justify-center text-xs ${
                          r.rank === 1 ? 'bg-amber-400 text-amber-950' :
                          r.rank === 2 ? 'bg-slate-300 text-slate-800' :
                          r.rank === 3 ? 'bg-amber-700 text-white' :
                          'bg-slate-100 dark:bg-slate-700 text-slate-600'
                        }`}>
                          {r.rank}
                        </span>
                      )}
                    </td>

                    {/* Class Name */}
                    <td className="p-3 font-extrabold text-slate-800 dark:text-slate-100">
                      {isAdmin ? (
                        <input
                          type="text"
                          value={r.className}
                          onChange={(e) => handleUpdateField(r.rankingId, 'className', e.target.value)}
                          className="w-20 px-2 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-xs"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span>Lớp {r.className}</span>
                          {isUserClass && (
                            <span className="px-1.5 py-0.5 bg-amber-400 text-amber-950 text-[10px] rounded font-black">
                              LỚP BẠN
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Grade */}
                    <td className="p-3 font-semibold text-slate-600 dark:text-slate-300">
                      {isAdmin ? (
                        <select
                          value={r.grade}
                          onChange={(e) => handleUpdateField(r.rankingId, 'grade', e.target.value)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                        >
                          <option value="Khối 6">Khối 6</option>
                          <option value="Khối 7">Khối 7</option>
                          <option value="Khối 8">Khối 8</option>
                          <option value="Khối 9">Khối 9</option>
                          <option value="Khối 10">Khối 10</option>
                          <option value="Khối 11">Khối 11</option>
                          <option value="Khối 12">Khối 12</option>
                        </select>
                      ) : (
                        r.grade
                      )}
                    </td>

                    {/* Total Classes / Student Count */}
                    <td className="p-3 text-center">
                      {isAdmin ? (
                        <input
                          type="number"
                          value={r.totalClasses}
                          onChange={(e) => handleUpdateField(r.rankingId, 'totalClasses', Number(e.target.value) || 24)}
                          className="w-14 text-center py-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-semibold text-xs"
                        />
                      ) : (
                        `${r.totalClasses} Lớp`
                      )}
                    </td>

                    {/* Score */}
                    <td className="p-3 text-center font-black text-indigo-600 dark:text-indigo-400">
                      {isAdmin ? (
                        <input
                          type="number"
                          value={r.score}
                          onChange={(e) => handleUpdateField(r.rankingId, 'score', Number(e.target.value) || 0)}
                          className="w-16 text-center py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-700 rounded-lg font-black text-xs text-indigo-700 dark:text-indigo-300"
                        />
                      ) : (
                        `${r.score >= 0 ? `+${r.score}` : r.score} đ`
                      )}
                    </td>

                    {/* Average Score */}
                    <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {isAdmin ? (
                        <input
                          type="number"
                          step="0.01"
                          value={r.averageScore}
                          onChange={(e) => handleUpdateField(r.rankingId, 'averageScore', Number(e.target.value) || 0)}
                          className="w-16 text-center py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-lg font-bold text-xs text-emerald-700 dark:text-emerald-300"
                        />
                      ) : (
                        `${r.averageScore} đ/HS`
                      )}
                    </td>

                    {/* Note */}
                    <td className="p-3">
                      {isAdmin ? (
                        <input
                          type="text"
                          value={r.note}
                          onChange={(e) => handleUpdateField(r.rankingId, 'note', e.target.value)}
                          placeholder="Nhập ghi chú..."
                          className="w-full px-2 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                        />
                      ) : (
                        <span className="text-slate-600 dark:text-slate-300">{r.note || '—'}</span>
                      )}
                    </td>

                    {/* Action delete */}
                    {isAdmin && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteClass(r.rankingId)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                          title="Xóa dòng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer save prompt */}
        {isAdmin && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              💡 Bấm <strong>LƯU XẾP HẠNG</strong> để lưu lại toàn bộ dữ liệu kỳ thi đua này vào bộ nhớ hệ thống & Firebase.
            </p>
            <button
              onClick={handleSaveAllRankings}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>💾 LƯU XẾP HẠNG KỲ NÀY</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
