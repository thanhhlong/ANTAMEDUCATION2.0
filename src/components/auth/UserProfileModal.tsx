import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Shield,
  GraduationCap,
  Users,
  BookOpen,
  UserCheck,
  ReceiptText,
  KeyRound,
  Mail,
  Phone,
  LogOut,
  X,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLoginModal: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenLoginModal,
}) => {
  const { currentUser, logout, changePassword, updateUserProfile, setIsLoginPageView } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [fullName, setFullName] = useState(currentUser?.fullName || '');

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !currentUser) return null;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Quản Trị Viên', icon: Shield, bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'ACADEMIC_MANAGER':
        return { label: 'Phòng Đào Tạo', icon: BookOpen, bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'ACCOUNTANT':
        return { label: 'Kế Toán Trưởng', icon: ReceiptText, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'TEACHER':
        return { label: 'Giáo Viên', icon: BookOpen, bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'TUTOR':
        return { label: 'Trợ Giảng / Gia Sư', icon: UserCheck, bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'PARENT':
        return { label: 'Phụ Huynh', icon: Users, bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'STUDENT':
        return { label: 'Học Sinh', icon: GraduationCap, bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      default:
        return { label: role, icon: User, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);
  const RoleIcon = roleInfo.icon;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
    setStatusMessage({ type: 'success', text: 'Cập nhật thông tin tài khoản thành công!' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Mật khẩu mới và xác nhận mật khẩu không khớp' });
      return;
    }

    const res = await changePassword(oldPassword, newPassword);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message || 'Đổi mật khẩu thành công!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Không thể đổi mật khẩu' });
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
    onOpenLoginModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative text-slate-800 my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 font-extrabold flex items-center justify-center text-xl text-white shadow-sm border border-indigo-400/30">
              {currentUser.fullName.split(' ').pop()?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {currentUser.fullName}
                </h3>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${roleInfo.bg}`}>
                  <RoleIcon className="w-3 h-3" />
                  <span>{roleInfo.label}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {currentUser.title || currentUser.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('profile');
              setStatusMessage(null);
            }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Thông Tin Cá Nhân</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('password');
              setStatusMessage(null);
            }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'password'
                ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Đổi Mật Khẩu</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-1">
                  <div className="text-slate-500 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>Bộ phận / Chức danh</span>
                  </div>
                  <div className="font-bold text-slate-900">{currentUser.title}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Lần đăng nhập gần nhất</span>
                  </div>
                  <div className="font-mono font-bold text-slate-800">
                    {currentUser.lastLogin || 'Vừa xong'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    logout();
                    setIsLoginPageView(true);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng Xuất</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setIsLoginPageView(true);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Đến Trang Đăng Nhập
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Lưu Thay Đổi
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại (Mặc định: 123)"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 3 ký tự"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Đổi Mật Khẩu
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
