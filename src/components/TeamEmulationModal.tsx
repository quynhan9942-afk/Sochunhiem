import React, { useState } from 'react';
import { X, Award, ShieldAlert, Sparkles, Users, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Student, TeamNumber, ClassRulesConfig } from '../types';

interface TeamEmulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onSubmitTeamEmulation: (
    team: TeamNumber | 'ALL_TEAMS',
    scoreDiff: number,
    reasonCategory: string,
    reasonDetail: string
  ) => void;
  classRulesConfig?: ClassRulesConfig;
}

export const TeamEmulationModal: React.FC<TeamEmulationModalProps> = ({
  isOpen,
  onClose,
  students = [],
  onSubmitTeamEmulation,
  classRulesConfig,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<TeamNumber | 'ALL_TEAMS'>('Tổ 1');
  const [actionType, setActionType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [selectedPreset, setSelectedPreset] = useState<string>('Tổ không vi phạm đồng phục trong tuần (+50đ)');
  const [customPoints, setCustomPoints] = useState<number>(50);
  const [reasonDetail, setReasonDetail] = useState<string>('');

  if (!isOpen) return null;

  const teamList: TeamNumber[] = ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'];

  const defaultPositivePresets = [
    { label: 'Tổ không vi phạm đồng phục trong tuần (+50đ)', pts: 50, cat: 'Thưởng Tập Thể' },
    { label: 'Tổ không vi phạm tác phong, ngôn phong trong tuần (+50đ)', pts: 50, cat: 'Thưởng Tập Thể' },
    { label: 'Tổ ổn định tốt 15 phút ôn bài đầu giờ (+50đ)', pts: 50, cat: 'Thưởng Tập Thể' },
    { label: 'Tổ xuất sắc hoàn thành trực nhật, vệ sinh (+50đ)', pts: 50, cat: 'Thưởng Tập Thể' },
    { label: 'Tổ đạt thành tích phong trào thi đua tuần (+30đ)', pts: 30, cat: 'Thưởng Tập Thể' },
  ];

  const defaultNegativePresets = [
    { label: 'Tổ nhiều thành viên vi phạm tác phong (-20đ)', pts: -20, cat: 'Trừ Tập Thể' },
    { label: 'Tổ 15 phút đầu giờ mất trật tự (-30đ)', pts: -30, cat: 'Trừ Tập Thể' },
    { label: 'Tổ không hoàn thành trực nhật lớp (-30đ)', pts: -30, cat: 'Trừ Tập Thể' },
    { label: 'Tổ vi phạm nghiêm trọng nội quy tuần (-50đ)', pts: -50, cat: 'Trừ Tập Thể' },
  ];

  // Dynamic team presets from classRulesConfig
  let dynamicPositive = defaultPositivePresets;
  let dynamicNegative = defaultNegativePresets;

  if (classRulesConfig?.rules && classRulesConfig.rules.length > 0) {
    const teamBonusRules = classRulesConfig.rules.filter(
      r => r.type === 'BONUS' && (r.isTeamRule || r.category.includes('Tổ') || r.category.includes('Tập thể'))
    );
    if (teamBonusRules.length > 0) {
      dynamicPositive = teamBonusRules.map(r => ({
        label: `${r.title} (+${r.points}đ)`,
        pts: r.points,
        cat: r.category
      }));
    }

    const teamPenaltyRules = classRulesConfig.rules.filter(
      r => r.type === 'PENALTY' && (r.isTeamRule || r.category.includes('Tổ') || r.category.includes('Tập thể'))
    );
    if (teamPenaltyRules.length > 0) {
      dynamicNegative = teamPenaltyRules.map(r => ({
        label: `${r.title} (-${r.points}đ)`,
        pts: -r.points,
        cat: r.category
      }));
    }
  }

  const currentPresets = actionType === 'ADD' ? dynamicPositive : dynamicNegative;

  const handleSelectPreset = (p: { label: string; pts: number; cat: string }) => {
    setSelectedPreset(p.label);
    setCustomPoints(Math.abs(p.pts));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPoints = actionType === 'ADD' ? Math.abs(customPoints) : -Math.abs(customPoints);
    const category = actionType === 'ADD' ? 'Thưởng Tập Thể Tổ' : 'Trừ Tập Thể Tổ';
    const detail = reasonDetail.trim() || selectedPreset;

    onSubmitTeamEmulation(selectedTeam, finalPoints, category, detail);
    onClose();
  };

  // Affected student count preview
  const affectedCount = selectedTeam === 'ALL_TEAMS' 
    ? students.length 
    : students.filter(s => s.team === selectedTeam).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className={`p-6 text-white flex items-center justify-between ${
          actionType === 'ADD' 
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700' 
            : 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg">
                {actionType === 'ADD' ? '🏆 Thưởng Điểm Tập Thể Tổ' : '⚠️ Trừ Điểm Tập Thể Tổ'}
              </h3>
              <p className="text-xs text-white/80">
                Cộng / trừ điểm thi đua đồng loạt cho các thành viên trong Tổ
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          
          {/* Action Switcher (Cộng / Trừ) */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl font-bold">
            <button
              type="button"
              onClick={() => {
                setActionType('ADD');
                setSelectedPreset(dynamicPositive[0]?.label || '');
                setCustomPoints(dynamicPositive[0]?.pts || 50);
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                actionType === 'ADD' 
                  ? 'bg-emerald-600 text-white shadow-xs font-black' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" /> + Thưởng Điểm Tổ
            </button>
            <button
              type="button"
              onClick={() => {
                setActionType('DEDUCT');
                setSelectedPreset(dynamicNegative[0]?.label || '');
                setCustomPoints(Math.abs(dynamicNegative[0]?.pts || 20));
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                actionType === 'DEDUCT' 
                  ? 'bg-rose-600 text-white shadow-xs font-black' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> - Trừ Điểm Tổ
            </button>
          </div>

          {/* Select Target Team */}
          <div>
            <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Chọn Tổ Áp Dụng:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {teamList.map((tm) => (
                <button
                  key={tm}
                  type="button"
                  onClick={() => setSelectedTeam(tm)}
                  className={`p-2.5 rounded-2xl border font-black transition-all cursor-pointer text-center ${
                    selectedTeam === tm
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-102'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {tm}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedTeam('ALL_TEAMS')}
                className={`p-2.5 rounded-2xl border font-black transition-all cursor-pointer text-center col-span-2 sm:col-span-1 ${
                  selectedTeam === 'ALL_TEAMS'
                    ? 'bg-amber-500 border-amber-500 text-white shadow-md scale-102'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                Cả 4 Tổ
              </button>
            </div>
            <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-1">
              ✨ Đang áp dụng cho <strong>{affectedCount} học sinh</strong> thuộc {selectedTeam === 'ALL_TEAMS' ? 'toàn lớp' : selectedTeam}.
            </p>
          </div>

          {/* Select Rule Presets */}
          <div>
            <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Chọn Nội Quy Tập Thể Tuần:
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {currentPresets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`w-full text-left p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    selectedPreset === p.label
                      ? actionType === 'ADD' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-extrabold'
                        : 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-950 dark:text-rose-200 font-extrabold'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{p.label}</span>
                  <span className={`px-2 py-0.5 rounded-full font-black text-[11px] whitespace-nowrap ${
                    actionType === 'ADD' ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                  }`}>
                    {p.pts > 0 ? `+${p.pts}` : p.pts}đ
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Points & Detail Input */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Mức Điểm:
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={customPoints}
                onChange={(e) => setCustomPoints(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl font-black text-center text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Ghi Chú Chi Tiết:
              </label>
              <input
                type="text"
                placeholder="Nhập lý do thưởng/phạt chi tiết..."
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl font-semibold text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Footer Submit Controls */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-2xl font-black text-white shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                actionType === 'ADD' 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Xác Nhận {actionType === 'ADD' ? 'Cộng' : 'Trừ'} Điểm Tập Thể
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
