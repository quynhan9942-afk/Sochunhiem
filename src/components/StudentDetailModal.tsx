import React, { useState, useRef } from 'react';
import { 
  X, 
  User, 
  PhoneCall, 
  Trophy, 
  Award, 
  HeartHandshake, 
  MessageSquare, 
  BookOpen, 
  Clock, 
  Edit3, 
  Save, 
  Camera, 
  Upload, 
  Trash2, 
  Copy, 
  Check, 
  Plus, 
  Minus, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { 
  Student, 
  EmulationLog, 
  Commendation, 
  ParentLog, 
  TeacherLog, 
  NeedsAttentionCategory,
  TeamNumber,
  AttendanceStatus,
  AuthMode,
  UserRole,
  ClassConfig,
  AttendanceRecord
} from '../types';

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
  emulationLogs: EmulationLog[];
  commendations: Commendation[];
  parentLogs: ParentLog[];
  teacherLogs: TeacherLog[];
  attendanceRecords?: AttendanceRecord[];
  authMode?: AuthMode;
  userRole?: UserRole;
  config?: ClassConfig;
  onAddTeacherLog: (studentId: string, content: string) => void;
  onUpdateNeedsAttention: (studentId: string, isAttention: boolean, category?: NeedsAttentionCategory, note?: string) => void;
  onOpenParentContact: (student: Student) => void;
  onOpenAddPoint: (student: Student) => void;
  onOpenDeductPoint: (student: Student) => void;
  onUpdateStudent?: (updatedStudent: Student) => void;
  onUpdateAttendance?: (studentId: string, status: AttendanceStatus) => void;
}

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80";

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  emulationLogs,
  commendations,
  parentLogs,
  teacherLogs,
  attendanceRecords = [],
  authMode = 'TEACHER',
  userRole = 'GIÁO VIÊN',
  config,
  onAddTeacherLog,
  onUpdateNeedsAttention,
  onOpenParentContact,
  onOpenAddPoint,
  onOpenDeductPoint,
  onUpdateStudent,
  onUpdateAttendance,
}) => {
  if (!student) return null;

  const isGuest = authMode === 'GUEST';

  // Tabs state
  const [activeTab, setActiveTab] = useState<'info' | 'parent' | 'emulation' | 'attendance' | 'teacher_notes' | 'commendations' | 'needs_attention'>('info');

  // Edit profile state (Requirement 88)
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Student>({ ...student });
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Zalo Confirmation Modal state (Requirement 84)
  const [zaloConfirmPhone, setZaloConfirmPhone] = useState<{ phone: string; name: string } | null>(null);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [zaloErrorMsg, setZaloErrorMsg] = useState<string | null>(null);

  // Camera Capture State
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Teacher notes tab state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [attentionCategory, setAttentionCategory] = useState<NeedsAttentionCategory>(student.needsAttentionCategory || 'Cần hỗ trợ khác');
  const [attentionNote, setAttentionNote] = useState(student.needsAttentionNote || '');
  const [logFilter, setLogFilter] = useState<'all' | 'positive' | 'negative'>('all');

  // Filter student logs
  const studentLogs = emulationLogs.filter(l => l.studentId === student.id);
  const studentCommendations = commendations.filter(c => c.studentId === student.id);
  const studentParentLogs = parentLogs.filter(p => p.studentId === student.id);
  const studentTeacherLogs = teacherLogs.filter(t => t.studentId === student.id);
  const studentAttendance = attendanceRecords.filter(a => a.studentId === student.id);

  const filteredStudentLogs = studentLogs.filter(log => {
    if (logFilter === 'positive') return log.scoreDiff > 0;
    if (logFilter === 'negative') return log.scoreDiff < 0;
    return true;
  });

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Zalo Connection Flow (Requirement 84)
  const handleOpenZaloClick = (phone: string, name: string) => {
    if (!phone) {
      alert('Chưa có số điện thoại phụ huynh.');
      return;
    }
    setZaloConfirmPhone({ phone, name });
  };

  const handleConfirmZaloOpen = () => {
    if (!zaloConfirmPhone) return;
    const cleanPhone = zaloConfirmPhone.phone.replace(/[^0-9]/g, '');
    const zaloUrl = `https://zalo.me/${cleanPhone}`;
    
    try {
      const win = window.open(zaloUrl, '_blank');
      if (!win) {
        setZaloErrorMsg('Không thể mở Zalo trực tiếp trên thiết bị này.');
      } else {
        setZaloConfirmPhone(null);
      }
    } catch (e) {
      setZaloErrorMsg('Không thể mở Zalo trực tiếp trên thiết bị này.');
    }
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  // Image Upload / Camera Handlers (Requirement 82)
  const handleSelectImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        if (isEditing) {
          setEditFormData(prev => ({ ...prev, avatar: base64 }));
        } else if (onUpdateStudent) {
          const updated = { ...student, avatar: base64 };
          onUpdateStudent(updated);
          showToast('✓ Đã cập nhật ảnh học sinh');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Không thể mở camera trên thiết bị này hoặc chưa được cấp quyền.');
      setShowCamera(false);
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 300;
      canvas.height = videoRef.current.videoHeight || 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        if (isEditing) {
          setEditFormData(prev => ({ ...prev, avatar: dataUrl }));
        } else if (onUpdateStudent) {
          const updated = { ...student, avatar: dataUrl };
          onUpdateStudent(updated);
          showToast('✓ Đã chụp và cập nhật ảnh học sinh');
        }
      }
    }
    handleStopCamera();
  };

  const handleStopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setShowCamera(false);
  };

  const handleResetAvatar = () => {
    if (isEditing) {
      setEditFormData(prev => ({ ...prev, avatar: DEFAULT_AVATAR }));
    } else if (onUpdateStudent) {
      const updated = { ...student, avatar: DEFAULT_AVATAR };
      onUpdateStudent(updated);
      showToast('✓ Đã đặt lại ảnh mặc định');
    }
  };

  // Save Profile Handler (Requirement 88)
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.fullName.trim()) {
      alert('Vui lòng nhập Họ và tên học sinh');
      return;
    }

    // Auto update parentName/parentPhone for backwards compatibility
    const father = editFormData.fatherName ? `${editFormData.fatherName} (${editFormData.fatherPhone || ''})` : '';
    const mother = editFormData.motherName ? `${editFormData.motherName} (${editFormData.motherPhone || ''})` : '';
    const mergedParentName = editFormData.fatherName || editFormData.motherName || editFormData.parentName || 'Phụ huynh';
    const mergedParentPhone = editFormData.fatherPhone || editFormData.motherPhone || editFormData.parentPhone || '';

    const updatedStudent: Student = {
      ...editFormData,
      ethnicity: editFormData.ethnicity?.trim() || 'Kinh',
      familyBackground: editFormData.familyBackground || 'Bình thường',
      parentName: mergedParentName,
      parentPhone: mergedParentPhone,
    };

    if (onUpdateStudent) {
      onUpdateStudent(updatedStudent);
    }
    setIsEditing(false);
    showToast('✓ Đã cập nhật hồ sơ học sinh');
  };

  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    onAddTeacherLog(student.id, newNoteContent.trim());
    setNewNoteContent('');
  };

  const handleSaveAttentionSettings = () => {
    onUpdateNeedsAttention(student.id, !student.isNeedsAttention, attentionCategory, attentionNote);
    showToast('✓ Đã cập nhật trạng thái Cần Quan Tâm');
  };

  // Mask sensitive info for Guests
  const maskPhone = (phone?: string) => {
    if (!phone) return 'Chưa cập nhật';
    if (!isGuest) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
  };

  const currentAvatar = isEditing ? editFormData.avatar : (student.avatar || DEFAULT_AVATAR);
  const fatherName = isEditing ? editFormData.fatherName : (student.fatherName || student.parentName || '');
  const fatherPhone = isEditing ? editFormData.fatherPhone : (student.fatherPhone || student.parentPhone || '');
  const motherName = isEditing ? editFormData.motherName : (student.motherName || '');
  const motherPhone = isEditing ? editFormData.motherPhone : (student.motherPhone || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 md:p-6 animate-fadeIn overflow-y-auto">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleSelectImageFile}
        className="hidden"
      />

      {/* Camera Capture Dialog */}
      {showCamera && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl p-4 max-w-md w-full space-y-4 border border-slate-700 shadow-2xl text-center">
            <h3 className="text-white font-bold text-sm flex items-center justify-center gap-2">
              <Camera className="w-5 h-5 text-blue-400" /> Chụp ảnh đại diện học sinh
            </h3>
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs"
              >
                📸 Chụp Ảnh
              </button>
              <button
                type="button"
                onClick={handleStopCamera}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold text-xs"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zalo Confirmation Dialog (Requirement 84) */}
      {zaloConfirmPhone && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-2xl text-center animate-in zoom-in-95">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/60 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-black">
              💬
            </div>
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
              Kết Nối Zalo Nhanh
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Bạn có muốn mở ứng dụng/liên kết Zalo cho phụ huynh <strong>{zaloConfirmPhone.name}</strong> với số điện thoại <strong>{zaloConfirmPhone.phone}</strong> không?
            </p>

            {zaloErrorMsg && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 font-medium">
                ⚠️ {zaloErrorMsg}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                onClick={handleConfirmZaloOpen}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <ExternalLink className="w-4 h-4" /> Mở Zalo Ngay
              </button>
              <button
                onClick={() => handleCopyPhone(zaloConfirmPhone.phone)}
                className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Copy className="w-4 h-4" /> Sao Chép Số Điện Thoại
              </button>
              <button
                onClick={() => {
                  setZaloConfirmPhone(null);
                  setZaloErrorMsg(null);
                }}
                className="w-full py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed top-6 right-6 z-[70] bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" /> {successToast}
        </div>
      )}

      {/* Copied Phone Toast */}
      {copiedToast && (
        <div className="fixed top-6 right-6 z-[70] bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2">
          <Copy className="w-4 h-4 text-blue-400" /> ✓ Đã sao chép số điện thoại
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-4xl w-full my-auto border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* PROMINENT HEADER WITH LARGE PHOTO (Requirement 87) */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors z-10"
            title="Đóng hồ sơ"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* LARGE PHOTO BOX WITH PHOTO CONTROLS */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden ring-4 ring-white/40 shadow-xl bg-slate-900 flex items-center justify-center">
                <img
                  src={currentAvatar}
                  alt={student.fullName}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                  }}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Photo Action Buttons (Only for Teacher/Admin) */}
              {!isGuest && (
                <div className="mt-2 flex items-center justify-center gap-1.5 bg-black/30 backdrop-blur-md p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Chọn ảnh từ thiết bị"
                    className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleStartCamera}
                    title="Chụp ảnh bằng camera"
                    className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetAvatar}
                    title="Xóa ảnh (đặt lại mặc định)"
                    className="p-1.5 hover:bg-rose-500/50 rounded-lg text-rose-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* HEADER TEXT & BADGES */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-xs">
                  {isEditing ? editFormData.fullName : student.fullName}
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur">
                  STT: {student.stt}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-black/30">
                  Mã HS: {student.studentCode}
                </span>
              </div>

              {/* TEAM BADGE (Requirement 82) */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-amber-400 text-amber-950 shadow-sm flex items-center gap-1">
                  👥 Thành viên {isEditing ? editFormData.team : student.team}
                </span>
                <span className="text-blue-100 text-xs font-medium">
                  • {student.gender} • Ngày sinh: {student.dob}
                </span>
              </div>

              {/* QUICK STATS BADGES */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/30 border border-emerald-300/40 text-emerald-100">
                  Điểm Thi Đua: {student.emulationScore > 0 ? `+${student.emulationScore}` : student.emulationScore}
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white/20 backdrop-blur">
                  Trạng Thái: {student.statusTag}
                </span>
                {student.isNeedsAttention && (
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-400 text-amber-950 flex items-center gap-1">
                    <HeartHandshake className="w-3.5 h-3.5" />
                    Cần Quan Tâm ({student.needsAttentionCategory})
                  </span>
                )}
              </div>
            </div>

            {/* EDIT PROFILE TOGGLE BUTTON (Requirement 88) */}
            {!isGuest && (
              <div className="shrink-0 self-center sm:self-start">
                <button
                  onClick={() => {
                    if (isEditing) {
                      setIsEditing(false);
                    } else {
                      setEditFormData({
                        ...student,
                        ethnicity: student.ethnicity || 'Kinh',
                        familyBackground: student.familyBackground || 'Bình thường',
                      });
                      setIsEditing(true);
                      setActiveTab('info');
                    }
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all ${
                    isEditing
                      ? 'bg-amber-400 text-amber-950 hover:bg-amber-300'
                      : 'bg-white text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  {isEditing ? 'Hủy chỉnh sửa' : '✏️ Chỉnh sửa hồ sơ'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ⚡ THAO TÁC NHANH (Requirement 85) */}
        <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> THAO TÁC NHANH
            </span>
            <span className="text-[10px] text-slate-400">
              Sử dụng các tính năng tích hợp sẵn
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {/* Call Father */}
            <a
              href={`tel:${fatherPhone || student.parentPhone}`}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold whitespace-nowrap flex items-center gap-1 shrink-0 shadow-2xs"
            >
              📞 Gọi bố
            </a>
            {/* Zalo Father */}
            <button
              onClick={() => handleOpenZaloClick(fatherPhone || student.parentPhone, fatherName || 'Bố')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold whitespace-nowrap flex items-center gap-1 shrink-0 shadow-2xs"
            >
              💬 Zalo bố
            </button>
            {/* Call Mother */}
            <a
              href={`tel:${motherPhone || student.parentPhone}`}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold whitespace-nowrap flex items-center gap-1 shrink-0 shadow-2xs"
            >
              📞 Gọi mẹ
            </a>
            {/* Zalo Mother */}
            <button
              onClick={() => handleOpenZaloClick(motherPhone || student.parentPhone, motherName || 'Mẹ')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold whitespace-nowrap flex items-center gap-1 shrink-0 shadow-2xs"
            >
              💬 Zalo mẹ
            </button>

            {!isGuest && (
              <>
                <button
                  onClick={() => onOpenAddPoint(student)}
                  className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-200 rounded-xl font-bold whitespace-nowrap flex items-center gap-1 shrink-0 border border-emerald-300 dark:border-emerald-800"
                >
                  ➕ Cộng điểm
                </button>
                <button
                  onClick={() => onOpenDeductPoint(student)}
                  className="px-3 py-1.5 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 text-rose-800 dark:text-rose-200 rounded-xl font-bold whitespace-nowrap flex items-center gap-1 shrink-0 border border-rose-300 dark:border-rose-800"
                >
                  ➖ Trừ điểm
                </button>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-950/60 hover:bg-indigo-200 text-indigo-800 dark:text-indigo-200 rounded-xl font-bold whitespace-nowrap flex items-center gap-1 shrink-0 border border-indigo-300 dark:border-indigo-800"
                >
                  📅 Điểm danh
                </button>
                <button
                  onClick={() => setActiveTab('teacher_notes')}
                  className="px-3 py-1.5 bg-sky-100 dark:bg-sky-950/60 hover:bg-sky-200 text-sky-800 dark:text-sky-200 rounded-xl font-bold whitespace-nowrap flex items-center gap-1 shrink-0 border border-sky-300 dark:border-sky-800"
                >
                  📖 Nhật ký
                </button>
                <button
                  onClick={() => setActiveTab('commendations')}
                  className="px-3 py-1.5 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-800 dark:text-amber-200 rounded-xl font-bold whitespace-nowrap flex items-center gap-1 shrink-0 border border-amber-300 dark:border-amber-800"
                >
                  🏆 Khen thưởng
                </button>
              </>
            )}
          </div>
        </div>

        {/* MODAL TABS NAVIGATION (Requirement 86) */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 flex gap-1 overflow-x-auto shrink-0 no-scrollbar">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'info' 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" /> 👤 Thông Tin
          </button>

          <button
            onClick={() => setActiveTab('parent')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'parent' 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> 👨‍👩‍👧 Phụ Huynh
          </button>

          <button
            onClick={() => setActiveTab('emulation')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'emulation' 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" /> 📊 Thi Đua ({studentLogs.length})
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'attendance' 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" /> 📅 Chuyên Cần
          </button>

          <button
            onClick={() => setActiveTab('teacher_notes')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'teacher_notes' 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> 📖 Nhật Ký ({studentTeacherLogs.length})
          </button>

          <button
            onClick={() => setActiveTab('commendations')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'commendations' 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" /> 🏆 Khen Thưởng ({studentCommendations.length})
          </button>

          <button
            onClick={() => setActiveTab('needs_attention')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'needs_attention' 
                ? 'border-amber-600 text-amber-600 dark:text-amber-400' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-amber-500" /> 💙 Cần Quan Tâm
          </button>
        </div>

        {/* BODY CONTENT AREA */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-100">
          
          {/* EDIT FORM OR VIEW FOR TAB 1: BASIC INFO */}
          {activeTab === 'info' && (
            isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-4">
                  <h3 className="font-extrabold text-sm text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-700 pb-2 uppercase tracking-wider flex items-center gap-2">
                    <Edit3 className="w-4 h-4" /> CHỈNH SỬA THÔNG TIN BẢN THÂN
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Họ và tên *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.fullName}
                        onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-bold text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Mã học sinh</label>
                      <input
                        type="text"
                        value={editFormData.studentCode}
                        onChange={(e) => setEditFormData({ ...editFormData, studentCode: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Ngày sinh (DD/MM/YYYY)</label>
                      <input
                        type="text"
                        value={editFormData.dob}
                        onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Giới tính</label>
                      <select
                        value={editFormData.gender}
                        onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-semibold"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Dân tộc</label>
                      <input
                        type="text"
                        list="ethnicity-suggestions"
                        value={editFormData.ethnicity || 'Kinh'}
                        onChange={(e) => setEditFormData({ ...editFormData, ethnicity: e.target.value })}
                        placeholder="Kinh"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-semibold text-slate-800 dark:text-slate-100"
                      />
                      <datalist id="ethnicity-suggestions">
                        <option value="Kinh" />
                        <option value="Ê đê" />
                        <option value="Ba Na" />
                        <option value="Gia Rai" />
                        <option value="Tày" />
                        <option value="Thái" />
                        <option value="Mường" />
                        <option value="H'Mông" />
                        <option value="Dao" />
                        <option value="Khác" />
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Hoàn cảnh gia đình</label>
                      <select
                        value={editFormData.familyBackground || 'Bình thường'}
                        onChange={(e) => setEditFormData({ ...editFormData, familyBackground: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-semibold text-slate-800 dark:text-slate-100"
                      >
                        <option value="Bình thường">Bình thường</option>
                        <option value="Hộ nghèo">Hộ nghèo</option>
                        <option value="Hộ cận nghèo">Hộ cận nghèo</option>
                        <option value="Mồ côi cha/mẹ">Mồ côi cha/mẹ</option>
                        <option value="Khó khăn đột xuất">Khó khăn đột xuất</option>
                        <option value="Khuyết tật">Khuyết tật</option>
                        <option value="Con thương binh/liệt sĩ">Con thương binh/liệt sĩ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Quê quán</label>
                      <input
                        type="text"
                        value={editFormData.hometown || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, hometown: e.target.value })}
                        placeholder="Nhập quê quán..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Địa chỉ thường trú</label>
                      <input
                        type="text"
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                        placeholder="Nhập địa chỉ..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Phân tổ sinh hoạt</label>
                      <select
                        value={editFormData.team}
                        onChange={(e) => setEditFormData({ ...editFormData, team: e.target.value as TeamNumber })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-bold text-amber-600"
                      >
                        <option value="Tổ 1">Tổ 1</option>
                        <option value="Tổ 2">Tổ 2</option>
                        <option value="Tổ 3">Tổ 3</option>
                        <option value="Tổ 4">Tổ 4</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Số thứ tự (STT)</label>
                      <input
                        type="number"
                        value={editFormData.stt}
                        onChange={(e) => setEditFormData({ ...editFormData, stt: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600"
                      />
                    </div>
                  </div>
                </div>

                {/* PARENT EDIT SECTION */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-4">
                  <h3 className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400 border-b border-slate-200 dark:border-slate-700 pb-2 uppercase tracking-wider">
                    👨‍👩‍👧 CHỈNH SỬA THÔNG TIN PHỤ HUYNH
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Họ tên Bố / Ba</label>
                      <input
                        type="text"
                        value={editFormData.fatherName || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, fatherName: e.target.value })}
                        placeholder="Nhập tên bố..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Số điện thoại Bố</label>
                      <input
                        type="text"
                        value={editFormData.fatherPhone || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, fatherPhone: e.target.value })}
                        placeholder="Nhập số điện thoại..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Họ tên Mẹ</label>
                      <input
                        type="text"
                        value={editFormData.motherName || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, motherName: e.target.value })}
                        placeholder="Nhập tên mẹ..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Số điện thoại Mẹ</label>
                      <input
                        type="text"
                        value={editFormData.motherPhone || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, motherPhone: e.target.value })}
                        placeholder="Nhập số điện thoại..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md"
                  >
                    <Save className="w-4 h-4" /> 💾 Lưu hồ sơ
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            ) : (
              /* VIEW MODE TAB 1: BASIC INFO */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Student Basic Card */}
                  <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h3 className="font-extrabold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center justify-between">
                      <span>👤 THÔNG TIN CÁ NHÂN</span>
                      <span className="text-blue-600 font-bold">{student.studentCode}</span>
                    </h3>

                    <div className="text-xs space-y-2.5">
                      <div className="flex justify-between items-center"><span className="text-slate-400 font-medium">Họ và tên:</span> <strong className="text-slate-900 dark:text-slate-100 font-bold text-sm">{student.fullName}</strong></div>
                      <div className="flex justify-between items-center"><span className="text-slate-400 font-medium">Số thứ tự (STT):</span> <span className="font-bold">{student.stt}</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-400 font-medium">Ngày sinh:</span> <span className="font-semibold">{student.dob}</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-400 font-medium">Giới tính:</span> <span className="font-semibold">{student.gender}</span></div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Dân tộc:</span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700">
                          🏛️ {student.ethnicity || 'Kinh'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Hoàn cảnh gia đình:</span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                          (student.familyBackground && student.familyBackground !== 'Bình thường')
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                            : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          🏡 {student.familyBackground || 'Bình thường'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center"><span className="text-slate-400 font-medium">Quê quán:</span> <span className="font-semibold">{student.hometown || 'Chưa cập nhật'}</span></div>
                      <div className="flex justify-between items-start"><span className="text-slate-400 font-medium">Địa chỉ:</span> <span className="text-right max-w-[220px] font-medium">{student.address}</span></div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="text-slate-400 font-medium">Tổ sinh hoạt:</span>
                        <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-black">
                          👥 {student.team}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Parent Card */}
                  <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h3 className="font-extrabold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center justify-between">
                      <span>👨‍👩‍👧 TỔNG QUAN PHỤ HUYNH</span>
                      <button
                        onClick={() => setActiveTab('parent')}
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        Chi tiết →
                      </button>
                    </h3>

                    <div className="text-xs space-y-3">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Họ tên Bố / Ba:</span>
                        <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {fatherName || 'Chưa cập nhật'}
                        </div>
                        <div className="font-mono text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                          {maskPhone(fatherPhone)}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="text-slate-400 text-[11px] block">Họ tên Mẹ:</span>
                        <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {motherName || 'Chưa cập nhật'}
                        </div>
                        <div className="font-mono text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                          {maskPhone(motherPhone)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* TAB 2: PARENT DETAILS (Requirements 83 & 84) */}
          {activeTab === 'parent' && (
            <div className="space-y-6">
              <div className="bg-indigo-50/60 dark:bg-indigo-950/20 p-5 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 space-y-4">
                <h3 className="font-black text-sm text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" /> 👨‍👩‍👧 THÔNG TIN PHỤ HUYNH VÀ LIÊN HỆ
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* FATHER CARD */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400 uppercase">👨 BA / BỐ</span>
                      <span className="text-[10px] text-slate-400 font-mono">Người liên hệ chính</span>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">Họ và tên:</div>
                      <div className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                        {fatherName || 'Chưa cập nhật'}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">Số điện thoại:</div>
                      <div className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">
                        {maskPhone(fatherPhone)}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <a
                        href={`tel:${fatherPhone}`}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
                      >
                        📞 Gọi
                      </a>
                      <button
                        onClick={() => handleOpenZaloClick(fatherPhone, fatherName || 'Bố')}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
                      >
                        💬 Zalo
                      </button>
                      <button
                        onClick={() => handleCopyPhone(fatherPhone)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200"
                        title="Sao chép SĐT"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* MOTHER CARD */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400 uppercase">👩 MẸ</span>
                      <span className="text-[10px] text-slate-400 font-mono">Người liên hệ</span>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">Họ và tên:</div>
                      <div className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                        {motherName || 'Chưa cập nhật'}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">Số điện thoại:</div>
                      <div className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">
                        {maskPhone(motherPhone)}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <a
                        href={`tel:${motherPhone}`}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
                      >
                        📞 Gọi
                      </a>
                      <button
                        onClick={() => handleOpenZaloClick(motherPhone, motherName || 'Mẹ')}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
                      >
                        💬 Zalo
                      </button>
                      <button
                        onClick={() => handleCopyPhone(motherPhone)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200"
                        title="Sao chép SĐT"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* PARENT CONTACT LOGS HISTORY */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" /> Lịch Sử Trao Đổi Với Phụ Huynh ({studentParentLogs.length})
                  </h3>
                  {!isGuest && (
                    <button
                      onClick={() => onOpenParentContact(student)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Ghi Nhận Cuộc Gọi
                    </button>
                  )}
                </div>

                {studentParentLogs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    Chưa có lịch sử cuộc gọi hoặc tin nhắn ghi nhận với phụ huynh.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {studentParentLogs.map((p) => (
                      <div key={p.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            📞 Kênh: {p.channel}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {p.date}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 font-medium">
                          {p.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: EMULATION TIMELINE (Requirement 86) */}
          {activeTab === 'emulation' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" /> Timeline Điểm Thi Đua ({filteredStudentLogs.length})
                </h3>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs">
                    <button
                      onClick={() => setLogFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        logFilter === 'all' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setLogFilter('positive')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        logFilter === 'positive' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      🟢 Điểm cộng
                    </button>
                    <button
                      onClick={() => setLogFilter('negative')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        logFilter === 'negative' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      🔴 Điểm trừ
                    </button>
                  </div>

                  {!isGuest && (
                    <>
                      <button
                        onClick={() => onOpenAddPoint(student)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                      >
                        + Cộng Điểm
                      </button>
                      <button
                        onClick={() => onOpenDeductPoint(student)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
                      >
                        - Trừ Điểm
                      </button>
                    </>
                  )}
                </div>
              </div>

              {filteredStudentLogs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs bg-slate-50 dark:bg-slate-900 rounded-2xl">
                  Không tìm thấy ghi nhận lịch sử thi đua nào phù hợp.
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-6 py-2">
                  {filteredStudentLogs.map((log) => (
                    <div key={log.id} className="relative pl-6">
                      <span className={`absolute -left-[17px] top-1.5 w-8 h-8 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                        log.scoreDiff > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}>
                        {log.scoreDiff > 0 ? '+' : '-'}
                      </span>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-black px-2.5 py-0.5 rounded-lg text-xs ${
                            log.scoreDiff > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {log.scoreDiff > 0 ? `+${log.scoreDiff}` : log.scoreDiff} điểm
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            ⏰ {log.timestamp}
                          </span>
                        </div>

                        <div className="font-bold text-slate-800 dark:text-slate-100 text-xs pt-1">
                          Lý do: {log.reasonCategory}
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                          {log.reasonDetail}
                        </p>

                        <div className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
                          <span>Người thực hiện: <strong>{log.teacherName}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ATTENDANCE (Requirement 86) */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    Trạng Thái Chuyên Cần Hôm Nay
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hôm nay: <strong className="capitalize">{student.attendanceToday === 'present' ? '✅ Có mặt' : student.attendanceToday === 'late' ? '⏰ Đi muộn' : '❌ Vắng mặt'}</strong>
                  </p>
                </div>

                {!isGuest && onUpdateAttendance && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        onUpdateAttendance(student.id, 'present');
                        showToast('✓ Đã điểm danh Có mặt');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        student.attendanceToday === 'present'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Có mặt
                    </button>
                    <button
                      onClick={() => {
                        onUpdateAttendance(student.id, 'late');
                        showToast('✓ Đã điểm danh Đi muộn');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        student.attendanceToday === 'late'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 inline mr-1" /> Muộn
                    </button>
                    <button
                      onClick={() => {
                        onUpdateAttendance(student.id, 'excused');
                        showToast('✓ Đã điểm danh Vắng');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        student.attendanceToday === 'excused' || student.attendanceToday === 'unexcused'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5 inline mr-1" /> Vắng
                    </button>
                  </div>
                )}
              </div>

              {/* Attendance History */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-500 uppercase">Lịch sử điểm danh gần đây</h4>
                {studentAttendance.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    Chưa có lịch sử điểm danh theo ngày.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {studentAttendance.map((rec) => (
                      <div key={rec.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center">
                        <span className="font-mono font-medium">📅 {rec.date}</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                          rec.status === 'present' ? 'bg-emerald-100 text-emerald-800' : rec.status === 'late' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {rec.status === 'present' ? 'Có mặt' : rec.status === 'late' ? 'Đi muộn' : 'Vắng'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: TEACHER NOTES (Requirement 86) */}
          {activeTab === 'teacher_notes' && (
            <div className="space-y-4">
              {!isGuest && (
                <form onSubmit={handleAddLogSubmit} className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Ghi nhật ký giáo viên chủ nhiệm mới
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Nhập nhận xét hoặc sự việc liên quan..."
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                    >
                      Lưu Ghi Chú
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2 pt-2">
                {studentTeacherLogs.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    Chưa có nhật ký ghi nhận từ giáo viên.
                  </div>
                ) : (
                  studentTeacherLogs.map((t) => (
                    <div key={t.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex justify-between text-slate-400 font-mono text-[10px] mb-1">
                        <span>🗓️ {t.date}</span>
                        <span>GVCN: {t.teacherName}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 font-medium">
                        {t.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: COMMENDATIONS (Requirement 86) */}
          {activeTab === 'commendations' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> Bảng Thành Tích & Khen Thưởng
              </h3>

              {studentCommendations.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Chưa có bằng khen hay tuyên dương nào ghi nhận.
                </div>
              ) : (
                <div className="space-y-2">
                  {studentCommendations.map((c) => (
                    <div key={c.id} className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 dark:text-amber-200 text-sm flex items-center gap-1.5">
                          🏆 {c.achievementTitle}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-950 dark:text-amber-100 rounded-full font-bold text-[10px]">
                          {c.format}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">
                        {c.details}
                      </p>
                      <div className="text-[10px] text-slate-400 font-mono pt-1">
                        Ngày khen thưởng: {c.date}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: NEEDS ATTENTION (Requirement 86) */}
          {activeTab === 'needs_attention' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-amber-600" />
                    ĐÁNH DẤU HỌC SINH CẦN QUAN TÂM
                  </h3>
                  <span className="text-xs text-slate-500">
                    Trạng thái: <strong>{student.isNeedsAttention ? 'Có đánh dấu' : 'Bình thường'}</strong>
                  </span>
                </div>

                {!isGuest ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">Nhóm nguyên nhân:</label>
                        <select
                          value={attentionCategory}
                          onChange={(e) => setAttentionCategory(e.target.value as NeedsAttentionCategory)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-xs font-semibold"
                        >
                          <option value="Chuyên cần">Chuyên cần</option>
                          <option value="Rèn luyện">Rèn luyện</option>
                          <option value="Hoàn cảnh">Hoàn cảnh gia đình</option>
                          <option value="Quan hệ bạn bè">Quan hệ bạn bè</option>
                          <option value="Cần hỗ trợ khác">Cần hỗ trợ khác</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 font-bold mb-1">Ghi chú hỗ trợ đặc biệt:</label>
                        <input
                          type="text"
                          value={attentionNote}
                          onChange={(e) => setAttentionNote(e.target.value)}
                          placeholder="Ghi nhận lưu ý cho giáo viên..."
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveAttentionSettings}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        student.isNeedsAttention 
                          ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      {student.isNeedsAttention ? 'Bỏ đánh dấu Cần Quan Tâm' : 'Xác nhận Đánh dấu Cần Quan Tâm'}
                    </button>
                  </>
                ) : (
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    {student.isNeedsAttention ? (
                      <p>
                        Học sinh đang được hỗ trợ thuộc nhóm: <strong>{student.needsAttentionCategory}</strong>.
                      </p>
                    ) : (
                      <p>Học sinh duy trì trạng thái học tập và rèn luyện bình thường.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <button
            onClick={() => onOpenParentContact(student)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
          >
            <PhoneCall className="w-4 h-4" /> 📞 Liên Hệ Phụ Huynh
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl"
          >
            Đóng Hồ Sơ
          </button>
        </div>
      </div>
    </div>
  );
};
