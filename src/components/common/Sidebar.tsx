import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ReceiptText,
  UserPlus,
  Sparkles,
  GraduationCap,
  CalendarCheck,
  ScanFace,
  BookOpenCheck,
  BookOpen,
  TrendingUp,
  HeartHandshake,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  LogIn,
  LogOut,
  X,
  Coins,
  CloudUpload,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export type ActiveTab =
  | 'overview'
  | 'teacher_workspace'
  | 'students'
  | 'finance'
  | 'expenses'
  | 'crm'
  | 'user_roles'
  | 'tutoring'
  | 'tutors'
  | 'timetable'
  | 'attendance'
  | 'lms'
  | 'ai_insights'
  | 'parent_portal'
  | 'subjects'
  | 'teacher_payroll';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: any;
  roles: string[];
  badge?: string;
  badgeColor?: string;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const {
    currentRole,
    leads,
    invoices,
    expenses,
    currentUser,
    logout,
    setIsLoginPageView,
    saveAllToDatabase,
    isSavingToDatabase,
    lastSavedTimestamp,
  } = useApp();

  const [recentlySaved, setRecentlySaved] = React.useState(false);

  const handleSidebarSave = async () => {
    const res = await saveAllToDatabase(true);
    if (res.success) {
      setRecentlySaved(true);
      setTimeout(() => setRecentlySaved(false), 2500);
    }
  };

  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;
  const newLeadsCount = leads.filter((l) => l.status === 'new' || l.status === 'consulting').length;

  const systemNavItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Dashboard Đào Tạo & Học Tập',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER', 'ACCOUNTANT'],
    },
    {
      id: 'teacher_workspace',
      label: 'Bàn Làm Việc Giáo Viên',
      icon: Briefcase,
      highlight: true,
      roles: ['TEACHER'],
    },
    {
      id: 'timetable',
      label: 'Thời Khóa Biểu & Lịch Học',
      icon: CalendarCheck,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER', 'TEACHER', 'TUTOR', 'STUDENT', 'PARENT'],
    },
    {
      id: 'lms',
      label: 'Học Liệu & Bài Tập (LMS)',
      icon: BookOpenCheck,
      roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'TUTOR', 'STUDENT'],
    },
    {
      id: 'attendance',
      label: 'Điểm Danh & Ghi Chú Học',
      icon: ScanFace,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER', 'TEACHER', 'TUTOR'],
    },
    {
      id: 'students',
      label: currentRole === 'TEACHER' ? 'Học Sinh Lớp Phụ Trách' : 'Quản Lý Học Sinh',
      icon: Users,
      badge: currentRole === 'TEACHER' ? undefined : '58',
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER', 'ACCOUNTANT', 'TEACHER'],
    },
    {
      id: 'tutoring',
      label: 'Lớp Bồi Dưỡng & Gia Sư',
      icon: Sparkles,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER', 'TEACHER', 'TUTOR', 'PARENT'],
    },
    {
      id: 'tutors',
      label: 'Đội Ngũ Thầy Cô & Trợ Giảng',
      icon: GraduationCap,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER', 'TUTOR'],
    },
    {
      id: 'subjects',
      label: 'Chương Trình & Môn Học',
      icon: BookOpen,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER'],
    },
    {
      id: 'parent_portal',
      label: 'Cổng Tra Cứu Phụ Huynh',
      icon: HeartHandshake,
      roles: ['SUPER_ADMIN', 'ADMIN', 'PARENT', 'STUDENT'],
    },
  ];

  const academicNavItems: NavItem[] = [
    {
      id: 'crm',
      label: 'Tuyển Sinh & CRM',
      icon: UserPlus,
      badge: newLeadsCount > 0 ? `${newLeadsCount} mới` : undefined,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER'],
    },
    {
      id: 'finance',
      label: 'Thu Phí & Học Phí',
      icon: CreditCard,
      badge: overdueCount > 0 ? `${overdueCount} nợ` : undefined,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
    },
    {
      id: 'expenses',
      label: 'Chi Phí Vận Hành',
      icon: ReceiptText,
      badge: `${expenses.length}`,
      badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
    },
    {
      id: 'teacher_payroll',
      label: 'Chi Trả Giáo Viên',
      icon: Coins,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
    },
    {
      id: 'user_roles',
      label: 'Phân Quyền & Tài Khoản',
      icon: ShieldCheck,
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
  ];

  const filterRoles = (items: typeof systemNavItems) =>
    items.filter((item) => item.roles.includes(currentRole));

  const visibleSystem = filterRoles(systemNavItems);
  const visibleAcademic = filterRoles(academicNavItems);

  const handleNavClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    onCloseMobile?.();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      <aside
        className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shrink-0 text-slate-800 
          ${isMobileOpen 
            ? 'fixed inset-y-0 left-0 z-50 w-64 shadow-xl flex md:relative md:inset-auto md:z-auto md:shadow-none' 
            : 'hidden md:flex'
          } 
          ${collapsed ? 'md:w-16' : 'md:w-64'} w-64`}
      >
        {/* Mobile menu close header */}
        {isMobileOpen && (
          <div className="p-4 flex items-center justify-between border-b border-slate-100 md:hidden shrink-0">
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-600">AN TÂM EDUCATION</span>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-3 flex-1 overflow-y-auto space-y-4">
          {/* System Group (Academic & LMS Core) */}
          {visibleSystem.length > 0 && (
            <div className="space-y-1">
              {(!collapsed || isMobileOpen) && (
                <div className="px-3 py-1 text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  Đào Tạo & Học Tập
                </div>
              )}
              {visibleSystem.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left group relative ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    title={collapsed && !isMobileOpen ? item.label : undefined}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />

                    {(!collapsed || isMobileOpen) && (
                      <span className="flex-1 truncate tracking-tight text-xs lg:text-sm font-medium">
                        {item.label}
                      </span>
                    )}

                    {(!collapsed || isMobileOpen) && item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                          item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {isActive && (!collapsed || isMobileOpen) && (
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Academic Group (Administration & Operations Support) */}
          {visibleAcademic.length > 0 && (
            <div className="space-y-1">
              {(!collapsed || isMobileOpen) && (
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Quản Trị & Vận Hành
                </div>
              )}
              {visibleAcademic.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left group relative ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    title={collapsed && !isMobileOpen ? item.label : undefined}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        item.highlight
                          ? 'text-amber-500 group-hover:scale-110'
                          : isActive
                          ? 'text-indigo-600'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />

                    {(!collapsed || isMobileOpen) && (
                      <span className="flex-1 truncate tracking-tight text-xs lg:text-sm font-medium">
                        {item.label}
                      </span>
                    )}

                    {isActive && (!collapsed || isMobileOpen) && (
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info box & Quick Auth Access */}
        {(!collapsed || isMobileOpen) && (
          <div className="p-2.5 border-t border-slate-100 bg-slate-50 m-2 rounded-xl border border-slate-200 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Chính thức 2026 - 2027
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-xs text-slate-800 font-bold truncate">
              An Tâm Education Buôn Ma Thuột
            </div>
            <p className="text-[10px] text-slate-500 truncate">
              54/8 Phạm Hồng Thái, Đắk Lắk
            </p>
            
            {/* Quick Manual Save to Database */}
            <button
              type="button"
              onClick={handleSidebarSave}
              disabled={isSavingToDatabase}
              className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                recentlySaved
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : isSavingToDatabase
                  ? 'bg-indigo-400 border-indigo-400 text-white cursor-wait'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 border-indigo-700 text-white'
              }`}
            >
              {isSavingToDatabase ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : recentlySaved ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">
                {isSavingToDatabase
                  ? 'Đang lưu Cloud...'
                  : recentlySaved
                  ? 'Đã lưu Database!'
                  : 'Lưu Dữ Liệu (Ctrl+S)'}
              </span>
            </button>
            {lastSavedTimestamp && (
              <div className="text-[9px] text-slate-400 text-center truncate">
                Lưu gần nhất: {lastSavedTimestamp}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setIsLoginPageView(true);
                onCloseMobile?.();
              }}
              className="w-full mt-1 py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3 h-3" />
              <span>Mở Trang Đăng Nhập</span>
            </button>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center p-2 text-slate-400 hover:text-slate-700 border-t border-slate-100 text-xs hover:bg-slate-50 transition-colors shrink-0"
        >
          {collapsed ? '→' : '← Thu gọn menu'}
        </button>
      </aside>
    </>
  );
};
