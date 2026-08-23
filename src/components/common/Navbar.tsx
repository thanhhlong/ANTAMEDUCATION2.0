import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { AnTamLogo } from './AnTamLogo';
import {
  Sparkles,
  FileSpreadsheet,
  Download,
  Upload,
  UserCheck,
  Shield,
  GraduationCap,
  Users,
  BookOpen,
  LogIn,
  User as UserIcon,
  Menu,
} from 'lucide-react';

interface NavbarProps {
  onOpenImport: () => void;
  onOpenExport: () => void;
  onDownloadTemplate: () => void;
  onOpenPublicForm: () => void;
  onOpenDataCleaner: () => void;
  onOpenLogin: () => void;
  onOpenProfile: () => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenImport,
  onOpenExport,
  onDownloadTemplate,
  onOpenPublicForm,
  onOpenDataCleaner,
  onOpenLogin,
  onOpenProfile,
  onToggleSidebar,
}) => {
  const { currentRole, quickLoginAsRole, selectedGrade, setSelectedGrade, currentUser, isAuthenticated } = useApp();

  const roleOptions: { role: UserRole; label: string; icon: any }[] = [
    { role: 'SUPER_ADMIN', label: 'Quản trị viên', icon: Shield },
    { role: 'TEACHER', label: 'Giáo viên', icon: BookOpen },
    { role: 'TUTOR', label: 'Trợ giảng', icon: UserCheck },
    { role: 'PARENT', label: 'Phụ huynh', icon: Users },
    { role: 'STUDENT', label: 'Học sinh', icon: GraduationCap },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 text-slate-800 shadow-2xs">
      <div className="px-3 lg:px-6 py-2 flex items-center justify-between gap-3">
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer mr-0.5"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center shadow-xs border border-slate-200">
            <AnTamLogo size="sm" variant="icon" showText={false} className="w-full h-full" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-slate-900 text-sm lg:text-base">
                AN TÂM EDUCATION
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                CHÍNH THỨC 2026 - 2027
              </span>
            </div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
              Hệ thống đào tạo & điều hành chính thức
            </p>
          </div>
        </div>

        {/* Zone 2: Role Switcher & Grade Quick Filter */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {roleOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = currentRole === opt.role;
              return (
                <button
                  key={opt.role}
                  onClick={() => quickLoginAsRole(opt.role)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Grade Quick Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <span className="px-2 text-slate-500 font-medium text-[11px]">Khối:</span>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 6, label: 'K6' },
              { id: 7, label: 'K7' },
              { id: 8, label: 'K8' },
              { id: 9, label: 'K9' },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGrade(g.id as any)}
                className={`px-2 py-0.5 rounded text-xs transition-all font-medium cursor-pointer ${
                  selectedGrade === g.id
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zone 3: Actions & User Auth */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <a
            href="/antam-education-hosting.zip"
            download="antam-education-hosting.zip"
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors cursor-pointer whitespace-nowrap shadow-2xs text-xs"
            title="Tải gói đóng gói chuẩn sẵn sàng upload thẳng lên Hosting (cPanel, Viettel IDC, DirectAdmin)"
          >
            <Download className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Tải Gói Hosting (ZIP)</span>
          </a>

          <a
            href="/antam-education-full.zip"
            download="antam-education-full.zip"
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors cursor-pointer whitespace-nowrap shadow-2xs text-xs"
            title="Tải toàn bộ mã nguồn & bản dựng offline để chạy trực tiếp trên máy tính"
          >
            <Download className="w-3.5 h-3.5 text-slate-950 shrink-0" />
            <span>Bản Offline Máy Tính</span>
          </a>

          <button
            onClick={onOpenPublicForm}
            className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <span>Form Đăng Ký</span>
          </button>

          <button
            onClick={onDownloadTemplate}
            title="Tải file Excel mẫu nghiệp vụ trung tâm"
            className="hidden 2xl:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mẫu Excel</span>
          </button>

          <button
            onClick={onOpenDataCleaner}
            title="Làm gọn danh xưng, chuẩn hóa SĐT, tính lại công nợ & gộp bản ghi trùng lặp"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>Làm Gọn Dữ Liệu</span>
          </button>

          <button
            onClick={onOpenImport}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>Nhập Excel</span>
          </button>

          <button
            onClick={onOpenExport}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Xuất Báo Cáo</span>
          </button>

          {/* User Auth Control */}
          {isAuthenticated && currentUser ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-md bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-2xs">
                {currentUser.fullName.split(' ').pop()?.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-none truncate max-w-[110px]">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5 truncate max-w-[110px]">
                  {currentUser.title || currentUser.role}
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng Nhập</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

