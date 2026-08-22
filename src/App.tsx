import React, { useState, useEffect } from 'react';
import { 
  Navbar, 
  StudentCard, 
  StudentListView, 
  Dashboard, 
  EmulationModal, 
  StudentDetailModal, 
  ParentContactModal, 
  AttendanceManager, 
  CommendationManager, 
  NeedsAttentionManager, 
  ClassManagement, 
  TaskManagerView, 
  ReportPrintView, 
  ClassConfigModal,
  UnifiedEmulationView,
  OperatingDateModal,
  PeriodConfigModal,
  AuthModal,
  QRCodeModal,
  ParentGuestBanner,
  SeatingChartView,
  JournalView,
  AdminSchoolRankingView,
  ClassRulesModal
} from './components';

import { 
  INITIAL_CLASS_CONFIG as DEFAULT_CONFIG, 
  INITIAL_STUDENTS as DEFAULT_STUDENTS, 
  INITIAL_EMULATION_LOGS as DEFAULT_EMULATION_LOGS, 
  INITIAL_COMMENDATIONS as DEFAULT_COMMENDATIONS, 
  INITIAL_PARENT_LOGS as DEFAULT_PARENT_LOGS, 
  INITIAL_TEACHER_LOGS as DEFAULT_TEACHER_LOGS, 
  INITIAL_TASKS as DEFAULT_TASKS 
} from './data/mockData';

import { 
  Student, 
  EmulationLog, 
  Commendation, 
  ParentLog, 
  TeacherLog, 
  ClassTask, 
  ClassConfig, 
  AttendanceStatus, 
  NeedsAttentionCategory,
  PeriodConfig,
  PeriodConfigHistory,
  AuthMode,
  TeacherProfile,
  TeamNumber,
  ClassRulesConfig
} from './types';

import { 
  loadStudents, 
  saveStudents, 
  loadEmulationLogs, 
  saveEmulationLogs, 
  loadCommendations, 
  saveCommendations, 
  loadParentLogs, 
  saveParentLogs, 
  loadTeacherLogs, 
  saveTeacherLogs, 
  loadTasks, 
  saveTasks, 
  loadConfig, 
  saveConfig,
  loadOperatingDate,
  saveOperatingDate,
  loadPeriodConfig,
  savePeriodConfig,
  loadPeriodConfigHistory,
  savePeriodConfigHistory,
  loadAuthorizedTeachers,
  loadSeatingCharts,
  loadAttendanceMap,
  saveAttendanceMap,
  AttendanceDayMap,
  loadClassRulesConfig,
  saveClassRulesConfig,
  DEFAULT_CLASS_RULES_CONFIG
} from './utils/storage';
import { loadSavedUserSession, clearUserSession } from './utils/googleAuth';

import { 
  saveClassConfigToCloud, 
  saveStudentToCloud, 
  saveTransactionToCloud,
  loadUserDataFromFirestore,
  saveUserDataToFirestore,
  saveClassDataToCloud,
  subscribeToUserDataInFirestore,
  saveAttendanceRecordToCloud
} from './utils/firebase';
import { syncToCloud, subscribeToCloudSync } from './utils/cloudSync';

