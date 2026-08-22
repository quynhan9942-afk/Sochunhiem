import React, { useState } from 'react';
import { Award, Sparkles } from 'lucide-react';
import { Student, Commendation } from '../types';

interface CommendationManagerProps {
  students?: Student[];
  commendations?: Commendation[];
  onAddCommendation: (item: Commendation) => void;
}

export const CommendationManager: React.FC<CommendationManagerProps> = ({
  students = [],
  commendations = [],
  onAddCommendation,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [achievementTitle, setAchievementTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [details, setDetails] = useState('');
  const [format, setFormat] = useState<'Giấy khen' | 'Tuyên dương trước lớp' | 'Phần quà' | 'Cờ thi đua'>('Giấy khen');

  const studentList = Array.isArray(students) ? students : [];
  const commendationList = Array.isArray(commendations) ? commendations : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!achievementTitle.trim() || !selectedStudentId) return;

    const student = studentList.find(s => s.id === selectedStudentId);
    if (!student) return;

    onAddCommendation({
      id: 'cm_' + Date.now(),
      studentId: student.id,
      studentName: student.fullName,
      achievementTitle: achievementTitle.trim(),
      date,
      details: details.trim() || achievementTitle.trim(),
      format
    });

    setAchievementTitle('');
    setDetails('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 rounded-3xl p-6 text-white shadow-lg shadow-purple-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Bảng Vinh Danh & Thành Tích Lớp
          </span>
          <h2 className="text-2xl font-black">
            Bảng Thành Tích & Khen Thưởng
          </h2>
          <p className="text-purple-100 text-xs mt-1">
            Ghi nhận khen thưởng các cá nhân đạt thành tích xuất sắc trong các phong trào, hội thi và phong cách rèn luyện
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs rounded-2xl shadow-md flex items-center gap-2 shrink-0 transition-colors"
        >
          <Award className="w-4 h-4" /> Trao Khen Thưởng Mới
        </button>
      </div>

      {/* Commendation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {commendationList.map((item) => {
          const student = studentList.find(s => s.id === item.studentId);
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-amber-200/80 dark:border-amber-800/60 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={student?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'}
                      alt={item.studentName}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-400"
                    />
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {item.studentName}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Học sinh lớp {student?.studentCode ? `• ${student.studentCode}` : ''}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-800 shrink-0">
                    {item.format}
                  </span>
                </div>

                <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/40 my-2">
                  <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    🏆 {item.achievementTitle}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    "{item.details}"
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <span>📅 Ngày khen thưởng:</span>
                <span className="font-bold text-slate-600 dark:text-slate-300">{item.date}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Commendation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
              <Award className="w-5 h-5 text-amber-500" />
              Ghi Nhận Khen Thưởng Mới
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Chọn học sinh
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  {studentList.map(s => (
                    <option key={s.id} value={s.id}>
                      STT {s.stt}: {s.fullName} ({s.team})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tên thành tích / Giải thưởng
                </label>
                <input
                  type="text"
                  required
                  value={achievementTitle}
                  onChange={(e) => setAchievementTitle(e.target.value)}
                  placeholder="Ví dụ: Đạt Giải Nhất Thi Vẽ Tranh Cấp Trường"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Hình thức khen thưởng
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    <option value="Giấy khen">Giấy khen</option>
                    <option value="Tuyên dương trước lớp">Tuyên dương trước lớp</option>
                    <option value="Phần quà">Phần quà</option>
                    <option value="Cờ thi đua">Cờ thi đua</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Ngày khen thưởng
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nội dung chi tiết
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Mô tả cụ thể lý do tuyên dương..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-normal"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-xl shadow-md"
                >
                  Lưu Khen Thưởng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
