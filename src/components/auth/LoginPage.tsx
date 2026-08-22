import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { Logo } from '../common/Logo';
import logoImg from '../../assets/images/antam_education_logo_1787304782954.jpg';
import {
  GraduationCap,
  ShieldCheck,
  Briefcase,
  Users,
  CreditCard,
  HeartHandshake,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Phone,
  ArrowRight,
  BookOpen,
  Search,
  Award,
  Calendar,
  Globe,
  Flame,
  Star,
  Check,
  MapPin,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LoginPageProps {
  onLoginSuccess?: () => void;
  onContinueAsGuest?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onContinueAsGuest,
}) => {
  const {
    loginUser,
    students,
    registerUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'parent_lookup' | 'register'>('login');
  const [selectedRoleType, setSelectedRoleType] = useState<UserRole>('SUPER_ADMIN');
  
  // Interactive Showcase Tab
  const [activeFeatureTab, setActiveFeatureTab] = useState<'so_lien_lac' | 'hoc_vu' | 'vietqr' | 'luyen_thi'>('so_lien_lac');

  // Login form state
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Parent quick lookup state
  const [lookupPhoneOrCode, setLookupPhoneOrCode] = useState('');
  const [lookupResult, setLookupResult] = useState<typeof students[0] | null>(null);

  // Register form state
  const [regData, setRegData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'STUDENT' as UserRole,
    studentCode: '',
    grade: 8,
    courseInterest: 'Toán học & Luyện thi vào 10',
    password: '',
    confirmPassword: '',
  });

  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRoleType(role);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await loginUser(identifier.trim(), password);
      if (res.success) {
        setSuccessMessage(res.message || 'Đăng nhập thành công!');
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
        });
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess();
        }, 500);
      } else {
        setErrorMessage(res.message || 'Tài khoản hoặc mật khẩu không chính xác');
      }
    } catch (err: any) {
      setErrorMessage('Đã xảy ra lỗi trong quá trình xác thực. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleParentLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const query = lookupPhoneOrCode.trim().toLowerCase();
    if (!query) return;

    const cleanQuery = query.replace(/[^0-9]/g, '');

    const found = students.find((s) => {
      const cleanParentPhone = s.parentPhone.replace(/[^0-9]/g, '');
      const cleanStudentPhone = (s.phone || '').replace(/[^0-9]/g, '');
      return (
        (cleanQuery && cleanParentPhone.includes(cleanQuery)) ||
        (cleanQuery && cleanStudentPhone.includes(cleanQuery)) ||
        s.code.toLowerCase() === query ||
        s.fullName.toLowerCase().includes(query)
      );
    });

    if (found) {
      setLookupResult(found);
      setErrorMessage(null);
    } else {
      setLookupResult(null);
      setErrorMessage('Không tìm thấy dữ liệu học viên với Số điện thoại hoặc Mã học sinh này. Vui lòng thử lại.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regData.password !== regData.confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    const res = await registerUser({
      username: regData.email ? regData.email.split('@')[0] : `user_${Date.now().toString().slice(-4)}`,
      fullName: regData.fullName,
      email: regData.email,
      phone: regData.phone,
      role: regData.role,
      grade: regData.role === 'STUDENT' || regData.role === 'PARENT' ? regData.grade : undefined,
      studentCode: regData.studentCode || undefined,
      password: regData.password,
      title: regData.role === 'STUDENT' ? `Học sinh Khối ${regData.grade}` : 'Phụ huynh học sinh',
    });

    if (res.success) {
      setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển hướng vào hệ thống An Tâm Education...');
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess();
      }, 700);
    } else {
      setErrorMessage(res.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans selection:bg-emerald-600 selection:text-white">
      {/* Main Section */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Educational Brand Showcase on Light Canvas (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6 text-left">
            <div className="space-y-5">
              
              {/* Brand Card with Hero Logo */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                <div className="bg-emerald-50/50 p-2 rounded-2xl border border-emerald-100 shrink-0">
                  <img
                    src={logoImg}
                    alt="Logo An Tâm Education"
                    className="h-16 w-16 sm:h-20 sm:w-20 object-contain"
                  />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-extrabold mb-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>antameducation.vn</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-emerald-950 leading-snug">
                    Trung Tâm Giáo Dục An Tâm
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    54/8 Phạm Hồng Thái, Buôn Ma Thuột, Đắk Lắk
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Tâm Sáng Chí Bền,<br />
                  <span className="text-emerald-800">
                    Vững Bước Tương Lai
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Cổng kết nối đa chiều giữa Nhà Trường, Giáo Viên, Học Sinh và Phụ Huynh. Quản lý điểm danh, kết quả học tập, học phí VietQR tự động và sổ liên lạc điện tử 24/7.
                </p>
              </div>

              {/* Quick Info & Contact Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs text-slate-700 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>54/8 Phạm Hồng Thái, Buôn Ma Thuột, Đắk Lắk</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Hotline / Zalo: <strong>0949.421.357</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Website: <strong className="text-emerald-800">www.antameducation.vn</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Portal Login & Lookup Box on Clean White Card (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-lg flex flex-col justify-between">
            
            <div>
              {/* Main Tabs Navigation */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 mb-5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'login'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng Nhập</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('parent_lookup');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'parent_lookup'
                      ? 'bg-indigo-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Tra Cứu Phụ Huynh</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'register'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Đăng Ký Khóa Học</span>
                </button>
              </div>

              {/* Notification Banners */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* TAB 1: STANDARD MULTI-ROLE LOGIN */}
              {activeTab === 'login' && (
                <div className="space-y-4">
                  {/* Role Selector Grid */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Chọn vai trò truy cập hệ thống:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleRoleTabChange('SUPER_ADMIN')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          selectedRoleType === 'SUPER_ADMIN'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-2xs ring-1 ring-emerald-600/30'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <span>Ban Quản Trị</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRoleTabChange('TEACHER')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          selectedRoleType === 'TEACHER'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-2xs ring-1 ring-emerald-600/30'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Briefcase className="w-4 h-4 text-emerald-700" />
                        <span>Giáo Viên</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRoleTabChange('ACCOUNTANT')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          selectedRoleType === 'ACCOUNTANT'
                            ? 'bg-amber-50 border-amber-600 text-amber-900 shadow-2xs ring-1 ring-amber-600/30'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-amber-600" />
                        <span>Kế Toán Phí</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRoleTabChange('PARENT')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          selectedRoleType === 'PARENT'
                            ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-2xs ring-1 ring-purple-600/30'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <HeartHandshake className="w-4 h-4 text-purple-600" />
                        <span>Phụ Huynh</span>
                      </button>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        Tên đăng nhập / Số điện thoại / Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="VD: admin, gv.nam, 0903112233..."
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white font-mono text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1.5">
                        <label className="font-bold text-slate-700">Mật khẩu bảo mật</label>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Nhập mật khẩu..."
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white font-mono text-xs font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-600 text-[11px] font-medium">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                        />
                        <span>Ghi nhớ phiên làm việc</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>ĐĂNG NHẬP VÀO HỆ THỐNG AN TÂM</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 2: PARENT INSTANT LOOKUP */}
              {activeTab === 'parent_lookup' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-bold text-indigo-900">
                      <HeartHandshake className="w-4 h-4 text-indigo-700" />
                      <span>Tra Cứu Học Tập Nhanh Dành Cho Phụ Huynh</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Quý Phụ huynh chỉ cần nhập <strong>Số điện thoại</strong> hoặc <strong>Mã học sinh (VD: AT-2024-001)</strong> để xem ngay Sổ Liên Lạc Điện Tử mà không cần nhập mật khẩu.
                    </p>
                  </div>

                  <form onSubmit={handleParentLookup} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Số điện thoại phụ huynh hoặc Mã học sinh
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Phone className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={lookupPhoneOrCode}
                            onChange={(e) => setLookupPhoneOrCode(e.target.value)}
                            placeholder="VD: 0903112233 hoặc AT-2024-001"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white font-mono text-xs font-medium"
                          />
                        </div>

                        <button
                          type="submit"
                          className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                        >
                          <Search className="w-4 h-4" />
                          <span>Tra Cứu</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {lookupResult && (
                    <div className="p-4 rounded-2xl bg-white border border-emerald-300 shadow-sm space-y-3 animate-fadeIn text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center">
                            {lookupResult.fullName.split(' ').pop()?.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{lookupResult.fullName}</div>
                            <div className="text-[11px] text-emerald-800 font-mono font-bold">
                              Mã: {lookupResult.code} • Lớp: {lookupResult.className}
                            </div>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                          Đang theo học
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-slate-500">Phụ huynh:</span>{' '}
                          <strong className="text-slate-800">{lookupResult.parentName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Trường:</span>{' '}
                          <strong className="text-slate-800">{lookupResult.currentSchool}</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          setIsLoading(true);
                          const res = await loginUser(lookupResult.parentPhone, '123');
                          setIsLoading(false);
                          if (res.success) {
                            confetti({
                              particleCount: 60,
                              spread: 60,
                              origin: { y: 0.6 },
                            });
                            if (onLoginSuccess) onLoginSuccess();
                          }
                        }}
                        className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <HeartHandshake className="w-4 h-4" />
                        <span>Xem Sổ Liên Lạc Em {lookupResult.fullName}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: REGISTER NEW STUDENT */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Họ và tên học sinh <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regData.fullName}
                        onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                        placeholder="VD: Nguyễn Tuấn Anh"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Khối Lớp <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={regData.grade}
                        onChange={(e) => setRegData({ ...regData, grade: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:border-teal-600 focus:bg-white"
                      >
                        <option value={6}>Khối 6 (THCS)</option>
                        <option value={7}>Khối 7 (THCS)</option>
                        <option value={8}>Khối 8 (THCS)</option>
                        <option value={9}>Khối 9 (Luyện thi vào 10)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Số điện thoại liên hệ <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={regData.phone}
                        onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                        placeholder="0912.888.999"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-teal-600 focus:bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Email nhận thông báo
                      </label>
                      <input
                        type="email"
                        value={regData.email}
                        onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                        placeholder="tuananh@gmail.com"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Mật khẩu tài khoản <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={regData.password}
                        onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                        placeholder="Mật khẩu đăng nhập"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-teal-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Xác nhận mật khẩu <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={regData.confirmPassword}
                        onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                        placeholder="Nhập lại mật khẩu"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-teal-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>GỬI ĐĂNG KÝ HỌC VIÊN AN TÂM</span>
                  </button>
                </form>
              )}
            </div>

            {/* Sub Footer inside Login Box */}
            <div className="pt-4 border-t border-slate-200 text-center text-[11px] text-slate-500 flex items-center justify-between">
              <span>Hỗ trợ kỹ thuật: <strong className="text-slate-700">0949.421.357</strong></span>
              <a 
                href="https://www.antameducation.vn" 
                target="_blank" 
                rel="noreferrer" 
                className="text-emerald-700 font-bold hover:underline"
              >
                www.antameducation.vn
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Official Legal Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 lg:px-8 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <img 
              src={logoImg} 
              alt="An Tâm Education" 
              className="h-8 w-8 object-contain"
            />
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 font-black text-emerald-950 text-xs">
                <span>TRUNG TÂM GIÁO DỤC AN TÂM (AN TÂM EDUCATION)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Đc: 54/8 Phạm Hồng Thái, Phường Buôn Ma Thuột, Đắk Lắk | ĐT: 0949.421.357
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
