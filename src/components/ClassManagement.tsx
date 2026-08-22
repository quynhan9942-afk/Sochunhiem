import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Download, 
  Upload, 
  ArrowUpDown, 
  Check, 
  X, 
  Search,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { Student, TeamNumber } from '../types';
import { exportStudentsToCSV } from '../utils/storage';

interface ClassManagementProps {
  students: Student[];
  className: string;
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onReorderStudents: (students: Student[]) => void;
}

export const ClassManagement: React.FC<ClassManagementProps> = ({
  students,
  className,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onReorderStudents,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Nam' as 'Nam' | 'Nữ',
    dob: '2012-05-15',
    ethnicity: 'Kinh',
    familyBackground: 'Bình thường',
    team: 'Tổ 1' as TeamNumber,
    address: 'TP. Hồ Chí Minh',
    parentName: '',
    parentPhone: '',
    statusNote: 'Học sinh chăm ngoan.'
  });

  const handleOpenAdd = () => {
    setFormData({
      fullName: '',
      gender: 'Nam',
      dob: '2012-05-15',
      ethnicity: 'Kinh',
      familyBackground: 'Bình thường',
      team: 'Tổ 1',
      address: 'TP. Hồ Chí Minh',
      parentName: '',
      parentPhone: '',
      statusNote: 'Học sinh chăm ngoan.'
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      fullName: student.fullName,
      gender: student.gender,
      dob: student.dob,
      ethnicity: student.ethnicity || 'Kinh',
      familyBackground: student.familyBackground || 'Bình thường',
      team: student.team,
      address: student.address,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      statusNote: student.statusNote
    });
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        fullName: formData.fullName.trim(),
        gender: formData.gender,
        dob: formData.dob,
        ethnicity: formData.ethnicity || 'Kinh',
        familyBackground: formData.familyBackground || 'Bình thường',
        team: formData.team,
        address: formData.address,
        parentName: formData.parentName || 'Phụ huynh ' + formData.fullName,
        parentPhone: formData.parentPhone || '0901234567',
        statusNote: formData.statusNote
      });
      setEditingStudent(null);
    } else {
      const newStt = students.length + 1;
      const codeNumber = newStt < 10 ? `0${newStt}` : `${newStt}`;
      const newStudent: Student = {
        id: 'hs_' + Date.now(),
        studentCode: `HS${className}${codeNumber}`,
        stt: newStt,
        fullName: formData.fullName.trim(),
        gender: formData.gender,
        dob: formData.dob,
        ethnicity: formData.ethnicity || 'Kinh',
        familyBackground: formData.familyBackground || 'Bình thường',
        avatar: formData.gender === 'Nam' 
          ? 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'
          : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
        team: formData.team,
        address: formData.address,
        parentName: formData.parentName || 'Phụ huynh ' + formData.fullName,
        parentPhone: formData.parentPhone || '0901234567',
        emulationScore: 0,
        statusTag: 'Tốt',
        statusNote: formData.statusNote,
        attendanceToday: 'present',
        isNeedsAttention: false
      };
      onAddStudent(newStudent);
      setShowAddModal(false);
    }
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter(line => line.trim().length > 0);
      if (lines.length <= 1) return;

      // Simple CSV parser
      const newStudents: Student[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length >= 3) {
          const stt = parseInt(cols[0]) || (students.length + i);
          newStudents.push({
            id: 'hs_imp_' + Date.now() + '_' + i,
            studentCode: cols[1] || `HS${className}${i}`,
            stt: stt,
            fullName: cols[2] || 'Học sinh ' + i,
            gender: (cols[3] === 'Nữ' ? 'Nữ' : 'Nam'),
            dob: cols[4] || '2012-01-01',
            avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
            team: (cols[5] as TeamNumber) || 'Tổ 1',
            address: cols[8] || 'TP. Hồ Chí Minh',
            parentName: cols[9] || 'Phụ huynh',
            parentPhone: cols[10] || '0900000000',
            emulationScore: parseInt(cols[6]) || 0,
            statusTag: 'Tốt',
            statusNote: 'Nhập từ tập tin CSV/Excel.',
            attendanceToday: 'present',
            isNeedsAttention: false
          });
        }
      }

      if (newStudents.length > 0) {
        onReorderStudents([...students, ...newStudents]);
        alert(`Đã nhập thành công ${newStudents.length} học sinh từ tập tin CSV/Excel!`);
      }
    };
    reader.readAsText(file);
  };

  const filtered = students.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Quản Lý Danh Sách Lớp Chủ Nhiệm {className}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Thêm mới, sửa thông tin, xóa học sinh, chuyển tổ và xuất/nhập danh sách lớp bằng Excel/CSV
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV */}
          <button
            onClick={() => exportStudentsToCSV(students, className)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Xuất Excel/CSV
          </button>

          {/* Import CSV */}
          <label className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-2xl shadow-xs flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4" /> Import Excel/CSV
            <input type="file" accept=".csv, .txt" onChange={handleCSVImport} className="hidden" />
          </label>

          {/* Add Student */}
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-xs flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Thêm Học Sinh
          </button>
        </div>
      </div>

      {/* Table & Search */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Tìm học sinh để chỉnh sửa..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div className="text-xs font-bold text-slate-500">
            Tổng số: {students.length} học sinh
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">STT</th>
                <th className="py-3.5 px-4">Mã HS</th>
                <th className="py-3.5 px-4">Họ Và Tên</th>
                <th className="py-3.5 px-4">Giới Tính</th>
                <th className="py-3.5 px-4">Tổ</th>
                <th className="py-3.5 px-4">Phụ Huynh</th>
                <th className="py-3.5 px-4">SĐT Phụ Huynh</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filtered.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                  <td className="py-3 px-4 text-center font-bold text-slate-500">
                    {st.stt}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs font-semibold">
                    {st.studentCode}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <img src={st.avatar} alt={st.fullName} className="w-8 h-8 rounded-xl object-cover" />
                      <span className="font-bold text-slate-800 dark:text-slate-100">{st.fullName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs font-medium">
                    {st.gender}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 font-bold text-xs">
                      {st.team}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {st.parentName}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {st.parentPhone}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(st)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg text-xs font-semibold flex items-center gap-1"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Sửa
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(st.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-semibold flex items-center gap-1"
                        title="Xóa học sinh"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {(showAddModal || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              {editingStudent ? 'Chỉnh Sửa Thông Tin Học Sinh' : 'Thêm Học Sinh Mới Vào Lớp'}
            </h3>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Họ và tên học sinh *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Giới tính
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Tổ sinh hoạt
                  </label>
                  <select
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    <option value="Tổ 1">Tổ 1</option>
                    <option value="Tổ 2">Tổ 2</option>
                    <option value="Tổ 3">Tổ 3</option>
                    <option value="Tổ 4">Tổ 4</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Dân tộc
                  </label>
                  <input
                    type="text"
                    list="class-mgmt-ethnicity"
                    value={formData.ethnicity}
                    onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                    placeholder="Kinh"
                  />
                  <datalist id="class-mgmt-ethnicity">
                    <option value="Kinh" />
                    <option value="Ê đê" />
                    <option value="Ba Na" />
                    <option value="Gia Rai" />
                    <option value="Tày" />
                    <option value="Thái" />
                    <option value="Mường" />
                    <option value="H'Mông" />
                    <option value="Dao" />
                    <option value="Khác" />
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Hoàn cảnh gia đình
                  </label>
                  <select
                    value={formData.familyBackground}
                    onChange={(e) => setFormData({ ...formData, familyBackground: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    <option value="Bình thường">Bình thường</option>
                    <option value="Hộ nghèo">Hộ nghèo</option>
                    <option value="Hộ cận nghèo">Hộ cận nghèo</option>
                    <option value="Mồ côi cha/mẹ">Mồ côi cha/mẹ</option>
                    <option value="Khó khăn đột xuất">Khó khăn đột xuất</option>
                    <option value="Khuyết tật">Khuyết tật</option>
                    <option value="Con thương binh/liệt sĩ">Con thương binh/liệt sĩ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Họ tên Phụ huynh
                  </label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="Tên bố/mẹ..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Số điện thoại PH
                  </label>
                  <input
                    type="text"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="090XXXXXXX"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Địa chỉ nhà
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingStudent(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  {editingStudent ? 'Lưu Thay Đổi' : 'Thêm Học Sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              Xác nhận xóa học sinh khỏi danh sách?
            </h3>
            <p className="text-xs text-slate-500">
              Hành động này sẽ xóa dữ liệu học sinh khỏi lớp học hiện tại. Dữ liệu có thể khôi phục lại nếu cần.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  onDeleteStudent(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
