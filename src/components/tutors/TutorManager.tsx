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
  Trash2,
  CheckSquare,
  Square,
  MinusSquare,
  CheckCircle2,
} from 'lucide-react';

export const TutorManager: React.FC = () => {
  const { tutors, addTutor, updateTutorStatus, deleteTutor, deleteTutors } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTutor, setSelectedTutor] = useState<TutorAssistant | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Delete Modals & Batch Selection State
  const [tutorToDelete, setTutorToDelete] = useState<TutorAssistant | null>(null);
  const [selectedTutorIds, setSelectedTutorIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);

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

  const allFilteredSelected = filteredTutors.length > 0 && filteredTutors.every((t) => selectedTutorIds.includes(t.id));
  const someFilteredSelected = selectedTutorIds.length > 0 && !allFilteredSelected;

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredSet = new Set(filteredTutors.map((t) => t.id));
      setSelectedTutorIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      const filteredIds = filteredTutors.map((t) => t.id);
      setSelectedTutorIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleToggleSelectTutor = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTutorIds((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  const handleOpenSingleDelete = (tutor: TutorAssistant, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTutorToDelete(tutor);
  };

  const handleConfirmSingleDelete = () => {
    if (!tutorToDelete) return;
    const name = tutorToDelete.fullName;
    deleteTutor(tutorToDelete.id);
    setSelectedTutorIds((prev) => prev.filter((id) => id !== tutorToDelete.id));
    if (selectedTutor?.id === tutorToDelete.id) setSelectedTutor(null);
    setTutorToDelete(null);
    setDeleteSuccessMessage(`Đã xóa thành công hồ sơ thầy/cô ${name}`);
    setTimeout(() => setDeleteSuccessMessage(null), 3500);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedTutorIds.length === 0) return;
    const count = selectedTutorIds.length;
    if (deleteTutors) {
      deleteTutors(selectedTutorIds);
    } else {
      selectedTutorIds.forEach((id) => deleteTutor(id));
    }
    if (selectedTutor && selectedTutorIds.includes(selectedTutor.id)) {
      setSelectedTutor(null);
    }
    setSelectedTutorIds([]);
    setIsBulkDeleteOpen(false);
    setDeleteSuccessMessage(`Đã xóa thành công ${count} hồ sơ thầy/cô & trợ giảng`);
    setTimeout(() => setDeleteSuccessMessage(null), 3500);
  };

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
      {/* Delete Success Toast */}
      {deleteSuccessMessage && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{deleteSuccessMessage}</span>
          </div>
          <button
            onClick={() => setDeleteSuccessMessage(null)}
            className="p-1 rounded-md text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
            <span>QUẢN LÝ TRỢ GIẢNG & THẦY CÔ</span>
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
            <span>+ Thêm Thầy Cô / Trợ Giảng</span>
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
              placeholder="Tìm theo tên thầy cô, trợ giảng, trường ĐH, môn dạy..."
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

        {/* Select all & count */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="flex items-center gap-1.5 font-medium hover:text-indigo-600 cursor-pointer"
          >
            {allFilteredSelected ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : someFilteredSelected ? (
              <MinusSquare className="w-4 h-4 text-indigo-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Chọn tất cả ({filteredTutors.length})</span>
          </button>
          <span>Đang hiển thị {filteredTutors.length} nhân sự</span>
        </div>
      </div>

      {/* Bulk Action Bar (when tutors are selected) */}
      {selectedTutorIds.length > 0 && (
        <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
              {selectedTutorIds.length}
            </span>
            <span>Đang chọn {selectedTutorIds.length} thầy cô / trợ giảng</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTutorIds([])}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Bỏ chọn tất cả
            </button>

            <button
              onClick={() => setIsBulkDeleteOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa {selectedTutorIds.length} người đã chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* Tutors Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTutors.map((tutor) => {
          const isSelected = selectedTutorIds.includes(tutor.id);

          return (
            <div
              key={tutor.id}
              className={`p-5 rounded-xl bg-white border transition-all space-y-4 shadow-xs relative ${
                isSelected
                  ? 'border-indigo-400 bg-indigo-50/20 ring-1 ring-indigo-400'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  {/* Selection Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleSelectTutor(tutor.id, e)}
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 cursor-pointer shrink-0"
                    title={isSelected ? 'Bỏ chọn' : 'Chọn nhân sự này'}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                    )}
                  </button>

                  <div className="w-11 h-11 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs shrink-0">
                    {tutor.fullName.split(' ').pop()?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">{tutor.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                      <span className="text-indigo-600 font-semibold">{tutor.code}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-medium">★ {tutor.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={tutor.status}
                    onChange={(e) => updateTutorStatus(tutor.id, e.target.value as TutorStatus)}
                    className="text-[11px] font-bold px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-indigo-700"
                  >
                    <option value="active_contract">Chính thức</option>
                    <option value="interviewing">Phỏng vấn</option>
                    <option value="new_applicant">Ứng viên</option>
                  </select>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => handleOpenSingleDelete(tutor, e)}
                    title="Xóa hồ sơ thầy cô / trợ giảng"
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
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
          );
        })}
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

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const t = selectedTutor;
                  setSelectedTutor(null);
                  handleOpenSingleDelete(t);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Xóa hồ sơ này</span>
              </button>

              <button
                onClick={() => setSelectedTutor(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
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
                <span>Thêm Thầy Cô / Trợ Giảng Mới</span>
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

      {/* Single Tutor Delete Confirmation Modal */}
      {tutorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Xác Nhận Xóa Hồ Sơ</h3>
                <p className="text-xs text-slate-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 space-y-2 text-xs">
              <div className="text-slate-700 font-medium">
                Bạn có chắc chắn muốn xóa hồ sơ thầy/cô <strong className="text-rose-700 font-bold">{tutorToDelete.fullName}</strong> ({tutorToDelete.code})?
              </div>
              <div className="text-slate-500 text-[11px] space-y-0.5 pt-1 border-t border-rose-200/50">
                <div>• <strong>Trường/Ngành:</strong> {tutorToDelete.university} ({tutorToDelete.major})</div>
                <div>• <strong>Số điện thoại:</strong> {tutorToDelete.phone}</div>
                <div>• <strong>Môn giảng dạy:</strong> {tutorToDelete.subjectsCanTeach.join(', ')}</div>
                <div>• <strong>Mức thù lao:</strong> {formatCurrency(tutorToDelete.hourlyRate)}/h</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTutorToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác Nhận Xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Xóa Hàng Loạt Hồ Sơ Thầy Cô</h3>
                <p className="text-xs text-slate-500">Đang chọn {selectedTutorIds.length} người</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 space-y-2 text-xs">
              <div className="text-slate-700 font-medium">
                Bạn có chắc chắn muốn xóa vĩnh viễn <strong className="text-rose-700 font-bold">{selectedTutorIds.length} hồ sơ</strong> đã chọn?
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Tất cả dữ liệu thông tin, ma trận lịch rảnh và định mức thù lao của các nhân sự này sẽ bị xóa khỏi hệ thống.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa {selectedTutorIds.length} Hồ Sơ</span>
              </button>
            </div>
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

