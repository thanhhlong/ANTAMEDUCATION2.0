import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TutorAssistant, TutorStatus } from '../../types';
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
  Edit2,
  Mail,
  BookOpen,
  DollarSign,
  Star,
  Check,
  User,
  RefreshCw,
} from 'lucide-react';

const COMMON_DEFAULT_SUBJECTS = [
  'Toán học',
  'Ngữ văn',
  'Tiếng Anh',
  'Khoa học tự nhiên',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Lịch sử & Địa lý',
  'Tin học',
  'Toán Tư Duy',
  'IELTS / TOEIC',
];

const AVAILABLE_GRADES = [6, 7, 8, 9, 10, 11, 12];

export const TutorManager: React.FC = () => {
  const { tutors, subjects, addTutor, updateTutor, updateTutorStatus, deleteTutor, deleteTutors, syncAcademicToOperations } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTutor, setSelectedTutor] = useState<TutorAssistant | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTutor, setEditingTutor] = useState<TutorAssistant | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Delete Modals & Batch Selection State
  const [tutorToDelete, setTutorToDelete] = useState<TutorAssistant | null>(null);
  const [selectedTutorIds, setSelectedTutorIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Custom subject input state for modals
  const [customSubjectInput, setCustomSubjectInput] = useState('');

  // Form state for adding tutor
  const [addFormData, setAddFormData] = useState({
    fullName: '',
    gender: 'Nữ' as 'Nam' | 'Nữ' | 'Khác',
    phone: '',
    email: '',
    university: 'ĐH Sư Phạm Hà Nội',
    major: 'Sư phạm Toán',
    subjectsCanTeach: ['Toán học'],
    gradesCanTeach: [6, 7, 8, 9],
    hourlyRate: 150000,
    bio: 'Nhiệt tình, kiên nhẫn, có phương pháp dạy học sinh mất gốc.',
    expectations: 'Mong muốn hợp tác lâu dài với trung tâm',
  });

  // Form state for editing tutor
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    gender: 'Nữ' as 'Nam' | 'Nữ' | 'Khác',
    phone: '',
    email: '',
    university: '',
    major: '',
    status: 'active_contract' as TutorStatus,
    subjectsCanTeach: [] as string[],
    gradesCanTeach: [] as number[],
    hourlyRate: 150000,
    rating: 5.0,
    bio: '',
    expectations: '',
  });

  // All subject choices merging registered subjects and common defaults
  const allSubjectOptions = Array.from(
    new Set([
      ...subjects.map((s) => s.name),
      ...COMMON_DEFAULT_SUBJECTS,
      ...(editingTutor ? editingTutor.subjectsCanTeach : []),
      ...addFormData.subjectsCanTeach,
    ])
  ).filter(Boolean);

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
    if (editingTutor?.id === tutorToDelete.id) {
      setIsEditModalOpen(false);
      setEditingTutor(null);
    }
    setTutorToDelete(null);
    setNotificationMessage({ text: `Đã xóa thành công hồ sơ thầy/cô ${name}`, type: 'success' });
    setTimeout(() => setNotificationMessage(null), 3500);
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
    if (editingTutor && selectedTutorIds.includes(editingTutor.id)) {
      setIsEditModalOpen(false);
      setEditingTutor(null);
    }
    setSelectedTutorIds([]);
    setIsBulkDeleteOpen(false);
    setNotificationMessage({ text: `Đã xóa thành công ${count} hồ sơ thầy/cô & trợ giảng`, type: 'success' });
    setTimeout(() => setNotificationMessage(null), 3500);
  };

  const handleOpenEditModal = (tutor: TutorAssistant, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTutor(tutor);
    setEditFormData({
      fullName: tutor.fullName,
      gender: tutor.gender || 'Nữ',
      phone: tutor.phone,
      email: tutor.email || '',
      university: tutor.university || '',
      major: tutor.major || '',
      status: tutor.status,
      subjectsCanTeach: [...tutor.subjectsCanTeach],
      gradesCanTeach: [...tutor.gradesCanTeach],
      hourlyRate: tutor.hourlyRate || 150000,
      rating: tutor.rating || 5.0,
      bio: tutor.bio || '',
      expectations: tutor.expectations || '',
    });
    setCustomSubjectInput('');
    setIsEditModalOpen(true);
  };

  const handleSaveEditedTutor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTutor) return;

    if (!editFormData.fullName.trim() || !editFormData.phone.trim()) {
      alert('Vui lòng nhập họ tên và số điện thoại của giáo viên');
      return;
    }

    if (editFormData.subjectsCanTeach.length === 0) {
      alert('Vui lòng chọn ít nhất 1 môn giảng dạy cho giáo viên');
      return;
    }

    updateTutor(editingTutor.id, {
      fullName: editFormData.fullName.trim(),
      gender: editFormData.gender,
      phone: editFormData.phone.trim(),
      email: editFormData.email.trim(),
      university: editFormData.university.trim(),
      major: editFormData.major.trim(),
      status: editFormData.status,
      subjectsCanTeach: editFormData.subjectsCanTeach,
      gradesCanTeach: editFormData.gradesCanTeach.length > 0 ? editFormData.gradesCanTeach : [6, 7, 8, 9],
      hourlyRate: Number(editFormData.hourlyRate) || 150000,
      rating: Number(editFormData.rating) || 5.0,
      bio: editFormData.bio.trim(),
      expectations: editFormData.expectations.trim(),
    });

    if (selectedTutor && selectedTutor.id === editingTutor.id) {
      setSelectedTutor({
        ...selectedTutor,
        ...editFormData,
      });
    }

    setIsEditModalOpen(false);
    setNotificationMessage({
      text: `Đã cập nhật thông tin giáo viên "${editFormData.fullName}" thành công!`,
      type: 'success',
    });
    setTimeout(() => setNotificationMessage(null), 3500);
  };

  const handleSaveTutor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.fullName.trim() || !addFormData.phone.trim()) {
      alert('Vui lòng nhập họ tên và số điện thoại');
      return;
    }

    if (addFormData.subjectsCanTeach.length === 0) {
      alert('Vui lòng chọn ít nhất 1 môn giảng dạy');
      return;
    }

    addTutor({
      fullName: addFormData.fullName.trim(),
      gender: addFormData.gender,
      phone: addFormData.phone.trim(),
      email: addFormData.email.trim(),
      university: addFormData.university.trim(),
      major: addFormData.major.trim(),
      subjectsCanTeach: addFormData.subjectsCanTeach,
      gradesCanTeach: addFormData.gradesCanTeach.length > 0 ? addFormData.gradesCanTeach : [6, 7, 8, 9],
      experienceYears: 0,
      hourlyRate: Number(addFormData.hourlyRate) || 150000,
      bio: addFormData.bio.trim(),
      expectations: addFormData.expectations.trim(),
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
    setNotificationMessage({
      text: `Đã thêm giáo viên/trợ giảng "${addFormData.fullName}" thành công!`,
      type: 'success',
    });
    setTimeout(() => setNotificationMessage(null), 3500);
  };

  const toggleSubjectSelection = (
    subject: string,
    currentSubjects: string[],
    setFunc: (subs: string[]) => void
  ) => {
    if (currentSubjects.includes(subject)) {
      setFunc(currentSubjects.filter((s) => s !== subject));
    } else {
      setFunc([...currentSubjects, subject]);
    }
  };

  const toggleGradeSelection = (
    grade: number,
    currentGrades: number[],
    setFunc: (grades: number[]) => void
  ) => {
    if (currentGrades.includes(grade)) {
      setFunc(currentGrades.filter((g) => g !== grade));
    } else {
      setFunc([...currentGrades, grade].sort((a, b) => a - b));
    }
  };

  const handleAddCustomSubject = (
    currentSubjects: string[],
    setFunc: (subs: string[]) => void
  ) => {
    const trimmed = customSubjectInput.trim();
    if (!trimmed) return;
    if (!currentSubjects.includes(trimmed)) {
      setFunc([...currentSubjects, trimmed]);
    }
    setCustomSubjectInput('');
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

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Toast Notification */}
      {notificationMessage && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notificationMessage.text}</span>
          </div>
          <button
            onClick={() => setNotificationMessage(null)}
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
            Quản lý hồ sơ giáo viên, chỉnh sửa môn giảng dạy, phân quyền và ma trận lịch rảnh
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (syncAcademicToOperations) {
                const res = syncAcademicToOperations();
                setNotificationMessage({
                  text: `Đồng bộ thành công! Đã cập nhật ${res.syncedTutors} thầy cô & trợ giảng từ Hệ thống và Bảng Chi Trả.`,
                  type: 'success',
                });
              }
            }}
            title="Đồng bộ giáo viên từ Hệ thống & Chi trả lương"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs lg:text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <span>Đồng Bộ Giáo Viên & Lương</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs lg:text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4 text-purple-600" />
            <span>Nhập Ứng Viên Từ Excel (BM1)</span>
          </button>

          <button
            onClick={() => {
              setCustomSubjectInput('');
              setIsAddModalOpen(true);
            }}
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
              placeholder="Tìm theo tên thầy cô, số điện thoại, trường ĐH, môn dạy..."
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

      {/* Bulk Action Bar */}
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
              {/* Card Header */}
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
                    <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                      <span>{tutor.fullName}</span>
                      {tutor.code?.startsWith('GV') || tutor.fullName.includes('Thầy') || tutor.fullName.includes('Cô') ? (
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold text-[10px] shrink-0">
                          Giáo viên
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px] shrink-0">
                          Trợ giảng
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                      <span className="text-indigo-600 font-semibold">{tutor.code}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-medium">★ {tutor.rating || 5.0}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={tutor.status}
                    onChange={(e) => updateTutorStatus(tutor.id, e.target.value as TutorStatus)}
                    className="text-[11px] font-bold px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-indigo-700 cursor-pointer"
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

              {/* Education & Phone Info */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{tutor.university || 'Đại học'} ({tutor.major || 'Sư phạm'})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-slate-700 font-medium">{tutor.phone}</span>
                  {tutor.email && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 truncate text-[11px]">{tutor.email}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Subjects & Grades */}
              <div className="space-y-1.5">
                <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                  <span>Môn & Khối đảm nhiệm:</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">{tutor.subjectsCanTeach.length} môn</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tutor.subjectsCanTeach.map((sub, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200"
                    >
                      {sub}
                    </span>
                  ))}
                  {tutor.gradesCanTeach && tutor.gradesCanTeach.length > 0 && tutor.gradesCanTeach.map((g) => (
                    <span
                      key={g}
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
                    >
                      K{g}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer Actions: Chỉnh sửa & Xem Lịch Rảnh (Đã bỏ dòng số năm kinh nghiệm) */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={(e) => handleOpenEditModal(tutor, e)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Chỉnh Sửa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTutor(tutor)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-100 transition-colors cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Xem Lịch Rảnh</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT TUTOR MODAL */}
      {isEditModalOpen && editingTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-5 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Chỉnh Sửa Thông Tin Giáo Viên / Trợ Giảng
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Mã hồ sơ: <span className="text-indigo-600 font-bold">{editingTutor.code}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingTutor(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedTutor} className="space-y-4 text-xs lg:text-sm">
              {/* Row 1: Full name, Gender, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Họ Và Tên Giáo Viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    required
                    placeholder="VD: Lê Thị Thơm"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-slate-700 font-semibold mb-1">Giới Tính</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  >
                    <option value="Nữ">Nữ</option>
                    <option value="Nam">Nam</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-slate-700 font-semibold mb-1">Trạng Thái</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as TutorStatus })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold focus:border-indigo-500 text-indigo-700"
                  >
                    <option value="active_contract">Chính thức</option>
                    <option value="interviewing">Phỏng vấn</option>
                    <option value="new_applicant">Ứng viên mới</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Số Điện Thoại <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      required
                      placeholder="0949106879"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      placeholder="giaovien@antam.edu.vn"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: University & Major */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Trường Đại Học / Cơ Quan</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={editFormData.university}
                      onChange={(e) => setEditFormData({ ...editFormData, university: e.target.value })}
                      placeholder="VD: ĐH Sư Phạm Tây Nguyên"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Chuyên Ngành</label>
                  <input
                    type="text"
                    value={editFormData.major}
                    onChange={(e) => setEditFormData({ ...editFormData, major: e.target.value })}
                    placeholder="VD: Sư phạm Tiếng Anh"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* SECTION: CHỌN MÔN GIẢNG DẠY (Interactive Multi-Select) */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>Chọn Môn Giảng Dạy * ({editFormData.subjectsCanTeach.length} đã chọn)</span>
                  </label>
                  <span className="text-[11px] text-indigo-600 font-medium">Bấm vào môn để chọn/bỏ chọn</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {allSubjectOptions.map((subName) => {
                    const isSelected = editFormData.subjectsCanTeach.includes(subName);
                    return (
                      <button
                        key={subName}
                        type="button"
                        onClick={() =>
                          toggleSubjectSelection(
                            subName,
                            editFormData.subjectsCanTeach,
                            (subs) => setEditFormData({ ...editFormData, subjectsCanTeach: subs })
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        <span>{subName}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Subject Input */}
                <div className="flex items-center gap-2 pt-2 border-t border-indigo-100/60">
                  <input
                    type="text"
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    placeholder="Thêm môn khác (VD: Ôn thi Chuyên, Luyện chữ đẹp...)"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSubject(editFormData.subjectsCanTeach, (subs) =>
                          setEditFormData({ ...editFormData, subjectsCanTeach: subs })
                        );
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleAddCustomSubject(editFormData.subjectsCanTeach, (subs) =>
                        setEditFormData({ ...editFormData, subjectsCanTeach: subs })
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shrink-0"
                  >
                    + Thêm Môn
                  </button>
                </div>
              </div>

              {/* SECTION: KHỐI LỚP ĐẢM NHIỆM */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Khối Lớp Đảm Nhiệm
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, gradesCanTeach: [6, 7, 8, 9] })}
                      className="text-indigo-600 hover:underline font-medium cursor-pointer"
                    >
                      Chọn THCS (K6-9)
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, gradesCanTeach: [10, 11, 12] })}
                      className="text-indigo-600 hover:underline font-medium cursor-pointer"
                    >
                      Chọn THPT (K10-12)
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_GRADES.map((gradeNum) => {
                    const isSelected = editFormData.gradesCanTeach.includes(gradeNum);
                    return (
                      <button
                        key={gradeNum}
                        type="button"
                        onClick={() =>
                          toggleGradeSelection(
                            gradeNum,
                            editFormData.gradesCanTeach,
                            (grades) => setEditFormData({ ...editFormData, gradesCanTeach: grades })
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Khối {gradeNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 4: Rate & Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Thù Lao Dự Kiến / Giờ (VNĐ)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="10000"
                      min="0"
                      value={editFormData.hourlyRate}
                      onChange={(e) => setEditFormData({ ...editFormData, hourlyRate: Number(e.target.value) })}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Đánh Giá (Sao 1 - 5)</label>
                  <div className="relative">
                    <Star className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2 fill-amber-400" />
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={editFormData.rating}
                      onChange={(e) => setEditFormData({ ...editFormData, rating: Number(e.target.value) })}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bio & Notes */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Giới Thiệu & Phong Cách Giảng Dạy</label>
                <textarea
                  rows={2}
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                  placeholder="Phương pháp giảng dạy, thế mạnh chuyên môn, học sinh phụ trách..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const tutor = editingTutor;
                    setIsEditModalOpen(false);
                    setEditingTutor(null);
                    handleOpenSingleDelete(tutor);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>Xóa giáo viên</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingTutor(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu Cập Nhật</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tutor Availability Matrix Modal */}
      {selectedTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-xl text-slate-800 animate-in fade-in zoom-in-95 duration-150">
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
                    {selectedTutor.university || 'Đại học'} • SĐT: {selectedTutor.phone}
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

            {/* Teaching Subjects in Matrix Modal */}
            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-indigo-900">Môn phụ trách:</span>
              {selectedTutor.subjectsCanTeach.map((sub, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-white text-indigo-700 font-semibold border border-indigo-200 shadow-2xs"
                >
                  {sub}
                </span>
              ))}
              {selectedTutor.gradesCanTeach && (
                <span className="text-slate-500 text-[11px] ml-auto">
                  Khối: {selectedTutor.gradesCanTeach.map((g) => `K${g}`).join(', ')}
                </span>
              )}
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
                        const dayAvail = selectedTutor.availability?.[dayNum];
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
              <div><strong>Giới thiệu & Chuyên môn:</strong> {selectedTutor.bio || 'Đội ngũ giáo viên giàu nhiệt huyết'}</div>
              <div><strong>Kỳ vọng:</strong> {selectedTutor.expectations || 'Sẵn sàng nhận lớp phụ đạo theo lịch rảnh'}</div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const t = selectedTutor;
                  setSelectedTutor(null);
                  handleOpenEditModal(t);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Chỉnh sửa thông tin</span>
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

      {/* ADD TUTOR MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Thêm Thầy Cô / Trợ Giảng Mới</span>
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTutor} className="space-y-4 text-xs lg:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Họ Và Tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addFormData.fullName}
                    onChange={(e) => setAddFormData({ ...addFormData, fullName: e.target.value })}
                    placeholder="VD: Trần Phương Thảo"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-slate-700 font-semibold mb-1">Giới Tính</label>
                  <select
                    value={addFormData.gender}
                    onChange={(e) => setAddFormData({ ...addFormData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  >
                    <option value="Nữ">Nữ</option>
                    <option value="Nam">Nam</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Số Điện Thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addFormData.phone}
                    onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                    required
                    placeholder="0987654321"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                    placeholder="thayco@antam.edu.vn"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Trường Đại Học</label>
                  <input
                    type="text"
                    value={addFormData.university}
                    onChange={(e) => setAddFormData({ ...addFormData, university: e.target.value })}
                    placeholder="VD: ĐH Sư Phạm Hà Nội"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Chuyên Ngành</label>
                  <input
                    type="text"
                    value={addFormData.major}
                    onChange={(e) => setAddFormData({ ...addFormData, major: e.target.value })}
                    placeholder="VD: Sư phạm Toán"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Interactive Subject Selection */}
              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Chọn Môn Giảng Dạy * ({addFormData.subjectsCanTeach.length} đã chọn)</span>
                  </label>
                  <span className="text-[10px] text-indigo-600 font-medium">Bấm chọn các môn</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {allSubjectOptions.map((subName) => {
                    const isSelected = addFormData.subjectsCanTeach.includes(subName);
                    return (
                      <button
                        key={subName}
                        type="button"
                        onClick={() =>
                          toggleSubjectSelection(
                            subName,
                            addFormData.subjectsCanTeach,
                            (subs) => setAddFormData({ ...addFormData, subjectsCanTeach: subs })
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                        <span>{subName}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-indigo-100/60">
                  <input
                    type="text"
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    placeholder="Thêm môn khác..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:border-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSubject(addFormData.subjectsCanTeach, (subs) =>
                          setAddFormData({ ...addFormData, subjectsCanTeach: subs })
                        );
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleAddCustomSubject(addFormData.subjectsCanTeach, (subs) =>
                        setAddFormData({ ...addFormData, subjectsCanTeach: subs })
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    + Thêm
                  </button>
                </div>
              </div>

              {/* Grades Selection */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-slate-700">Khối Lớp Phụ Trách</span>
                  <button
                    type="button"
                    onClick={() => setAddFormData({ ...addFormData, gradesCanTeach: [6, 7, 8, 9] })}
                    className="text-indigo-600 font-medium hover:underline text-[11px]"
                  >
                    Chọn K6-9
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_GRADES.map((g) => {
                    const isSelected = addFormData.gradesCanTeach.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() =>
                          toggleGradeSelection(
                            g,
                            addFormData.gradesCanTeach,
                            (grades) => setAddFormData({ ...addFormData, gradesCanTeach: grades })
                          )
                        }
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Khối {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Lưu Giáo Viên
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
                Tất cả dữ liệu thông tin và ma trận lịch rảnh của các nhân sự này sẽ bị xóa khỏi hệ thống.
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
