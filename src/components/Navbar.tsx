import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  Table,
  CalendarCheck, 
  Award, 
  HeartHandshake, 
  FolderKanban, 
  Printer, 
  Sun, 
  Moon, 
  Settings,
  CheckSquare,
  Calendar,
  BarChart3,
  Clock,
  QrCode,
  Lock,
  LogOut,
  ChevronDown,
  ShieldCheck,
  User,
  FileText,
  CloudCheck
} from 'lucide-react';
import { ClassConfig, AuthMode, TeacherProfile } from '../types';
import { INITIAL_CLASS_CONFIG } from '../data/mockData';
import { subscribeSyncStatus, SyncStatus } from '../utils/cloudSync';

interface NavbarProps {
  config?: ClassConfig;
  classConfig?: ClassConfig;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenConfigModal: () => void;
  
  // New props for operating date, period config, QR, auth, class rules
  operatingDate: string; // YYYY-MM-DD
  authMode: AuthMode;
  teacherProfile: TeacherProfile | null;
  onOpenOperatingDateModal: () => void;
  onOpenPeriodConfigModal: () => void;
  onOpenQRCodeModal: () => void;
  onOpenClassRulesModal: () => void;
  onOpenAuthModal: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  classConfig,
  activeTab,
  onSelectTab,
  darkMode,
  onToggleDarkMode,
  onOpenConfigModal,
  operatingDate,
  authMode,
  teacherProfile,
  onOpenOperatingDateModal,
  onOpenPeriodConfigModal,
  onOpenQRCodeModal,
  onOpenClassRulesModal,
  onOpenAuthModal,
  onLogout,
}) => {
  const [showAdminMenu, setShowAdminMenu] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: 'synced',
    lastSyncedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    message: '🟢 Đã đồng bộ lên đám mây',
  });

  useEffect(() => {
    const unsub = subscribeSyncStatus((s) => setSyncStatus(s));
    return () => unsub();
  }, []);

  const currentConfig = config || classConfig || INITIAL_CLASS_CONFIG;

  const formatDateDisplay = (ymd: string) => {
    if (!ymd) return '';
    const parts = ymd.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return ymd;
  };

  const navTabs = [
    { id: 'dashboard', label: '🏠 Trang chủ', icon: LayoutDashboard },
    { id: 'emulation_summary', label: '📊 Tổng hợp thi đua', icon: BarChart3 },
    { id: 'seating_chart', label: '🪑 Sơ đồ lớp học', icon: Table },
    { id: 'teacher_logs', label: '📓 Nhật ký lớp học', icon: FolderKanban },
    { id: 'student_table', label: '👥 Lớp chủ nhiệm', icon: Users },
    { id: 'attendance', label: '✅ Chuyên cần', icon: CalendarCheck },
    { id: 'commendations', label: '🎖️ Khen thưởng', icon: Award },
    { id: 'needs_attention', label: '⚠️ Cần quan tâm', icon: HeartHandshake },
    { id: 'tasks', label: '📋 Nhiệm vụ lớp', icon: CheckSquare },
    { id: 'reports', label: '🖨 In báo cáo', icon: Printer },
  ];

  const isLoggedInAdmin = authMode === 'TEACHER' && teacherProfile !== null;
  const adminDisplayName = teacherProfile?.displayName || 'ThS. Nguyễn Quỳnh An';
  const adminRole = teacherProfile?.role || 'ADMIN';
  const adminEmail = teacherProfile?.email || 'Quynhan9942@gmail.com';

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      {/* Top Banner Info */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white px-4 py-2 text-xs md:text-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left Info: School & Class Name & Cloud Sync Badge */}
          <div className="flex items-center gap-2.5 font-medium flex-wrap">
            <span className="flex items-center gap-1.5 bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur font-semibold text-white">
              🏫 {currentConfig?.schoolName || 'THCS Nguyễn Văn Cừ'}
            </span>
            <span className="text-blue-100">|</span>
            <span className="flex items-center gap-1 text-blue-100">
              Lớp: <strong className="text-white">{currentConfig?.className || '6a3'}</strong>
            </span>
            <span className="text-blue-100">|</span>
            {/* Real Cloud Sync Badge */}
            <span 
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold backdrop-blur border ${
                syncStatus.state === 'synced' 
                  ? 'bg-emerald-500/30 text-emerald-100 border-emerald-400/50' 
                  : syncStatus.state === 'syncing'
                  ? 'bg-amber-500/30 text-amber-100 border-amber-400/50 animate-pulse'
                  : 'bg-rose-500/30 text-rose-100 border-rose-400/50'
              }`}
              title={`Đồng bộ đám mây: ${syncStatus.message}`}
            >
              <span className={`w-2 h-2 rounded-full ${
                syncStatus.state === 'synced' ? 'bg-emerald-400 animate-pulse' : syncStatus.state === 'syncing' ? 'bg-amber-300' : 'bg-rose-400'
              }`} />
              <span>{syncStatus.message} {syncStatus.lastSyncedAt ? `(${syncStatus.lastSyncedAt})` : ''}</span>
            </span>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 flex-wrap relative">
            {/* Nội quy lớp Button */}
            <button
              onClick={onOpenClassRulesModal}
              className="px-2.5 py-1 bg-amber-500/90 hover:bg-amber-500 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur transition-all active:scale-95 cursor-pointer shadow-sm border border-amber-300/40"
              title="📜 Xem toàn văn Nội quy & Khen thưởng - Kỷ luật"
            >
              <FileText className="w-3.5 h-3.5 text-amber-100" />
              <span>📜 Nội quy lớp</span>
            </button>

            {/* Kỳ thi đua Button */}
            <button
              onClick={onOpenPeriodConfigModal}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur transition-all active:scale-95 cursor-pointer"
              title="📅 ⚙️ Kỳ thi đua"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-200" />
              <span>📅 ⚙️ Kỳ thi đua</span>
            </button>

            {/* Mã QR Button */}
            <button
              onClick={onOpenQRCodeModal}
              className="px-2.5 py-1 bg-cyan-500/80 hover:bg-cyan-500 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur transition-all active:scale-95 cursor-pointer"
              title="📇 📱 Mã QR"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>📇 📱 Mã QR</span>
            </button>

            {/* Thiết lập lớp Button */}
            <button
              onClick={onOpenConfigModal}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur transition-all active:scale-95 cursor-pointer"
              title="⚙️ Thiết lập lớp"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>⚙️ Thiết lập lớp</span>
            </button>

            {/* Google Admin Login / Account Profile Dropdown */}
            {isLoggedInAdmin ? (
              <div className="relative">
                <button
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all cursor-pointer border border-emerald-400"
                  title="Tài khoản Admin Google"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse shrink-0" />
                  {teacherProfile?.photoURL ? (
                    <img 
                      src={teacherProfile.photoURL} 
                      alt="Google Avatar" 
                      className="w-5 h-5 rounded-full object-cover border border-white shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <svg className="w-4 h-4 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  )}
                  <span>👤 {adminDisplayName} ({adminRole})</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdminMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Account Dropdown */}
                {showAdminMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 text-slate-800 dark:text-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-3 mb-3">
                      {teacherProfile?.photoURL ? (
                        <img 
                          src={teacherProfile.photoURL} 
                          alt="Google Avatar" 
                          className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-md shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 border-2 border-white dark:border-slate-700 shadow-md">
                          {adminDisplayName.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs truncate flex items-center gap-1">
                          <span>👤 {adminDisplayName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                          {adminEmail}
                        </div>
                        <span className="inline-block px-2 py-0.5 mt-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[10px] rounded-md">
                          🛡️ {adminRole} QUẢN TRỊ
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <button
                        onClick={() => {
                          setShowAdminMenu(false);
                          onOpenAuthModal();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                      >
                        <User className="w-4 h-4 text-blue-500" />
                        <span>🔑 Chuyển tài khoản Google khác</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowAdminMenu(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>🚪 Đăng xuất Admin (Chuyển chế độ Khách)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-3 py-1 bg-white text-slate-800 hover:bg-slate-100 active:scale-95 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md cursor-pointer group"
                title="Đăng nhập Admin bằng Google"
              >
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Đăng nhập Admin bằng Google</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div 
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg md:text-xl text-slate-800 dark:text-slate-100 leading-tight flex items-center gap-1.5">
              SỔ CHỦ NHIỆM ĐIỆN TỬ
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 rounded-full">
                {currentConfig?.className || '6a3'}
              </span>
              {authMode === 'GUEST' && (
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" /> CHỈ XEM
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quản lý học sinh & thi đua rèn luyện lớp chủ nhiệm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Operating Date pill */}
          <button
            onClick={onOpenOperatingDateModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Ngày NV: <strong className="text-emerald-600 dark:text-emerald-400">{formatDateDisplay(operatingDate)}</strong></span>
          </button>

          <button
            onClick={onToggleDarkMode}
            title="Chuyển đổi giao diện Sáng / Tối"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};


