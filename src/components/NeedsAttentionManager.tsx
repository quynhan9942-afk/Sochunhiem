import React, { useState } from 'react';
import { HeartHandshake, PhoneCall, CheckCircle2 } from 'lucide-react';
import { Student, NeedsAttentionCategory } from '../types';

interface NeedsAttentionManagerProps {
  students?: Student[];
  onSelectStudent: (student: Student) => void;
  onOpenParentContact: (student: Student) => void;
  onUpdateNeedsAttention: (studentId: string, isAttention: boolean, category?: NeedsAttentionCategory, note?: string) => void;
}

export const NeedsAttentionManager: React.FC<NeedsAttentionManagerProps> = ({
  students = [],
  onSelectStudent,
  onOpenParentContact,
  onUpdateNeedsAttention,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const studentList = Array.isArray(students) ? students : [];

  const attentionList = studentList.filter(s => {
    if (!s.isNeedsAttention) return false;
    if (selectedCategory !== 'all' && s.needsAttentionCategory !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 text-white shadow-lg shadow-amber-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold mb-2">
            <HeartHandshake className="w-4 h-4 text-amber-200" /> Đồng Hành & Hỗ Trợ Học Sinh
          </span>
          <h2 className="text-2xl font-black">
            Danh Sách Học Sinh Cần Quan Tâm ({attentionList.length})
          </h2>
          <p className="text-amber-100 text-xs mt-1">
            Theo dõi, động viên và hỗ trợ kịp thời đối với học sinh gặp khó khăn về hoàn cảnh, rèn luyện, chuyên cần hay tâm lý lứa tuổi
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1 bg-black/20 p-1 rounded-2xl text-xs font-semibold border border-white/20">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl transition-all ${selectedCategory === 'all' ? 'bg-white text-amber-900 shadow-xs' : 'text-amber-100'}`}
          >
            Tất cả ({studentList.filter(s => s.isNeedsAttention).length})
          </button>
          <button
            onClick={() => setSelectedCategory('Chuyên cần')}
            className={`px-3 py-1.5 rounded-xl transition-all ${selectedCategory === 'Chuyên cần' ? 'bg-white text-amber-900 shadow-xs' : 'text-amber-100'}`}
          >
            Chuyên cần
          </button>
          <button
            onClick={() => setSelectedCategory('Rèn luyện')}
            className={`px-3 py-1.5 rounded-xl transition-all ${selectedCategory === 'Rèn luyện' ? 'bg-white text-amber-900 shadow-xs' : 'text-amber-100'}`}
          >
            Rèn luyện
          </button>
          <button
            onClick={() => setSelectedCategory('Hoàn cảnh')}
            className={`px-3 py-1.5 rounded-xl transition-all ${selectedCategory === 'Hoàn cảnh' ? 'bg-white text-amber-900 shadow-xs' : 'text-amber-100'}`}
          >
            Hoàn cảnh
          </button>
          <button
            onClick={() => setSelectedCategory('Quan hệ bạn bè')}
            className={`px-3 py-1.5 rounded-xl transition-all ${selectedCategory === 'Quan hệ bạn bè' ? 'bg-white text-amber-900 shadow-xs' : 'text-amber-100'}`}
          >
            Quan hệ bạn bè
          </button>
        </div>
      </div>

      {/* Student Attention Cards */}
      {attentionList.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center text-slate-400 border border-slate-200 dark:border-slate-700 shadow-xs">
          <HeartHandshake className="w-12 h-12 text-amber-400 mx-auto mb-3 opacity-60" />
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
            Không có học sinh nào thuộc nhóm "{selectedCategory === 'all' ? 'Tất cả' : selectedCategory}"
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Bạn có thể đánh dấu thêm trong thẻ hồ sơ của học sinh khi cần hỗ trợ.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attentionList.map((student) => (
            <div
              key={student.id}
              className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-amber-300 dark:border-amber-800/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatar}
                      alt={student.fullName}
                      className="w-13 h-13 rounded-2xl object-cover ring-2 ring-amber-400 shadow-xs"
                    />
                    <div>
                      <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        {student.fullName}
                        <span className="text-xs font-normal text-slate-400">({student.studentCode})</span>
                      </h3>
                      <div className="text-xs text-slate-500 font-medium">
                        Tổ {student.team} • STT: {student.stt} • Điểm thi đua: <strong className="text-blue-600">{student.emulationScore}</strong>
                      </div>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 shrink-0">
                    {student.needsAttentionCategory || 'Cần hỗ trợ'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 text-xs my-2">
                  <span className="font-bold text-amber-900 dark:text-amber-300 block mb-1">
                    📝 Nội dung ghi chú hỗ trợ GVCN:
                  </span>
                  <p className="text-slate-700 dark:text-slate-200 italic leading-relaxed">
                    "{student.needsAttentionNote || student.statusNote}"
                  </p>
                  {student.needsAttentionDate && (
                    <div className="text-[10px] text-slate-400 mt-2 font-mono">
                      🗓️ Ngày ghi nhận: {student.needsAttentionDate}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenParentContact(student)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> 📞 Liên Hệ Phụ Huynh
                </button>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => onSelectStudent(student)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold"
                  >
                    Hồ Sơ
                  </button>

                  <button
                    onClick={() => onUpdateNeedsAttention(student.id, false)}
                    className="px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1"
                    title="Hoàn thành hỗ trợ (Bỏ khỏi danh sách)"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Xong
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
