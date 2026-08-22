import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { BarChart3, TrendingUp, Users, Trophy } from 'lucide-react';
import { Student, EmulationLog } from '../types';
import { getWeekDateRange, computeStudentStatsForPeriod, computeTeamStatsForPeriod, parseLogDate } from '../utils/emulationUtils';

interface EmulationChartsViewProps {
  students?: Student[];
  emulationLogs?: EmulationLog[];
}

export const EmulationChartsView: React.FC<EmulationChartsViewProps> = ({
  students = [],
  emulationLogs = [],
}) => {
  const [activeScope, setActiveScope] = useState<'week' | 'month' | 'semester'>('week');

  const studentList = Array.isArray(students) ? students : [];
  const logList = Array.isArray(emulationLogs) ? emulationLogs : [];

  // 1. Chart Data: Weekly Emulation Points Trend (Weeks 1 to 8)
  const weeklyTrendData = Array.from({ length: 8 }, (_, i) => {
    const wNum = i + 1;
    const { startDate, endDate } = getWeekDateRange(wNum);
    
    let added = 0;
    let deducted = 0;

    logList.forEach(log => {
      const d = parseLogDate(log.timestamp);
      if (d >= startDate && d <= endDate) {
        if (log.scoreDiff > 0) added += log.scoreDiff;
        if (log.scoreDiff < 0) deducted += Math.abs(log.scoreDiff);
      }
    });

    return {
      name: `Tuần ${wNum}`,
      'Điểm cộng': added,
      'Điểm trừ': deducted,
      'Điểm ròng': added - deducted,
    };
  });

  // 2. Chart Data: Monthly Positive vs Negative Points (Months 8 to 12)
  const monthlyComparisonData = [8, 9, 10, 11, 12].map(m => {
    let added = 0;
    let deducted = 0;

    logList.forEach(log => {
      const d = parseLogDate(log.timestamp);
      if (d.getMonth() + 1 === m) {
        if (log.scoreDiff > 0) added += log.scoreDiff;
        if (log.scoreDiff < 0) deducted += Math.abs(log.scoreDiff);
      }
    });

    return {
      name: `Tháng ${m}`,
      'Điểm cộng (+)': added,
      'Điểm trừ (-)': deducted,
    };
  });

  // 3. Chart Data: Top 10 Student Rankings
  const topStudentStats = computeStudentStatsForPeriod(
    studentList,
    logList,
    () => true
  ).slice(0, 10);

  const studentRankingChartData = topStudentStats.map(s => ({
    name: s.student.fullName.split(' ').pop() || s.student.fullName,
    'Điểm Thi Đua': s.endingScore,
  }));

  // 4. Chart Data: Team Average Scores
  const teamStats = computeTeamStatsForPeriod(
    studentList,
    logList,
    () => true
  );

  const teamChartData = teamStats.map(t => ({
    name: t.team,
    'Điểm TB/HS': t.averageScore,
    'Tổng điểm ròng': t.netPoints,
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs font-bold mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-sky-400" /> Dashboard Phân Tích Dữ Liệu
          </span>
          <h2 className="text-2xl font-black tracking-tight">
            📊 BIỂU ĐỒ TỔNG HỢP THI ĐUA RÈN LUYỆN
          </h2>
          <p className="text-slate-300 text-xs mt-1">
            Trực quan hóa diễn biến thi đua, so sánh điểm cộng/trừ và xếp hạng phong trào cá nhân - tập thể.
          </p>
        </div>

        {/* Scope Toggle */}
        <div className="flex items-center bg-black/40 p-1.5 rounded-2xl border border-slate-700">
          <button
            onClick={() => setActiveScope('week')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeScope === 'week' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Theo Tuần
          </button>
          <button
            onClick={() => setActiveScope('month')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeScope === 'month' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Theo Tháng
          </button>
          <button
            onClick={() => setActiveScope('semester')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeScope === 'semester' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Học Kỳ
          </button>
        </div>
      </div>

      {/* Grid of 4 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Điểm thi đua theo tuần */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Biểu Đồ 1: Diễn Biến Điểm Thi Đua Theo Tuần
          </h3>
          <p className="text-[11px] text-slate-400">Xu hướng điểm phát sinh ròng của cả lớp qua các tuần học.</p>
          
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="Điểm ròng" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Điểm cộng và điểm trừ theo tháng */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            Biểu Đồ 2: Tương Quan Điểm Cộng (-) & Trừ (+) Theo Tháng
          </h3>
          <p className="text-[11px] text-slate-400">So sánh số lượt thưởng/phạt tổng hợp qua từng tháng.</p>
          
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Điểm cộng (+)" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Điểm trừ (-)" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Top 10 Xếp hạng học sinh */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Biểu Đồ 3: Top 10 Học Sinh Dẫn Đầu Thi Đua
          </h3>
          <p className="text-[11px] text-slate-400">Học sinh có điểm thi đua rèn luyện cao nhất lớp.</p>
          
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentRankingChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" stroke="#888888" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#888888" fontSize={11} width={70} />
                <Tooltip />
                <Bar dataKey="Điểm Thi Đua" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Xếp hạng các tổ */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            Biểu Đồ 4: So Sánh Điểm Trung Bình Giữa Các Tổ
          </h3>
          <p className="text-[11px] text-slate-400">Điểm trung bình thi đua per học sinh của 4 tổ.</p>
          
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Điểm TB/HS" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
