import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, AuthUser } from '../../types';
import {
  GraduationCap,
  ShieldCheck,
  Briefcase,
  Users,
  CreditCard,
  HeartHandshake,
  KeyRound,
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
  UserCheck,
  BookOpen,
  Building,
  HelpCircle,
  Search,
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
    quickLoginAsRole,
    users,
    students,
    registerUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'parent_lookup' | 'register'>('login');
  const [selectedRoleType, setSelectedRoleType] = useState<UserRole>('SUPER_ADMIN');
  
  // Slides configuration for Login Page Carousel
  const [activeSlide, setActiveSlide] = useState(0);

  const loginSlides = [
    {
      title: "Phân Hệ Giáo Viên",
      subtitle: "Soạn Bài & Điểm Danh",
      description: "Hệ thống hỗ trợ giáo viên xây dựng ngân hàng đề thi chuẩn hóa bám sát Bộ GD, chấm điểm và báo cáo tiến trình học tập của từng học viên.",
      icon: <Briefcase className="w-5 h-5 text-emerald-400" />,
      badge: "Học Vụ Thông Minh",
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      preview: (
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sổ Điểm Danh Lớp Toán K9
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">Ca dạy: 08:00</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800/60 flex items-center justify-between">
              <span className="text-slate-300 font-medium">1. Nguyễn Hoàng Nam</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">Hiện diện (8:02)</span>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800/60 flex items-center justify-between">
              <span className="text-slate-300 font-medium">2. Trần Minh Anh</span>
              <span className="text-amber-400 font-bold bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/10">Vào trễ (8:15)</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Quản Trị Tài Chính",
      subtitle: "Giao Dịch VietQR Tự Động",
      description: "Tự động phát hành mã VietQR học phí cá nhân hóa cho từng phụ huynh. Nhận thông báo giao dịch gạch nợ tự động trong 1 giây mà không cần đối soát thủ công.",
      icon: <CreditCard className="w-5 h-5 text-indigo-400" />,
      badge: "Tự Động Hóa 100%",
      badgeClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      preview: (
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Giao dịch học phí tháng 8
            </span>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold border border-indigo-500/20">VietQR Sync</span>
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/60 flex items-center justify-between">
              <div>
                <div className="font-bold text-emerald-400">+1,500,000 đ</div>
                <div className="text-[9px] text-slate-500">Học phí T8 • Em Hà An (K8)</div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">Khớp lệnh 1s</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Sổ Liên Lạc 24/7",
      subtitle: "Đồng Hành Cùng Phụ Huynh",
      description: "Xem tức thời kết quả chuyên cần, điểm kiểm tra chi tiết, và lời phê sát sao của giáo viên bộ môn qua Zalo/Sổ liên lạc điện tử mà không cần cài đặt phức tạp.",
      icon: <HeartHandshake className="w-5 h-5 text-amber-400" />,
      badge: "Phản Hồi Hai Chiều",
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      preview: (
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Sổ nhận xét điện tử
            </span>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold border border-amber-500/20">Mới nhất</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/60 text-left space-y-1">
            <div className="flex items-center justify-between font-bold text-amber-400 text-[11px]">
              <span>Nhận xét: em Lâm Bảo (K9)</span>
              <span>10/10đ</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              "Con hiểu bài nhanh, giải tốt các bài toán hình học nâng cao. Rất năng nổ đóng góp xây dựng bài."
            </p>
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % loginSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);
  
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
    password: '',
    confirmPassword: '',
  });

  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRoleType(role);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Auto-fill convenience credentials based on role
    if (role === 'SUPER_ADMIN') {
      setIdentifier('admin');
      setPassword('123');
    } else if (role === 'TEACHER') {
      setIdentifier('gv.nam');
      setPassword('123');
    } else if (role === 'ACCOUNTANT') {
      setIdentifier('accountant');
      setPassword('123');
    } else if (role === 'PARENT') {
      setIdentifier('0903112233');
      setPassword('123');
    } else if (role === 'TUTOR') {
      setIdentifier('tg.minh');
      setPassword('123');
    }
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

  const handleQuickDemoLogin = (username: string, pass: string, role: UserRole) => {
    setIdentifier(username);
    setPassword(pass);
    setSelectedRoleType(role);
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(async () => {
      const res = await loginUser(username, pass);
      setIsLoading(false);
      if (res.success) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
        });
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setErrorMessage(res.message || 'Đăng nhập thất bại');
      }
    }, 200);
  };

  const handleParentLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const query = lookupPhoneOrCode.trim().toLowerCase();
    if (!query) return;

    const found = students.find(
      (s) =>
        s.parentPhone.replace(/[^0-9]/g, '') === query.replace(/[^0-9]/g, '') ||
        s.phone?.replace(/[^0-9]/g, '') === query.replace(/[^0-9]/g, '') ||
        s.code.toLowerCase() === query ||
        s.fullName.toLowerCase().includes(query)
    );

    if (found) {
      setLookupResult(found);
      setErrorMessage(null);
    } else {
      setLookupResult(null);
      setErrorMessage('Không tìm thấy học sinh với số điện thoại hoặc mã học sinh này');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regData.password !== regData.confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    const res = await registerUser({
      username: regData.email.split('@')[0],
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
      setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển đến hệ thống...');
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess();
      }, 700);
    } else {
      setErrorMessage(res.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative overflow-hidden font-sans">
      {/* Background Subtle Gradient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md border border-emerald-400/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base lg:text-lg tracking-tight text-white uppercase">
                AN TÂM EDUCATION
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                Cổng Học Vụ 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Hệ Thống Quản Lý Giáo Dục, Tài Chính & Sổ Liên Lạc Điện Tử
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onContinueAsGuest && (
            <button
              onClick={onContinueAsGuest}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span>Xem Thử Hệ Thống (Guest)</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}

          <a
            href="tel:0912345678"
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-500" />
            <span>Hotline: 0912.345.678</span>
          </a>
        </div>
      </header>

      {/* Main Login Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-auto">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Branding & System Highlights Carousel (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full min-h-[500px] hidden lg:flex text-left space-y-6">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Nền Tảng Quản Trị Giáo Dục Toàn Diện</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                  Tâm Sáng Chí Bền,<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">
                    Vững Bước Tương Lai
                  </span>
                </h1>
                <p className="text-xs lg:text-sm text-slate-400 leading-relaxed">
                  Đăng nhập phân quyền chuyên biệt cho Ban Quản Trị, Giáo Viên Bộ Môn, Kế Toán, Trợ Giảng và Cổng Phụ Huynh tra cứu sổ liên lạc.
                </p>
              </div>

              {/* High-end Slide Content Panel */}
              <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 space-y-4 shadow-xl min-h-[280px] flex flex-col justify-between transition-all duration-500">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${loginSlides[activeSlide].badgeClass}`}>
                      {loginSlides[activeSlide].icon}
                      <span>{loginSlides[activeSlide].badge}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Slide {activeSlide + 1} / {loginSlides.length}</span>
                  </div>

                  <h3 className="text-base font-extrabold text-white mt-1">
                    {loginSlides[activeSlide].title} • <span className="text-indigo-400">{loginSlides[activeSlide].subtitle}</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {loginSlides[activeSlide].description}
                  </p>
                </div>

                {/* Micro preview mock of the actual screen module */}
                <div className="pt-2">
                  {loginSlides[activeSlide].preview}
                </div>
              </div>
            </div>

            {/* Slider Dots Indicator */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                {loginSlides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      activeSlide === index ? 'w-8 bg-emerald-500' : 'w-2.5 bg-slate-700 hover:bg-slate-600'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Bảo mật 256-bit</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Real-time</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Login Box (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
            
            {/* Main Tabs Navigation */}
            <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80 mb-6 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'login'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng Nhập Tài Khoản</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('parent_lookup');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'parent_lookup'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
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
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Đăng Ký Mới</span>
              </button>
            </div>

            {/* Error / Success Toast Notifications */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* TAB 1: STANDARD LOGIN FORM */}
            {activeTab === 'login' && (
              <div className="space-y-5">
                {/* Role Switcher Pills */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Chọn vai trò đăng nhập:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleRoleTabChange('SUPER_ADMIN')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        selectedRoleType === 'SUPER_ADMIN'
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-xs'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>Quản Trị Viên</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleTabChange('TEACHER')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        selectedRoleType === 'TEACHER'
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-xs'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Briefcase className="w-4 h-4 text-emerald-400" />
                      <span>Giáo Viên</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleTabChange('ACCOUNTANT')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        selectedRoleType === 'ACCOUNTANT'
                          ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-xs'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <span>Kế Toán</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleTabChange('PARENT')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        selectedRoleType === 'PARENT'
                          ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-xs'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <HeartHandshake className="w-4 h-4 text-purple-400" />
                      <span>Phụ Huynh</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1.5">
                      Tên đăng nhập / Email / Số điện thoại
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="VD: admin, gv.nam, 0903112233..."
                        className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-300">Mật khẩu</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIdentifier('admin');
                          setPassword('123');
                          setSuccessMessage('Đã điền mật khẩu mặc định (123)');
                        }}
                        className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                      >
                        Quên mật khẩu? (Mặc định: 123)
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu..."
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Ghi nhớ phiên đăng nhập</span>
                    </label>

                    <span className="text-[11px] text-slate-500 font-mono">
                      Mật khẩu demo: <strong className="text-emerald-400">123</strong>
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Đăng Nhập Vào Hệ Thống</span>
                      </>
                    )}
                  </button>
                </form>

                {/* 1-Click Quick Demo Accounts Bar */}
                <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Đăng nhập nhanh 1-Click (Tài khoản mẫu):</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('admin', '123', 'SUPER_ADMIN')}
                      className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-[11px] font-bold text-indigo-300 group-hover:text-indigo-200 truncate">
                        Quản Trị Viên
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">admin / 123</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('gv.nam', '123', 'TEACHER')}
                      className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-[11px] font-bold text-emerald-300 group-hover:text-emerald-200 truncate">
                        Thầy Nam (Toán)
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">gv.nam / 123</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('gv.trang', '123', 'TEACHER')}
                      className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-[11px] font-bold text-teal-300 group-hover:text-teal-200 truncate">
                        Cô Trang (Anh)
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">gv.trang / 123</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('accountant', '123', 'ACCOUNTANT')}
                      className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-[11px] font-bold text-amber-300 group-hover:text-amber-200 truncate">
                        Kế Toán Trưởng
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">accountant / 123</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('0903112233', '123', 'PARENT')}
                      className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-[11px] font-bold text-purple-300 group-hover:text-purple-200 truncate">
                        PH Em Gia Bảo
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">0903112233 / 123</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('tg.minh', '123', 'TUTOR')}
                      className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-[11px] font-bold text-rose-300 group-hover:text-rose-200 truncate">
                        Trợ Giảng Minh
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">tg.minh / 123</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PARENT INSTANT LOOKUP (WITHOUT COMPLEX PASSWORD) */}
            {activeTab === 'parent_lookup' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-indigo-300">
                    <HeartHandshake className="w-4 h-4" />
                    <span>Tra Cứu Học Tập Nhanh Dành Cho Phụ Huynh</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Quý Phụ huynh chỉ cần nhập <strong>Số điện thoại đăng ký</strong> hoặc <strong>Mã học sinh (VD: AT-2024-001)</strong> để truy cập trực tiếp vào Sổ Liên Lạc Điện Tử.
                  </p>
                </div>

                <form onSubmit={handleParentLookup} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Số điện thoại phụ huynh hoặc Mã học sinh
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={lookupPhoneOrCode}
                          onChange={(e) => setLookupPhoneOrCode(e.target.value)}
                          placeholder="VD: 0903112233 hoặc AT-2024-001"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
                      >
                        <Search className="w-4 h-4" />
                        <span>Tra Cứu</span>
                      </button>
                    </div>
                  </div>
                </form>

                {lookupResult && (
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/40 space-y-3 animate-in fade-in text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center">
                          {lookupResult.fullName.split(' ').pop()?.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{lookupResult.fullName}</div>
                          <div className="text-[11px] text-emerald-400 font-mono">
                            Mã: {lookupResult.code} • Lớp: {lookupResult.className}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        Đang học
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-slate-400">Phụ huynh:</span>{' '}
                        <strong className="text-slate-200">{lookupResult.parentName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Trường:</span>{' '}
                        <strong className="text-slate-200">{lookupResult.currentSchool}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin(lookupResult.parentPhone, '123', 'PARENT')}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <HeartHandshake className="w-4 h-4" />
                      <span>Truy Cập Sổ Liên Lạc Em {lookupResult.fullName}</span>
                    </button>
                  </div>
                )}

                <div className="pt-2 text-center text-xs text-slate-400">
                  <span>Gợi ý SĐT thử nghiệm: </span>
                  <button
                    type="button"
                    onClick={() => setLookupPhoneOrCode('0903112233')}
                    className="text-indigo-400 hover:underline font-mono cursor-pointer"
                  >
                    0903112233 (Nguyễn Gia Bảo)
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: REGISTER NEW STUDENT / PARENT */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Họ và tên đầy đủ <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regData.fullName}
                      onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                      placeholder="VD: Trần Hoàng Long"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Vai trò đăng ký <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={regData.role}
                      onChange={(e) => setRegData({ ...regData, role: e.target.value as UserRole })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white font-semibold focus:outline-none focus:border-teal-500"
                    >
                      <option value="STUDENT">Học Sinh</option>
                      <option value="PARENT">Phụ Huynh</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Email liên hệ <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={regData.email}
                      onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                      placeholder="long.tran@gmail.com"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Số điện thoại <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={regData.phone}
                      onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                      placeholder="0912.888.999"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Mật khẩu <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={regData.password}
                      onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                      placeholder="Tối thiểu 3 ký tự"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Xác nhận mật khẩu <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={regData.confirmPassword}
                      onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Hoàn Tất Đăng Ký Tài Khoản</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer System Info */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-900/40 px-4 lg:px-8 py-3.5 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          © 2026 <strong>AN TÂM EDUCATION</strong>. Hệ thống quản trị giáo dục chất lượng cao.
        </div>
        <div className="flex items-center gap-4">
          <span>Trụ sở: Tòa An Tâm Building, Cầu Giấy, Hà Nội</span>
          <span>•</span>
          <span>Phiên bản v2.6.4</span>
        </div>
      </footer>
    </div>
  );
};
