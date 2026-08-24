import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { AnTamLogo } from '../common/AnTamLogo';
import {
  LogIn,
  X,
  Eye,
  EyeOff,
  Shield,
  GraduationCap,
  Users,
  BookOpen,
  UserCheck,
  ReceiptText,
  KeyRound,
  Mail,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, registerUser, quickLoginAsRole, users } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  
  // Login Form
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Register Form
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('PARENT');
  const [regGrade, setRegGrade] = useState<number>(8);
  const [regStudentCode, setRegStudentCode] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Forgot Password
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  if (!isOpen) return null;

  const quickRoles: {
    role: UserRole;
    label: string;
    sub: string;
    icon: any;
    color: string;
  }[] = [
    {
      role: 'SUPER_ADMIN',
      label: 'Quản Trị Viên',
      sub: 'admin@antam.edu.vn',
      icon: Shield,
      color: 'border-indigo-200 hover:border-indigo-500 bg-indigo-50/50 text-indigo-700',
    },
    {
      role: 'ACADEMIC_MANAGER',
      label: 'Phòng Đào Tạo',
      sub: 'daotao@antam.edu.vn',
      icon: BookOpen,
      color: 'border-blue-200 hover:border-blue-500 bg-blue-50/50 text-blue-700',
    },
    {
      role: 'ACCOUNTANT',
      label: 'Kế Toán Trưởng',
      sub: 'ketoan@antam.edu.vn',
      icon: ReceiptText,
      color: 'border-emerald-200 hover:border-emerald-500 bg-emerald-50/50 text-emerald-700',
    },
    {
      role: 'TEACHER',
      label: 'Giáo Viên',
      sub: 'gv.nam@antam.edu.vn',
      icon: BookOpen,
      color: 'border-amber-200 hover:border-amber-500 bg-amber-50/50 text-amber-700',
    },
    {
      role: 'TUTOR',
      label: 'Trợ Giảng / Gia Sư',
      sub: 'tg.thao@antam.edu.vn',
      icon: UserCheck,
      color: 'border-purple-200 hover:border-purple-500 bg-purple-50/50 text-purple-700',
    },
    {
      role: 'PARENT',
      label: 'Phụ Huynh',
      sub: 'ph.mai@gmail.com',
      icon: Users,
      color: 'border-rose-200 hover:border-rose-500 bg-rose-50/50 text-rose-700',
    },
    {
      role: 'STUDENT',
      label: 'Học Sinh (K8)',
      sub: 'hs.an@antam.edu.vn',
      icon: GraduationCap,
      color: 'border-cyan-200 hover:border-cyan-500 bg-cyan-50/50 text-cyan-700',
    },
  ];

  const handleQuickLogin = (role: UserRole) => {
    setErrorMessage(null);
    quickLoginAsRole(role);
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.6 },
    });
    onClose();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await login(identifier, password);
      if (res.success) {
        setSuccessMessage(res.message || 'Đăng nhập thành công!');
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        setErrorMessage(res.message || 'Thông tin đăng nhập không chính xác');
      }
    } catch (err: any) {
      setErrorMessage('Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regFullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên');
      return;
    }
    if (!regEmail.trim() && !regPhone.trim()) {
      setErrorMessage('Vui lòng cung cấp ít nhất email hoặc số điện thoại');
      return;
    }
    if (regPassword.length < 3) {
      setErrorMessage('Mật khẩu phải có ít nhất 3 ký tự');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const username = regEmail ? regEmail.split('@')[0] : `user_${Date.now()}`;
      const title =
        regRole === 'PARENT'
          ? `Phụ huynh học sinh (${regPhone})`
          : regRole === 'STUDENT'
          ? `Học sinh Lớp K${regGrade}`
          : regRole === 'TUTOR'
          ? 'Trợ giảng ứng tuyển'
          : 'Thành viên mới';

      const res = await registerUser({
        username,
        email: regEmail || `${username}@antam.edu.vn`,
        phone: regPhone,
        fullName: regFullName.trim(),
        role: regRole,
        title,
        grade: regRole === 'STUDENT' ? regGrade : undefined,
        studentCode: regRole === 'STUDENT' ? regStudentCode : undefined,
        password: regPassword,
      });

      if (res.success) {
        setSuccessMessage('Đăng ký tài khoản thành công!');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setErrorMessage(res.message || 'Đăng ký thất bại');
      }
    } catch (err) {
      setErrorMessage('Không thể tạo tài khoản lúc này');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      if (!forgotIdentifier.trim()) {
        setErrorMessage('Vui lòng nhập Email hoặc SĐT đã đăng ký');
        return;
      }
      setErrorMessage(null);
      setOtpSent(true);
      setSuccessMessage('Mã xác thực OTP (6 chữ số: 123456) đã được gửi đến bạn.');
    } else {
      if (otpCode !== '123456' && otpCode !== '8888') {
        setErrorMessage('Mã OTP không đúng (Mã mẫu là 123456)');
        return;
      }
      if (!newPassword || newPassword.length < 3) {
        setErrorMessage('Mật khẩu mới phải có ít nhất 3 ký tự');
        return;
      }
      setSuccessMessage('Đặt lại mật khẩu thành công! Đang chuyển về màn hình đăng nhập...');
      setTimeout(() => {
        setMode('login');
        setOtpSent(false);
        setPassword(newPassword);
        setIdentifier(forgotIdentifier);
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative text-slate-800 my-auto">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between relative border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0 border border-slate-200">
              <AnTamLogo size="sm" variant="icon" showText={false} className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  AN TÂM EDUCATION
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  HỆ THỐNG NỘI BỘ
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {mode === 'login' && 'Đăng nhập cổng thông tin quản lý & học tập'}
                {mode === 'register' && 'Đăng ký tài khoản Phụ huynh / Học sinh'}
                {mode === 'forgot' && 'Khôi phục mật khẩu truy cập'}
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng Nhập</span>
          </button>
          <button
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Đăng Ký</span>
          </button>
          <button
            onClick={() => {
              setMode('forgot');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'forgot'
                ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Quên Mật Khẩu</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Centered Brand Presentation */}
          <div className="flex flex-col items-center justify-center pt-1 pb-3 text-center border-b border-slate-100">
            <AnTamLogo size="lg" variant="full" showText={true} />
          </div>

          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <div className="space-y-4">
              {/* Quick 1-Click Role Login Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Đăng nhập nhanh 1-Click theo vai trò:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Dành cho thử nghiệm</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {quickRoles.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => handleQuickLogin(item.role)}
                        className={`p-2 rounded-lg border text-left transition-all hover:scale-[1.02] cursor-pointer ${item.color}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-xs font-bold truncate">{item.label}</span>
                        </div>
                        <div className="text-[10px] opacity-75 truncate mt-0.5 font-mono">
                          {item.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-[11px] font-semibold">
                  Hoặc đăng nhập với tài khoản cá nhân
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên đăng nhập / Email / SĐT / Mã học sinh
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="VD: admin@antam.edu.vn, 0988123456, AT-K8-001..."
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Mật khẩu
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu (Mặc định: 123 hoặc 123456)"
                      className="w-full pl-9 pr-10 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Ghi nhớ phiên đăng nhập này</span>
                  </label>
                  <span className="text-[11px] text-slate-400">MK mặc định: 123</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Đang xác thực...' : 'Đăng Nhập Vào Hệ Thống'}</span>
                </button>
              </form>
            </div>
          )}

          {/* MODE: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tôi đăng ký với tư cách:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: 'PARENT' as UserRole, label: 'Phụ Huynh', icon: Users },
                    { role: 'STUDENT' as UserRole, label: 'Học Sinh', icon: GraduationCap },
                    { role: 'TUTOR' as UserRole, label: 'Trợ Giảng', icon: UserCheck },
                  ].map((r) => {
                    const Icon = r.icon;
                    const isSelected = regRole === r.role;
                    return (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => setRegRole(r.role)}
                        className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-bold shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="VD: Nguyễn Văn Nam, Trần Thị Mai..."
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại / Zalo *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0988112233"
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {regRole === 'STUDENT' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Khối Lớp
                    </label>
                    <select
                      value={regGrade}
                      onChange={(e) => setRegGrade(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-800"
                    >
                      {[6, 7, 8, 9].map((g) => (
                        <option key={g} value={g}>
                          Khối {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Mã HS (Nếu có)
                    </label>
                    <input
                      type="text"
                      value={regStudentCode}
                      onChange={(e) => setRegStudentCode(e.target.value)}
                      placeholder="AT-K8-099"
                      className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-800 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mật khẩu *
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Tối thiểu 3 ký tự"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Xác nhận mật khẩu *
                  </label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                {loading ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản & Đăng Nhập Ngay'}
              </button>
            </form>
          )}

          {/* MODE: FORGOT */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 space-y-1">
                <div className="font-bold">Quy trình khôi phục mật khẩu:</div>
                <div>
                  Nhập Email hoặc SĐT đã đăng ký để nhận mã OTP xác minh, sau đó tiến hành tạo mật khẩu mới.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email hoặc SĐT đăng ký *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="VD: admin@antam.edu.vn hoặc 0988123456"
                    disabled={otpSent}
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 disabled:bg-slate-100"
                  />
                </div>
              </div>

              {otpSent && (
                <div className="space-y-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã xác thực OTP (Mẫu: 123456)
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 font-mono text-center tracking-widest text-base font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                {!otpSent ? 'Gửi Mã OTP Xác Thực' : 'Xác Nhận & Đặt Lại Mật Khẩu'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
