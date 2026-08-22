import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Grid,
  Plus,
  Trash2,
  Save,
  Copy,
  Edit2,
  Check,
  RotateCcw,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Trophy,
  HeartHandshake,
  FileText,
  Eye,
  PhoneCall,
  PlusCircle,
  MinusCircle,
  ArrowRightLeft,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import { Student, SeatingChart, DeskItem, TeamNumber, AttendanceStatus } from '../types';
import { loadSeatingCharts, saveSeatingCharts } from '../utils/storage';

interface SeatingChartViewProps {
  students: Student[];
  schoolYear: string;
  className: string;
  onSelectStudent: (student: Student) => void;
  onOpenEmulationModal: (student: Student, mode: 'add' | 'deduct') => void;
  onUpdateAttendance: (studentId: string, status: AttendanceStatus) => void;
  onOpenParentContact: (student: Student) => void;
  onOpenJournalForStudent?: (student: Student) => void;
}

export const SeatingChartView: React.FC<SeatingChartViewProps> = ({
  students = [],
  schoolYear = '2026-2027',
  className = '6a3',
  onSelectStudent,
  onOpenEmulationModal,
  onUpdateAttendance,
  onOpenParentContact,
  onOpenJournalForStudent,
}) => {
  // Storage state for seating charts
  const [charts, setCharts] = useState<SeatingChart[]>([]);
  const [activeChartId, setActiveChartId] = useState<string>('');

  // Selected team filter inside seating chart
  const [teamFilter, setTeamFilter] = useState<string>('ALL');

  // Edit / Customization state for current chart
  const [rows, setRows] = useState<number>(4);
  const [cols, setCols] = useState<number>(3);
  const [seatsPerDesk, setSeatsPerDesk] = useState<number>(2);

  // Desks array mapping
  const [desks, setDesks] = useState<DeskItem[]>([]);

  // Selection state for swapping seats
  const [selectedSeat, setSelectedSeat] = useState<{ deskId: string; seatIdx: number } | null>(null);

  // Quick Profile Modal Student
  const [quickStudent, setQuickStudent] = useState<Student | null>(null);

  // Chart management UI states
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [chartNameInput, setChartNameInput] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // 1. Initial load from storage
  useEffect(() => {
    const loadedCharts = loadSeatingCharts(schoolYear, className);
    if (loadedCharts.length > 0) {
      setCharts(loadedCharts);
      const defaultChart = loadedCharts.find((c) => c.isDefault) || loadedCharts[0];
      setActiveChartId(defaultChart.id);
      applyChart(defaultChart);
    } else {
      // Auto generate default initial seating chart
      const initialChart = createDefaultChart('Sơ đồ đầu năm', true);
      setCharts([initialChart]);
      setActiveChartId(initialChart.id);
      applyChart(initialChart);
      saveSeatingCharts(schoolYear, className, [initialChart]);
    }
  }, [schoolYear, className, students]);

  const createDefaultChart = (name: string, isDefault = false): SeatingChart => {
    const initialRows = 4;
    const initialCols = 3;
    const initialSeatsPerDesk = 2;
    const generatedDesks: DeskItem[] = [];

    let studentIndex = 0;
    for (let r = 0; r < initialRows; r++) {
      for (let c = 0; c < initialCols; c++) {
        const deskId = `desk_${r}_${c}`;
        const seats: (string | null)[] = [];
        for (let s = 0; s < initialSeatsPerDesk; s++) {
          if (studentIndex < students.length) {
            seats.push(students[studentIndex].id);
            studentIndex++;
          } else {
            seats.push(null);
          }
        }
        generatedDesks.push({ id: deskId, row: r, col: c, seats });
      }
    }

    return {
      id: `chart_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      schoolYear,
      className,
      isDefault,
      rows: initialRows,
      cols: initialCols,
      seatsPerDesk: initialSeatsPerDesk,
      desks: generatedDesks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const applyChart = (chart: SeatingChart) => {
    setRows(chart.rows || 4);
    setCols(chart.cols || 3);
    setSeatsPerDesk(chart.seatsPerDesk || 2);
    setDesks(chart.desks || []);
    setChartNameInput(chart.name);
  };

  const currentChart = useMemo(() => {
    return charts.find((c) => c.id === activeChartId) || charts[0];
  }, [charts, activeChartId]);

  // Student Map for fast lookup
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((st) => map.set(st.id, st));
    return map;
  }, [students]);

  // Unassigned Students list
  const assignedStudentIds = useMemo(() => {
    const set = new Set<string>();
    desks.forEach((d) => {
      d.seats.forEach((sid) => {
        if (sid) set.add(sid);
      });
    });
    return set;
  }, [desks]);

  const unassignedStudents = useMemo(() => {
    return students.filter((st) => !assignedStudentIds.has(st.id));
  }, [students, assignedStudentIds]);

  // Handle seat click (for swapping or assigning)
  const handleSeatClick = (deskId: string, seatIdx: number) => {
    if (!selectedSeat) {
      // First selection
      setSelectedSeat({ deskId, seatIdx });
    } else {
      // Second selection -> SWAP SEATS!
      if (selectedSeat.deskId === deskId && selectedSeat.seatIdx === seatIdx) {
        setSelectedSeat(null); // unselect
        return;
      }

      setDesks((prevDesks) => {
        const nextDesks = prevDesks.map((d) => ({ ...d, seats: [...d.seats] }));
        const d1 = nextDesks.find((d) => d.id === selectedSeat.deskId);
        const d2 = nextDesks.find((d) => d.id === deskId);

        if (d1 && d2) {
          const temp = d1.seats[selectedSeat.seatIdx];
          d1.seats[selectedSeat.seatIdx] = d2.seats[seatIdx];
          d2.seats[seatIdx] = temp;
        }
        return nextDesks;
      });

      setSelectedSeat(null);
    }
  };

  // Assign unassigned student to selected empty seat or vice versa
  const handleAssignUnassignedStudent = (studentId: string) => {
    if (!selectedSeat) return;
    setDesks((prevDesks) => {
      const nextDesks = prevDesks.map((d) => ({ ...d, seats: [...d.seats] }));
      const d1 = nextDesks.find((d) => d.id === selectedSeat.deskId);
      if (d1) {
        d1.seats[selectedSeat.seatIdx] = studentId;
      }
      return nextDesks;
    });
    setSelectedSeat(null);
  };

  // Clear a seat
  const handleClearSeat = (deskId: string, seatIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDesks((prevDesks) => {
      const nextDesks = prevDesks.map((d) => ({ ...d, seats: [...d.seats] }));
      const d1 = nextDesks.find((d) => d.id === deskId);
      if (d1) d1.seats[seatIdx] = null;
      return nextDesks;
    });
  };

  // Re-generate desk layout based on current rows/cols/seatsPerDesk
  const handleUpdateDimensions = (newRows: number, newCols: number, newSeatsPerDesk: number) => {
    setRows(newRows);
    setCols(newCols);
    setSeatsPerDesk(newSeatsPerDesk);

    setDesks((prevDesks) => {
      const nextDesks: DeskItem[] = [];
      for (let r = 0; r < newRows; r++) {
        for (let c = 0; c < newCols; c++) {
          const deskId = `desk_${r}_${c}`;
          const existing = prevDesks.find((d) => d.row === r && d.col === c);
          const seats: (string | null)[] = [];
          for (let s = 0; s < newSeatsPerDesk; s++) {
            seats.push(existing && existing.seats[s] ? existing.seats[s] : null);
          }
          nextDesks.push({ id: deskId, row: r, col: c, seats });
        }
      }
      return nextDesks;
    });
  };

  // Save current chart
  const handleSaveChart = () => {
    if (!currentChart) return;
    const updatedChart: SeatingChart = {
      ...currentChart,
      name: chartNameInput || currentChart.name,
      rows,
      cols,
      seatsPerDesk,
      desks,
      updatedAt: new Date().toISOString(),
    };

    const nextCharts = charts.map((c) => (c.id === updatedChart.id ? updatedChart : c));
    setCharts(nextCharts);
    saveSeatingCharts(schoolYear, className, nextCharts);

    setSaveSuccessMsg('💾 Đã lưu sơ đồ lớp học thành công!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Create New Chart
  const handleCreateNewChart = () => {
    const count = charts.length + 1;
    const newChart = createDefaultChart(`Sơ đồ sơ đồ ${count}`, false);
    const nextCharts = [...charts, newChart];
    setCharts(nextCharts);
    setActiveChartId(newChart.id);
    applyChart(newChart);
    saveSeatingCharts(schoolYear, className, nextCharts);
  };

  // Copy Chart
  const handleCopyChart = () => {
    if (!currentChart) return;
    const newChart: SeatingChart = {
      ...currentChart,
      id: `chart_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: `${currentChart.name} (Bản sao)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const nextCharts = [...charts, newChart];
    setCharts(nextCharts);
    setActiveChartId(newChart.id);
    applyChart(newChart);
    saveSeatingCharts(schoolYear, className, nextCharts);
  };

  // Delete Chart
  const handleDeleteChart = () => {
    if (charts.length <= 1) {
      alert('Không thể xóa sơ đồ duy nhất còn lại.');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa sơ đồ "${currentChart?.name}"?`)) {
      const nextCharts = charts.filter((c) => c.id !== activeChartId);
      setCharts(nextCharts);
      const nextActive = nextCharts[0];
      setActiveChartId(nextActive.id);
      applyChart(nextActive);
      saveSeatingCharts(schoolYear, className, nextCharts);
    }
  };

  // Set Default Chart
  const handleSetDefaultChart = () => {
    const nextCharts = charts.map((c) => ({
      ...c,
      isDefault: c.id === activeChartId,
    }));
    setCharts(nextCharts);
    saveSeatingCharts(schoolYear, className, nextCharts);
    setSaveSuccessMsg('⭐ Đã đặt làm sơ đồ lớp mặc định!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 backdrop-blur rounded-full text-xs font-bold mb-2 text-blue-200 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Sơ Đồ Lớp Học Trực Quan
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            🏫 SƠ ĐỒ LỚP HỌC LỚP {className}
          </h2>
          <p className="text-blue-100 text-xs md:text-sm mt-1">
            Mô phỏng vị trí ngồi thực tế, đổi chỗ kéo thả/chọn chỗ, xem điểm thi đua & chuyên cần theo từng bàn học
          </p>
        </div>

        {/* Multi Chart Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="relative">
            <select
              value={activeChartId}
              onChange={(e) => {
                setActiveChartId(e.target.value);
                const chart = charts.find((c) => c.id === e.target.value);
                if (chart) applyChart(chart);
              }}
              className="bg-white/10 text-white font-bold text-xs py-2 px-4 rounded-xl border border-white/20 backdrop-blur focus:outline-none"
            >
              {charts.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.isDefault ? '⭐ ' : ''}{c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveChart}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            <span>💾 LƯU SƠ ĐỒ</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* TOOLBAR CONTROLS: Team filter, Grid config, Chart Operations */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* 1. Team Filter Bar */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Lọc Quan Sát Theo Tổ:
            </label>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex-wrap">
              {['ALL', 'Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTeamFilter(t)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    teamFilter === t
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {t === 'ALL' ? '👥 Toàn Lớp' : t}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Grid Dimensions Adjuster */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <span>Hàng:</span>
              <input
                type="number"
                min={1}
                max={10}
                value={rows}
                onChange={(e) => handleUpdateDimensions(Number(e.target.value), cols, seatsPerDesk)}
                className="w-12 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-center"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <span>Cột (Dãy):</span>
              <input
                type="number"
                min={1}
                max={6}
                value={cols}
                onChange={(e) => handleUpdateDimensions(rows, Number(e.target.value), seatsPerDesk)}
                className="w-12 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-center"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <span>HS/Bàn:</span>
              <input
                type="number"
                min={1}
                max={4}
                value={seatsPerDesk}
                onChange={(e) => handleUpdateDimensions(rows, cols, Number(e.target.value))}
                className="w-12 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-center"
              />
            </div>
          </div>

          {/* 3. Chart Actions: New / Copy / Rename / Delete / Set Default */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleCreateNewChart}
              className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
              title="Tạo sơ đồ mới"
            >
              <Plus className="w-3.5 h-3.5" /> Mới
            </button>
            <button
              onClick={handleCopyChart}
              className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
              title="Sao chép sơ đồ này"
            >
              <Copy className="w-3.5 h-3.5" /> Bản sao
            </button>
            <button
              onClick={handleSetDefaultChart}
              className="p-2 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-800 dark:text-amber-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
              title="Đặt làm sơ đồ mặc định"
            >
              <Trophy className="w-3.5 h-3.5" /> Mặc định
            </button>
            <button
              onClick={handleDeleteChart}
              className="p-2 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 text-rose-800 dark:text-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
              title="Xóa sơ đồ này"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa
            </button>
          </div>
        </div>

        {/* Selected Seat Banner Info */}
        {selectedSeat && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Đang chọn vị trí <strong>{selectedSeat.deskId} (Ghế {selectedSeat.seatIdx + 1})</strong>. Nhấp vị trí khác để <strong>Đổi chỗ</strong> hoặc chọn học sinh chưa có vị trí bên dưới.
              </span>
            </div>
            <button
              onClick={() => setSelectedSeat(null)}
              className="px-2.5 py-1 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-bold rounded-lg text-xs"
            >
              Hủy chọn
            </button>
          </div>
        )}
      </div>

      {/* THE CLASSROOM STAGE (VISUAL DESK GRID) */}
      <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-3xl border border-slate-300 dark:border-slate-800 space-y-8 shadow-inner overflow-x-auto">
        {/* 1. BLACKBOARD / DISPLAY AT TOP */}
        <div className="w-full max-w-2xl mx-auto py-3 bg-slate-800 text-slate-200 rounded-2xl text-center font-black tracking-widest text-xs uppercase border-4 border-amber-700/60 shadow-md relative">
          <div className="absolute left-4 top-2 text-[10px] text-slate-400">🚪 CỬA RA VÀO</div>
          <span>░░░ BẢNG ĐEN / MÀN HÌNH CHẾU ░░░</span>
          <div className="absolute right-4 top-2 text-[10px] text-slate-400">🪟 CỬA SỔ</div>
        </div>

        {/* 2. DESKS GRID */}
        <div
          className="grid gap-6 justify-center"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(220px, 1fr))`,
          }}
        >
          {desks.map((desk) => (
            <div
              key={desk.id}
              className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-md space-y-2 relative"
            >
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-1">
                <span>Bàn (H{desk.row + 1}, C{desk.col + 1})</span>
                <span className="text-slate-300">Nội thất</span>
              </div>

              {/* SEATS IN THIS DESK */}
              <div className={`grid gap-2 ${seatsPerDesk === 1 ? 'grid-cols-1' : seatsPerDesk === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {desk.seats.map((studentId, sIdx) => {
                  const student = studentId ? studentMap.get(studentId) : null;
                  const isSelected = selectedSeat?.deskId === desk.id && selectedSeat?.seatIdx === sIdx;
                  const isTeamFilteredOut = teamFilter !== 'ALL' && student && student.team !== teamFilter;

                  return (
                    <div
                      key={sIdx}
                      onClick={() => handleSeatClick(desk.id, sIdx)}
                      className={`relative rounded-xl p-2.5 border transition-all cursor-pointer flex flex-col justify-between min-h-[90px] ${
                        isSelected
                          ? 'border-amber-500 ring-4 ring-amber-400/30 bg-amber-50 dark:bg-amber-950/40'
                          : student
                          ? isTeamFilteredOut
                            ? 'opacity-30 bg-slate-50 dark:bg-slate-800/50 border-slate-200'
                            : 'bg-slate-50 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:shadow-md'
                          : 'bg-slate-100 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {student ? (
                        <>
                          <div className="flex items-start justify-between gap-1">
                            <img
                              src={student.avatar}
                              alt={student.fullName}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-300"
                            />
                            <button
                              onClick={(e) => handleClearSeat(desk.id, sIdx, e)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                              title="Bỏ học sinh khỏi chỗ này"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="mt-1">
                            <div className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate line-clamp-1">
                              {student.fullName}
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[10px]">
                              <span className="font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {student.team}
                              </span>
                              <span
                                className={`font-black ${
                                  student.emulationScore >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {student.emulationScore >= 0 ? `+${student.emulationScore}` : student.emulationScore}
                              </span>
                            </div>
                          </div>

                          {/* Quick Action Overlay Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickStudent(student);
                            }}
                            className="mt-1.5 w-full py-0.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 rounded text-[10px] font-bold text-center"
                          >
                            Chi tiết
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 py-3">
                          <PlusCircle className="w-5 h-5 mb-1" />
                          <span className="text-[10px] font-bold">Chỗ Trống</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 3. TEACHER DESK AT BOTTOM */}
        <div className="w-full max-w-sm mx-auto py-3 bg-amber-900 text-amber-100 rounded-2xl text-center font-bold text-xs border-2 border-amber-800 shadow-md">
          💼 BÀN GIÁO VIÊN CHỦ NHIỆM
        </div>
      </div>

      {/* UNASSIGNED STUDENTS TRAY */}
      {unassignedStudents.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-500" />
              <span>Học Sinh Chưa Xếp Vị Trí ({unassignedStudents.length})</span>
            </h3>
            <span className="text-xs text-slate-500">
              {selectedSeat ? '👉 Chọn một học sinh bên dưới để xếp vào ghế đang chọn' : '👉 Chọn vị trí ghế trống trước, sau đó chọn học sinh'}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {unassignedStudents.map((st) => (
              <button
                key={st.id}
                onClick={() => handleAssignUnassignedStudent(st.id)}
                className={`p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 transition-all shrink-0 flex items-center gap-2 text-left ${
                  selectedSeat ? 'ring-2 ring-blue-400' : ''
                }`}
              >
                <img src={st.avatar} alt={st.fullName} className="w-7 h-7 rounded-full object-cover" />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{st.fullName}</div>
                  <div className="text-[10px] text-slate-400">{st.team}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QUICK PROFILE MODAL ON STUDENT CLICK */}
      {quickStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={quickStudent.avatar}
                  alt={quickStudent.fullName}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-500"
                />
                <div>
                  <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">
                    {quickStudent.fullName}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {quickStudent.studentCode} • {quickStudent.team}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setQuickStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-500">Điểm Thi Đua:</span>
                <div
                  className={`text-lg font-black ${
                    quickStudent.emulationScore >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {quickStudent.emulationScore >= 0 ? `+${quickStudent.emulationScore}` : quickStudent.emulationScore} đ
                </div>
              </div>
              <div>
                <span className="text-slate-500">Chuyên Cần Hôm Nay:</span>
                <div className="font-bold text-slate-800 dark:text-slate-100 capitalize mt-0.5">
                  {quickStudent.attendanceToday === 'present' ? '✅ Có mặt' : quickStudent.attendanceToday === 'late' ? '⏰ Đi muộn' : '❌ Vắng'}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => {
                  onOpenEmulationModal(quickStudent, 'add');
                  setQuickStudent(null);
                }}
                className="py-2 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> + Cộng Điểm
              </button>
              <button
                onClick={() => {
                  onOpenEmulationModal(quickStudent, 'deduct');
                  setQuickStudent(null);
                }}
                className="py-2 px-3 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <MinusCircle className="w-4 h-4" /> - Trừ Điểm
              </button>
              <button
                onClick={() => {
                  onOpenParentContact(quickStudent);
                  setQuickStudent(null);
                }}
                className="py-2 px-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <PhoneCall className="w-4 h-4" /> Liên Lạc PH
              </button>
              <button
                onClick={() => {
                  onSelectStudent(quickStudent);
                  setQuickStudent(null);
                }}
                className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Eye className="w-4 h-4" /> Hồ Sơ Đầy Đủ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
