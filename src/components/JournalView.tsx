import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Image as ImageIcon,
  X,
  Eye,
  EyeOff,
  Search,
  Filter,
  Calendar,
  User,
  ShieldAlert,
  Sparkles,
  Upload,
  CheckCircle2,
  Trash2,
  Lock,
  Tag
} from 'lucide-react';
import { TeacherLog, Student, UserRole, AuthMode, TeamNumber } from '../types';

interface JournalViewProps {
  teacherLogs: TeacherLog[];
  students: Student[];
  authMode: AuthMode;
  userRole?: UserRole;
  teacherName: string;
  onAddJournalLog: (log: Omit<TeacherLog, 'id' | 'date'>) => void;
  onDeleteJournalLog?: (logId: string) => void;
  onSelectStudent?: (student: Student) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  teacherLogs = [],
  students = [],
  authMode = 'TEACHER',
  teacherName = 'Cô Lê Thị Quỳnh An',
  onAddJournalLog,
  onDeleteJournalLog,
  onSelectStudent,
}) => {
  const isGuest = authMode === 'GUEST';

  // Modal / Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [category, setCategory] = useState<'Học tập' | 'Kỷ luật' | 'Chuyên cần' | 'Sinh hoạt' | 'Khác'>('Sinh hoạt');
  const [content, setContent] = useState('');
  const [publicForParents, setPublicForParents] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');

  // Image Upload handler (Base64 file reader)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setSelectedImages((prev) => [...prev, evt.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setSelectedImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const matchedStudent = students.find((s) => s.id === selectedStudentId);

    onAddJournalLog({
      studentId: selectedStudentId || undefined,
      studentName: matchedStudent?.fullName || undefined,
      team: matchedStudent?.team || undefined,
      content: content.trim(),
      category,
      teacherName,
      imageUrls: selectedImages.length > 0 ? selectedImages : undefined,
      publicForParents,
    });

    // Reset Form
    setContent('');
    setSelectedStudentId('');
    setSelectedImages([]);
    setPublicForParents(false);
    setShowAddModal(false);
  };

  // Filter logs according to permissions & selected filters
  const filteredLogs = teacherLogs.filter((log) => {
    // Permission check: Guests ONLY see entries with publicForParents === true
    if (isGuest && !log.publicForParents) {
      return false;
    }

    const matchSearch =
      log.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.studentName && log.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.teacherName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = categoryFilter === 'ALL' || log.category === categoryFilter;
    const matchTeam = teamFilter === 'ALL' || log.team === teamFilter;
    const matchVisibility =
      visibilityFilter === 'ALL' ||
      (visibilityFilter === 'PUBLIC' && log.publicForParents) ||
      (visibilityFilter === 'PRIVATE' && !log.publicForParents);

    return matchSearch && matchCategory && matchTeam && matchVisibility;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold mb-2 text-purple-100">
            <BookOpen className="w-3.5 h-3.5 text-amber-300" /> Sổ Nhật Ký Lớp Học
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            📓 NHẬT KÝ THEO DÕI NẾP SỐNG & HOẠT ĐỘNG LỚP
          </h2>
          <p className="text-purple-100 text-xs md:text-sm mt-1">
            Ghi chép tình hình học tập, nếp sống, hình ảnh hoạt động và quản lý quyền công khai cho phụ huynh
          </p>
        </div>

        {!isGuest && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ TẠO NHẬT KÝ MỚI</span>
          </button>
        )}
      </div>

      {/* PARENT / GUEST NOTICE IF APPLICABLE */}
      {isGuest && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-3 text-amber-800 dark:text-amber-200 text-xs font-medium">
          <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Bạn đang xem Nhật ký ở chế độ <strong>Phụ huynh / Khách</strong>. Chỉ những bài nhật ký được Giáo viên chủ nhiệm cài đặt <strong>"Cho phép phụ huynh xem"</strong> mới hiển thị ở đây.
          </span>
        </div>
      )}

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm nội dung nhật ký, tên học sinh, giáo viên..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">Tất cả danh mục</option>
              <option value="Học tập">Học tập</option>
              <option value="Kỷ luật">Kỷ luật</option>
              <option value="Chuyên cần">Chuyên cần</option>
              <option value="Sinh hoạt">Sinh hoạt</option>
              <option value="Khác">Khác</option>
            </select>

            {/* Team Filter */}
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">Tất cả các Tổ</option>
              <option value="Tổ 1">Tổ 1</option>
              <option value="Tổ 2">Tổ 2</option>
              <option value="Tổ 3">Tổ 3</option>
              <option value="Tổ 4">Tổ 4</option>
            </select>

            {/* Public/Private Filter for Teachers */}
            {!isGuest && (
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value as any)}
                className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">Mọi trạng thái quyền</option>
                <option value="PUBLIC">👁️ Cho phụ huynh xem</option>
                <option value="PRIVATE">🔒 Chỉ GV/Admin xem</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* JOURNAL ENTRIES LIST */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
              Chưa có nhật ký nào phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
            >
              {/* Log Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {log.category || 'Sinh hoạt'}
                  </span>

                  {log.studentName && (
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full text-xs font-bold flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.studentName} {log.team ? `(${log.team})` : ''}
                    </span>
                  )}

                  {/* Public / Private Badge */}
                  {log.publicForParents ? (
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded-full text-[11px] font-bold flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Cho PH xem
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-full text-[11px] font-bold flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> Nội bộ GV
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {log.date}
                  </span>
                  <span>•</span>
                  <span>{log.teacherName}</span>

                  {!isGuest && onDeleteJournalLog && (
                    <button
                      onClick={() => onDeleteJournalLog(log.id)}
                      className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors ml-2"
                      title="Xóa nhật ký"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Log Text Content */}
              <div className="text-slate-800 dark:text-slate-100 text-sm whitespace-pre-line leading-relaxed font-normal">
                {log.content}
              </div>

              {/* Log Attached Images Grid */}
              {log.imageUrls && log.imageUrls.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">
                    📸 Hình ảnh đính kèm ({log.imageUrls.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {log.imageUrls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative block aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-slate-700"
                      >
                        <img
                          src={url}
                          alt={`Anh dinh kem ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                          <span>🔍 Xem lớn</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL: ADD NEW JOURNAL ENTRY */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Thêm Mới Bài Nhật Ký Lớp Học
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category & Student Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Danh Mục Nhật Ký:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white"
                  >
                    <option value="Sinh hoạt">Sinh hoạt chung</option>
                    <option value="Học tập">Học tập & thi đua</option>
                    <option value="Kỷ luật">Nội quy & Kỷ luật</option>
                    <option value="Chuyên cần">Chuyên cần</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Gắn Với Học Sinh (Tùy chọn):
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white"
                  >
                    <option value="">-- Toàn thể lớp --</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.stt}. {st.fullName} ({st.team})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content text */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Nội Dung Nhật Ký: *
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ghi nhận hoạt động, biểu hiện học sinh, sự việc trong ngày..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              {/* ATTACH IMAGES SECTION (Request 55-57) */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-700/80 pt-3">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  📷 Đính Kèm Hình Ảnh Minh Họa:
                </label>

                {/* File Upload Button & URL input */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <label className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 cursor-pointer flex items-center justify-center gap-1.5 transition-colors shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>Tải ảnh từ thiết bị</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <div className="flex-1 flex gap-1">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="Hoặc dán URL ảnh Web..."
                      className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl"
                    >
                      Thêm
                    </button>
                  </div>
                </div>

                {/* Thumbnails Grid Preview with Delete Button (Request 57) */}
                {selectedImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {selectedImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={imgUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition-colors"
                          title="Xóa ảnh này"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TOGGLE: ALLOW PARENT VIEW (Request 58) */}
              <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {publicForParents ? (
                    <Eye className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-slate-400" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                      Cho Phép Phụ Huynh Xem Bài Này
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {publicForParents
                        ? 'Phụ huynh và học sinh có thể theo dõi nội dung & ảnh đính kèm'
                        : 'Mặc định TẮT: Chỉ Giáo viên / Ban giám hiệu được phép xem'}
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={publicForParents}
                    onChange={(e) => setPublicForParents(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Lưu bài nhật ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
