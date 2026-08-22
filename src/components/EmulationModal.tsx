import React, { useState } from 'react';
import { Plus, Minus, Check, X, AlertTriangle, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { Student, ClassRulesConfig } from '../types';

interface EmulationModalProps {
  student: Student | null;
  mode: 'add' | 'deduct';
  operatingDate?: string;
  onClose: () => void;
  onSubmit: (studentId: string, scoreDiff: number, reasonCategory: string, reasonDetail: string, customDate?: string) => void;
  teacherName: string;
  classRulesConfig?: ClassRulesConfig;
}

const ADD_REASON_PRESETS = [
  { category: 'Học tập & Cá nhân', label: 'Phát biểu đúng trong giờ học', points: 2 },
  { category: 'Học tập & Cá nhân', label: 'Phát biểu xây dựng bài (chưa đúng)', points: 1 },
  { category: 'Học tập & Cá nhân', label: 'Kiểm tra miệng đạt 8 - 9 điểm', points: 3 },
  { category: 'Học tập & Cá nhân', label: 'Kiểm tra miệng đạt 10 điểm', points: 5 },
  { category: 'Đạo đức & Việc tốt', label: 'Nhặt được của rơi trả người bị mất', points: 5 },
  { category: 'Thưởng Tập Thể Tổ', label: 'Tổ không vi phạm đồng phục trong tuần', points: 50 },
  { category: 'Thưởng Tập Thể Tổ', label: 'Tổ không vi phạm tác phong, ngôn phong trong tuần', points: 50 },
  { category: 'Thưởng Tập Thể Tổ', label: 'Tổ ổn định tốt 15 phút ôn bài đầu giờ', points: 50 },
  { category: 'Khen thưởng khác', label: 'Tuyên dương / Khác', points: 1 },
];

const DEDUCT_REASON_PRESETS = [
  // a) Chuyên cần
  { category: 'a) Chuyên cần', label: 'Đi học trễ, vào lớp sau giáo viên', points: 5 },
  { category: 'a) Chuyên cần', label: 'Vắng học không phép (không có phụ huynh xin phép)', points: 5 },
  { category: 'a) Chuyên cần', label: 'Trốn học, cúp tiết', points: 20 },

  // b) Học tập
  { category: 'b) Học tập', label: 'Kiểm tra miệng kém (0, 1, 2 điểm)', points: 10 },
  { category: 'b) Học tập', label: 'Kiểm tra miệng yếu (3, 4 điểm)', points: 5 },
  { category: 'b) Học tập', label: 'Quay cóp trong giờ kiểm tra', points: 10 },
  { category: 'b) Học tập', label: 'Không chép bài / Không làm bài tập về nhà', points: 5 },
  { category: 'b) Học tập', label: 'Không chuẩn bị bài trước khi đến lớp', points: 5 },

  // c) Đạo đức & Tác phong
  { category: 'c) Đạo đức & Tác phong', label: 'Làm lớp bị giờ B', points: 5 },
  { category: 'c) Đạo đức & Tác phong', label: 'Làm lớp bị giờ C', points: 10 },
  { category: 'c) Đạo đức & Tác phong', label: 'Không mặc áo đồng phục', points: 10 },
  { category: 'c) Đạo đức & Tác phong', label: 'Mất trật tự trong giờ học / Chào cờ', points: 5 },
  { category: 'c) Đạo đức & Tác phong', label: 'Bị ghi tên vào Sổ đầu bài', points: 10 },
  { category: 'c) Đạo đức & Tác phong', label: 'Không tham gia lao động / Trực nhật / Hoạt động tập thể', points: 20 },
  { category: 'c) Đạo đức & Tác phong', label: 'Vi phạm an toàn giao thông', points: 10 },
  { category: 'c) Đạo đức & Tác phong', label: 'Xả rác trong lớp/trường, mang đồ ăn uống vào lớp', points: 5 },
  { category: 'c) Đạo đức & Tác phong', label: 'Viết vẽ bậy lên tường, bàn ghế', points: 5 },
  { category: 'c) Đạo đức & Tác phong', label: 'Ngồi lên bàn hoặc xô đổ bàn ghế', points: 5 },
  { category: 'c) Đạo đức & Tác phong', label: 'Nói tục, chửi thề', points: 10 },
  { category: 'c) Đạo đức & Tác phong', label: 'Vi phạm quy định khác', points: 5 },
];

const ADD_LEVELS = [1, 2, 3, 5, 10, 20, 50];
const DEDUCT_LEVELS = [1, 2, 3, 5, 10, 20];

export const EmulationModal: React.FC<EmulationModalProps> = ({
  student,
  mode,
  operatingDate,
  onClose,
  onSubmit,
  teacherName,
  classRulesConfig,
}) => {
  if (!student) return null;

  const dynamicAddPresets = classRulesConfig?.rules
    ? classRulesConfig.rules.filter(r => r.type === 'BONUS').map(r => ({
        category: r.category,
        label: r.title,
        points: r.points
      }))
    : ADD_REASON_PRESETS;

  const dynamicDeductPresets = classRulesConfig?.rules
    ? classRulesConfig.rules.filter(r => r.type === 'PENALTY').map(r => ({
        category: r.category,
        label: r.title,
        points: r.points
      }))
    : DEDUCT_REASON_PRESETS;

  const presets = mode === 'add'
    ? (dynamicAddPresets.length > 0 ? dynamicAddPresets : ADD_REASON_PRESETS)
    : (dynamicDeductPresets.length > 0 ? dynamicDeductPresets : DEDUCT_REASON_PRESETS);
  
  const todayYMD = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(operatingDate || todayYMD);
  const [selectedPreset, setSelectedPreset] = useState(presets[0]?.label || '');
  const [pointsValue, setPointsValue] = useState<number>(presets[0]?.points || 5);
  const [note, setNote] = useState('');
  const [showConfirmDeduct, setShowConfirmDeduct] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleLevelClick = (val: number) => {
    setPointsValue(val);
  };

  const handleSelectPreset = (presetLabel: string, defaultPoints: number) => {
    setSelectedPreset(presetLabel);
    setPointsValue(defaultPoints);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'deduct' && !showConfirmDeduct) {
      setShowConfirmDeduct(true);
      return;
    }
    executeSave();
  };

  const executeSave = () => {
    const finalScoreDiff = mode === 'add' ? Math.abs(pointsValue) : -Math.abs(pointsValue);
    
    onSubmit(
      student.id,
      finalScoreDiff,
      selectedPreset,
      note.trim() || selectedPreset,
      selectedDate
    );

    const sign = mode === 'add' ? '+' : '-';
    setSuccessToast(`✓ Đã ${mode === 'add' ? 'cộng' : 'trừ'} ${sign}${Math.abs(pointsValue)} điểm cho ${student.fullName}`);

    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative">
        {/* Success Toast Banner */}
        {successToast && (
          <div className="absolute inset-x-4 top-4 z-20 bg-emerald-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 font-bold text-sm animate-bounce">
            <Check className="w-5 h-5" />
            {successToast}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg ${
              mode === 'add' 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
            }`}>
              {mode === 'add' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                {mode === 'add' ? 'CỘNG ĐIỂM THI ĐUA' : 'TRỪ ĐIỂM THI ĐUA'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Học sinh: <strong className="text-slate-800 dark:text-slate-200">{student.fullName}</strong>
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

        {/* Student Information Banner */}
        <div className="my-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <img src={student.avatar} alt={student.fullName} className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-100">
                {student.fullName} ({student.studentCode})
              </div>
              <div className="text-slate-500">
                Tổ: {student.team} • STT: {student.stt}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Điểm hiện tại</span>
            <span className="font-black text-sm text-blue-600 dark:text-blue-400">
              {student.emulationScore > 0 ? `+${student.emulationScore}` : student.emulationScore} đ
            </span>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {/* Quick Level Selector */}
          <div>
            <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Mức điểm ({mode === 'add' ? '+' : '-'})
            </label>
            <div className="flex items-center gap-2">
              {(mode === 'add' ? ADD_LEVELS : DEDUCT_LEVELS).map((lvl) => {
                const isActive = pointsValue === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleLevelClick(lvl)}
                    className={`flex-1 py-2 rounded-xl font-black text-xs transition-all border ${
                      isActive
                        ? mode === 'add'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-105'
                          : 'bg-rose-600 text-white border-rose-600 shadow-sm scale-105'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {mode === 'add' ? `+${lvl}` : `-${lvl}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              📅 Ngày tính điểm (Chọn thủ công)
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Lý do (Chọn nhanh theo nội quy)
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => {
                const p = presets.find(item => item.label === e.target.value);
                handleSelectPreset(e.target.value, p ? p.points : pointsValue);
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from(new Set(presets.map(p => p.category))).map(cat => (
                <optgroup key={cat} label={cat}>
                  {presets.filter(p => p.category === cat).map((p) => (
                    <option key={p.label} value={p.label}>
                      {p.label} ({mode === 'add' ? '+' : '-'}{p.points}đ)
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Custom Points & Teacher */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Số điểm tùy chỉnh
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={pointsValue}
                onChange={(e) => setPointsValue(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Người thực hiện
              </label>
              <input
                type="text"
                disabled
                value={teacherName}
                className="w-full px-3 py-2 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 font-medium text-slate-500"
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Ghi chú thêm
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập nội dung ghi chú chi tiết..."
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Deduct Warning Step */}
          {showConfirmDeduct && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Xác nhận trừ điểm học sinh
              </div>
              <p className="text-[11px] leading-relaxed">
                Bạn có chắc chắn muốn <strong>TRỪ -{pointsValue} ĐIỂM</strong> của học sinh <strong>{student.fullName}</strong> vì lý do "{selectedPreset}" không?
              </p>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold"
            >
              HỦY BỎ
            </button>

            {mode === 'deduct' && showConfirmDeduct ? (
              <button
                type="button"
                onClick={executeSave}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                XÁC NHẬN TRỪ ĐIỂM
              </button>
            ) : (
              <button
                type="submit"
                className={`px-5 py-2.5 rounded-xl text-white font-black shadow-md flex items-center gap-1.5 ${
                  mode === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <Check className="w-4 h-4" />
                {mode === 'add' ? 'XÁC NHẬN CỘNG ĐIỂM' : 'XÁC NHẬN TRỪ ĐIỂM'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
