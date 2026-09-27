import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck, Sparkles, Eye } from 'lucide-react';
import { TeacherProfile } from '../types';
import { loginWithGoogle } from '../utils/firebase';
import { createTeacherProfileFromGooglePayload, clearUserSession } from '../utils/googleAuth';

interface AuthModalProps {
  currentTeacher: TeacherProfile | null;
  onClose: () => void;
  onLoginSuccess: (profile: TeacherProfile) => void;
  onGuestLogin?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentTeacher,
  onClose,
  onLoginSuccess,
  onGuestLogin,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  // Google Login Handler
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const googleUser = await loginWithGoogle();

      if (googleUser.email.trim().toLowerCase() !== "quynhan9942@gmail.com") {
        throw new Error("Tài khoản Google này không được cấp quyền truy cập Sổ Chủ Nhiệm Điện Tử.");
      }

      const profile = createTeacherProfileFromGooglePayload({
        sub: googleUser.uid,
        email: googleUser.email,
        name: googleUser.displayName,
        picture: googleUser.photoURL,
      });

      onLoginSuccess(profile);
      onClose();
    } catch (error: any) {
      console.error("Login error:", error);
      setErrorMessage(error.message || "Đăng nhập Google thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl">
              <ShieldCheck className="w-7 h-7 text-blue-200" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">Xác thực hệ thống</span>
              <h2 className="text-xl font-black">ĐĂNG NHẬP GIÁO VIÊN</h2>
            </div>
          </div>
          <p className="text-xs text-blue-100/90 leading-relaxed">
            Sổ Chủ Nhiệm Điện Tử • Hệ thống phân quyền an toàn Google Auth & Firestore RBAC
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Authorization Error Alert */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-2xl flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs animate-in slide-in-from-top-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-bold text-sm block">TRUY CẬP BỊ TỪ CHỐI</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Primary Google Sign-In Button & GIS Slot */}
          <div className="space-y-2">

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl shadow-sm text-slate-800 dark:text-slate-100 font-bold text-xs hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-all group disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Đang xác thực Google...' : 'ĐĂNG NHẬP BẰNG GOOGLE'}</span>
            </button>
            <p className="text-[11px] text-center text-slate-500">
              Sử dụng tài khoản Google để đăng nhập Admin
            </p>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span className="flex-shrink mx-3 text-xs font-semibold text-slate-400 uppercase">Hoặc</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          </div>

          {/* Guest Sign-In Button */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                clearUserSession();
                if (onGuestLogin) {
                  onGuestLogin();
                }
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-extrabold text-xs rounded-2xl shadow-xs transition-all border border-slate-300 dark:border-slate-600 active:scale-95 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
              <span>ĐĂNG NHẬP VỚI TƯ CÁCH KHÁCH (CHỈ XEM)</span>
            </button>
            <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
              Chế độ Khách: Chỉ xem dữ liệu thi đua, sơ đồ lớp & báo cáo (không thể chỉnh sửa)
            </p>
          </div>

          {/* Information box */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Phân quyền tài khoản (RBAC):</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              <li><strong>ADMIN (Google)</strong>: Quản trị toàn trường, cấu hình kỳ thi đua & phân công lớp.</li>
              <li><strong>KHÁCH (Guest)</strong>: Tra cứu thông tin, sơ đồ lớp & điểm thi đua (chế độ chỉ xem).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

