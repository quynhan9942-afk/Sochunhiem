import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Eye, 
  HeartHandshake, 
  PhoneCall, 
  Search,
  Filter,
  Users
} from 'lucide-react';
import { Student, AttendanceStatus } from '../types';

interface StudentCardProps {
  students?: Student[];
  student?: Student;
  hidePointButtons?: boolean;
  onOpenAddPoint?: (student: Student) => void;
  onOpenDeductPoint?: (student: Student) => void;
  onUpdateAttendance?: (studentId: string, status: AttendanceStatus) => void;
  onQuickAttendance?: (studentId: string, status: AttendanceStatus) => void;
  onOpenDetail?: (student: Student) => void;
  onSelectStudent?: (student: Student) => void;
  onOpenParentContact?: (student: Student) => void;
  onOpenQuickNote?: (student: Student) => void;
}

// Single Card Component
const SingleStudentCard: React.FC<{
  student: Student;
  hidePointButtons?: boolean;
  onOpenAddPoint?: (student: Student) => void;
  onOpenDeductPoint?: (student: Student) => void;
  onUpdateAttendance?: (studentId: string, status: AttendanceStatus) => void;
  onOpenDetail?: (student: Student) => void;
  onSelectStudent?: (student: Student) => void;
  onOpenParentContact?: (student: Student) => void;
  onOpenQuickNote?: (student: Student) => void;
}> = ({
  student,
  hidePointButtons,
  onOpenAddPoint,
  onOpenDeductPoint,
  onUpdateAttendance,
  onOpenDetail,
  onSelectStudent,
  onOpenParentContact,
  onOpenQuickNote,
}) => {
  const handleDetail = onOpenDetail || onSelectStudent || (() => {});
  const handleQuickNote = onOpenQuickNote || handleDetail;
  const handleAddPoint = onOpenAddPoint || (() => {});
  const handleDeductPoint = onOpenDeductPoint || (() => {});
  const handleParentContact = onOpenParentContact || (() => {});
  const handleAttendance = onUpdateAttendance || (() => {});

  const getScoreBadgeClass = (score: number) => {
    if (score >= 10) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300';
    if (score >= 5) return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300';
    if (score >= 0) return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300';
    return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300';
  };

  const getStatusTagBadge = (tag: string) => {
    switch (tag) {
      case 'Tốt':
      case 'Xuất sắc':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">🌟 {tag}</span>;
      case 'Khá':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300">👍 {tag}</span>;
      case 'Cần cố gắng':
      case 'Cần nhắc nhở':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">🌱 {tag}</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{tag}</span>;
    }
  };

  return (
    <div className={`group relative bg-white dark:bg-slate-800/90 rounded-2xl p-4 border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between ${
      student.isNeedsAttention 
        ? 'border-amber-300/80 dark:border-amber-700/60 ring-2 ring-amber-400/20 shadow-amber-500/5' 
        : 'border-slate-200/80 dark:border-slate-700/80 shadow-xs'
    }`}>
      {/* Top Card Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={student.avatar}
                alt={student.fullName}
                className="w-13 h-13 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-xs group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-1 -right-1 bg-slate-900 text-white dark:bg-blue-600 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs">
                {student.stt}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                {student.fullName}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md font-semibold text-slate-700 dark:text-slate-300">
                  {student.team}
                </span>
                <span>•</span>
                <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                  {student.studentCode}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col items-end shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">
              Thi đua
            </span>
            <div className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-0.5 shadow-2xs ${getScoreBadgeClass(student.emulationScore)}`}>
              {student.emulationScore > 0 ? `+${student.emulationScore}` : student.emulationScore}
            </div>
          </div>
        </div>

        {/* Status Tag */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 py-2 border-t border-b border-slate-100 dark:border-slate-700/60 my-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-medium text-[11px]">Trạng thái:</span>
            {getStatusTagBadge(student.statusTag)}
          </div>

          {student.isNeedsAttention && (
            <span 
              title={student.needsAttentionNote || 'Cần hỗ trợ từ giáo viên chủ nhiệm'}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
            >
              <HeartHandshake className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              {student.needsAttentionCategory || 'Cần quan tâm'}
            </span>
          )}
        </div>

        {/* Short Note */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 min-h-[36px] bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-700/50 italic leading-relaxed">
          "{student.statusNote || 'Chưa có ghi chú mới cho tuần này.'}"
        </p>
      </div>

      {/* Action Bar */}
      <div className="mt-3 space-y-2">
        <div className="bg-slate-100/80 dark:bg-slate-900/60 p-1.5 rounded-xl flex items-center justify-between gap-1 text-[11px] font-medium">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider px-1">
            Điểm danh:
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdateAttendance(student.id, 'present')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                student.attendanceToday === 'present'
                  ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" /> Có mặt
            </button>
            <button
              onClick={() => onUpdateAttendance(student.id, 'late')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                student.attendanceToday === 'late'
                  ? 'bg-amber-500 text-white font-bold shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              }`}
            >
              <Clock className="w-3 h-3" /> Muộn
            </button>
            <button
              onClick={() => onUpdateAttendance(student.id, 'excused')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                student.attendanceToday === 'excused' || student.attendanceToday === 'unexcused'
                  ? 'bg-rose-600 text-white font-bold shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
            >
              <XCircle className="w-3 h-3" /> Vắng
            </button>
          </div>
        </div>

        <div className={`grid ${hidePointButtons ? 'grid-cols-3' : 'grid-cols-4'} gap-1.5 pt-1`}>
          {!hidePointButtons && (
            <>
              <button
                onClick={() => handleAddPoint(student)}
                title="Thêm điểm thi đua"
                className="flex items-center justify-center py-2 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 rounded-xl transition-colors font-semibold text-xs gap-1 border border-emerald-200 dark:border-emerald-800"
              >
                <Plus className="w-3.5 h-3.5" />
                + Điểm
              </button>

              <button
                onClick={() => handleDeductPoint(student)}
                title="Trừ điểm thi đua"
                className="flex items-center justify-center py-2 px-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 rounded-xl transition-colors font-semibold text-xs gap-1 border border-rose-200 dark:border-rose-800"
              >
                <Minus className="w-3.5 h-3.5" />
                - Điểm
              </button>
            </>
          )}

          {hidePointButtons && (
            <button
              onClick={() => handleQuickNote(student)}
              title="Ghi chú nhanh"
              className="flex items-center justify-center py-2 px-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-xl transition-colors font-semibold text-xs gap-1 border border-slate-200 dark:border-slate-600"
            >
              <FileText className="w-3.5 h-3.5" />
              Ghi chú
            </button>
          )}

          <button
            onClick={() => handleParentContact(student)}
            title="Liên hệ phụ huynh"
            className="flex items-center justify-center py-2 px-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 rounded-xl transition-colors font-semibold text-xs gap-1 border border-indigo-200 dark:border-indigo-800"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Gọi PH
          </button>

          <button
            onClick={() => handleDetail(student)}
            title="Xem hồ sơ chi tiết"
            className="flex items-center justify-center py-2 px-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-bold text-xs gap-1 shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            Hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
};

export const StudentCard: React.FC<StudentCardProps> = ({
  students = [],
  student,
  hidePointButtons,
  onOpenAddPoint,
  onOpenDeductPoint,
  onUpdateAttendance,
  onQuickAttendance,
  onOpenDetail,
  onSelectStudent,
  onOpenParentContact,
  onOpenQuickNote,
}) => {
  const handleAttendance = onUpdateAttendance || onQuickAttendance || (() => {});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'needsAttention' | 'topPoints'>('all');

  // If a single student prop is provided, render just that single card
  if (student) {
    return (
      <SingleStudentCard
        student={student}
        hidePointButtons={hidePointButtons}
        onOpenAddPoint={onOpenAddPoint}
        onOpenDeductPoint={onOpenDeductPoint}
        onUpdateAttendance={handleAttendance}
        onOpenDetail={onOpenDetail}
        onSelectStudent={onSelectStudent}
        onOpenParentContact={onOpenParentContact}
        onOpenQuickNote={onOpenQuickNote}
      />
    );
  }

  // Otherwise, render full grid of student cards with filter bar
  const studentList = Array.isArray(students) ? students : [];

  const filteredStudents = studentList.filter((st) => {
    const matchesSearch = st.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          st.studentCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = selectedTeam === 'all' || st.team === selectedTeam;
    
    let matchesType = true;
    if (filterType === 'needsAttention') matchesType = !!st.isNeedsAttention;
    if (filterType === 'topPoints') matchesType = st.emulationScore >= 10;

    return matchesSearch && matchesTeam && matchesType;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên hoặc mã học sinh..."
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Team Selector */}
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Tất cả các tổ</option>
            <option value="Tổ 1">Tổ 1</option>
            <option value="Tổ 2">Tổ 2</option>
            <option value="Tổ 3">Tổ 3</option>
            <option value="Tổ 4">Tổ 4</option>
          </select>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${filterType === 'all' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500'}`}
            >
              Tất cả ({studentList.length})
            </button>
            <button
              onClick={() => setFilterType('needsAttention')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${filterType === 'needsAttention' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs' : 'text-slate-500'}`}
            >
              Cần quan tâm ({studentList.filter(s => s.isNeedsAttention).length})
            </button>
            <button
              onClick={() => setFilterType('topPoints')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${filterType === 'topPoints' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500'}`}
            >
              Thi đua xuất sắc ({studentList.filter(s => s.emulationScore >= 10).length})
            </button>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-blue-500" />
          <span>Hiển thị <strong>{filteredStudents.length}</strong> học sinh</span>
        </div>
      </div>

      {/* Student Cards Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 text-slate-400">
          <p className="text-sm">Không tìm thấy học sinh phù hợp với bộ lọc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((st) => (
            <SingleStudentCard
              key={st.id}
              student={st}
              onOpenAddPoint={onOpenAddPoint}
              onOpenDeductPoint={onOpenDeductPoint}
              onUpdateAttendance={handleAttendance}
              onOpenDetail={onOpenDetail}
              onSelectStudent={onSelectStudent}
              onOpenParentContact={onOpenParentContact}
              onOpenQuickNote={onOpenQuickNote}
            />
          ))}
        </div>
      )}
    </div>
  );
};
