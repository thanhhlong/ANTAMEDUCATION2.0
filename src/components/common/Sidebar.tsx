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
  TrendingUp,
  HeartHandshake,
  ChevronRight,
  ShieldCheck,
  Briefcase,
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
  | 'parent_portal';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
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
}) => {
  const { currentRole, leads, invoices, expenses } = useApp();

  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;
  const newLeadsCount = leads.filter((l) => l.status === 'new' || l.status === 'consulting').length;

  const systemNavItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Dashboard Tổng Quan',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER', 'ACCOUNTANT'],
    },
    {
      id: 'teacher_workspace',
      label: 'Bàn Làm Việc & Lịch Dạy',
      icon: Briefcase,
      highlight: true,
      roles: ['TEACHER'],
    },
    {
      id: 'crm',
      label: 'CRM & Tuyển Sinh',
      icon: UserPlus,
      badge: newLeadsCount > 0 ? `${newLeadsCount} mới` : undefined,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER'],
    },
    {
      id: 'students',
      label: currentRole === 'TEACHER' ? 'Học Sinh Lớp Phụ Trách' : 'Học Sinh & Đăng Ký',
      icon: Users,
      badge: currentRole === 'TEACHER' ? undefined : '58',
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER', 'ACCOUNTANT', 'TEACHER'],
    },
    {
      id: 'finance',
      label: 'Học Phí & Công Nợ',
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
      id: 'user_roles',
      label: 'Phân Quyền & Tài Khoản',
      icon: ShieldCheck,
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
  ];

  const academicNavItems: NavItem[] = [
    {
      id: 'tutoring',
      label: 'Gia Sư & Bồi Dưỡng',
      icon: Sparkles,
      highlight: true,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER', 'TEACHER', 'TUTOR', 'PARENT'],
    },
    {
      id: 'tutors',
      label: 'Trợ Giảng & Lịch Rảnh',
      icon: GraduationCap,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER', 'TUTOR'],
    },
    {
      id: 'timetable',
      label: 'Thời Khóa Biểu',
      icon: CalendarCheck,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER', 'TEACHER', 'TUTOR', 'STUDENT', 'PARENT'],
    },
    {
      id: 'attendance',
      label: 'Điểm Danh & Face AI',
      icon: ScanFace,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER', 'TEACHER', 'TUTOR'],
    },
    {
      id: 'lms',
      label: 'LMS & AI Quiz',
      icon: BookOpenCheck,
      roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'TUTOR', 'STUDENT'],
    },
    {
      id: 'ai_insights',
      label: 'AI Cố Vấn Kinh Doanh',
      icon: TrendingUp,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
    },
    {
      id: 'parent_portal',
      label: 'Cổng Phụ Huynh',
      icon: HeartHandshake,
      roles: ['SUPER_ADMIN', 'ADMIN', 'PARENT', 'STUDENT'],
    },
  ];

  const filterRoles = (items: typeof systemNavItems) =>
    items.filter((item) => item.roles.includes(currentRole));

  const visibleSystem = filterRoles(systemNavItems);
  const visibleAcademic = filterRoles(academicNavItems);

  return (
    <aside
      className={`relative bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shrink-0 text-slate-800 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-3 flex-1 overflow-y-auto space-y-4">
        {/* System Group */}
        {visibleSystem.length > 0 && (
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {currentRole === 'TEACHER' ? 'Bàn Làm Việc Giáo Viên' : 'Quản Trị Hệ Thống'}
              </div>
            )}
            {visibleSystem.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left group relative ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />

                  {!collapsed && (
                    <span className="flex-1 truncate tracking-tight text-xs lg:text-sm">
                      {item.label}
                    </span>
                  )}

                  {!collapsed && item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                        item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {isActive && !collapsed && (
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Academic Group */}
        {visibleAcademic.length > 0 && (
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Đào Tạo & Học Tập
              </div>
            )}
            {visibleAcademic.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left group relative ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title={collapsed ? item.label : undefined}
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

                  {!collapsed && (
                    <span className="flex-1 truncate tracking-tight text-xs lg:text-sm">
                      {item.label}
                    </span>
                  )}

                  {isActive && !collapsed && (
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer info box */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-100 bg-slate-50 m-2 rounded-xl border">
          <div className="text-[11px] text-slate-400 flex items-center justify-between mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Cơ sở đào tạo</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xs text-slate-800 font-bold truncate">
            Cầu Giấy, Hà Nội
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Dữ liệu đồng bộ Excel 2 chiều
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex items-center justify-center p-2 text-slate-400 hover:text-slate-700 border-t border-slate-100 text-xs hover:bg-slate-50 transition-colors"
      >
        {collapsed ? '→' : '← Thu gọn menu'}
      </button>
    </aside>
  );
};
