import React, { useState } from 'react';
import { Calendar, Check, Clock, X, RotateCcw } from 'lucide-react';

interface OperatingDateModalProps {
  currentOperatingDate: string; // YYYY-MM-DD
  onClose: () => void;
  onSaveOperatingDate: (newDate: string) => void;
}

export const OperatingDateModal: React.FC<OperatingDateModalProps> = ({
  currentOperatingDate,
  onClose,
  onSaveOperatingDate,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(currentOperatingDate);

  const handleSelectToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    onSaveOperatingDate(selectedDate);
    onClose();
  };

  const formatDisplay = (ymd: string) => {
    if (!ymd) return '';
    const [y, m, d] = ymd.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Calendar className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold">⚙️ Cấu Hình Ngày Nghiệp Vụ</h2>
              <p className="text-xs text-emerald-100/90">Thiết lập ngày tính điểm & nhật ký học sinh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
            <div className="font-semibold text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>📅 Ngày nghiệp vụ đang chọn: <strong className="underline decoration-emerald-500">{formatDisplay(currentOperatingDate)}</strong></span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Mọi thao tác Cộng/Trừ điểm, Điểm danh, Ghi chú, Nhật ký & Khen thưởng sẽ được ghi nhận vào ngày nghiệp vụ được chọn này thay vì lấy giờ thiết bị.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Chọn Ngày Nghiệp Vụ Mới
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm dark:text-white font-medium"
                required
              />
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">Xem trước: <strong className="text-emerald-600 dark:text-emerald-400">{formatDisplay(selectedDate)}</strong></span>
              <button
                type="button"
                onClick={handleSelectToday}
                className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt về Ngày Hôm Nay</span>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-500">Gợi ý chọn nhanh:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="py-1.5 px-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-200 font-medium transition-colors"
              >
                Hôm qua
              </button>
              <button
                type="button"
                onClick={handleSelectToday}
                className="py-1.5 px-2 bg-emerald-100 dark:bg-emerald-900/60 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 font-medium transition-colors"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="py-1.5 px-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-200 font-medium transition-colors"
              >
                Ngày mai
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-md transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Áp Dụng Ngày Nghiệp Vụ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
