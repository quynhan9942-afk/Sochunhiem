import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Copy, Download, Printer, X, Check, Share2, UserCheck, ShieldCheck, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';
import { Student, ClassConfig } from '../types';

interface QRCodeModalProps {
  config: ClassConfig;
  students: Student[];
  adminEmail?: string;
  adminId?: string;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  config,
  students,
  adminEmail,
  adminId,
  onClose,
}) => {
  const [qrType, setQrType] = useState<'class' | 'student'>('class');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute actual website deployment target URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://sochunhiem.edu.vn';

  // Determine current QR Target URL
  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const studentPin = selectedStudent?.accessCode || selectedStudent?.studentCode?.slice(-4) || '8899';
  const effectiveAdminId = adminId || adminEmail || 'quynhan9942@gmail.com';

  const qrUrl = `${baseUrl}?admin=${encodeURIComponent(effectiveAdminId)}`;
  const targetUrl = qrType === 'class'
    ? qrUrl
    : `${qrUrl}&studentCode=${encodeURIComponent(selectedStudent?.studentCode || '')}&pin=${studentPin}`;

  // Generate QR code canvas
  useEffect(() => {
    QRCode.toDataURL(targetUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [targetUrl]);

  // Copy Link Handler
  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download QR PNG Handler
  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_${config.className}_${qrType === 'class' ? 'TrangLop' : selectedStudent?.fullName || 'HocSinh'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print QR Sheet Handler
  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mã QR Truy Cập - ${config.className}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; text-align: center; color: #1e293b; }
            .card { border: 2px solid #0284c7; border-radius: 20px; padding: 30px; max-width: 480px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
            h1 { color: #0284c7; font-size: 24px; margin-bottom: 5px; }
            h2 { font-size: 18px; color: #334155; margin-top: 0; }
            .qr-img { width: 220px; height: 220px; margin: 20px auto; display: block; border: 1px solid #e2e8f0; padding: 10px; border-radius: 12px; }
            .instructions { font-size: 13px; color: #475569; line-height: 1.6; text-align: left; background: #f8fafc; padding: 15px; border-radius: 10px; margin-top: 20px; }
            .pin-badge { font-weight: bold; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>SỔ CHỦ NHIỆM ĐIỆN TỬ</h1>
            <h2>Lớp ${config.className} • ${config.schoolName}</h2>
            <p style="font-size: 14px; color: #64748b;">${qrType === 'class' ? 'Thẻ Quét QR Dành Cho Phụ Huynh Học Sinh' : `Thẻ Quét QR Riêng Cho Học Sinh: <strong>${selectedStudent?.fullName}</strong>`}</p>
            
            <img src="${qrDataUrl}" class="qr-img" />

            ${qrType === 'student' ? `<p>Mã PIN bảo mật: <span class="pin-badge">${studentPin}</span></p>` : ''}
            
            <div class="instructions">
              <strong>📱 HƯỚNG DẪN DÙNG CHO PHỤ HUYNH:</strong>
              <ol style="margin-top: 8px; margin-bottom: 0; padding-left: 20px;">
                <li>Mở camera điện thoại di động hoặc ứng dụng Zalo/QR.</li>
                <li>Hướng ống kính quét mã QR phía trên.</li>
                <li>Nhấn mở đường dẫn website để vào Chế Độ Phụ Huynh (Chỉ xem).</li>
              </ol>
            </div>
            
            <div style="margin-top: 25px; font-size: 12px; color: #94a3b8;">
              GVCN: ${config.teacherName} • Năm học ${config.schoolYear}
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <QrCode className="w-6 h-6 text-cyan-100" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">📱 MÃ QR TRUY CẬP WEBSITE</h2>
              <p className="text-xs text-cyan-100/90">
                Phụ huynh quét mã để xem tình hình thi đua & thông tin lớp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* QR Type Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setQrType('class')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                qrType === 'class'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🏫 QR Lớp Học
            </button>
            <button
              onClick={() => setQrType('student')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                qrType === 'student'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              👨‍🎓 QR Riêng Học Sinh
            </button>
          </div>

          {/* Student Selector (If Student QR) */}
          {qrType === 'student' && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Chọn học sinh để tạo mã QR riêng:
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.stt}. {s.fullName} ({s.studentCode}) - {s.team}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* QR Code Display Frame */}
          <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center justify-center space-y-3">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
              SỔ CHỦ NHIỆM ĐIỆN TỬ
            </div>
            
            {/* QR Image */}
            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Website Access QR Code" className="w-52 h-52 mx-auto" />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
                  Đang tạo mã QR...
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500 space-y-0.5">
              <div className="font-bold text-slate-800 dark:text-slate-200">Quét mã để truy cập</div>
              <div className="text-[11px] text-sky-600 dark:text-sky-400 font-mono break-all max-w-xs mx-auto">
                {targetUrl}
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-[11px] text-sky-800 dark:text-sky-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Bảo mật dữ liệu phụ huynh:</span>
            </div>
            <p>
              Mã QR chỉ dẫn đến địa chỉ website thực tế. Khi quét QR, Phụ huynh sẽ vào <strong>Chế Độ Phụ Huynh (Chỉ xem)</strong> và không chứa token quản trị hoặc mật khẩu giáo viên.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã Sao Chép' : 'SAO CHÉP LINK'}</span>
            </button>

            <button
              onClick={handleDownloadQR}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>TẢI MÃ QR</span>
            </button>

            <button
              onClick={handlePrintQR}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>IN THẺ QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
