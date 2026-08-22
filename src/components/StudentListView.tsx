import React, { useState, useMemo } from 'react';
import { Student, AttendanceStatus, TeamNumber, AuthMode } from '../types';
import {
  Plus,
  Minus,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Eye,
  PhoneCall,
  HeartHandshake,
  Users,
  Search,
  Grid,
  List,
  UserPlus,
  Edit3,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  X,
  Phone,
  Shield
} from 'lucide-react';

interface StudentListViewProps {
  students: Student[];
  hidePointButtons?: boolean;
  authMode?: AuthMode;
  className?: string;
  onAddStudent?: (student: Student) => void;
  onUpdateStudent?: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
  onOpenAddPoint?: (student: Student) => void;
  onOpenDeductPoint?: (student: Student) => void;
  onUpdateAttendance?: (studentId: string, status: AttendanceStatus) => void;
  onOpenDetail?: (student: Student) => void;
  onSelectStudent?: (student: Student) => void;
  onOpenParentContact?: (student: Student) => void;
  onOpenQuickNote?: (student: Student) => void;
}

export const StudentListView: React.FC<StudentListViewProps> = ({
  students,
  hidePointButtons,
  authMode = 'TEACHER',
  className = '6a3',
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onOpenAddPoint,
  onOpenDeductPoint,
  onUpdateAttendance,
  onOpenDetail,
  onSelectStudent,
  onOpenParentContact,
  onOpenQuickNote,
}) => {
  const isGuest = authMode === 'GUEST';

  // Selected Team Filter
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');

  // Display Mode: 'WHOLE_CLASS' (group by teams) vs 'SINGLE_TEAM' (filter only selected team)
  const [viewMode, setViewMode] = useState<'WHOLE_CLASS' | 'SINGLE_TEAM'>('WHOLE_CLASS');

  // Layout presentation: 'TABLE' or 'CARDS'
  const [layoutType, setLayoutType] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Search input
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [zaloTarget, setZaloTarget] = useState<{ name: string; phone: string } | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // Add / Edit Form state
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Nam' as 'Nam' | 'Nữ',
    dob: '2014-05-15',
    ethnicity: 'Kinh',
    familyBackground: 'Bình thường',
    hometown: 'Phường Nguyễn Văn Cừ, Quy Nhơn, Bình Định',
    team: 'Tổ 1' as TeamNumber,
    address: 'THCS Nguyễn Văn Cừ',
    fatherName: '',
    fatherPhone: '',
    motherName: '',
    motherPhone: '',
    statusNote: 'Học sinh chăm ngoan, chấp hành tốt nội quy.'
  });

  const teamsList: TeamNumber[] = ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'];

  // Open Add Modal
  const handleOpenAddModal = () => {
    const nextStt = students.length + 1;
    setFormData({
      fullName: '',
      gender: 'Nam',
      dob: '2014-05-15',
      ethnicity: 'Kinh',
      familyBackground: 'Bình thường',
      hometown: 'Phường Nguyễn Văn Cừ, Quy Nhơn, Bình Định',
      team: 'Tổ 1',
      address: 'THCS Nguyễn Văn Cừ',
      fatherName: '',
      fatherPhone: '',
      motherName: '',
      motherPhone: '',
      statusNote: 'Học sinh chăm ngoan, chấp hành tốt nội quy.'
    });
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (st: Student) => {
    setEditingStudent(st);
    setFormData({
      fullName: st.fullName,
      gender: st.gender === 'Nữ' ? 'Nữ' : 'Nam',
      dob: st.dob || '2014-05-15',
      ethnicity: st.ethnicity || 'Kinh',
      familyBackground: st.familyBackground || 'Bình thường',
      hometown: st.hometown || 'Phường Nguyễn Văn Cừ, Quy Nhơn, Bình Định',
      team: st.team,
      address: st.address || 'THCS Nguyễn Văn Cừ',
      fatherName: st.fatherName || st.parentName || '',
      fatherPhone: st.fatherPhone || st.parentPhone || '',
      motherName: st.motherName || '',
      motherPhone: st.motherPhone || '',
      statusNote: st.statusNote || 'Học sinh chăm ngoan.'
    });
  };

  // Submit Add / Edit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      alert('Vui lòng nhập Họ và Tên học sinh.');
      return;
    }

    const fatherName = formData.fatherName.trim() || `Bố HS ${formData.fullName.trim()}`;
    const fatherPhone = formData.fatherPhone.trim() || '0903123456';
    const motherName = formData.motherName.trim() || `Mẹ HS ${formData.fullName.trim()}`;
    const motherPhone = formData.motherPhone.trim() || '0918234888';

    if (editingStudent) {
      const updated: Student = {
        ...editingStudent,
        fullName: formData.fullName.trim(),
        gender: formData.gender,
        dob: formData.dob,
        ethnicity: formData.ethnicity.trim() || 'Kinh',
        familyBackground: formData.familyBackground || 'Bình thường',
        hometown: formData.hometown.trim() || 'Phường Nguyễn Văn Cừ, Quy Nhơn, Bình Định',
        team: formData.team,
        address: formData.address.trim() || 'THCS Nguyễn Văn Cừ',
        fatherName,
        fatherPhone,
        motherName,
        motherPhone,
        parentName: `${fatherName} (Bố)`,
        parentPhone: fatherPhone,
        statusNote: formData.statusNote.trim()
      };
      if (onUpdateStudent) onUpdateStudent(updated);
      setEditingStudent(null);
    } else {
      const newStt = students.length + 1;
      const codeNum = newStt < 10 ? `0${newStt}` : `${newStt}`;
      const cleanClassName = className.toUpperCase().replace(/\s+/g, '');
      const newStudentCode = `HS${cleanClassName.length > 0 ? cleanClassName : '06A1'}${codeNum}`;
      const newAccessCode = `${100 + newStt}`;

      const avatar = formData.gender === 'Nam'
        ? 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'
        : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200';

      const newStudent: Student = {
        id: 'hs_' + Date.now(),
        studentCode: newStudentCode,
        stt: newStt,
        fullName: formData.fullName.trim(),
        gender: formData.gender,
        dob: formData.dob,
        ethnicity: formData.ethnicity.trim() || 'Kinh',
        familyBackground: formData.familyBackground || 'Bình thường',
        hometown: formData.hometown.trim() || 'Phường Nguyễn Văn Cừ, Quy Nhơn, Bình Định',
        avatar,
        team: formData.team,
        address: formData.address.trim() || 'THCS Nguyễn Văn Cừ',
        fatherName,
        fatherPhone,
        motherName,
        motherPhone,
        parentName: `${fatherName} (Bố)`,
        parentPhone: fatherPhone,
        emulationScore: 100,
        statusTag: 'Tốt',
        statusNote: formData.statusNote.trim(),
        attendanceToday: 'present',
        isNeedsAttention: false,
        accessCode: newAccessCode
      };

      if (onAddStudent) onAddStudent(newStudent);
      setShowAddModal(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingStudent) return;
    if (onDeleteStudent) {
      onDeleteStudent(deletingStudent.id);
    }
    setDeletingStudent(null);
  };

  // Open Zalo Modal
  const handleOpenZalo = (phone?: string, name?: string) => {
    if (!phone) {
      alert('Chưa có số điện thoại.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    setZaloTarget({ name: name || 'Phụ huynh', phone: cleanPhone });
  };

  const handleConfirmZaloOpen = () => {
    if (!zaloTarget) return;
    window.open(`https://zalo.me/${zaloTarget.phone}`, '_blank');
    setZaloTarget(null);
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Calculate team ranks and scores
  const teamRanksMap = useMemo(() => {
    const stats = teamsList.map((teamName) => {
      const teamStudents = students.filter((st) => st.team === teamName);
      const totalScore = teamStudents.reduce((sum, st) => sum + (st.emulationScore || 0), 0);
      const avgScore = teamStudents.length > 0 ? totalScore / teamStudents.length : 0;
      return { teamName, totalScore, avgScore, count: teamStudents.length };
    });

    stats.sort((a, b) => b.avgScore - a.avgScore || b.totalScore - a.totalScore);

    const ranksMap = new Map<string, { rank: number; totalScore: number; avgScore: number; count: number }>();
    stats.forEach((st, idx) => {
      ranksMap.set(st.teamName, {
        rank: idx + 1,
        totalScore: st.totalScore,
        avgScore: Number(st.avgScore.toFixed(1)),
        count: st.count,
      });
    });
    return ranksMap;
  }, [students]);

  // Filtered students according to search and team
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const matchesSearch =
        searchQuery === '' ||
        st.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.studentCode.toLowerCase().includes(searchQuery.toLowerCase());

      if (viewMode === 'SINGLE_TEAM' && selectedTeam !== 'ALL') {
        return matchesSearch && st.team === selectedTeam;
      }
      if (selectedTeam !== 'ALL') {
        return matchesSearch && st.team === selectedTeam;
      }
      return matchesSearch;
    });
  }, [students, searchQuery, selectedTeam, viewMode]);

  // Selected team stats for summary card
  const selectedTeamStats = useMemo(() => {
    if (selectedTeam === 'ALL') return null;
    const teamSts = students.filter((st) => st.team === selectedTeam);
    const maleCount = teamSts.filter((st) => st.gender === 'Nam').length;
    const femaleCount = teamSts.filter((st) => st.gender === 'Nữ').length;
    const totalScore = teamSts.reduce((sum, st) => sum + (st.emulationScore || 0), 0);
    const avgScore = teamSts.length > 0 ? (totalScore / teamSts.length).toFixed(1) : '0';
    const rankInfo = teamRanksMap.get(selectedTeam) || { rank: 1 };
    const presentCount = teamSts.filter((st) => st.attendanceToday === 'present').length;

    return {
      teamName: selectedTeam,
      count: teamSts.length,
      maleCount,
      femaleCount,
      totalScore,
      avgScore,
      rank: rankInfo.rank,
      presentCount,
    };
  }, [selectedTeam, students, teamRanksMap]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* COPIED TOAST */}
      {copiedToast && (
        <div className="fixed top-6 right-6 z-[70] bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2">
          <Copy className="w-4 h-4 text-blue-400" /> ✓ Đã sao chép số điện thoại
        </div>
      )}

      {/* ZALO MODAL */}
      {zaloTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-2xl text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/60 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
              💬
            </div>
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
              Kết Nối Zalo
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Mở ứng dụng Zalo để liên hệ với <strong>{zaloTarget.name}</strong> ({zaloTarget.phone})?
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={handleConfirmZaloOpen}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <ExternalLink className="w-4 h-4" /> Mở Zalo Ngay
              </button>
              <button
                onClick={() => handleCopyPhone(zaloTarget.phone)}
                className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Copy className="w-4 h-4" /> Sao Chép Số Điện Thoại
              </button>
              <button
                onClick={() => setZaloTarget(null)}
                className="w-full py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 border border-rose-200 dark:border-rose-900 shadow-2xl text-center animate-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
              🗑️
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
              Xác Nhận Xóa Học Sinh
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa học sinh <strong className="text-rose-600">{deletingStudent.fullName}</strong> (Mã: {deletingStudent.studentCode}, {deletingStudent.team}) khỏi danh sách lớp? Hành động này sẽ không thể hoàn tác.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
              >
                <Trash2 className="w-4 h-4" /> Đồng Ý Xóa
              </button>
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT STUDENT MODAL */}
      {(showAddModal || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 my-auto border border-slate-200 dark:border-slate-700 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/60 text-blue-600 rounded-2xl flex items-center justify-center text-xl">
                  {editingStudent ? '✏️' : '➕'}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                    {editingStudent ? 'Chỉnh Sửa Hồ Sơ Học Sinh' : 'Thêm Học Sinh Mới Vào Lớp'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingStudent ? `Cập nhật thông tin chi tiết cho ${editingStudent.fullName}` : `Lớp ${className} - Nhập thông tin học sinh`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingStudent(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Row 1: Full Name & Gender & Dob */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Họ Và Tên Học Sinh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="VD: Nguyễn Văn An"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Giới Tính
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Ngày Sinh
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 2: Team, Ethnicity, Family Background */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Tổ Sinh Hoạt
                  </label>
                  <select
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value as TeamNumber })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Tổ 1">Tổ 1</option>
                    <option value="Tổ 2">Tổ 2</option>
                    <option value="Tổ 3">Tổ 3</option>
                    <option value="Tổ 4">Tổ 4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Dân Tộc
                  </label>
                  <input
                    type="text"
                    value={formData.ethnicity}
                    onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                    placeholder="Kinh, Ê đê, Ba Na..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Hoàn Cảnh Gia Đình
                  </label>
                  <select
                    value={formData.familyBackground}
                    onChange={(e) => setFormData({ ...formData, familyBackground: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Bình thường">Bình thường</option>
                    <option value="Hộ nghèo">Hộ nghèo</option>
                    <option value="Hộ cận nghèo">Hộ cận nghèo</option>
                    <option value="Mồ côi cha/mẹ">Mồ côi cha/mẹ</option>
                    <option value="Khó khăn đột xuất">Khó khăn đột xuất</option>
                    <option value="Khuyết tật">Khuyết tật</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Hometown & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Quê Quán
                  </label>
                  <input
                    type="text"
                    value={formData.hometown}
                    onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                    placeholder="VD: Phường Nguyễn Văn Cừ, Quy Nhơn, Bình Định"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Địa Chỉ Thường Trú / Hiện Tại
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="VD: 12 Nguyễn Trãi, THCS Nguyễn Văn Cừ"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 4: Father Info */}
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/50 space-y-2">
                <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  👨 Thông Tin Bố (Phụ Huynh)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    placeholder="Họ và tên Bố"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none"
                  />
                  <input
                    type="tel"
                    value={formData.fatherPhone}
                    onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                    placeholder="Số điện thoại Bố"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Mother Info */}
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  👩 Thông Tin Mẹ (Phụ Huynh)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={formData.motherName}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    placeholder="Họ và tên Mẹ"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none"
                  />
                  <input
                    type="tel"
                    value={formData.motherPhone}
                    onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                    placeholder="Số điện thoại Mẹ"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Status Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Ghi Chú Đặc Điểm Học Sinh
                </label>
                <textarea
                  rows={2}
                  value={formData.statusNote}
                  onChange={(e) => setFormData({ ...formData, statusNote: e.target.value })}
                  placeholder="Ghi chú về nề nếp, sức khỏe, học tập..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Submit buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingStudent ? 'Lưu Thay Đổi Hồ Sơ' : 'Thêm Học Sinh Vào Danh Sách'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingStudent(null);
                  }}
                  className="px-5 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-xs"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOOLBAR: ACTION BUTTONS, VIEW MODES, TEAM SELECTOR, SEARCH & LAYOUT */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        {/* Top bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {!isGuest && (
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black shadow-md flex items-center gap-1.5 animate-pulse"
              >
                <UserPlus className="w-4 h-4" /> ➕ THÊM HỌC SINH MỚI
              </button>
            )}

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1" />

            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chế độ xem:</span>
            <button
              onClick={() => {
                setViewMode('WHOLE_CLASS');
                setSelectedTeam('ALL');
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 ${
                viewMode === 'WHOLE_CLASS' && selectedTeam === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
              }`}
            >
              👁️ XEM TOÀN LỚP
            </button>

            <button
              onClick={() => {
                setViewMode('SINGLE_TEAM');
                if (selectedTeam === 'ALL') setSelectedTeam('Tổ 1');
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 ${
                viewMode === 'SINGLE_TEAM' || selectedTeam !== 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
              }`}
            >
              🔎 XEM RIÊNG TỪNG TỔ
            </button>
          </div>

          {/* Search bar & Table/Card View switch */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên, mã HS..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setLayoutType('TABLE')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  layoutType === 'TABLE' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs' : 'text-slate-400'
                }`}
                title="Bảng dữ liệu"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutType('CARDS')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  layoutType === 'CARDS' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs' : 'text-slate-400'
                }`}
                title="Thẻ học sinh"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* TEAM FILTER SELECTOR (Tất cả | Tổ 1 | Tổ 2 | Tổ 3 | Tổ 4) */}
        <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-700/60 pt-3 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 uppercase shrink-0">👥 Lọc Theo Tổ:</span>
          <button
            onClick={() => {
              setSelectedTeam('ALL');
              setViewMode('WHOLE_CLASS');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedTeam === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Tất cả ({students.length})
          </button>
          {teamsList.map((teamName) => {
            const count = students.filter((s) => s.team === teamName).length;
            const rankInfo = teamRanksMap.get(teamName);
            return (
              <button
                key={teamName}
                onClick={() => {
                  setSelectedTeam(teamName);
                  setViewMode('SINGLE_TEAM');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                  selectedTeam === teamName
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>{teamName} ({count})</span>
                {rankInfo && (
                  <span className="text-[10px] opacity-80 font-mono">
                    #{rankInfo.rank}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TEAM SUMMARY CARD (When selecting a specific team) */}
      {selectedTeamStats && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl p-6 shadow-lg animate-in fade-in zoom-in-95">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-inner">
                {selectedTeamStats.rank === 1 ? '🥇' : selectedTeamStats.rank === 2 ? '🥈' : selectedTeamStats.rank === 3 ? '🥉' : '🎖️'}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-blue-100">
                  Thống Kê Chi Tiết Tổ Học Sinh
                </div>
                <h3 className="text-2xl font-black">{selectedTeamStats.teamName.toUpperCase()}</h3>
                <div className="text-xs text-blue-100 mt-1 flex items-center gap-2">
                  <span>{selectedTeamStats.count} học sinh</span>
                  <span>•</span>
                  <span>{selectedTeamStats.maleCount} Nam / {selectedTeamStats.femaleCount} Nữ</span>
                  <span>•</span>
                  <span>Có mặt: {selectedTeamStats.presentCount}/{selectedTeamStats.count}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur rounded-2xl p-3 text-center border border-white/20">
              <div>
                <div className="text-[10px] font-bold uppercase text-blue-100">Tổng Điểm</div>
                <div className="text-xl font-black mt-0.5">
                  {selectedTeamStats.totalScore > 0 ? `+${selectedTeamStats.totalScore}` : selectedTeamStats.totalScore}
                </div>
              </div>
              <div className="border-x border-white/20 px-3">
                <div className="text-[10px] font-bold uppercase text-blue-100">Trung Bình / HS</div>
                <div className="text-xl font-black mt-0.5">
                  {Number(selectedTeamStats.avgScore) > 0 ? `+${selectedTeamStats.avgScore}` : selectedTeamStats.avgScore}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-blue-100">Xếp Hạng Tổ</div>
                <div className="text-xl font-black mt-0.5">🥇 Hạng {selectedTeamStats.rank}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER CONTENT: WHOLE CLASS (Grouped by teams) vs SINGLE TEAM */}
      {viewMode === 'WHOLE_CLASS' && selectedTeam === 'ALL' ? (
        <div className="space-y-6">
          {teamsList.map((tName) => {
            const teamSts = filteredStudents.filter((s) => s.team === tName);
            const rankInfo = teamRanksMap.get(tName);
            if (teamSts.length === 0) return null;

            return (
              <div
                key={tName}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4"
              >
                {/* Team Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                      {tName === 'Tổ 1' ? '1' : tName === 'Tổ 2' ? '2' : tName === 'Tổ 3' ? '3' : '4'}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                        {tName.toUpperCase()}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {teamSts.length} học sinh • Tổng điểm: {rankInfo?.totalScore || 0} đ • Trung bình: {rankInfo?.avgScore || 0}/HS
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                    🥇 Hạng {rankInfo?.rank}
                  </span>
                </div>

                {/* Table or Cards */}
                {layoutType === 'TABLE' ? (
                  <StudentTable
                    students={teamSts}
                    isGuest={isGuest}
                    onOpenAddPoint={onOpenAddPoint}
                    onOpenDeductPoint={onOpenDeductPoint}
                    onUpdateAttendance={onUpdateAttendance}
                    onOpenDetail={onOpenDetail}
                    onSelectStudent={onSelectStudent}
                    onOpenParentContact={onOpenParentContact}
                    onOpenQuickNote={onOpenQuickNote}
                    onEditStudent={handleOpenEditModal}
                    onDeleteStudent={(st) => setDeletingStudent(st)}
                    onOpenZalo={handleOpenZalo}
                  />
                ) : (
                  <StudentCardsGrid
                    students={teamSts}
                    isGuest={isGuest}
                    onOpenAddPoint={onOpenAddPoint}
                    onOpenDeductPoint={onOpenDeductPoint}
                    onUpdateAttendance={onUpdateAttendance}
                    onOpenDetail={onOpenDetail}
                    onSelectStudent={onSelectStudent}
                    onOpenParentContact={onOpenParentContact}
                    onOpenQuickNote={onOpenQuickNote}
                    onEditStudent={handleOpenEditModal}
                    onDeleteStudent={(st) => setDeletingStudent(st)}
                    onOpenZalo={handleOpenZalo}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* SINGLE TEAM / FILTERED VIEW */
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          {layoutType === 'TABLE' ? (
            <StudentTable
              students={filteredStudents}
              hidePointButtons={hidePointButtons}
              isGuest={isGuest}
              onOpenAddPoint={onOpenAddPoint}
              onOpenDeductPoint={onOpenDeductPoint}
              onUpdateAttendance={onUpdateAttendance}
              onOpenDetail={onOpenDetail}
              onSelectStudent={onSelectStudent}
              onOpenParentContact={onOpenParentContact}
              onOpenQuickNote={onOpenQuickNote}
              onEditStudent={handleOpenEditModal}
              onDeleteStudent={(st) => setDeletingStudent(st)}
              onOpenZalo={handleOpenZalo}
            />
          ) : (
            <StudentCardsGrid
              students={filteredStudents}
              hidePointButtons={hidePointButtons}
              isGuest={isGuest}
              onOpenAddPoint={onOpenAddPoint}
              onOpenDeductPoint={onOpenDeductPoint}
              onUpdateAttendance={onUpdateAttendance}
              onOpenDetail={onOpenDetail}
              onSelectStudent={onSelectStudent}
              onOpenParentContact={onOpenParentContact}
              onOpenQuickNote={onOpenQuickNote}
              onEditStudent={handleOpenEditModal}
              onDeleteStudent={(st) => setDeletingStudent(st)}
              onOpenZalo={handleOpenZalo}
            />
          )}
        </div>
      )}
    </div>
  );
};

// SUB-COMPONENT: STUDENT TABLE VIEW
interface StudentSubProps extends Omit<StudentListViewProps, 'onDeleteStudent'> {
  isGuest: boolean;
  onEditStudent: (st: Student) => void;
  onDeleteStudent: (st: Student) => void;
  onOpenZalo: (phone?: string, name?: string) => void;
}

const StudentTable: React.FC<StudentSubProps> = ({
  students,
  hidePointButtons,
  isGuest,
  onOpenAddPoint,
  onOpenDeductPoint,
  onUpdateAttendance,
  onOpenDetail,
  onSelectStudent,
  onOpenQuickNote,
  onEditStudent,
  onDeleteStudent,
  onOpenZalo,
}) => {
  const handleDetail = onOpenDetail || onSelectStudent || (() => {});
  const handleAddPoint = onOpenAddPoint || (() => {});
  const handleDeductPoint = onOpenDeductPoint || (() => {});

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-700 dark:text-slate-200">
        <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th className="py-3 px-3 w-10 text-center">STT</th>
            <th className="py-3 px-3">Học Sinh</th>
            <th className="py-3 px-3">Tổ & Thông Tin</th>
            <th className="py-3 px-3 text-center">Điểm Thi Đua</th>
            <th className="py-3 px-3 text-center">Chuyên Cần</th>
            <th className="py-3 px-3 text-center">Liên Hệ Phụ Huynh</th>
            <th className="py-3 px-3 text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {students.map((st) => {
            const fatherPhone = st.fatherPhone || st.parentPhone || '';
            const fatherName = st.fatherName || st.parentName || 'Bố';
            const motherPhone = st.motherPhone || '';
            const motherName = st.motherName || 'Mẹ';

            return (
              <tr
                key={st.id}
                className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors ${
                  st.isNeedsAttention ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''
                }`}
              >
                <td className="py-3 px-3 text-center font-bold text-slate-500 text-xs">{st.stt}</td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={st.avatar}
                      alt={st.fullName}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <button
                          onClick={() => handleDetail(st)}
                          className="hover:text-blue-600 text-left transition-colors"
                        >
                          {st.fullName}
                        </button>
                        {st.isNeedsAttention && (
                          <span title={st.needsAttentionNote || 'Cần quan tâm'}>
                            <HeartHandshake className="w-3.5 h-3.5 text-amber-500" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {st.studentCode} • PIN: {st.accessCode || '101'} • {st.gender}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="py-3 px-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 font-bold text-[10px]">
                        {st.team}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-[10px]">
                        Dân tộc: {st.ethnicity || 'Kinh'}
                      </span>
                    </div>
                    {st.familyBackground && st.familyBackground !== 'Bình thường' && (
                      <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-bold text-[10px]">
                        🏠 {st.familyBackground}
                      </span>
                    )}
                  </div>
                </td>

                <td className="py-3 px-3 text-center font-black">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs ${
                      st.emulationScore >= 10
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : st.emulationScore >= 5
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : st.emulationScore >= 0
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {st.emulationScore > 0 ? `+${st.emulationScore}` : st.emulationScore} đ
                  </span>
                </td>

                <td className="py-3 px-3 text-center">
                  <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs">
                    <button
                      onClick={() => onUpdateAttendance && onUpdateAttendance(st.id, 'present')}
                      className={`p-1 rounded-lg ${
                        st.attendanceToday === 'present' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'
                      }`}
                      title="Có mặt"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateAttendance && onUpdateAttendance(st.id, 'late')}
                      className={`p-1 rounded-lg ${
                        st.attendanceToday === 'late' ? 'bg-amber-500 text-white font-bold' : 'text-slate-400'
                      }`}
                      title="Đi muộn"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateAttendance && onUpdateAttendance(st.id, 'excused')}
                      className={`p-1 rounded-lg ${
                        st.attendanceToday === 'excused' || st.attendanceToday === 'unexcused'
                          ? 'bg-rose-600 text-white font-bold'
                          : 'text-slate-400'
                      }`}
                      title="Vắng mặt"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>

                {/* 4 Quick Call & Zalo Buttons */}
                <td className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    {/* Bố */}
                    <a
                      href={`tel:${fatherPhone}`}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-bold flex items-center gap-1"
                      title={`Gọi Bố (${fatherName}): ${fatherPhone}`}
                    >
                      <Phone className="w-3 h-3" /> Bố
                    </a>
                    <button
                      onClick={() => onOpenZalo(fatherPhone, fatherName)}
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-bold flex items-center gap-1"
                      title={`Zalo Bố (${fatherName}): ${fatherPhone}`}
                    >
                      <MessageSquare className="w-3 h-3" /> Zalo Bố
                    </button>

                    {/* Mẹ */}
                    {motherPhone && (
                      <>
                        <a
                          href={`tel:${motherPhone}`}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] font-bold flex items-center gap-1"
                          title={`Gọi Mẹ (${motherName}): ${motherPhone}`}
                        >
                          <Phone className="w-3 h-3" /> Mẹ
                        </a>
                        <button
                          onClick={() => onOpenZalo(motherPhone, motherName)}
                          className="px-2 py-1 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 rounded-lg text-[10px] font-bold flex items-center gap-1"
                          title={`Zalo Mẹ (${motherName}): ${motherPhone}`}
                        >
                          <MessageSquare className="w-3 h-3" /> Zalo Mẹ
                        </button>
                      </>
                    )}
                  </div>
                </td>

                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {!isGuest && !hidePointButtons && (
                      <>
                        <button
                          onClick={() => handleAddPoint(st)}
                          className="p-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg text-xs font-bold"
                          title="+ Điểm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeductPoint(st)}
                          className="p-1.5 bg-rose-100 text-rose-800 hover:bg-rose-200 rounded-lg text-xs font-bold"
                          title="- Điểm"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {!isGuest && (
                      <>
                        <button
                          onClick={() => onEditStudent(st)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold flex items-center gap-1"
                          title="Chỉnh sửa hồ sơ"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Sửa
                        </button>

                        <button
                          onClick={() => onDeleteStudent(st)}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg"
                          title="Xóa học sinh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDetail(st)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Chi tiết
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// SUB-COMPONENT: STUDENT CARDS GRID VIEW
const StudentCardsGrid: React.FC<StudentSubProps> = ({
  students,
  hidePointButtons,
  isGuest,
  onOpenAddPoint,
  onOpenDeductPoint,
  onUpdateAttendance,
  onOpenDetail,
  onSelectStudent,
  onEditStudent,
  onDeleteStudent,
  onOpenZalo,
}) => {
  const handleDetail = onOpenDetail || onSelectStudent || (() => {});
  const handleAddPoint = onOpenAddPoint || (() => {});
  const handleDeductPoint = onOpenDeductPoint || (() => {});

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {students.map((st) => {
        const fatherPhone = st.fatherPhone || st.parentPhone || '';
        const fatherName = st.fatherName || st.parentName || 'Bố';
        const motherPhone = st.motherPhone || '';
        const motherName = st.motherName || 'Mẹ';

        return (
          <div
            key={st.id}
            className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3 flex flex-col justify-between hover:shadow-md transition-all"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img src={st.avatar} alt={st.fullName} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/20" />
                  <div>
                    <h4
                      onClick={() => handleDetail(st)}
                      className="font-bold text-slate-800 dark:text-slate-100 text-sm hover:text-blue-600 cursor-pointer"
                    >
                      {st.fullName}
                    </h4>
                    <div className="text-xs text-slate-400 font-mono">
                      {st.studentCode} • PIN: {st.accessCode || '101'}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">#{st.stt}</span>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 font-bold">
                  {st.team}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                  {st.ethnicity || 'Kinh'}
                </span>
                {st.familyBackground && st.familyBackground !== 'Bình thường' && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-bold">
                    🏠 {st.familyBackground}
                  </span>
                )}
              </div>

              {/* Stats Box */}
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Điểm Thi Đua</span>
                  <span className={`font-black text-sm ${st.emulationScore >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {st.emulationScore >= 0 ? `+${st.emulationScore}` : st.emulationScore} đ
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Chuyên Cần</span>
                  <span className="font-bold capitalize text-slate-700 dark:text-slate-200">
                    {st.attendanceToday === 'present' ? '✅ Có mặt' : st.attendanceToday === 'late' ? '⏰ Đi muộn' : '❌ Vắng'}
                  </span>
                </div>
              </div>

              {/* Quick Call & Zalo for Bố & Mẹ */}
              <div className="p-2 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[120px]" title={fatherName}>
                    👨 {fatherName}
                  </span>
                  <div className="flex items-center gap-1">
                    <a
                      href={`tel:${fatherPhone}`}
                      className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-bold"
                      title="Gọi Bố"
                    >
                      📞
                    </a>
                    <button
                      onClick={() => onOpenZalo(fatherPhone, fatherName)}
                      className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-bold"
                      title="Zalo Bố"
                    >
                      💬 Zalo
                    </button>
                  </div>
                </div>

                {motherPhone && (
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-1">
                    <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[120px]" title={motherName}>
                      👩 {motherName}
                    </span>
                    <div className="flex items-center gap-1">
                      <a
                        href={`tel:${motherPhone}`}
                        className="px-2 py-0.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded font-bold"
                        title="Gọi Mẹ"
                      >
                        📞
                      </a>
                      <button
                        onClick={() => onOpenZalo(motherPhone, motherName)}
                        className="px-2 py-0.5 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded font-bold"
                        title="Zalo Mẹ"
                      >
                        💬 Zalo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1">
                {!isGuest && !hidePointButtons && (
                  <>
                    <button
                      onClick={() => handleAddPoint(st)}
                      className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-bold"
                      title="+ Điểm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeductPoint(st)}
                      className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold"
                      title="- Điểm"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                {!isGuest && (
                  <>
                    <button
                      onClick={() => onEditStudent(st)}
                      className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-bold"
                      title="Chỉnh sửa hồ sơ"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteStudent(st)}
                      className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => handleDetail(st)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> Chi tiết
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
