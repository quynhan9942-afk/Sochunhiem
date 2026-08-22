import React, { useState } from 'react';
import { Eye, Lock, LogIn, Key, Search, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Student } from '../types';

interface ParentGuestBannerProps {
  students: Student[];
  selectedStudentForPin: Student | null;
  onOpenTeacherLogin: () => void;
  onUnlockStudentDetails: (student: Student) => void;
}

export const ParentGuestBanner: React.FC<ParentGuestBannerProps> = ({
  students,
  selectedStudentForPin,
  onOpenTeacherLogin,
  onUnlockStudentDetails,
}) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(false);

    if (!pinInput.trim()) return;

    // Search student by accessCode or studentCode or last 4 digits
    const cleaned = pinInput.trim().toLowerCase();
    const matched = students.find((s) => {
      const code = (s.accessCode || '').toLowerCase();
      const stCode = (s.studentCode || '').toLowerCase();
      return code === cleaned || stCode === cleaned || stCode.endsWith(cleaned);
    });

    if (matched) {
      onUnlockStudentDetails(matched);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-md border-b border-amber-600 print:hidden">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Main Banner Title */}
        <div className="flex items-center gap-2 font-black text-sm tracking-wide">
          <div className="p-1.5 bg-black/15 rounded-lg flex items-center justify-center">
            <Eye className="w-4 h-4 text-white" />
          </div>
          <span>👨‍👩‍👧 CHẾ ĐỘ PHỤ HUYNH – CHỈ XEM (READ-ONLY)</span>
        </div>

        {/* PIN Lookup for Student Discipline Details */}
        <form onSubmit={handleVerifyPin} className="flex items-center gap-2">
          <span className="hidden sm:inline text-amber-100 text-[11px] font-semibold">
            Xem riêng con em:
          </span>
          <div className="relative">
            <input
              type="text"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              placeholder="Nhập Mã/PIN học sinh (VD: 8899)"
              className="pl-2.5 pr-8 py-1 bg-white/10 dark:bg-black/20 border border-white/30 rounded-lg text-white placeholder-amber-100/70 text-xs focus:outline-none focus:ring-2 focus:ring-white w-48 font-mono"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 p-0.5 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors"
              title="Tra cứu học sinh"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            type="submit"
            className="px-2.5 py-1 bg-white text-amber-900 font-bold rounded-lg hover:bg-amber-100 transition-colors shadow-2xs text-xs"
          >
            Tra Cứu
          </button>
          {pinError && (
            <span className="text-red-100 font-bold text-[11px] flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Mã không hợp lệ!
            </span>
          )}
        </form>

        {/* Switch to Teacher Login */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-amber-100 text-[11px]">Dành cho GVCN:</span>
          <button
            onClick={onOpenTeacherLogin}
            className="flex items-center gap-1.5 px-3 py-1 bg-black/20 hover:bg-black/30 text-white font-bold rounded-lg border border-white/20 transition-all text-xs"
          >
            <Lock className="w-3 h-3 text-amber-200" />
            <span>Đăng Nhập Giáo Viên</span>
          </button>
        </div>
      </div>
    </div>
  );
};