export default function App() {
  // App Config State
  const [config, setConfig] = useState<ClassConfig>(() => loadConfig() || DEFAULT_CONFIG);
  
  // App Tab Route State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Dark Mode Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('so_chu_nhiem_theme') === 'dark' || 
           (!('so_chu_nhiem_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Operating Date State (📅 Ngày nghiệp vụ)
  const [operatingDate, setOperatingDate] = useState<string>(() => loadOperatingDate());

  // Period Configuration State (⚙️ Thời gian thi đua)
  const [periodConfig, setPeriodConfig] = useState<PeriodConfig>(() => loadPeriodConfig(config.schoolYear));
  const [periodConfigHistory, setPeriodConfigHistory] = useState<PeriodConfigHistory[]>(() => loadPeriodConfigHistory(config.schoolYear));

  // Class Rules Config State (📜 Bảng Nội Quy Lớp Động)
  const [classRulesConfig, setClassRulesConfig] = useState<ClassRulesConfig>(() =>
    loadClassRulesConfig(config.schoolYear, config.className)
  );

  // Authentication & Access Control State
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(() => {
    const saved = loadSavedUserSession();
    if (saved) return saved;
    const list = loadAuthorizedTeachers();
    return list.find((t) => t.isAuthorized) || list[0] || null;
  });

  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('mode=parent')) {
      return 'GUEST';
    }
    const saved = loadSavedUserSession();
    if (saved) return 'TEACHER';
    return 'TEACHER';
  });

  const handleLogout = () => {
    clearUserSession();
    setAuthMode('GUEST');
    setTeacherProfile(null);
  };

  // Data States with persistence
  const [students, setStudents] = useState<Student[]>(() => {
    const loaded = loadStudents(config.schoolYear, config.className);
    return loaded && loaded.length >= 2 ? loaded : DEFAULT_STUDENTS;
  });

  const [emulationLogs, setEmulationLogs] = useState<EmulationLog[]>(() => {
    const loaded = loadEmulationLogs(config.schoolYear, config.className);
    return loaded.length > 0 ? loaded : DEFAULT_EMULATION_LOGS;
  });

  const [commendations, setCommendations] = useState<Commendation[]>(() => {
    const loaded = loadCommendations(config.schoolYear, config.className);
    return loaded.length > 0 ? loaded : DEFAULT_COMMENDATIONS;
  });

  const [parentLogs, setParentLogs] = useState<ParentLog[]>(() => {
    const loaded = loadParentLogs(config.schoolYear, config.className);
    return loaded.length > 0 ? loaded : DEFAULT_PARENT_LOGS;
  });

  const [teacherLogs, setTeacherLogs] = useState<TeacherLog[]>(() => {
    const loaded = loadTeacherLogs(config.schoolYear, config.className);
    return loaded.length > 0 ? loaded : DEFAULT_TEACHER_LOGS;
  });

  const [tasks, setTasks] = useState<ClassTask[]>(() => {
    const loaded = loadTasks(config.schoolYear, config.className);
    return loaded.length > 0 ? loaded : DEFAULT_TASKS;
  });

  const [attendanceMap, setAttendanceMap] = useState<AttendanceDayMap>(() => {
    return loadAttendanceMap(config.schoolYear, config.className);
  });

  // Modal States
  const [emulationModalStudent, setEmulationModalStudent] = useState<Student | null>(null);
  const [emulationModalMode, setEmulationModalMode] = useState<'add' | 'deduct'>('add');

  const [detailModalStudent, setDetailModalStudent] = useState<Student | null>(null);
  const [parentContactStudent, setParentContactStudent] = useState<Student | null>(null);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  // New Modals
  const [showOperatingDateModal, setShowOperatingDateModal] = useState<boolean>(false);
  const [showPeriodConfigModal, setShowPeriodConfigModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState<boolean>(false);
  const [showClassRulesModal, setShowClassRulesModal] = useState<boolean>(false);
  const [isLoadingCloudData, setIsLoadingCloudData] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return !!params.get('admin');
    }
    return false;
  });

  // 1. Fetch Admin Data & Subscribe to Real-time Cloud Sync
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const targetAdmin = params.get('admin');

    let activeAdminId = '';
    if (targetAdmin) {
      activeAdminId = targetAdmin.trim();
      setAuthMode('GUEST');
      setIsLoadingCloudData(true);
    } else if (teacherProfile?.email) {
      activeAdminId = teacherProfile.email.trim();
    } else {
      activeAdminId = 'quynhan9942@gmail.com';
    }

    const applyData = (cloudData: any) => {
      if (!cloudData) return;
      if (cloudData.config) setConfig(cloudData.config);
      if (cloudData.students && Array.isArray(cloudData.students) && cloudData.students.length >= 2) {
        setStudents(cloudData.students);
      }
      if (cloudData.emulationLogs && Array.isArray(cloudData.emulationLogs)) setEmulationLogs(cloudData.emulationLogs);
      if (cloudData.commendations && Array.isArray(cloudData.commendations)) setCommendations(cloudData.commendations);
      if (cloudData.tasks && Array.isArray(cloudData.tasks)) setTasks(cloudData.tasks);
      if (cloudData.parentLogs && Array.isArray(cloudData.parentLogs)) setParentLogs(cloudData.parentLogs);
      if (cloudData.teacherLogs && Array.isArray(cloudData.teacherLogs)) setTeacherLogs(cloudData.teacherLogs);
      if (cloudData.periodConfig) setPeriodConfig(cloudData.periodConfig);
      if (cloudData.periodConfigHistory && Array.isArray(cloudData.periodConfigHistory)) setPeriodConfigHistory(cloudData.periodConfigHistory);
      if (cloudData.operatingDate) setOperatingDate(cloudData.operatingDate);
      if (cloudData.attendanceMap) {
        setAttendanceMap(cloudData.attendanceMap);
        saveAttendanceMap(cloudData.config?.schoolYear || config.schoolYear, cloudData.config?.className || config.className, cloudData.attendanceMap);
      }
      if (cloudData.classRulesConfig) {
        setClassRulesConfig(cloudData.classRulesConfig);
        saveClassRulesConfig(cloudData.config?.schoolYear || config.schoolYear, cloudData.config?.className || config.className, cloudData.classRulesConfig);
      }
      setIsLoadingCloudData(false);
    };

    // Realtime Cloud Subscription (Multi-channel: Cloud REST API + Firestore)
    const unsubscribeCloudSync = subscribeToCloudSync((liveData) => {
      applyData(liveData);
    });

    return () => {
      unsubscribeCloudSync();
    };
  }, [teacherProfile?.email]);

  // 2. Auto sync changes to Real Cloud Sync API & Firestore
  useEffect(() => {
    if (authMode === 'TEACHER') {
      const activeAdminId = teacherProfile?.email || 'quynhan9942@gmail.com';
      const seatingCharts = loadSeatingCharts(config.schoolYear, config.className);

      const timeoutId = setTimeout(() => {
        const payload = {
          config,
          students,
          emulationLogs,
          commendations,
          tasks,
          parentLogs,
          teacherLogs,
          periodConfig,
          periodConfigHistory,
          operatingDate,
          seatingCharts,
          classRulesConfig,
          attendanceMap,
          timestamp: Date.now(),
        };
        saveUserDataToFirestore(activeAdminId, payload);
        saveClassDataToCloud(payload);
        syncToCloud(payload);
      }, 200);

      return () => clearTimeout(timeoutId);
    }
  }, [
    students,
    emulationLogs,
    commendations,
    parentLogs,
    teacherLogs,
    tasks,
    config,
    periodConfig,
    periodConfigHistory,
    operatingDate,
    classRulesConfig,
    attendanceMap,
    authMode,
    teacherProfile?.email,
  ]);

  // Auto-open student details if parent scanned QR with PIN parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const stCode = params.get('studentCode');
      const pin = params.get('pin');
      if (stCode && students.length > 0) {
        const found = students.find((s) => s.studentCode === stCode || s.accessCode === pin);
        if (found) {
          setDetailModalStudent(found);
          setAuthMode('GUEST');
        }
      }
    }
  }, [students]);

  // Sync dark mode class with root document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('so_chu_nhiem_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('so_chu_nhiem_theme', 'light');
    }
  }, [darkMode]);

  // Persist data when changes occur
  useEffect(() => {
    saveStudents(config.schoolYear, config.className, students);
  }, [students, config]);

  useEffect(() => {
    saveEmulationLogs(config.schoolYear, config.className, emulationLogs);
  }, [emulationLogs, config]);

  useEffect(() => {
    saveCommendations(config.schoolYear, config.className, commendations);
  }, [commendations, config]);

  useEffect(() => {
    saveParentLogs(config.schoolYear, config.className, parentLogs);
  }, [parentLogs, config]);

  useEffect(() => {
    saveTeacherLogs(config.schoolYear, config.className, teacherLogs);
  }, [teacherLogs, config]);

  useEffect(() => {
    saveTasks(config.schoolYear, config.className, tasks);
  }, [tasks, config]);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  // Handler: Update Operating Date (Ngày nghiệp vụ)
  const handleSaveOperatingDate = (newDate: string) => {
    setOperatingDate(newDate);
    saveOperatingDate(newDate);
  };

  // Handler: Update Period Configuration (Cấu hình thời gian thi đua)
  const handleSavePeriodConfig = (newCfg: PeriodConfig, historyItem: PeriodConfigHistory) => {
    setPeriodConfig(newCfg);
    savePeriodConfig(config.schoolYear, newCfg);

    const updatedHistory = [historyItem, ...periodConfigHistory];
    setPeriodConfigHistory(updatedHistory);
    savePeriodConfigHistory(config.schoolYear, updatedHistory);
  };

  // Handler: Teacher Auth Success
  const handleLoginSuccess = (profile: TeacherProfile) => {
    setTeacherProfile(profile);
    setAuthMode('TEACHER');
  };

  // Handler: Emulation Point Add/Deduct
  const handleOpenEmulationModal = (student: Student, mode: 'add' | 'deduct') => {
    if (authMode === 'GUEST') {
      alert('Chế độ Phụ Huynh (Chỉ Xem) không thể cộng/trừ điểm. Vui lòng đăng nhập tài khoản Giáo viên.');
      return;
    }
    setEmulationModalStudent(student);
    setEmulationModalMode(mode);
  };

  const handleSubmitEmulation = (
    studentId: string, 
    scoreDiff: number, 
    reasonCategory: string, 
    reasonDetail: string,
    customDate?: string
  ) => {
    if (authMode === 'GUEST') return;

    // Build timestamp using customDate or operatingDate + current time
    const activeDate = customDate || operatingDate;
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const [y, m, d] = activeDate.split('-');
    const formattedOpDate = `${d}/${m}/${y}`;
    const logTimestamp = `${formattedOpDate} ${nowTime}`;

    // 1. Update Student Score
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const newScore = s.emulationScore + scoreDiff;
        let newTag: any = 'Tốt';
        if (newScore >= 10) newTag = 'Xuất sắc';
        else if (newScore >= 5) newTag = 'Tốt';
        else if (newScore >= 0) newTag = 'Khá';
        else newTag = 'Cần nhắc nhở';

        return {
          ...s,
          emulationScore: newScore,
          statusTag: newTag,
          statusNote: `${scoreDiff > 0 ? 'Cộng' : 'Trừ'} ${Math.abs(scoreDiff)}đ: ${reasonCategory}`,
        };
      }
      return s;
    }));

    // 2. Append Log & Save to Cloud
    const newTxId = 'tx_' + Date.now();
    const newLog: EmulationLog = {
      id: newTxId,
      transactionId: newTxId,
      studentId,
      studentName: students.find(s => s.id === studentId)?.fullName || 'Học sinh',
      scoreDiff,
      reasonCategory,
      reasonDetail,
      timestamp: logTimestamp,
      teacherName: teacherProfile?.displayName || config.teacherName,
      date: activeDate,
      classId: config.className,
      schoolYearId: config.schoolYear,
      schoolId: config.schoolId || 'THCS_LQD',
      type: scoreDiff > 0 ? 'positive' : 'negative',
      points: Math.abs(scoreDiff),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEmulationLogs(prev => [newLog, ...prev]);

    // Async save to cloud
    saveTransactionToCloud(newLog, config.schoolYear, config.className, config.schoolId || 'THCS_LQD');
  };

  const handleTeamEmulationSubmit = (
    team: TeamNumber | 'ALL_TEAMS',
    scoreDiff: number,
    reasonCategory: string,
    reasonDetail: string
  ) => {
    if (authMode === 'GUEST') return;

    const targetTeams: TeamNumber[] = team === 'ALL_TEAMS' 
      ? ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'] 
      : [team as TeamNumber];

    const activeDate = operatingDate || new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const [y, m, d] = activeDate.split('-');
    const formattedOpDate = `${d}/${m}/${y}`;
    const logTimestamp = `${formattedOpDate} ${nowTime}`;

    const newLogsBatch: EmulationLog[] = [];

    setStudents(prev => prev.map(s => {
      if (targetTeams.includes(s.team)) {
        const newScore = s.emulationScore + scoreDiff;
        let newTag: any = 'Tốt';
        if (newScore >= 10) newTag = 'Xuất sắc';
        else if (newScore >= 5) newTag = 'Tốt';
        else if (newScore >= 0) newTag = 'Khá';
        else newTag = 'Cần nhắc nhở';

        const newTxId = 'tx_team_' + Date.now() + '_' + s.id;
        const logItem: EmulationLog = {
          id: newTxId,
          transactionId: newTxId,
          studentId: s.id,
          studentName: s.fullName,
          scoreDiff,
          reasonCategory,
          reasonDetail: `[Tập thể ${s.team}] ${reasonDetail}`,
          timestamp: logTimestamp,
          teacherName: teacherProfile?.displayName || config.teacherName,
          date: activeDate,
          classId: config.className,
          schoolYearId: config.schoolYear,
          schoolId: config.schoolId || 'THCS_LQD',
          type: scoreDiff > 0 ? 'positive' : 'negative',
          points: Math.abs(scoreDiff),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        newLogsBatch.push(logItem);

        return {
          ...s,
          emulationScore: newScore,
          statusTag: newTag,
          statusNote: `[${s.team}] ${scoreDiff > 0 ? 'Cộng' : 'Trừ'} ${Math.abs(scoreDiff)}đ: ${reasonCategory}`,
        };
      }
      return s;
    }));

    if (newLogsBatch.length > 0) {
      setEmulationLogs(prev => [...newLogsBatch, ...prev]);
      newLogsBatch.forEach(l => saveTransactionToCloud(l, config.schoolYear, config.className, config.schoolId || 'THCS_LQD'));
    }
  };

  // Handler: Attendance Updates per Date
  const handleUpdateAttendanceForDate = (dateStr: string, studentId: string, status: AttendanceStatus, note?: string) => {
    if (authMode === 'GUEST') return;
    setAttendanceMap(prev => {
      const nextMap = { ...prev };
      const currentDay = { ...(nextMap[dateStr] || {}) };
      const existingRecord = currentDay[studentId] || { status: 'present' };
      currentDay[studentId] = {
        status,
        note: note !== undefined ? note : (existingRecord.note || '')
      };
      nextMap[dateStr] = currentDay;
      saveAttendanceMap(config.schoolYear, config.className, nextMap);
      saveAttendanceRecordToCloud(config.schoolYear, config.className, dateStr, currentDay, config.schoolId || 'THCS_LQD');
      return nextMap;
    });

    const activeToday = operatingDate || new Date().toISOString().slice(0, 10);
    if (dateStr === activeToday) {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, attendanceToday: status } : s));
    }
  };

  const handleBatchAttendanceForDate = (dateStr: string, status: AttendanceStatus) => {
    if (authMode === 'GUEST') return;
    setAttendanceMap(prev => {
      const nextMap = { ...prev };
      const currentDay = { ...(nextMap[dateStr] || {}) };
      students.forEach(s => {
        const existingRecord = currentDay[s.id] || { status: 'present' };
        currentDay[s.id] = { status, note: existingRecord.note || '' };
      });
      nextMap[dateStr] = currentDay;
      saveAttendanceMap(config.schoolYear, config.className, nextMap);
      saveAttendanceRecordToCloud(config.schoolYear, config.className, dateStr, currentDay, config.schoolId || 'THCS_LQD');
      return nextMap;
    });

    const activeToday = operatingDate || new Date().toISOString().slice(0, 10);
    if (dateStr === activeToday) {
      setStudents(prev => prev.map(s => ({ ...s, attendanceToday: status })));
    }
  };

  const handleUpdateAttendance = (studentId: string, status: AttendanceStatus) => {
    const activeToday = operatingDate || new Date().toISOString().slice(0, 10);
    handleUpdateAttendanceForDate(activeToday, studentId, status);
  };

  const handleBatchAttendance = (status: AttendanceStatus) => {
    const activeToday = operatingDate || new Date().toISOString().slice(0, 10);
    handleBatchAttendanceForDate(activeToday, status);
  };

  // Handler: Student Needs Attention
  const handleUpdateNeedsAttention = (
    studentId: string, 
    isAttention: boolean, 
    category?: NeedsAttentionCategory, 
    note?: string
  ) => {
    if (authMode === 'GUEST') return;
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          isNeedsAttention: isAttention,
          needsAttentionCategory: category || s.needsAttentionCategory,
          needsAttentionNote: note !== undefined ? note : s.needsAttentionNote,
          needsAttentionDate: isAttention ? new Date().toLocaleDateString('vi-VN') : undefined,
        };
      }
      return s;
    }));
  };

  // Handler: Add Teacher Log
  const handleAddTeacherLog = (studentId: string, content: string) => {
    if (authMode === 'GUEST') return;
    const newLog: TeacherLog = {
      id: 'tlog_' + Date.now(),
      studentId,
      date: new Date().toLocaleDateString('vi-VN'),
      content,
      teacherName: teacherProfile?.displayName || config.teacherName,
      publicForParents: false,
    };
    setTeacherLogs(prev => [newLog, ...prev]);
  };

  const handleAddJournalLog = (logData: Omit<TeacherLog, 'id' | 'date'>) => {
    if (authMode === 'GUEST') return;
    const newLog: TeacherLog = {
      ...logData,
      id: 'journal_' + Date.now(),
      date: new Date().toLocaleDateString('vi-VN'),
    };
    setTeacherLogs(prev => [newLog, ...prev]);
  };

  const handleDeleteJournalLog = (logId: string) => {
    if (authMode === 'GUEST') return;
    setTeacherLogs(prev => prev.filter(l => l.id !== logId));
  };

  // Handler: Save Parent Log
  const handleSaveParentLog = (
    studentId: string, 
    channel: 'Điện thoại' | 'Zalo' | 'Gặp trực tiếp' | 'Khác', 
    summary: string
  ) => {
    if (authMode === 'GUEST') return;
    const newLog: ParentLog = {
      id: 'plog_' + Date.now(),
      studentId,
      date: new Date().toLocaleDateString('vi-VN'),
      channel,
      summary,
    };
    setParentLogs(prev => [newLog, ...prev]);
  };

  // Handler: Commendations
  const handleAddCommendation = (item: Commendation) => {
    if (authMode === 'GUEST') return;
    setCommendations(prev => [item, ...prev]);
  };

  // Handler: Student CRUD
  const handleAddStudent = (student: Student) => {
    if (authMode === 'GUEST') return;
    setStudents(prev => [...prev, student]);
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    if (authMode === 'GUEST') return;
    setStudents(prev => {
      const next = prev.map(s => s.id === updatedStudent.id ? updatedStudent : s);
      saveStudents(next, config.schoolYear, config.className);
      return next;
    });
    await saveStudentToCloud(updatedStudent, config.schoolYear, config.className);
    setDetailModalStudent(updatedStudent);
  };

  const handleDeleteStudent = (studentId: string) => {
    if (authMode === 'GUEST') return;
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  // Handler: Class Config Settings (Requirement 65)
  const handleSaveConfig = async (newConfig: ClassConfig): Promise<boolean> => {
    try {
      const oldSchoolYear = config.schoolYear;
      const oldClassName = config.className;

      // 1. Save config to local storage
      saveConfig(newConfig);

      // 2. Save config to Firebase Firestore (if online/active)
      await saveClassConfigToCloud(newConfig);

      // 3. Handle school year / class name scope change
      if (newConfig.schoolYear !== oldSchoolYear || newConfig.className !== oldClassName) {
        // Save current data under old scope
        saveStudents(students, oldSchoolYear, oldClassName);
        saveEmulationLogs(emulationLogs, oldSchoolYear, oldClassName);
        saveCommendations(commendations, oldSchoolYear, oldClassName);
        saveParentLogs(parentLogs, oldSchoolYear, oldClassName);
        saveTeacherLogs(teacherLogs, oldSchoolYear, oldClassName);
        saveTasks(tasks, oldSchoolYear, oldClassName);
        saveAttendanceMap(oldSchoolYear, oldClassName, attendanceMap);

        // Load or initialize data for new scope
        const newStudents = loadStudents(newConfig.schoolYear, newConfig.className);
        const newLogs = loadEmulationLogs(newConfig.schoolYear, newConfig.className);
        const newCommendations = loadCommendations(newConfig.schoolYear, newConfig.className);
        const newParentLogs = loadParentLogs(newConfig.schoolYear, newConfig.className);
        const newTeacherLogs = loadTeacherLogs(newConfig.schoolYear, newConfig.className);
        const newTasks = loadTasks(newConfig.schoolYear, newConfig.className);
        const newAttendanceMap = loadAttendanceMap(newConfig.schoolYear, newConfig.className);

        setStudents(newStudents.length > 0 ? newStudents : DEFAULT_STUDENTS);
        setEmulationLogs(newLogs.length > 0 ? newLogs : DEFAULT_EMULATION_LOGS);
        setCommendations(newCommendations.length > 0 ? newCommendations : DEFAULT_COMMENDATIONS);
        setParentLogs(newParentLogs.length > 0 ? newParentLogs : DEFAULT_PARENT_LOGS);
        setTeacherLogs(newTeacherLogs.length > 0 ? newTeacherLogs : DEFAULT_TEACHER_LOGS);
        setTasks(newTasks.length > 0 ? newTasks : DEFAULT_TASKS);
        setAttendanceMap(newAttendanceMap);
      }

      // 4. Update React config state
      setConfig(newConfig);
      return true;
    } catch (err) {
      console.error('Error saving class config:', err);
      return false;
    }
  };

  // Handler: Class Rules Config
  const handleSaveClassRulesConfig = (newRulesConfig: ClassRulesConfig) => {
    setClassRulesConfig(newRulesConfig);
    saveClassRulesConfig(config.schoolYear, config.className, newRulesConfig);
    const activeEmail = teacherProfile?.email?.trim()?.toLowerCase();
    if (activeEmail) {
      saveUserDataToFirestore(activeEmail, { classRulesConfig: newRulesConfig });
    }
  };

  const handleResetClassRulesConfig = () => {
    setClassRulesConfig(DEFAULT_CLASS_RULES_CONFIG);
    saveClassRulesConfig(config.schoolYear, config.className, DEFAULT_CLASS_RULES_CONFIG);
    const activeEmail = teacherProfile?.email?.trim()?.toLowerCase();
    if (activeEmail) {
      saveUserDataToFirestore(activeEmail, { classRulesConfig: DEFAULT_CLASS_RULES_CONFIG });
    }
  };

  // Handler: Tasks CRUD
  const handleAddTask = (task: ClassTask) => {
    if (authMode === 'GUEST') return;
    setTasks(prev => [task, ...prev]);
  };

  const handleUpdateTask = (updatedTask: ClassTask) => {
    if (authMode === 'GUEST') return;
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleUpdateTaskStatus = (taskId: string, status: 'Chưa làm' | 'Đang làm' | 'Hoàn thành') => {
    if (authMode === 'GUEST') return;
    setTasks(prev => prev.map(t => t.id === taskId ? { 
      ...t, 
      status, 
      completed: status === 'Hoàn thành' 
    } : t));
  };

  const handleToggleTask = (taskId: string) => {
    if (authMode === 'GUEST') return;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const isComp = t.completed || t.status === 'Hoàn thành';
        const nextComp = !isComp;
        return {
          ...t,
          completed: nextComp,
          status: nextComp ? 'Hoàn thành' : 'Đang làm'
        };
      }
      return t;
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    if (authMode === 'GUEST') return;
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  if (isLoadingCloudData) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-cyan-400">
            🏫
          </div>
        </div>
        <div className="text-center space-y-2 max-w-sm">
          <h2 className="text-xl font-bold tracking-tight text-cyan-300">
            ĐANG TẢI DỮ LIỆU SỔ CHỦ NHIỆM...
          </h2>
          <p className="text-xs text-slate-400">
            Đang kết nối đồng bộ dữ liệu lớp học từ máy chủ Firestore...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col">
      {/* Parent Guest Mode Banner (if GUEST) */}
      {authMode === 'GUEST' && (
        <ParentGuestBanner
          students={students}
          selectedStudentForPin={detailModalStudent}
          onOpenTeacherLogin={() => setShowAuthModal(true)}
          onUnlockStudentDetails={(st) => setDetailModalStudent(st)}
        />
      )}

      {/* Navigation Header */}
      <Navbar
        config={config}
        activeTab={currentTab}
        onSelectTab={setCurrentTab}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenConfigModal={() => setShowConfigModal(true)}
        operatingDate={operatingDate}
        authMode={authMode}
        teacherProfile={teacherProfile}
        onOpenOperatingDateModal={() => setShowOperatingDateModal(true)}
        onOpenPeriodConfigModal={() => setShowPeriodConfigModal(true)}
        onOpenQRCodeModal={() => setShowQRCodeModal(true)}
        onOpenClassRulesModal={() => setShowClassRulesModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* VIEW 1: DASHBOARD */}
        {currentTab === 'dashboard' && (
          <Dashboard
            students={students}
            tasks={tasks}
            config={config}
            authMode={authMode}
            operatingDate={operatingDate}
            periodConfig={periodConfig}
            emulationLogs={emulationLogs}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
            onSelectStudent={(student) => setDetailModalStudent(student)}
            onOpenAddPoint={(student) => handleOpenEmulationModal(student, 'add')}
            onOpenDeductPoint={(student) => handleOpenEmulationModal(student, 'deduct')}
            onSubmitTeamEmulation={handleTeamEmulationSubmit}
            onNavigateTab={setCurrentTab}
            classRulesConfig={classRulesConfig}
          />
        )}

        {/* VIEW 2: STUDENT CARDS */}
        {currentTab === 'student_cards' && (
          <StudentCard
            students={students}
            hidePointButtons={true}
            onOpenAddPoint={(student) => handleOpenEmulationModal(student, 'add')}
            onOpenDeductPoint={(student) => handleOpenEmulationModal(student, 'deduct')}
            onOpenDetail={(student) => setDetailModalStudent(student)}
            onSelectStudent={(student) => setDetailModalStudent(student)}
            onOpenQuickNote={(student) => setDetailModalStudent(student)}
            onOpenParentContact={(student) => setParentContactStudent(student)}
            onQuickAttendance={handleUpdateAttendance}
          />
        )}

        {/* VIEW 3: STUDENT TABLE (LỚP CHỦ NHIỆM) */}
        {currentTab === 'student_table' && (
          <StudentListView
            students={students}
            hidePointButtons={true}
            authMode={authMode}
            className={config.className}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onOpenDetail={(student) => setDetailModalStudent(student)}
            onSelectStudent={(student) => setDetailModalStudent(student)}
            onOpenQuickNote={(student) => setDetailModalStudent(student)}
            onOpenAddPoint={(student) => handleOpenEmulationModal(student, 'add')}
            onOpenDeductPoint={(student) => handleOpenEmulationModal(student, 'deduct')}
            onOpenParentContact={(student) => setParentContactStudent(student)}
            onUpdateAttendance={handleUpdateAttendance}
          />
        )}

        {/* VIEW 3.5: XẾP HẠNG TOÀN TRƯỜNG (ADMIN) */}
        {currentTab === 'admin_school_ranking' && (
          <AdminSchoolRankingView
            userRole={teacherProfile?.role || 'GIÁO VIÊN'}
            schoolYear={config.schoolYear}
            config={config}
            periodConfig={periodConfig}
            operatingDate={operatingDate}
          />
        )}

        {/* VIEW 4: TỔNG HỢP THI ĐUA (UNIFIED EMULATION VIEW) */}
        {(currentTab === 'emulation_summary' ||
          currentTab === 'daily_emulation' ||
          currentTab === 'weekly_emulation' ||
          currentTab === 'monthly_emulation' ||
          currentTab === 'semester_emulation' ||
          currentTab === 'team_emulation' ||
          currentTab === 'charts' ||
          currentTab === 'ranking') && (
          <UnifiedEmulationView
            students={students}
            emulationLogs={emulationLogs}
            periodConfig={periodConfig}
            operatingDate={operatingDate}
            userRole={teacherProfile?.role || 'GIÁO VIÊN'}
            currentTeacherName={teacherProfile?.displayName || config.teacherName}
            className={config.className}
            schoolYear={config.schoolYear}
            config={config}
            onSelectStudent={(student) => setDetailModalStudent(student)}
            onOpenEmulationModal={handleOpenEmulationModal}
            onOpenPeriodConfigModal={() => setShowPeriodConfigModal(true)}
          />
        )}

        {/* VIEW 5: ATTENDANCE */}
        {currentTab === 'attendance' && (
          <AttendanceManager
            students={students}
            config={config}
            authMode={authMode}
            operatingDate={operatingDate}
            attendanceMap={attendanceMap}
            onUpdateAttendanceDate={handleUpdateAttendanceForDate}
            onBatchAttendanceDate={handleBatchAttendanceForDate}
            onUpdateAttendance={handleUpdateAttendance}
            onBatchAttendance={handleBatchAttendance}
          />
        )}

        {/* VIEW 6: COMMENDATIONS */}
        {currentTab === 'commendations' && (
          <CommendationManager
            students={students}
            commendations={commendations}
            onAddCommendation={handleAddCommendation}
          />
        )}

        {/* VIEW 7: NEEDS ATTENTION */}
        {currentTab === 'needs_attention' && (
          <NeedsAttentionManager
            students={students}
            onSelectStudent={(student) => setDetailModalStudent(student)}
            onOpenParentContact={(student) => setParentContactStudent(student)}
            onUpdateNeedsAttention={handleUpdateNeedsAttention}
          />
        )}

        {/* VIEW 8: SEATING CHART */}
        {currentTab === 'seating_chart' && (
          <SeatingChartView
            students={students}
            schoolYear={config.schoolYear}
            className={config.className}
            onSelectStudent={(st) => setDetailModalStudent(st)}
          />
        )}

        {/* VIEW 9: JOURNAL (NHẬT KÝ LỚP HỌC) */}
        {currentTab === 'teacher_logs' && (
          <JournalView
            teacherLogs={teacherLogs}
            students={students}
            authMode={authMode}
            userRole={teacherProfile?.role || 'GIÁO VIÊN'}
            teacherName={teacherProfile?.displayName || config.teacherName}
            onAddJournalLog={handleAddJournalLog}
            onDeleteJournalLog={handleDeleteJournalLog}
            onSelectStudent={(st) => setDetailModalStudent(st)}
          />
        )}

        {/* VIEW 10: CLASS MANAGEMENT */}
        {currentTab === 'class_management' && (
          <ClassManagement
            students={students}
            className={config.className}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onReorderStudents={setStudents}
          />
        )}

        {/* VIEW 9: PARENT CONTACT */}
        {currentTab === 'parent_contact' && (
          <StudentListView
            students={students}
            authMode={authMode}
            className={config.className}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onOpenDetail={(student) => setDetailModalStudent(student)}
            onSelectStudent={(student) => setDetailModalStudent(student)}
            onOpenQuickNote={(student) => setDetailModalStudent(student)}
            onOpenAddPoint={(student) => handleOpenEmulationModal(student, 'add')}
            onOpenDeductPoint={(student) => handleOpenEmulationModal(student, 'deduct')}
            onOpenParentContact={(student) => setParentContactStudent(student)}
            onUpdateAttendance={handleUpdateAttendance}
          />
        )}

        {/* VIEW 10: TASKS */}
        {currentTab === 'tasks' && (
          <TaskManagerView
            tasks={tasks}
            onAddTask={handleAddTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {/* VIEW 11: REPORTS */}
        {currentTab === 'reports' && (
          <ReportPrintView
            students={students}
            emulationLogs={emulationLogs}
            config={config}
            attendanceMap={attendanceMap}
            periodConfig={periodConfig}
            classRulesConfig={classRulesConfig}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700/80 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 print:hidden mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>SỔ CHỦ NHIỆM ĐIỆN TỬ</strong> • {config.schoolName} ({config.className} - {config.schoolYear})
          </div>
          <div className="text-slate-400">
            Hệ thống quản lý lớp học & thi đua rèn luyện học sinh trực quan
          </div>
        </div>
      </footer>

      {/* MODAL 1: Add/Deduct Emulation Points */}
      {emulationModalStudent && (
        <EmulationModal
          student={emulationModalStudent}
          mode={emulationModalMode}
          operatingDate={operatingDate}
          onClose={() => setEmulationModalStudent(null)}
          onSubmit={handleSubmitEmulation}
          teacherName={teacherProfile?.displayName || config.teacherName}
          classRulesConfig={classRulesConfig}
        />
      )}

      {/* MODAL 2: Student Detail View */}
      {detailModalStudent && (
        <StudentDetailModal
          student={detailModalStudent}
          onClose={() => setDetailModalStudent(null)}
          emulationLogs={emulationLogs}
          commendations={commendations}
          parentLogs={parentLogs}
          teacherLogs={teacherLogs}
          authMode={authMode}
          userRole={teacherProfile?.role || 'GIÁO VIÊN'}
          config={config}
          onAddTeacherLog={handleAddTeacherLog}
          onUpdateNeedsAttention={handleUpdateNeedsAttention}
          onOpenParentContact={(st) => {
            setDetailModalStudent(null);
            setParentContactStudent(st);
          }}
          onOpenAddPoint={(st) => {
            setDetailModalStudent(null);
            handleOpenEmulationModal(st, 'add');
          }}
          onOpenDeductPoint={(st) => {
            setDetailModalStudent(null);
            handleOpenEmulationModal(st, 'deduct');
          }}
          onUpdateStudent={handleUpdateStudent}
          onUpdateAttendance={handleUpdateAttendance}
        />
      )}

      {/* MODAL 3: Parent Contact */}
      {parentContactStudent && (
        <ParentContactModal
          student={parentContactStudent}
          onClose={() => setParentContactStudent(null)}
          onSaveParentLog={handleSaveParentLog}
          className={config.className}
        />
      )}

      {/* MODAL 4: Class Configuration Settings */}
      {showConfigModal && (
        <ClassConfigModal
          config={config}
          onClose={() => setShowConfigModal(false)}
          onSaveConfig={handleSaveConfig}
        />
      )}

      {/* MODAL 5: Operating Date Configuration (📅 Ngày nghiệp vụ) */}
      {showOperatingDateModal && (
        <OperatingDateModal
          currentOperatingDate={operatingDate}
          onClose={() => setShowOperatingDateModal(false)}
          onSaveOperatingDate={handleSaveOperatingDate}
        />
      )}

      {/* MODAL 6: Period Date Range Configuration (⚙️ Kỳ thi đua) */}
      {showPeriodConfigModal && (
        <PeriodConfigModal
          periodConfig={periodConfig}
          history={periodConfigHistory}
          schoolYear={config.schoolYear}
          userRole={teacherProfile?.role || 'GIÁO VIÊN'}
          currentTeacherName={teacherProfile?.displayName || config.teacherName}
          operatingDate={operatingDate}
          onClose={() => setShowPeriodConfigModal(false)}
          onSaveConfig={handleSavePeriodConfig}
        />
      )}

      {/* MODAL 7: Teacher Auth Login (🔵 Google Auth & RBAC) */}
      {showAuthModal && (
        <AuthModal
          currentTeacher={teacherProfile}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
          onGuestLogin={handleLogout}
        />
      )}

      {/* MODAL 8: Website QR Code (📱 Mã QR Phụ huynh) */}
      {showQRCodeModal && (
        <QRCodeModal
          config={config}
          students={students}
          adminEmail={teacherProfile?.email || 'quynhan9942@gmail.com'}
          adminId={teacherProfile?.email || teacherProfile?.uid || 'quynhan9942@gmail.com'}
          onClose={() => setShowQRCodeModal(false)}
        />
      )}

      {/* MODAL 9: Class Rules & Regulations (📜 Bảng Nội Quy Lớp) */}
      <ClassRulesModal
        isOpen={showClassRulesModal}
        onClose={() => setShowClassRulesModal(false)}
        className={config.className}
        schoolYear={config.schoolYear}
        authMode={authMode}
        config={classRulesConfig}
        onSaveConfig={handleSaveClassRulesConfig}
        onResetDefault={handleResetClassRulesConfig}
      />
    </div>
  );
}

