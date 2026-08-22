import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Trash2,
  ListTodo
} from 'lucide-react';
import { ClassTask } from '../types';

interface TaskManagerViewProps {
  tasks: ClassTask[];
  onAddTask: (task: ClassTask) => void;
  onUpdateTaskStatus: (taskId: string, status: 'Chưa làm' | 'Đang làm' | 'Hoàn thành') => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskManagerView: React.FC<TaskManagerViewProps> = ({
  tasks,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [assignee, setAssignee] = useState<string>('Ban cán sự lớp');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      id: 'task_' + Date.now(),
      title: title.trim(),
      dueDate,
      assignee,
      status: 'Chưa làm',
    });

    setTitle('');
    setShowAddModal(false);
  };

  const pendingTasks = tasks.filter(t => t.status !== 'Hoàn thành');
  const completedTasks = tasks.filter(t => t.status === 'Hoàn thành');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-sky-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold mb-2">
            📌 Lịch Trình & Phân Công Nhiệm Vụ Lớp
          </span>
          <h2 className="text-2xl font-black">
            Nhiệm Vụ & Kế Hoạch Lớp Chủ Nhiệm
          </h2>
          <p className="text-sky-100 text-xs mt-1">
            Theo dõi tiến độ vệ sinh, trực nhật, phong trào thi đua và nhiệm vụ phân công cho Ban cán sự, các tổ
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-white text-blue-900 font-bold text-xs rounded-2xl shadow-md flex items-center gap-2 shrink-0 hover:bg-sky-50 transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm Nhiệm Vụ Mới
        </button>
      </div>

      {/* Task Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Nhiệm Vụ Cần Thực Hiện ({pendingTasks.length})
            </h3>
          </div>

          <div className="space-y-3">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Không có nhiệm vụ nào đang chờ thực hiện.
              </div>
            ) : (
              pendingTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">
                      {t.title}
                    </h4>
                    <button
                      onClick={() => onDeleteTask(t.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2 pt-1">
                    <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-md">
                      👤 {t.assignee}
                    </span>
                    <span className="font-mono">🗓️ Hạn: {t.dueDate}</span>
                  </div>

                  <div className="pt-2 flex gap-1.5">
                    <button
                      onClick={() => onUpdateTaskStatus(t.id, 'Đang làm')}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold ${
                        t.status === 'Đang làm'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Đang làm
                    </button>
                    <button
                      onClick={() => onUpdateTaskStatus(t.id, 'Hoàn thành')}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Hoàn thành
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Nhiệm Vụ Đã Hoàn Thành ({completedTasks.length})
            </h3>
          </div>

          <div className="space-y-3">
            {completedTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Chưa có nhiệm vụ nào được đánh dấu hoàn thành.
              </div>
            ) : (
              completedTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-2 opacity-90"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 line-through">
                      {t.title}
                    </h4>
                    <button
                      onClick={() => onDeleteTask(t.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                    <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                      👤 {t.assignee}
                    </span>
                    <span className="font-mono text-emerald-600">✓ Hoàn thành</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
              Thêm Nhiệm Vụ / Kế Hoạch Mới
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nội dung công việc *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Nộp sổ trực nhật tuần 5, Vệ sinh khu vực sân..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Người / Bộ phận phụ trách
                  </label>
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    <option value="Ban cán sự lớp">Ban cán sự lớp</option>
                    <option value="Tổ 1">Tổ 1</option>
                    <option value="Tổ 2">Tổ 2</option>
                    <option value="Tổ 3">Tổ 3</option>
                    <option value="Tổ 4">Tổ 4</option>
                    <option value="Cả lớp">Cả lớp</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Hạn hoàn thành
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  Lưu Nhiệm Vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
