import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TutorAssistant, TutorStatus } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ExcelImportModal } from '../excel/ExcelModals';
import {
  GraduationCap,
  Search,
  Plus,
  Calendar,
  Phone,
  Building,
  X,
  Upload,
} from 'lucide-react';

export const TutorManager: React.FC = () => {
  const { tutors, addTutor, updateTutorStatus } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTutor, setSelectedTutor] = useState<TutorAssistant | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form state for adding tutor
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Nữ' as const,
    phone: '',
    email: '',
    university: 'ĐH Sư Phạm Hà Nội',
    major: 'Sư phạm Toán',
    subjectsCanTeach: ['Toán học'],
    gradesCanTeach: [6, 7, 8, 9],
    experienceYears: 2,
    hourlyRate: 150000,
    bio: 'Nhiệt tình, kiên nhẫn, có phương pháp dạy học sinh mất gốc.',
    expectations: 'Mong muốn hợp tác lâu dài với trung tâm',
  });

  const filteredTutors = tutors.filter((tut) => {
    if (statusFilter !== 'all' && tut.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = tut.fullName.toLowerCase().includes(q);
      const matchCode = tut.code.toLowerCase().includes(q);
      const matchUniv = tut.university.toLowerCase().includes(q);
      const matchSub = tut.subjectsCanTeach.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchCode && !matchUniv && !matchSub) return false;
    }
    return true;
  });

  const dayNames: { [key: number]: string } = {
    2: 'Thứ 2',
    3: 'Thứ 3',
    4: 'Thứ 4',
    5: 'Thứ 5',
    6: 'Thứ 6',
    7: 'Thứ 7',
    8: 'Chủ Nhật',
  };

  const shiftNames = [
    { key: 'shift1', label: 'Ca 1 (Sáng: 08:00 - 10:00)' },
    { key: 'shift2', label: 'Ca 2 (Chiều: 14:00 - 16:00)' },
    { key: 'shift3', label: 'Ca 3 (Tối 1: 17:30 - 19:15)' },
    { key: 'shift4', label: 'Ca 4 (Tối 2: 19:30 - 21:15)' },
  ];

  const handleSaveTutor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      alert('Vui lòng nhập tên và số điện thoại');
      return;
    }

    addTutor({
      ...formData,
      status: 'active_contract',
      rating: 5.0,
      availability: {
        2: { shift1: false, shift2: true, shift3: true, shift4: true },
        3: { shift1: false, shift2: true, shift3: true, shift4: true },
        4: { shift1: false, shift2: true, shift3: true, shift4: true },
        5: { shift1: false, shift2: true, shift3: true, shift4: true },
        6: { shift1: false, shift2: true, shift3: true, shift4: true },
        7: { shift1: true, shift2: true, shift3: true, shift4: true },
        8: { shift1: true, shift2: true, shift3: true, shift4: true },
      },
    });

    setIsAddModalOpen(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Đội Ngũ</span>
            <span>/</span>
            <span className="text-slate-700">Trợ Giảng & Giáo Viên</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-1">
            <GraduationCap className="w-6 h-6 text-purple-600" />
            <span>QUẢN LÝ TRỢ GIẢNG & MA TRẬN LỊCH RẢNH</span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Dữ liệu đồng bộ từ Biểu mẫu 1 (Đại học Sư phạm, Ngoại Thương, Bách Khoa, Quốc Gia...)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs lg:text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4 text-purple-600" />
            <span>Nhập Ứng Viên Từ Excel (BM1)</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs lg:text-sm font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Trợ Giảng Mới</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên trợ giảng, trường ĐH, môn dạy..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-xs lg:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs lg:text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active_contract">Đang cộng tác chính thức</option>
              <option value="interviewing">Đang phỏng vấn</option>
              <option value="new_applicant">Ứng viên mới</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tutors Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTutors.map((tutor) => (
          <div
            key={tutor.id}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                  {tutor.fullName.split(' ').pop()?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{tutor.fullName}</div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                    <span className="text-indigo-600 font-semibold">{tutor.code}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-medium">★ {tutor.rating}</span>
                  </div>
                </div>
              </div>

              <select
                value={tutor.status}
                onChange={(e) => updateTutorStatus(tutor.id, e.target.value as TutorStatus)}
                className="text-[11px] font-bold px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-indigo-700"
              >
                <option value="active_contract">Chính thức</option>
                <option value="interviewing">Phỏng vấn</option>
                <option value="new_applicant">Ứng viên</option>
              </select>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{tutor.university} ({tutor.major})</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono text-slate-700">{tutor.phone}</span>
              </div>
            </div>

            {/* Subjects & Grades */}
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Môn & Khối đảm nhiệm:</div>
              <div className="flex flex-wrap gap-1">
                {tutor.subjectsCanTeach.map((sub, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200"
                  >
                    {sub}
                  </span>
                ))}
                {tutor.gradesCanTeach.map((g) => (
                  <span
                    key={g}
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
                  >
                    K{g}
                  </span>
                ))}
              </div>
            </div>

            {/* Rate & Availability button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500">Thù lao: </span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {formatCurrency(tutor.hourlyRate)}/h
                </span>
              </div>

              <button
                onClick={() => setSelectedTutor(tutor)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Xem Lịch Rảnh</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tutor Availability Matrix Modal */}
      {selectedTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {selectedTutor.fullName.split(' ').pop()?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Ma Trận Lịch Rảnh: {selectedTutor.fullName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedTutor.university} • SĐT: {selectedTutor.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTutor(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Availability Matrix Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold">
                    <th className="p-2.5 text-left border border-slate-200">Ca Học / Thứ</th>
                    {[2, 3, 4, 5, 6, 7, 8].map((d) => (
                      <th key={d} className="p-2 border border-slate-200">
                        {dayNames[d]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shiftNames.map((shift) => (
                    <tr key={shift.key} className="border-b border-slate-200">
                      <td className="p-2.5 text-left font-medium text-slate-700 bg-slate-50 border border-slate-200">
                        {shift.label}
                      </td>
                      {[2, 3, 4, 5, 6, 7, 8].map((dayNum) => {
                        const dayAvail = selectedTutor.availability[dayNum];
                        const isFree = dayAvail ? (dayAvail as any)[shift.key] : false;
                        return (
                          <td
                            key={dayNum}
                            className={`p-2 border border-slate-200 ${
                              isFree
                                ? 'bg-emerald-50 text-emerald-700 font-bold'
                                : 'bg-slate-50/50 text-slate-300'
                            }`}
                          >
                            {isFree ? 'Rảnh ✓' : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <div><strong>Kinh nghiệm & Giới thiệu:</strong> {selectedTutor.bio}</div>
              <div><strong>Kỳ vọng:</strong> {selectedTutor.expectations || 'Sẵn sàng nhận lớp phụ đạo'}</div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedTutor(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tutor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Thêm Trợ Giảng Mới</span>
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTutor} className="space-y-3 text-xs lg:text-sm">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Họ Và Tên *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="VD: Trần Phương Thảo"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Số Điện Thoại *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Trường Đại Học</label>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Chuyên Ngành</label>
                  <input
                    type="text"
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Thù Lao (VNĐ / Buổi)</label>
                  <input
                    type="number"
                    step="10000"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Kinh Nghiệm (Năm)</label>
                  <input
                    type="number"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Lưu Trợ Giảng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
