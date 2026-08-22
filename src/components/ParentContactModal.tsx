import React, { useState } from 'react';
import { 
  X, 
  PhoneCall, 
  Copy, 
  Check, 
  MessageCircle, 
  Save, 
  Phone, 
  User, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Student } from '../types';

interface ParentContactModalProps {
  student: Student | null;
  onClose: () => void;
  onSaveParentLog: (studentId: string, channel: 'Điện thoại' | 'Zalo' | 'Gặp trực tiếp' | 'Khác', summary: string) => void;
  className: string;
}

export const ParentContactModal: React.FC<ParentContactModalProps> = ({
  student,
  onClose,
  onSaveParentLog,
  className,
}) => {
  if (!student) return null;

  const [channel, setChannel] = useState<'Điện thoại' | 'Zalo' | 'Gặp trực tiếp' | 'Khác'>('Zalo');
  const [copied, setCopied] = useState(false);
  const [templateType, setTemplateType] = useState<'weekly' | 'attendance' | 'praise' | 'custom'>('weekly');
  
  // Custom message state
  const [messageContent, setMessageContent] = useState('');

  // Auto template generators
  const generateTemplate = (type: string) => {
    switch (type) {
      case 'weekly':
        return `Kính gửi Phụ huynh em ${student.fullName} (Lớp ${className}),
GVCN xin thông báo tình hình rèn luyện tuần này của em:
- Điểm thi đua hiện tại: ${student.emulationScore} điểm (${student.statusTag})
- Chuyên cần: ${student.attendanceToday === 'present' ? 'Đi học đầy đủ' : 'Cần lưu ý điểm danh'}
- Ghi chú GVCN: ${student.statusNote || 'Con ngoan, tích cực tham gia các hoạt động lớp.'}
Trân trọng cảm ơn sự phối hợp của Gia đình!`;

      case 'attendance':
        return `Kính gửi Phụ huynh em ${student.fullName} (Lớp ${className}),
GVCN xin thông báo hôm nay (${new Date().toLocaleDateString('vi-VN')}) em ${student.fullName} đi học ${
          student.attendanceToday === 'late' ? 'muộn' : student.attendanceToday === 'excused' ? 'vắng có phép' : 'vắng chưa rõ lý do'
        }.
Nhờ Phụ huynh phản hồi lại thông tin cho GVCN. Xin cảm ơn Gia đình!`;

      case 'praise':
        return `Kính gửi Phụ huynh em ${student.fullName} (Lớp ${className}),
GVCN xin gửi lời tuyên dương em ${student.fullName} đã có thành tích thi đua rất tích cực tuần này (+${student.emulationScore} điểm). Con rất chăm ngoan và gương mẫu.
Rất mong Gia đình động viên con tiếp tục phát huy!`;

      default:
        return messageContent;
    }
  };

  const currentMessage = templateType === 'custom' ? messageContent : generateTemplate(templateType);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;
    onSaveParentLog(student.id, channel, currentMessage.trim());
    onClose();
  };

  // Clean phone number for tel: or Zalo
  const cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center font-bold">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                Liên Hệ Phụ Huynh Học Sinh
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Họ tên học sinh: <strong className="text-slate-800 dark:text-slate-200">{student.fullName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Parent Quick Info */}
        <div className="my-4 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Phụ huynh đại diện:</span>
            <strong className="text-slate-800 dark:text-slate-100 text-sm">{student.parentName}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Số điện thoại liên hệ:</span>
            <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
              {student.parentPhone}
            </span>
          </div>

          {/* Direct Action Links */}
          <div className="pt-2 flex gap-2">
            <a
              href={`tel:${cleanPhone}`}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" /> Gọi Điên Thoại
            </a>
            <a
              href={`https://zalo.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Mở Zalo PH
            </a>
          </div>
        </div>

        {/* Message Builder Form */}
        <form onSubmit={handleSaveLog} className="space-y-4">
          {/* Template Switcher */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Mẫu tin nhắn tự động
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTemplateType('weekly')}
                className={`p-2 rounded-xl font-semibold border text-center transition-all ${
                  templateType === 'weekly' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Báo cáo Tuần
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('attendance')}
                className={`p-2 rounded-xl font-semibold border text-center transition-all ${
                  templateType === 'attendance' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Nhắc Chuyên Cần
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('praise')}
                className={`p-2 rounded-xl font-semibold border text-center transition-all ${
                  templateType === 'praise' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Tuyên Dương
              </button>
            </div>
          </div>

          {/* Message Area */}
          <div className="relative">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Nội dung soạn sẵn
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Đã sao chép!' : 'Sao chép nội dung'}
              </button>
            </div>

            <textarea
              rows={4}
              value={currentMessage}
              onChange={(e) => {
                setTemplateType('custom');
                setMessageContent(e.target.value);
              }}
              className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
            />
          </div>

          {/* Channel Select */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Kênh liên hệ ghi lại
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
              >
                <option value="Zalo">Tin nhắn Zalo</option>
                <option value="Điện thoại">Cuộc gọi trực tiếp</option>
                <option value="Gặp trực tiếp">Gặp trực tiếp tại trường</option>
                <option value="Khác">Kênh khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Ngày liên hệ
              </label>
              <input
                type="text"
                disabled
                value={new Date().toLocaleDateString('vi-VN')}
                className="w-full px-3 py-2 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold"
              />
            </div>
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Lưu Lịch Sử Này
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
