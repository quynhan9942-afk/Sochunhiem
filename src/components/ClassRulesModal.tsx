import React, { useState, useEffect } from 'react';
import { 
  Award, 
  AlertTriangle, 
  X, 
  Sparkles,
  Users,
  Info,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  Save,
  Check,
  ShieldAlert,
  GraduationCap,
  Clock,
  BookOpen
} from 'lucide-react';
import { ClassRulesConfig, ClassRuleItem, AuthMode } from '../types';
import { DEFAULT_CLASS_RULES_CONFIG } from '../utils/storage';

interface ClassRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  schoolYear?: string;
  authMode?: AuthMode;
  config?: ClassRulesConfig;
  onSaveConfig?: (newConfig: ClassRulesConfig) => void;
  onResetDefault?: () => void;
}

export const ClassRulesModal: React.FC<ClassRulesModalProps> = ({
  isOpen,
  onClose,
  className = '6a3',
  schoolYear = '2026-2027',
  authMode = 'GUEST',
  config = DEFAULT_CLASS_RULES_CONFIG,
  onSaveConfig,
  onResetDefault,
}) => {
  const isAdmin = authMode === 'ADMIN' || authMode === 'TEACHER';

  // Draft State for Editing
  const [draftConfig, setDraftConfig] = useState<ClassRulesConfig>(config);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Edit / Add Rule Modal State
  const [editingRule, setEditingRule] = useState<ClassRuleItem | null>(null);
  const [isRuleFormOpen, setIsRuleFormOpen] = useState<boolean>(false);
  const [formType, setFormType] = useState<'BONUS' | 'PENALTY'>('BONUS');
  const [formCategory, setFormCategory] = useState<string>('Khen thưởng cá nhân');
  const [formCustomCategory, setFormCustomCategory] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formPoints, setFormPoints] = useState<number>(5);
  const [formIsTeamRule, setFormIsTeamRule] = useState<boolean>(false);

  // Sync draft state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setDraftConfig(config || DEFAULT_CLASS_RULES_CONFIG);
      setHasChanges(false);
      setSaveSuccessMsg(null);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  // Categories list derived from current rules
  const existingBonusCategories = Array.from(
    new Set(draftConfig.rules.filter(r => r.type === 'BONUS').map(r => r.category))
  );
  const existingPenaltyCategories = Array.from(
    new Set(draftConfig.rules.filter(r => r.type === 'PENALTY').map(r => r.category))
  );

  // Handlers for Base Score & Special Note
  const handleBaseScoreChange = (newScore: number) => {
    setDraftConfig(prev => ({ ...prev, baseScore: newScore }));
    setHasChanges(true);
  };

  const handleSpecialNoteChange = (note: string) => {
    setDraftConfig(prev => ({ ...prev, specialNote: note }));
    setHasChanges(true);
  };

  // Handlers for Rule Items
  const handleOpenAddRule = (type: 'BONUS' | 'PENALTY') => {
    setEditingRule(null);
    setFormType(type);
    setFormCategory(type === 'BONUS' ? 'Khen thưởng cá nhân' : 'a) Chuyên cần');
    setFormCustomCategory('');
    setFormTitle('');
    setFormPoints(type === 'BONUS' ? 5 : 5);
    setFormIsTeamRule(false);
    setIsRuleFormOpen(true);
  };

  const handleOpenEditRule = (rule: ClassRuleItem) => {
    setEditingRule(rule);
    setFormType(rule.type);
    setFormCategory(rule.category);
    setFormCustomCategory('');
    setFormTitle(rule.title);
    setFormPoints(rule.points);
    setFormIsTeamRule(!!rule.isTeamRule);
    setIsRuleFormOpen(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tiêu chí nội quy này?')) {
      setDraftConfig(prev => ({
        ...prev,
        rules: prev.rules.filter(r => r.id !== ruleId)
      }));
      setHasChanges(true);
    }
  };

  const handleSaveRuleItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Vui lòng nhập tên tiêu chí / hành vi!');
      return;
    }

    const finalCategory = formCategory === '__CUSTOM__' 
      ? (formCustomCategory.trim() || 'Tiêu chí khác') 
      : formCategory;

    if (editingRule) {
      // Update existing
      setDraftConfig(prev => ({
        ...prev,
        rules: prev.rules.map(r => r.id === editingRule.id ? {
          ...r,
          type: formType,
          category: finalCategory,
          title: formTitle.trim(),
          points: Math.abs(formPoints) || 1,
          isTeamRule: formIsTeamRule
        } : r)
      }));
    } else {
      // Add new
      const newRule: ClassRuleItem = {
        id: `rule_custom_${Date.now()}`,
        type: formType,
        category: finalCategory,
        title: formTitle.trim(),
        points: Math.abs(formPoints) || 1,
        isTeamRule: formIsTeamRule
      };
      setDraftConfig(prev => ({
        ...prev,
        rules: [...prev.rules, newRule]
      }));
    }

    setHasChanges(true);
    setIsRuleFormOpen(false);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục lại bảng nội quy mặc định ban đầu của nhà trường?')) {
      setDraftConfig(DEFAULT_CLASS_RULES_CONFIG);
      setHasChanges(true);
      if (onResetDefault) {
        onResetDefault();
      }
    }
  };

  const handleSaveAllConfig = () => {
    if (onSaveConfig) {
      onSaveConfig({
        ...draftConfig,
        updatedAt: new Date().toISOString()
      });
      setHasChanges(false);
      setSaveSuccessMsg('Đã lưu và đồng bộ bảng nội quy mới thành công!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    }
  };

  // Group Rules by Category
  const bonusRules = draftConfig.rules.filter(r => r.type === 'BONUS');
  const penaltyRules = draftConfig.rules.filter(r => r.type === 'PENALTY');

  const bonusGrouped = bonusRules.reduce((acc, rule) => {
    acc[rule.category] = acc[rule.category] || [];
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<string, ClassRuleItem[]>);

  const penaltyGrouped = penaltyRules.reduce((acc, rule) => {
    acc[rule.category] = acc[rule.category] || [];
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<string, ClassRuleItem[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-3 md:p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl relative max-h-[92vh] flex flex-col my-auto overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center font-black text-xl shadow-inner shrink-0">
              📜
            </div>
            <div>
              <h2 className="font-black text-base md:text-xl text-white uppercase tracking-tight flex items-center gap-2">
                NỘI QUY LỚP CHỦ NHIỆM {className}
              </h2>
              <p className="text-xs text-blue-100 flex items-center gap-2 mt-0.5">
                <span>Năm học: {schoolYear}</span>
                <span>•</span>
                <span className="bg-emerald-400/30 text-emerald-100 px-2 py-0.5 rounded-full font-bold">
                  {draftConfig.baseScore} điểm gốc / tuần
                </span>
                {isAdmin && (
                  <span className="bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-full text-[10px] uppercase">
                    Chế độ Admin
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-2xl transition-colors cursor-pointer shrink-0"
            title="Đóng bảng nội quy"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Admin Action Bar */}
        {isAdmin && (
          <div className="bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-extrabold">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Quản lý Nội Quy Động (Dynamic Rules Engine)</span>
              {hasChanges && (
                <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-lg text-[10px] font-black border border-amber-300">
                  Chưa lưu
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => handleOpenAddRule('BONUS')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Tiêu Chí Thưởng
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddRule('PENALTY')}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Tiêu Chí Phạt
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Khôi phục nội quy chuẩn mặc định"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Khôi phục mặc định
              </button>
              <button
                type="button"
                onClick={handleSaveAllConfig}
                disabled={!hasChanges}
                className={`px-4 py-1.5 rounded-xl font-extrabold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  hasChanges 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-400 animate-pulse' 
                    : 'bg-slate-300 text-slate-500 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        )}

        {/* Success Alert Toast */}
        {saveSuccessMsg && (
          <div className="bg-emerald-500 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 animate-fadeIn shrink-0">
            <Check className="w-4 h-4" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Modal Body - Scrollable */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-100 text-xs md:text-sm">
          
          {/* Section 1: Baseline Rules */}
          <div className="bg-blue-50/80 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-extrabold text-blue-900 dark:text-blue-200 text-sm md:text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                1. THIẾT LẬP MỨC ĐIỂM GỐC HÀNG TUẦN
              </h3>

              {isAdmin && (
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700">
                  <span className="font-bold text-xs text-slate-600 dark:text-slate-300">Điểm chuẩn gốc / tuần:</span>
                  <input
                    type="number"
                    min={50}
                    max={200}
                    value={draftConfig.baseScore}
                    onChange={(e) => handleBaseScoreChange(Number(e.target.value) || 100)}
                    className="w-16 px-2 py-0.5 bg-blue-50 dark:bg-slate-900 border border-blue-400 rounded-lg text-center font-black text-blue-800 dark:text-blue-200 text-xs focus:outline-none"
                  />
                  <span className="font-bold text-xs text-slate-500">điểm</span>
                </div>
              )}
            </div>

            <ul className="space-y-1.5 text-blue-800 dark:text-blue-300 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Mỗi học sinh bắt đầu mỗi tuần học mới với điểm chuẩn gốc: <strong>{draftConfig.baseScore} điểm / tuần</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  Công thức tổng kết tuần: <strong className="bg-blue-100 dark:bg-blue-900/80 px-2 py-0.5 rounded text-blue-900 dark:text-blue-100 font-mono font-black">Điểm tổng kết = {draftConfig.baseScore} + (Tổng điểm cộng) - (Tổng điểm trừ)</strong>
                </span>
              </li>
            </ul>
          </div>

          {/* Section 2: Bonus Points (+ Points) */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-extrabold text-emerald-900 dark:text-emerald-200 text-sm md:text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                2. ĐIỂM THƯỞNG (+ CỘNG ĐIỂM THI ĐUA)
              </h3>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenAddRule('BONUS')}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm mục
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(bonusGrouped).map(([catName, ruleItems]: [string, ClassRuleItem[]]) => (
                <div key={catName} className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/60 shadow-2xs space-y-2">
                  <div className="font-extrabold text-emerald-800 dark:text-emerald-300 text-xs uppercase tracking-wider flex items-center justify-between gap-2 border-b border-emerald-100 dark:border-emerald-900/40 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      {catName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal lowercase">({ruleItems.length} tiêu chí)</span>
                  </div>

                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 text-xs">
                    {ruleItems.map(item => (
                      <li key={item.id} className="flex items-center justify-between gap-2 bg-emerald-50/50 dark:bg-emerald-950/40 p-2 rounded-lg group">
                        <div className="flex items-center gap-1.5 min-w-0 pr-1">
                          <span className="truncate">{item.title}</span>
                          {item.isTeamRule && (
                            <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-md text-[9px] font-extrabold shrink-0">
                              Tổ
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                            +{item.points}đ
                          </span>

                          {isAdmin && (
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleOpenEditRule(item)}
                                className="p-1 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-slate-600 dark:text-slate-300 rounded cursor-pointer"
                                title="Chỉnh sửa tiêu chí"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRule(item.id)}
                                className="p-1 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 rounded cursor-pointer"
                                title="Xóa tiêu chí"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Penalty Points (- Points) */}
          <div className="bg-rose-50/60 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-200 dark:border-rose-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-extrabold text-rose-900 dark:text-rose-200 text-sm md:text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                3. ĐIỂM PHẠT (- TRỪ ĐIỂM THI ĐUA)
              </h3>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenAddRule('PENALTY')}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm mục
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(penaltyGrouped).map(([catName, ruleItems]: [string, ClassRuleItem[]]) => (
                <div key={catName} className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/60 shadow-2xs space-y-2">
                  <div className="font-extrabold text-rose-800 dark:text-rose-300 text-xs uppercase tracking-wider flex items-center justify-between gap-2 border-b border-rose-100 dark:border-rose-900/40 pb-1.5">
                    <span className="flex items-center gap-1.5 truncate">
                      <Clock className="w-4 h-4 text-rose-600 shrink-0" />
                      {catName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal lowercase shrink-0">({ruleItems.length})</span>
                  </div>

                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 text-xs">
                    {ruleItems.map(item => (
                      <li key={item.id} className="flex items-center justify-between gap-2 bg-rose-50/50 dark:bg-rose-950/40 p-2 rounded-lg group">
                        <div className="flex items-center gap-1.5 min-w-0 pr-1">
                          <span className="truncate">{item.title}</span>
                          {item.isTeamRule && (
                            <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-md text-[9px] font-extrabold shrink-0">
                              Tổ
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-rose-600 dark:text-rose-400">
                            -{item.points}đ
                          </span>

                          {isAdmin && (
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleOpenEditRule(item)}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded cursor-pointer"
                                title="Chỉnh sửa tiêu chí"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRule(item.id)}
                                className="p-1 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 rounded cursor-pointer"
                                title="Xóa tiêu chí"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Special Mandatory Note */}
          <div className="bg-amber-500/10 dark:bg-amber-950/40 p-4.5 rounded-2xl border-2 border-amber-400 dark:border-amber-700 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-300 text-xs md:text-sm uppercase tracking-wide">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 animate-bounce" />
                📌 GHI CHÚ LƯU Ý ĐẶC BIỆT
              </div>
            </div>

            {isAdmin ? (
              <textarea
                value={draftConfig.specialNote}
                onChange={(e) => handleSpecialNoteChange(e.target.value)}
                rows={3}
                className="w-full text-xs md:text-sm text-amber-950 dark:text-amber-100 font-extrabold leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-300 dark:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Nhập ghi chú lưu ý đặc biệt tại đây..."
              />
            ) : (
              <p className="text-xs md:text-sm text-amber-900 dark:text-amber-200 font-extrabold leading-relaxed bg-amber-100/60 dark:bg-amber-950/80 p-3 rounded-xl border border-amber-300 dark:border-amber-800">
                "{draftConfig.specialNote}"
              </p>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Áp dụng chung cho Giáo viên, Học sinh và Phụ huynh</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {isAdmin && hasChanges && (
              <button
                type="button"
                onClick={handleSaveAllConfig}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                LƯU NỘI QUY MỚI
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              ĐÃ HIỂU VÀ ĐỒNG Ý
            </button>
          </div>
        </div>
      </div>

      {/* SUB-MODAL: Add / Edit Rule Item */}
      {isRuleFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {editingRule ? '✏️ Sửa Tiêu Chí Nội Quy' : '➕ Thêm Tiêu Chí Nội Quy Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRuleFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRuleItem} className="space-y-4 text-xs">
              {/* Type Selection */}
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Loại tiêu chí:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('BONUS');
                      if (formCategory.startsWith('a)') || formCategory.startsWith('b)')) {
                        setFormCategory('Khen thưởng cá nhân');
                      }
                    }}
                    className={`py-2 px-3 rounded-xl font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formType === 'BONUS'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    + Thưởng (Cộng điểm)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('PENALTY');
                      if (formCategory === 'Khen thưởng cá nhân') {
                        setFormCategory('a) Chuyên cần');
                      }
                    }}
                    className={`py-2 px-3 rounded-xl font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formType === 'PENALTY'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    - Phạt (Trừ điểm)
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Phân nhóm tiêu chí:</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {formType === 'BONUS' ? (
                    <>
                      {existingBonusCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="Khen thưởng cá nhân">Khen thưởng cá nhân</option>
                      <option value="Thưởng Tập Thể Tổ">Thưởng Tập Thể Tổ</option>
                      <option value="Đạo đức & Việc tốt">Đạo đức & Việc tốt</option>
                      <option value="__CUSTOM__">+ Tạo nhóm mới...</option>
                    </>
                  ) : (
                    <>
                      {existingPenaltyCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="a) Chuyên cần">a) Chuyên cần</option>
                      <option value="b) Học tập">b) Học tập</option>
                      <option value="c) Đạo đức & Tác phong">c) Đạo đức & Tác phong</option>
                      <option value="Trừ Tập Thể Tổ">Trừ Tập Thể Tổ</option>
                      <option value="__CUSTOM__">+ Tạo nhóm mới...</option>
                    </>
                  )}
                </select>

                {formCategory === '__CUSTOM__' && (
                  <input
                    type="text"
                    value={formCustomCategory}
                    onChange={(e) => setFormCustomCategory(e.target.value)}
                    placeholder="Nhập tên nhóm tiêu chí mới..."
                    className="w-full mt-2 px-3 py-2 bg-white dark:bg-slate-900 border border-blue-400 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                    required
                  />
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Tên hành vi / tiêu chí:</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Kiểm tra miệng đạt 10 điểm..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Points & Team Flag */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Mức điểm (+ hoặc -):</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formPoints}
                    onChange={(e) => setFormPoints(Math.abs(Number(e.target.value)) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={formIsTeamRule}
                      onChange={(e) => setFormIsTeamRule(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Áp dụng cho Tập thể Tổ</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsRuleFormOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold transition-all shadow-xs cursor-pointer"
                >
                  Đồng Ý / Hoàn Tất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
