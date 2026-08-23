import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { formatCurrency, formatShortCurrency } from '../../utils/formatters';
import { exportTuitionStudentsExcel } from '../../utils/excelParser';
import { TuitionExportModal } from '../finance/TuitionExportModal';
import { ExcelImportModal } from '../excel/ExcelModals';
import {
  Users,
  Search,
  Plus,
  Phone,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  X,
  ShieldAlert,
  CreditCard,
  FileSpreadsheet,
  Download,
  Upload,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  TableProperties,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudentManagerProps {
  onOpenPaymentModal: (invoiceId: string) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({ onOpenPaymentModal }) => {
  const {
    students,
    subjects,
    invoices,
    selectedGrade,
    setSelectedGrade,
    addStudent,
    updateStudent,
    deleteStudent,
    isCompactView,
    setIsCompactView,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'debt'>('all');

  // Export Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportInitialType, setExportInitialType] = useState<'all' | 'paid' | 'debt'>('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    fullName: '',
    dob: '2012-05-15',
    gender: 'Nam' as 'Nam' | 'Nữ' | 'Khác',
    phone: '',
    zalo: '',
    email: '',
    address: 'Hà Nội',
    currentSchool: 'THCS Cầu Giấy',
    grade: 8,
    className: '8A1',
    status: 'active' as const,
    parentName: '',
    parentPhone: '',
    parentRelationship: 'Bố' as const,
    notes: '',
    enrolledSubjectIds: ['sub-toan'],
    customSubjectFees: {} as { [subjectId: string]: number },
    tuitionWaived: false,
  });

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Filter students
  const filtered = students.filter((s) => {
    // Grade filter
    if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.fullName.toLowerCase().includes(q);
      const matchCode = s.code.toLowerCase().includes(q);
      const matchPhone = s.phone.includes(q) || s.parentPhone.includes(q);
      const matchSchool = s.currentSchool.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchPhone && !matchSchool) return false;
    }

    // Subject filter
    if (selectedSubjectFilter !== 'all') {
      const hasSubject = s.enrollments.some(
        (e) => e.subjectId === selectedSubjectFilter && e.status === 'active'
      );
      if (!hasSubject) return false;
    }

    // Payment filter
    if (paymentFilter === 'paid' && s.remainingDebt > 0) return false;
    if (paymentFilter === 'debt' && s.remainingDebt === 0) return false;

    return true;
  });

  const generateNextStudentCode = (gradeNum: number) => {
    const gradeStudents = students.filter((s) => s.grade === gradeNum);
    let maxSeq = 0;
    const prefix = `AT-K${gradeNum}-`;
    gradeStudents.forEach((s) => {
      if (s.code && s.code.startsWith(prefix)) {
        const parts = s.code.substring(prefix.length);
        const seq = parseInt(parts, 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    });
    const nextSeq = maxSeq > 0 ? maxSeq + 1 : gradeStudents.length + 1;
    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  };

  const handleOpenAdd = () => {
    const nextGrade = selectedGrade === 'all' ? 8 : selectedGrade;
    const defaultCode = generateNextStudentCode(nextGrade);
    setFormData({
      code: defaultCode,
      fullName: '',
      dob: '2012-05-15',
      gender: 'Nam',
      phone: '',
      zalo: '',
      email: '',
      address: 'Hà Nội',
      currentSchool: 'THCS Cầu Giấy',
      grade: nextGrade,
      className: `${nextGrade}A1`,
      status: 'active',
      parentName: '',
      parentPhone: '',
      parentRelationship: 'Bố',
      notes: '',
      enrolledSubjectIds: ['sub-toan'],
      customSubjectFees: {},
      tuitionWaived: false,
    });
    setDuplicateWarning(null);
    setEditingStudent(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    const initialCustomFees: { [subjectId: string]: number } = {};
    student.enrollments.forEach((e) => {
      initialCustomFees[e.subjectId] = e.finalFee;
    });

    setFormData({
      code: student.code,
      fullName: student.fullName,
      dob: student.dob || '2012-05-15',
      gender: student.gender,
      phone: student.phone,
      zalo: student.zalo,
      email: student.email,
      address: student.address,
      currentSchool: student.currentSchool,
      grade: student.grade,
      className: student.className,
      status: student.status,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentRelationship: student.parentRelationship as any,
      notes: student.notes || '',
      enrolledSubjectIds: student.enrollments.map((e) => e.subjectId),
      customSubjectFees: initialCustomFees,
      tuitionWaived: !!student.tuitionWaived,
    });
    setDuplicateWarning(null);
    setIsAddModalOpen(true);
  };

  // Check duplicate on change
  const handleNameOrPhoneBlur = () => {
    if (!editingStudent && formData.fullName && formData.parentPhone) {
      const match = students.find(
        (s) =>
          s.fullName.toLowerCase().trim() === formData.fullName.toLowerCase().trim() &&
          s.parentPhone.trim() === formData.parentPhone.trim()
      );
      if (match) {
        setDuplicateWarning(
          `Cảnh báo: Đã tìm thấy học sinh "${match.fullName}" (Mã: ${match.code}) có cùng SĐT phụ huynh.`
        );
      } else {
        setDuplicateWarning(null);
      }
    }
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      alert('Vui lòng nhập họ và tên học sinh');
      return;
    }

    // Build enrollments
    const newEnrollments = formData.enrolledSubjectIds.map((subId) => {
      const targetSub = subjects.find((s) => s.id === subId) || subjects[0];
      const hasCustomFee = formData.customSubjectFees[subId] !== undefined;
      const customFeeValue = formData.customSubjectFees[subId];

      const gradeSpecificFee = targetSub.gradeFees && targetSub.gradeFees[formData.grade] !== undefined
        ? targetSub.gradeFees[formData.grade]
        : targetSub.defaultFee;

      const finalFeeToUse = hasCustomFee ? customFeeValue : gradeSpecificFee;

      return {
        id: `en-${Date.now()}-${subId}`,
        subjectId: targetSub.id,
        subjectName: targetSub.name,
        monthlyFee: finalFeeToUse,
        discount: 0,
        finalFee: finalFeeToUse,
        startDate: new Date().toISOString().split('T')[0],
        status: 'active' as const,
      };
    });

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        ...formData,
        enrollments: newEnrollments,
      });
    } else {
      addStudent({
        ...formData,
        enrollments: newEnrollments,
        joinedDate: new Date().toISOString().split('T')[0],
      });
    }

    setIsAddModalOpen(false);
  };

  // Auto calculate total tuition in form
  const totalFormFee = formData.tuitionWaived ? 0 : formData.enrolledSubjectIds.reduce((sum, subId) => {
    const sub = subjects.find((s) => s.id === subId);
    if (!sub) return sum;
    if (formData.customSubjectFees[subId] !== undefined) {
      return sum + formData.customSubjectFees[subId];
    }
    const gradeSpecificFee = sub.gradeFees && sub.gradeFees[formData.grade] !== undefined
      ? sub.gradeFees[formData.grade]
      : sub.defaultFee;
    return sum + gradeSpecificFee;
  }, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Học Viên</span>
            <span>/</span>
            <span className="text-slate-700">Danh Sách Học Sinh</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-1">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>QUẢN LÝ HỌC SINH & ĐĂNG KÝ MÔN HỌC</span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Cơ sở dữ liệu tập trung toàn bộ khối (K6, K7, K8, K9) với tự động tính học phí theo môn & xuất báo cáo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs lg:text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Nhập Từ Excel</span>
          </button>

          <button
            onClick={() => {
              setExportInitialType('all');
              setIsExportModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs lg:text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel Danh Sách</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs lg:text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Học Sinh Mới</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        {/* Row 1: Grade Tabs & Quick Stats & Fast Export */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'all', label: 'Tất Cả Khối', count: students.length },
              { id: 6, label: 'Khối 6', count: students.filter((s) => s.grade === 6).length },
              { id: 7, label: 'Khối 7', count: students.filter((s) => s.grade === 7).length },
              { id: 8, label: 'Khối 8', count: students.filter((s) => s.grade === 8).length },
              { id: 9, label: 'Khối 9', count: students.filter((s) => s.grade === 9).length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedGrade(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedGrade === tab.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>{tab.label}</span>
                <span className="ml-1.5 text-[10px] opacity-80 font-normal">({tab.count})</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs text-slate-500 hidden sm:flex items-center gap-3">
              <span>
                Tổng hiển thị: <strong className="text-slate-800">{filtered.length}</strong> HS
              </span>
              <span className="text-slate-300">•</span>
              <span>
                Công nợ:{' '}
                <strong className="text-rose-600">
                  {formatCurrency(filtered.reduce((acc, s) => acc + s.remainingDebt, 0))}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <button
                onClick={() => {
                  exportTuitionStudentsExcel(students, invoices, {
                    filterType: 'paid',
                    grade: selectedGrade,
                    month: 8,
                    year: 2026,
                  });
                  confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
                }}
                title="Tải ngay danh sách học sinh đã đóng đủ tiền"
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Xuất Đã Thu</span>
              </button>

              <button
                onClick={() => {
                  exportTuitionStudentsExcel(students, invoices, {
                    filterType: 'debt',
                    grade: selectedGrade,
                    month: 8,
                    year: 2026,
                  });
                  confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
                }}
                title="Tải ngay danh sách học sinh còn nợ tiền"
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Xuất Còn Nợ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Search & Dropdown Filters & Compact View */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="relative sm:col-span-5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, mã HS, SĐT, trường học..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-xs lg:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Subject Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs lg:text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tất cả môn học</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({formatShortCurrency(sub.defaultFee)})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs lg:text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tất cả học phí</option>
              <option value="paid">Đã nộp đủ</option>
              <option value="debt">Còn nợ</option>
            </select>
          </div>

          {/* Compact View Toggle */}
          <div className="sm:col-span-2 flex justify-end">
            <button
              onClick={() => setIsCompactView(!isCompactView)}
              title={isCompactView ? 'Chuyển sang chế độ xem tiêu chuẩn' : 'Chuyển sang chế độ xem thu gọn tiết kiệm diện tích'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                isCompactView
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>{isCompactView ? 'Xem Gọn: BẬT' : 'Xem Gọn'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs lg:text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className={isCompactView ? 'px-3 py-2 font-bold' : 'px-4 py-3.5 font-bold'}>Học Sinh</th>
                <th className={isCompactView ? 'px-2 py-2 font-bold' : 'px-3 py-3.5 font-bold'}>Khối / Lớp</th>
                <th className={isCompactView ? 'px-3 py-2 font-bold' : 'px-4 py-3.5 font-bold'}>Môn Đăng Ký</th>
                <th className={isCompactView ? 'px-2 py-2 font-bold' : 'px-3 py-3.5 font-bold'}>Học Phí</th>
                <th className={isCompactView ? 'px-2 py-2 font-bold' : 'px-3 py-3.5 font-bold'}>Công Nợ</th>
                <th className={isCompactView ? 'px-3 py-2 font-bold' : 'px-4 py-3.5 font-bold'}>Phụ Huynh & SĐT</th>
                <th className={isCompactView ? 'px-3 py-2 font-bold text-right' : 'px-4 py-3.5 font-bold text-right'}>Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Không tìm thấy học sinh nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filtered.map((student) => {
                  const targetInv = invoices.find((i) => i.studentId === student.id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Code */}
                      <td className={isCompactView ? 'px-3 py-1.5' : 'px-4 py-3.5'}>
                        <div className="flex items-center gap-2.5">
                          <div className={`rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-2xs ${isCompactView ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs'}`}>
                            {student.fullName.split(' ').pop()?.slice(0, 2).toUpperCase() || 'HS'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span className={isCompactView ? 'text-xs' : 'text-sm'}>{student.fullName}</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {student.gender}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-indigo-600 font-semibold">{student.code}</span>
                              {student.currentSchool && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[140px]">{student.currentSchool}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Grade & Class */}
                      <td className={isCompactView ? 'px-2 py-1.5' : 'px-3 py-3.5'}>
                        <div className="font-semibold text-slate-900 text-xs">Khối {student.grade}</div>
                        <div className="text-[10px] text-indigo-600 font-medium">Lớp {student.className}</div>
                      </td>

                      {/* Enrolled Subjects */}
                      <td className={isCompactView ? 'px-3 py-1.5' : 'px-4 py-3.5'}>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {student.enrollments.map((en) => {
                            return (
                              <span
                                key={en.id}
                                className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap"
                              >
                                {en.subjectName}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Tuition Fee */}
                      <td className={`whitespace-nowrap ${isCompactView ? 'px-2 py-1.5 text-xs' : 'px-3 py-3.5'}`}>
                        {student.tuitionWaived ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                            Miễn 100%
                          </span>
                        ) : (
                          <span className="font-bold text-slate-900">{formatCurrency(student.totalTuitionDue)}</span>
                        )}
                      </td>

                      {/* Debt */}
                      <td className={`whitespace-nowrap ${isCompactView ? 'px-2 py-1.5 text-xs' : 'px-3 py-3.5'}`}>
                        {student.tuitionWaived ? (
                          <span className="text-slate-400 text-xs font-medium">—</span>
                        ) : student.remainingDebt > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-rose-600">
                              {formatCurrency(student.remainingDebt)}
                            </span>
                            <button
                              onClick={() => targetInv && onOpenPaymentModal(targetInv.id)}
                              className="px-1.5 py-0.5 text-[9px] rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors font-bold cursor-pointer"
                            >
                              Thu
                            </button>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đã đủ</span>
                          </span>
                        )}
                      </td>

                      {/* Parent info */}
                      <td className={isCompactView ? 'px-3 py-1.5' : 'px-4 py-3.5'}>
                        <div className="text-slate-800 font-medium text-xs">{student.parentName}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-slate-400" />
                          <span>{student.parentPhone}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className={`text-right ${isCompactView ? 'px-3 py-1.5' : 'px-4 py-3.5'}`}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingStudent(student)}
                            title="Xem hồ sơ chi tiết"
                            className="p-1 rounded-md bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(student)}
                            title="Chỉnh sửa thông tin"
                            className="p-1 rounded-md bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc chắn muốn xóa học sinh ${student.fullName}?`)) {
                                deleteStudent(student.id);
                              }
                            }}
                            title="Xóa học sinh"
                            className="p-1 rounded-md bg-slate-100 text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>{editingStudent ? 'Chỉnh Sửa Học Sinh' : 'Thêm Học Sinh Mới'}</span>
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {duplicateWarning && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs lg:text-sm">
              {/* Row 1: Code & Full Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1 flex items-center justify-between">
                    <span>Mã Học Sinh *</span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextCode = generateNextStudentCode(formData.grade);
                        setFormData({ ...formData, code: nextCode });
                        confetti({ particleCount: 30, spread: 40, origin: { y: 0.6 } });
                      }}
                      className="text-[10px] text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Tự động tạo mã học sinh mới theo khối lớp hiện tại"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Tự tạo mã</span>
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                      className="w-full pl-3 pr-10 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextCode = generateNextStudentCode(formData.grade);
                        setFormData({ ...formData, code: nextCode });
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      title="Làm mới mã"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-medium mb-1">Họ Và Tên Học Sinh *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    onBlur={handleNameOrPhoneBlur}
                    placeholder="VD: Nguyễn Văn An"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Row 2: DOB, Gender, Grade, Class */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Khối Lớp</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => {
                      const newGrade = Number(e.target.value);
                      const nextCode = !editingStudent ? generateNextStudentCode(newGrade) : formData.code;
                      setFormData({
                        ...formData,
                        grade: newGrade,
                        className: `${newGrade}A1`,
                        code: nextCode,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500 cursor-pointer font-semibold"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>
                        Khối {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Tên Lớp</label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    placeholder="8A1"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Giới Tính</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Ngày Sinh</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Row 3: School & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Trường Đang Học</label>
                  <input
                    type="text"
                    value={formData.currentSchool}
                    onChange={(e) => setFormData({ ...formData, currentSchool: e.target.value })}
                    placeholder="VD: THCS Cầu Giấy"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Địa Chỉ Nhà</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="VD: Số 12 Cầu Giấy, Hà Nội"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Row 4: Parent Information */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Thông Tin Phụ Huynh (Bắt Buộc)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Họ Tên Phụ Huynh *</label>
                    <input
                      type="text"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="VD: Nguyễn Văn Hùng"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">SĐT Phụ Huynh / Zalo *</label>
                    <input
                      type="text"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      onBlur={handleNameOrPhoneBlur}
                      placeholder="VD: 0988112201"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Mối Quan Hệ</label>
                    <select
                      value={formData.parentRelationship}
                      onChange={(e) => setFormData({ ...formData, parentRelationship: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                    >
                      <option value="Bố">Bố</option>
                      <option value="Mẹ">Mẹ</option>
                      <option value="Người giám hộ">Người giám hộ</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 5: ĐĂNG KÝ MÔN HỌC & TỰ ĐỘNG TÍNH HỌC PHÍ */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100/50 pb-2.5">
                  <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span>Đăng Ký Môn Học & Học Phí Hàng Tháng</span>
                  </div>
                  
                  {/* Tuition Waive Toggle */}
                  <label className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.tuitionWaived}
                      onChange={(e) => setFormData({ ...formData, tuitionWaived: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold">Miễn 100% học phí</span>
                  </label>
                  
                  <div className="text-xs font-bold text-indigo-700 font-mono">
                    {formData.tuitionWaived ? (
                      <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">MIỄN HỌC PHÍ (0 ₫)</span>
                    ) : (
                      <span>Tổng: {formatCurrency(totalFormFee)} / tháng</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {subjects.map((sub) => {
                    const isChecked = formData.enrolledSubjectIds.includes(sub.id);
                    return (
                      <label
                        key={sub.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-indigo-600 text-white font-semibold border-indigo-600'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  enrolledSubjectIds: [...formData.enrolledSubjectIds, sub.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  enrolledSubjectIds: formData.enrolledSubjectIds.filter((id) => id !== sub.id),
                                });
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-0"
                          />
                          <span>{sub.name}</span>
                        </div>
                        <span className={`text-[11px] font-mono ${isChecked ? 'text-indigo-100' : 'text-slate-500'}`}>
                          {formatShortCurrency(sub.gradeFees && sub.gradeFees[formData.grade] !== undefined ? sub.gradeFees[formData.grade] : sub.defaultFee)}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {formData.enrolledSubjectIds.length > 0 && !formData.tuitionWaived && (
                  <div className="mt-3 bg-white p-3.5 rounded-lg border border-indigo-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Tùy chỉnh số tiền học phí cho từng môn học đã chọn:
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {formData.enrolledSubjectIds.map((subId) => {
                        const sub = subjects.find((s) => s.id === subId);
                        if (!sub) return null;
                        
                        const defaultOrGradeFee = sub.gradeFees && sub.gradeFees[formData.grade] !== undefined
                          ? sub.gradeFees[formData.grade]
                          : sub.defaultFee;
                          
                        const currentFee = formData.customSubjectFees[subId] !== undefined
                          ? formData.customSubjectFees[subId]
                          : defaultOrGradeFee;
                          
                        return (
                          <div key={subId} className="flex items-center justify-between gap-3 text-xs bg-slate-50 p-2 rounded-md border border-slate-200">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                              <span className="font-semibold text-slate-700">{sub.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <input
                                type="number"
                                value={currentFee}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setFormData({
                                    ...formData,
                                    customSubjectFees: {
                                      ...formData.customSubjectFees,
                                      [subId]: isNaN(val) ? 0 : val,
                                    }
                                  });
                                }}
                                className="w-24 px-2 py-1 rounded border border-slate-200 bg-white font-mono font-bold text-right text-xs text-indigo-700 focus:outline-none focus:border-indigo-500"
                              />
                              <span className="text-slate-500 font-bold">₫</span>
                              
                              {formData.customSubjectFees[subId] !== undefined && formData.customSubjectFees[subId] !== defaultOrGradeFee && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextCustomFees = { ...formData.customSubjectFees };
                                    delete nextCustomFees[subId];
                                    setFormData({
                                      ...formData,
                                      customSubjectFees: nextCustomFees,
                                    });
                                  }}
                                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium ml-1 cursor-pointer"
                                  title="Khôi phục học phí chuẩn"
                                >
                                  Đặt lại
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-600 font-medium mb-1">Ghi Chú Học Sinh</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Ghi chú về học lực, tính cách, nhu cầu bồi dưỡng..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingStudent ? 'Cập Nhật Học Sinh' : 'Lưu & Tạo Học Phí'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewing Student Detail Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg shadow-xs">
                  {viewingStudent.fullName.split(' ').pop()?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{viewingStudent.fullName}</h2>
                  <div className="text-xs text-slate-500 font-mono">
                    Mã: {viewingStudent.code} • Khối {viewingStudent.grade} ({viewingStudent.className})
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs lg:text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hồ Sơ Học Tập</div>
                <div><strong>Trường:</strong> {viewingStudent.currentSchool}</div>
                <div><strong>Ngày sinh:</strong> {viewingStudent.dob || '2012-05-15'} ({viewingStudent.gender})</div>
                <div><strong>SĐT Học sinh:</strong> {viewingStudent.phone || 'Chưa cập nhật'}</div>
                <div><strong>Địa chỉ:</strong> {viewingStudent.address}</div>
                <div><strong>Ghi chú:</strong> {viewingStudent.notes || 'Không có'}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Liên Hệ Phụ Huynh</div>
                <div><strong>Người liên hệ:</strong> {viewingStudent.parentName} ({viewingStudent.parentRelationship})</div>
                <div><strong>Số điện thoại:</strong> {viewingStudent.parentPhone}</div>
                <div><strong>Zalo:</strong> {viewingStudent.zalo || viewingStudent.parentPhone}</div>
                <div><strong>Ngày nhập học:</strong> {viewingStudent.joinedDate}</div>
              </div>
            </div>

            {/* Enrolled subjects & Tuition balance */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Môn Đăng Ký & Học Phí
                </span>
                <span className="text-sm font-bold text-emerald-600">
                  {viewingStudent.tuitionWaived ? (
                    <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-xs">MIỄN HỌC PHÍ 100%</span>
                  ) : (
                    <span>{formatCurrency(viewingStudent.totalTuitionDue)}/tháng</span>
                  )}
                </span>
              </div>

              <div className="space-y-2">
                {viewingStudent.enrollments.map((en) => (
                  <div
                    key={en.id}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-800">{en.subjectName}</span>
                    <span className="font-mono text-slate-600">
                      {viewingStudent.tuitionWaived ? 'Được miễn (0 ₫)' : formatCurrency(en.finalFee)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span>Đã nộp: <strong className="text-emerald-600">{formatCurrency(viewingStudent.totalPaid)}</strong></span>
                <span>Công nợ còn lại: <strong className="text-rose-600">{viewingStudent.tuitionWaived ? '0 ₫' : formatCurrency(viewingStudent.remainingDebt)}</strong></span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tuition Export Modal */}
      <TuitionExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        initialType={exportInitialType}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
