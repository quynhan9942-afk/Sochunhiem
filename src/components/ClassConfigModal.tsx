import React, { useState } from 'react';
import { X, Settings, School, Users, Calendar, UserCheck, Save, Trophy, Image, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { ClassConfig } from '../types';

interface ClassConfigModalProps {
  config: ClassConfig;
  onClose: () => void;
  onSaveConfig: (newConfig: ClassConfig) => Promise<boolean> | boolean;
}

export const ClassConfigModal: React.FC<ClassConfigModalProps> = ({
  config,
  onClose,
  onSaveConfig,
}) => {
  const [schoolName, setSchoolName] = useState(config.schoolName || '');
  const [className, setClassName] = useState(config.className || '');
  const [schoolYear, setSchoolYear] = useState(config.schoolYear || '');
  const [teacherName, setTeacherName] = useState(config.teacherName || '');
  const [numberOfTeams, setNumberOfTeams] = useState<number>(config.numberOfTeams || 4);
  const [teamNamesStr, setTeamNamesStr] = useState<string>(
    config.teamNames && config.teamNames.length > 0
      ? config.teamNames.join(', ')
      : 'Tổ 1, Tổ 2, Tổ 3, Tổ 4'
  );
  const [classDescription, setClassDescription] = useState<string>(config.classDescription || '');
  const [classLogo, setClassLogo] = useState<string>(config.classLogo || '');
  const [rankingMethod, setRankingMethod] = useState<'AVERAGE' | 'TOTAL'>(config.rankingMethod || 'AVERAGE');
  const [initialScore, setInitialScore] = useState<number>(config.initialScore ?? 100);

  // Validation & Status state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Validation
    if (!schoolName.trim()) {
      setErrorMessage('⚠️ Vui lòng nhập tên trường.');
      return;
    }
    if (!className.trim()) {
      setErrorMessage('⚠️ Vui lòng nhập tên lớp.');
      return;
    }
    if (!schoolYear.trim()) {
      setErrorMessage('⚠️ Vui lòng nhập năm học.');
      return;
    }
    if (!teacherName.trim()) {
      setErrorMessage('⚠️ Vui lòng nhập tên giáo viên chủ nhiệm.');
      return;
    }

    const parsedTeams = teamNamesStr
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const updatedConfig: ClassConfig = {
      ...config,
      schoolName: schoolName.trim(),
      className: className.trim(),
      schoolYear: schoolYear.trim(),
      teacherName: teacherName.trim(),
      homeroomTeacherName: teacherName.trim(),
      numberOfTeams,
      teamNames: parsedTeams.length > 0 ? parsedTeams : ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'],
      classDescription: classDescription.trim(),
      classLogo: classLogo.trim(),
      rankingMethod,
      initialScore,
      schoolId: config.schoolId || 'THCS_LQD',
      teacherId: config.teacherId || 'TEACHER_001',
    };

    setIsSubmitting(true);

    try {
      const result = await onSaveConfig(updatedConfig);
      setIsSubmitting(false);

      if (result !== false) {
        setSuccessMessage('✓ Đã lưu thay đổi');
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setErrorMessage('⚠️ Không thể lưu thay đổi. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Error saving config modal:', err);
      setIsSubmitting(false);
      setErrorMessage('⚠️ Không thể lưu thay đổi. Vui lòng thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">
                ⚙️ Thiết Lập Lớp Học
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cấu hình thông tin trường, lớp, năm học, tổ & tiêu chuẩn thi đua
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs my-4">
          {/* Section 1: School & Class Basic Info */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
              🏫 Thông tin cơ bản
            </span>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-indigo-600" /> Tên Trường *
              </label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Ví dụ: THCS Nguyễn Văn Cừ"
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" /> Tên Lớp *
                </label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="6a3"
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Năm Học *
                </label>
                <input
                  type="text"
                  required
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  placeholder="2026 - 2027"
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> Giáo Viên Chủ Nhiệm (GVCN) *
              </label>
              <input
                type="text"
                required
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Cô Lê Thị Quỳnh An"
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Section 2: Team Configurations */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
              👥 Cấu hình Tổ Lớp Học
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Số Lượng Tổ:
                </label>
                <select
                  value={numberOfTeams}
                  onChange={(e) => setNumberOfTeams(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100"
                >
                  <option value={2}>2 Tổ</option>
                  <option value={3}>3 Tổ</option>
                  <option value={4}>4 Tổ</option>
                  <option value={5}>5 Tổ</option>
                  <option value={6}>6 Tổ</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Tên Các Tổ (Phân cách dấu phẩy):
                </label>
                <input
                  type="text"
                  value={teamNamesStr}
                  onChange={(e) => setTeamNamesStr(e.target.value)}
                  placeholder="Tổ 1, Tổ 2, Tổ 3, Tổ 4"
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Emulation Settings */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
              🏆 Thiết lập Thi đua & Xếp hạng
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Phương Thức Xếp Hạng:
                </label>
                <select
                  value={rankingMethod}
                  onChange={(e) => setRankingMethod(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100"
                >
                  <option value="AVERAGE">Điểm TB / Học sinh (Ưu tiên)</option>
                  <option value="TOTAL">Tổng điểm ròng lớp</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Điểm Thi Đua Khởi Đầu:
                </label>
                <input
                  type="number"
                  value={initialScore}
                  onChange={(e) => setInitialScore(Number(e.target.value))}
                  placeholder="100"
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Display & Logo */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
              🖼️ Hiển thị & Khẩu hiệu lớp
            </span>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                Khẩu hiệu / Mô tả lớp:
              </label>
              <input
                type="text"
                value={classDescription}
                onChange={(e) => setClassDescription(e.target.value)}
                placeholder="Lớp 6a3 - Đoàn kết, Chăm ngoan, Học giỏi!"
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                URL Logo / Avatar Lớp (Tùy chọn):
              </label>
              <input
                type="url"
                value={classLogo}
                onChange={(e) => setClassLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Đang lưu...' : '💾 LƯU THAY ĐỔI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
