import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AuthUser, UserRole, PermissionKey } from '../../types';
import { ROLE_PERMISSION_CONFIGS } from '../../data/initialData';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Key,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Check,
  X,
  Edit2,
  Sparkles,
  BookOpen,
  CreditCard,
  GraduationCap,
  Settings,
  Trash2,
  CheckSquare,
  Square,
  MinusSquare,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const RolePermissionManager: React.FC = () => {
  const {
    users,
    currentUser,
    addNewUser,
    updateUser,
    deleteUser,
    deleteUsers,
    toggleUserStatus,
    tutors,
    students,
    syncAcademicToOperations,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'matrix' | 'add'>('users');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<AuthUser | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delete Modals & Batch Selection State
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // New User Form State
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'TEACHER' as UserRole,
    title: '',
    department: 'Tổ Tự Nhiên',
    assignedClasses: '8A1, 8A2, 9A1',
    password: '123',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.fullName || !formData.email) {
      showToast('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    const classesArray = formData.assignedClasses
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    addNewUser({
      username: formData.username.toLowerCase().trim(),
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: formData.role,
      title: formData.title.trim() || (formData.role === 'TEACHER' ? 'Giáo viên bộ môn' : 'Nhân sự trung tâm'),
      department: formData.department.trim(),
      assignedClasses: classesArray.length > 0 ? classesArray : undefined,
      password: formData.password || '123',
      isActive: true,
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    showToast(`Đã tạo tài khoản ${formData.fullName} (${formData.role}) thành công!`);
    setFormData({
      username: '',
      fullName: '',
      email: '',
      phone: '',
      role: 'TEACHER',
      title: '',
      department: 'Tổ Tự Nhiên',
      assignedClasses: '8A1, 8A2, 9A1',
      password: '123',
    });
    setActiveTab('users');
  };

  const handleResetPassword = (user: AuthUser) => {
    updateUser(user.id, { password: '123' });
    showToast(`Đã đặt lại mật khẩu cho ${user.fullName} về mặc định (123)`);
  };

  const handleConfirmSingleDelete = () => {
    if (!userToDelete) return;
    const name = userToDelete.fullName;
    deleteUser(userToDelete.id);
    setSelectedUserIds((prev) => prev.filter((id) => id !== userToDelete.id));
    if (selectedUserForEdit?.id === userToDelete.id) {
      setSelectedUserForEdit(null);
    }
    setUserToDelete(null);
    showToast(`Đã xóa tài khoản ${name} thành công`);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedUserIds.length === 0) return;
    const count = selectedUserIds.length;
    if (deleteUsers) {
      deleteUsers(selectedUserIds);
    } else {
      selectedUserIds.forEach((id) => deleteUser(id));
    }
    if (selectedUserForEdit && selectedUserIds.includes(selectedUserForEdit.id)) {
      setSelectedUserForEdit(null);
    }
    setSelectedUserIds([]);
    setIsBulkDeleteOpen(false);
    showToast(`Đã xóa ${count} tài khoản thành công`);
  };

  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));
    return matchRole && matchSearch;
  });

  // Deletable users in current filter (exclude self and SUPER_ADMIN)
  const deletableFilteredUsers = filteredUsers.filter(
    (u) => u.id !== currentUser?.id && u.role !== 'SUPER_ADMIN'
  );

  const allFilteredSelected =
    deletableFilteredUsers.length > 0 &&
    deletableFilteredUsers.every((u) => selectedUserIds.includes(u.id));
  const someFilteredSelected = selectedUserIds.length > 0 && !allFilteredSelected;

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      const deletableSet = new Set(deletableFilteredUsers.map((u) => u.id));
      setSelectedUserIds((prev) => prev.filter((id) => !deletableSet.has(id)));
    } else {
      const deletableIds = deletableFilteredUsers.map((u) => u.id);
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...deletableIds])));
    }
  };

  const handleToggleSelectUser = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uId) => uId !== id) : [...prev, id]
    );
  };

  const allPermissionsList: { key: PermissionKey; label: string; desc: string; category: string }[] = [
    { key: 'VIEW_DASHBOARD', label: 'Xem Báo Cáo / Dashboard', desc: 'Truy cập màn hình tổng quan chỉ số', category: 'Tổng quan' },
    { key: 'MANAGE_USERS', label: 'Quản Trị Phân Quyền & Tài Khoản', desc: 'Tạo, sửa, khóa tài khoản nhân sự & giáo viên', category: 'Hệ thống' },
    { key: 'VIEW_FINANCE', label: 'Xem Học Phí & Công Nợ', desc: 'Xem danh sách hóa đơn, số tiền đã thu và nợ', category: 'Tài chính' },
    { key: 'MANAGE_FINANCE', label: 'Thu Học Phí & Xuất Biên Lai', desc: 'Ghi nhận thanh toán và tạo hóa đơn mới', category: 'Tài chính' },
    { key: 'MANAGE_EXPENSES', label: 'Quản Lý Chi Phí Nội Bộ', desc: 'Ghi nhận chi phí lương, mặt bằng, điện nước', category: 'Tài chính' },
    { key: 'MANAGE_CRM', label: 'Quản Lý CRM & Tuyển Sinh', desc: 'Tiếp nhận lead, tư vấn và chuyển đổi học viên', category: 'Kinh doanh' },
    { key: 'VIEW_ALL_STUDENTS', label: 'Xem Toàn Bộ Học Sinh Trung Tâm', desc: 'Tra cứu hồ sơ của mọi học sinh các khối', category: 'Học vụ' },
    { key: 'MANAGE_STUDENTS', label: 'Thêm / Sửa / Xóa Hồ Sơ Học Sinh', desc: 'Chỉnh sửa thông tin học phí, lớp học sinh', category: 'Học vụ' },
    { key: 'MANAGE_TIMETABLE', label: 'Xếp Lịch & Thời Khóa Biểu', desc: 'Phân công ca dạy, phòng học, giáo viên, trợ giảng', category: 'Đào tạo' },
    { key: 'MANAGE_ATTENDANCE', label: 'Sổ Điểm Danh & Nhận Xét', desc: 'Điểm danh buổi học, Face AI, gửi nhận xét phụ huynh', category: 'Đào tạo' },
    { key: 'MANAGE_LMS', label: 'Tạo Khóa Học & Đề Thi LMS', desc: 'Tạo bài tập, quiz, ngân hàng câu hỏi AI', category: 'Đào tạo' },
    { key: 'GRADE_SUBMISSIONS', label: 'Chấm Điểm & Phản Hồi Bài Nộp', desc: 'Chấm bài tập về nhà của học sinh trên LMS', category: 'Đào tạo' },
    { key: 'MANAGE_TUTORING', label: 'Quản Lý Gia Sư Bồi Dưỡng', desc: 'Điều phối học kèm riêng 1-1, 1-2 theo yêu cầu', category: 'Gia sư' },
    { key: 'VIEW_AI_INSIGHTS', label: 'Cố Vấn Chiến Lược Doanh Nghiệp AI', desc: 'Xem phân tích dòng tiền và dự báo phát triển', category: 'Chiến lược' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 p-3.5 rounded-xl bg-slate-900 text-white shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shadow-md border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-black tracking-tight">
                Phân Quyền & Quản Trị Tài Khoản
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Thiết lập vai trò riêng biệt cho Ban Quản Trị, Giáo Viên, Kế Toán & Trợ Giảng
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls & Sync Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Danh Sách ({users.length})</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                <span>Ma Trận</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('add')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'add'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Thêm</span>
              </span>
            </button>
          </div>

          <button
            onClick={() => {
              if (syncAcademicToOperations) {
                const res = syncAcademicToOperations();
                showToast(`Đã đồng bộ ${res.syncedTutors} giáo viên và ${res.syncedStudents} học sinh thành công!`);
                confetti({
                  particleCount: 50,
                  spread: 60,
                  origin: { y: 0.6 },
                });
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            title="Đồng bộ toàn bộ giáo viên và học sinh từ phần Học Tập sang Quản Trị & Vận Hành"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Đồng Bộ Học Tập ({tutors.length} GV / {students.length} HS)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USER LIST */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Quick Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Vai trò:</span>
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                  roleFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({users.length})
              </button>
              <button
                onClick={() => setRoleFilter('SUPER_ADMIN')}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                  roleFilter === 'SUPER_ADMIN'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                Quản Trị Viên
              </button>
              <button
                onClick={() => setRoleFilter('TEACHER')}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                  roleFilter === 'TEACHER'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Giáo Viên
              </button>
              <button
                onClick={() => setRoleFilter('ACCOUNTANT')}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                  roleFilter === 'ACCOUNTANT'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Kế Toán
              </button>
              <button
                onClick={() => setRoleFilter('TUTOR')}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                  roleFilter === 'TUTOR'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                Trợ Giảng
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên, email, sđt..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-full sm:w-60"
              />
              <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Bulk Action Bar (when accounts are selected) */}
          {selectedUserIds.length > 0 && (
            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
                  {selectedUserIds.length}
                </span>
                <span>Đang chọn {selectedUserIds.length} tài khoản nhân sự / thầy cô</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserIds([])}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Bỏ chọn tất cả
                </button>

                <button
                  type="button"
                  onClick={() => setIsBulkDeleteOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa {selectedUserIds.length} tài khoản đã chọn</span>
                </button>
              </div>
            </div>
          )}

          {/* User Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 w-10">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 cursor-pointer"
                        title="Chọn tất cả tài khoản có thể xóa"
                      >
                        {allFilteredSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : someFilteredSelected ? (
                          <MinusSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4">Tài Khoản & Họ Tên</th>
                    <th className="py-3.5 px-4">Vai Trò & Chức Danh</th>
                    <th className="py-3.5 px-4">Phụ Trách Lớp</th>
                    <th className="py-3.5 px-4">Liên Hệ</th>
                    <th className="py-3.5 px-4">Trạng Thái</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const isSelf = currentUser?.id === user.id;
                    const isSuperAdmin = user.role === 'SUPER_ADMIN';
                    const canDelete = !isSelf && !isSuperAdmin;
                    const isSelected = selectedUserIds.includes(user.id);
                    const roleConfig = ROLE_PERMISSION_CONFIGS.find((c) => c.role === user.role);

                    return (
                      <tr
                        key={user.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-indigo-50/30' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={(e) => handleToggleSelectUser(user.id, e)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 cursor-pointer"
                              title={isSelected ? 'Bỏ chọn' : 'Chọn tài khoản này'}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          ) : (
                            <span className="inline-block w-4 h-4" />
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 font-black text-xs flex items-center justify-center border border-slate-200 shrink-0">
                              {user.fullName.split(' ').pop()?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{user.fullName}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[9px] font-bold">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 font-mono text-[11px]">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                                roleConfig?.badgeBg || 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {roleConfig?.roleName || user.role}
                            </span>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {user.title || user.department}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {user.assignedClasses && user.assignedClasses.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.assignedClasses.map((c) => (
                                <span
                                  key={c}
                                  className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          <div>{user.email}</div>
                          <div className="text-[11px] text-slate-400">{user.phone || 'Chưa cập nhật'}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.isActive !== false
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            {user.isActive !== false ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reset Password */}
                            <button
                              type="button"
                              onClick={() => handleResetPassword(user)}
                              title="Đặt lại mật khẩu mặc định (123)"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>

                            {/* Lock / Unlock Toggle */}
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => {
                                  toggleUserStatus(user.id);
                                  showToast(
                                    `Đã ${user.isActive !== false ? 'khóa' : 'mở khóa'} tài khoản ${user.fullName}`
                                  );
                                }}
                                title={user.isActive !== false ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  user.isActive !== false
                                    ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                    : 'text-rose-600 hover:bg-rose-50'
                                }`}
                              >
                                {user.isActive !== false ? (
                                  <Lock className="w-3.5 h-3.5" />
                                ) : (
                                  <Unlock className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            {/* Edit Modal */}
                            <button
                              type="button"
                              onClick={() => setSelectedUserForEdit(user)}
                              title="Chỉnh sửa thông tin & phân quyền"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button (with safe confirmation modal) */}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => setUserToDelete(user)}
                                title="Xóa tài khoản thầy cô / nhân sự"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERMISSIONS MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Bảng Ma Trận Phân Quyền Chuẩn AN TÂM EDUCATION</span>
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hệ thống tự động áp dụng chính sách bảo mật đa tầng: <strong>Quản Trị Viên</strong> nắm toàn quyền tài chính, chi phí và nhân sự; <strong>Giáo Viên</strong> tập trung vào lớp dạy, sổ điểm danh, chấm bài và LMS; <strong>Kế Toán</strong> phụ trách học phí và công nợ; <strong>Trợ Giảng</strong> phụ trách điểm danh và kèm cặp.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px]">
                    <th className="py-3.5 px-4 w-72">Quyền Hạn / Tính Năng</th>
                    <th className="py-3.5 px-3 text-center">Quản Trị Viên</th>
                    <th className="py-3.5 px-3 text-center bg-emerald-950/70 text-emerald-300">
                      Giáo Viên
                    </th>
                    <th className="py-3.5 px-3 text-center">Kế Toán</th>
                    <th className="py-3.5 px-3 text-center">Trợ Giảng</th>
                    <th className="py-3.5 px-3 text-center">Phụ Huynh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allPermissionsList.map((perm) => {
                    const adminConfig = ROLE_PERMISSION_CONFIGS.find((c) => c.role === 'SUPER_ADMIN');
                    const teacherConfig = ROLE_PERMISSION_CONFIGS.find((c) => c.role === 'TEACHER');
                    const accountantConfig = ROLE_PERMISSION_CONFIGS.find((c) => c.role === 'ACCOUNTANT');
                    const tutorConfig = ROLE_PERMISSION_CONFIGS.find((c) => c.role === 'TUTOR');
                    const parentConfig = ROLE_PERMISSION_CONFIGS.find((c) => c.role === 'PARENT');

                    const hasAdmin = adminConfig?.permissions.includes(perm.key);
                    const hasTeacher = teacherConfig?.permissions.includes(perm.key);
                    const hasAccountant = accountantConfig?.permissions.includes(perm.key);
                    const hasTutor = tutorConfig?.permissions.includes(perm.key);
                    const hasParent = parentConfig?.permissions.includes(perm.key);

                    return (
                      <tr key={perm.key} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{perm.label}</div>
                          <div className="text-[11px] text-slate-500">{perm.desc}</div>
                        </td>

                        {/* Admin */}
                        <td className="py-3 px-3 text-center">
                          {hasAdmin ? (
                            <span className="inline-flex p-1 rounded-md bg-indigo-50 text-indigo-700">
                              <Check className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="inline-flex p-1 rounded-md bg-slate-50 text-slate-300">
                              <X className="w-4 h-4" />
                            </span>
                          )}
                        </td>

                        {/* Teacher */}
                        <td className="py-3 px-3 text-center bg-emerald-50/30">
                          {hasTeacher ? (
                            <span className="inline-flex p-1 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                              <Check className="w-4 h-4 text-emerald-700" />
                            </span>
                          ) : (
                            <span className="inline-flex p-1 rounded-md bg-slate-50 text-slate-300">
                              <X className="w-4 h-4" />
                            </span>
                          )}
                        </td>

                        {/* Accountant */}
                        <td className="py-3 px-3 text-center">
                          {hasAccountant ? (
                            <span className="inline-flex p-1 rounded-md bg-amber-50 text-amber-700">
                              <Check className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="inline-flex p-1 rounded-md bg-slate-50 text-slate-300">
                              <X className="w-4 h-4" />
                            </span>
                          )}
                        </td>

                        {/* Tutor */}
                        <td className="py-3 px-3 text-center">
                          {hasTutor ? (
                            <span className="inline-flex p-1 rounded-md bg-purple-50 text-purple-700">
                              <Check className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="inline-flex p-1 rounded-md bg-slate-50 text-slate-300">
                              <X className="w-4 h-4" />
                            </span>
                          )}
                        </td>

                        {/* Parent */}
                        <td className="py-3 px-3 text-center">
                          {hasParent ? (
                            <span className="inline-flex p-1 rounded-md bg-rose-50 text-rose-700">
                              <Check className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="inline-flex p-1 rounded-md bg-slate-50 text-slate-300">
                              <X className="w-4 h-4" />
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ADD NEW USER FORM */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs max-w-2xl mx-auto space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              <span>Thêm Tài Khoản Giáo Viên / Quản Trị / Nhân Sự Mới</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cấp tài khoản đăng nhập nội bộ cho cán bộ, giáo viên giảng dạy
            </p>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên đăng nhập (Username) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="VD: gv.hung, admin.loan..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ và tên đầy đủ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="VD: Thầy Trần Quốc Hùng"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Vai trò hệ thống <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="TEACHER">Giáo Viên Chuyên Môn</option>
                  <option value="SUPER_ADMIN">Quản Trị Viên Cấp Cao</option>
                  <option value="ACADEMIC_MANAGER">Phòng Đào Tạo & Khảo Thí</option>
                  <option value="ACCOUNTANT">Kế Toán Trưởng</option>
                  <option value="TUTOR">Trợ Giảng / Gia Sư</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mật khẩu khởi tạo
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mặc định: 123"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email làm việc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="gv.hung@antam.edu.vn"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0912.345.678"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chức danh / Học vị
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Thạc Sĩ Sư Phạm Toán"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tổ chuyên môn / Phòng ban
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="VD: Tổ Tự Nhiên, Tổ Ngoại Ngữ..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* If Teacher: Classes Assigned */}
            {formData.role === 'TEACHER' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Các lớp phân công phụ trách (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={formData.assignedClasses}
                  onChange={(e) => setFormData({ ...formData, assignedClasses: e.target.value })}
                  placeholder="VD: 8A1, 8A2, 9A1"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Giáo viên khi đăng nhập sẽ chỉ nhìn thấy danh sách và lịch dạy của các lớp này.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-md transition-colors flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tạo Tài Khoản Ngay</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit User Modal */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <span>Chỉnh Sửa Tài Khoản & Phân Quyền</span>
              </h3>
              <button
                onClick={() => setSelectedUserForEdit(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={selectedUserForEdit.fullName}
                  onChange={(e) =>
                    setSelectedUserForEdit({ ...selectedUserForEdit, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vai trò</label>
                  <select
                    value={selectedUserForEdit.role}
                    onChange={(e) =>
                      setSelectedUserForEdit({
                        ...selectedUserForEdit,
                        role: e.target.value as UserRole,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-semibold"
                  >
                    <option value="SUPER_ADMIN">Quản Trị Viên Cấp Cao</option>
                    <option value="TEACHER">Giáo Viên Chuyên Môn</option>
                    <option value="ACADEMIC_MANAGER">Phòng Đào Tạo</option>
                    <option value="ACCOUNTANT">Kế Toán Trưởng</option>
                    <option value="TUTOR">Trợ Giảng</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mật khẩu mới</label>
                  <input
                    type="text"
                    placeholder="Để trống nếu không đổi"
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedUserForEdit({
                          ...selectedUserForEdit,
                          password: e.target.value,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lớp phụ trách (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={selectedUserForEdit.assignedClasses?.join(', ') || ''}
                  onChange={(e) => {
                    const cls = e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setSelectedUserForEdit({
                      ...selectedUserForEdit,
                      assignedClasses: cls,
                    });
                  }}
                  placeholder="8A1, 8A2, 9A1"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  {selectedUserForEdit.id !== currentUser?.id && selectedUserForEdit.role !== 'SUPER_ADMIN' && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedUserForEdit;
                        setSelectedUserForEdit(null);
                        setUserToDelete(target);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Xóa tài khoản này</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForEdit(null)}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold cursor-pointer text-xs"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateUser(selectedUserForEdit.id, selectedUserForEdit);
                      showToast(`Đã cập nhật thông tin cho ${selectedUserForEdit.fullName}`);
                      setSelectedUserForEdit(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs text-xs"
                  >
                    Lưu Thay Đổi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single User Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Xác Nhận Xóa Tài Khoản</h3>
                <p className="text-xs text-slate-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 space-y-2 text-xs">
              <div className="text-slate-700 font-medium">
                Bạn có chắc chắn muốn xóa tài khoản của thầy/cô <strong className="text-rose-700 font-bold">{userToDelete.fullName}</strong> (@{userToDelete.username})?
              </div>
              <div className="text-slate-500 text-[11px] space-y-0.5 pt-1 border-t border-rose-200/50">
                <div>• <strong>Vai trò:</strong> {userToDelete.role} - {userToDelete.title || userToDelete.department}</div>
                <div>• <strong>Email:</strong> {userToDelete.email}</div>
                {userToDelete.phone && <div>• <strong>SĐT:</strong> {userToDelete.phone}</div>}
                {userToDelete.assignedClasses && userToDelete.assignedClasses.length > 0 && (
                  <div>• <strong>Lớp phụ trách:</strong> {userToDelete.assignedClasses.join(', ')}</div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
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
                <h3 className="font-bold text-base text-slate-900">Xóa Hàng Loạt Tài Khoản</h3>
                <p className="text-xs text-slate-500">Đang chọn {selectedUserIds.length} tài khoản</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 space-y-2 text-xs">
              <div className="text-slate-700 font-medium">
                Bạn có chắc chắn muốn xóa vĩnh viễn <strong className="text-rose-700 font-bold">{selectedUserIds.length} tài khoản</strong> đã chọn?
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Các nhân sự này sẽ không thể đăng nhập vào hệ thống quản lý trung tâm nữa. Dữ liệu phân quyền và lớp phụ trách sẽ được thu hồi.
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
                <span>Xóa {selectedUserIds.length} Tài Khoản</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
