import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatShortCurrency } from '../../utils/formatters';
import { getAIBusinessInsights, BusinessAIInsight } from '../../services/geminiService';
import {
  Users,
  GraduationCap,
  UserPlus,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Clock,
  Calendar,
  ChevronRight,
  Send,
  Plus,
} from 'lucide-react';
import { ActiveTab } from '../common/Sidebar';

interface AdminOverviewProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenPaymentModal: (invoiceId: string) => void;
  onOpenAddStudent: () => void;
  onOpenAddExpense: () => void;
  onOpenAddLead: () => void;
  onOpenAIAdvisor: () => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  onNavigate,
  onOpenPaymentModal,
  onOpenAddStudent,
  onOpenAddExpense,
  onOpenAddLead,
  onOpenAIAdvisor,
}) => {
  const { students, subjects, invoices, expenses, leads, tutors, scheduleSessions, selectedGrade } = useApp();

  const [aiInsight, setAiInsight] = useState<BusinessAIInsight | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Filter based on selectedGrade if not 'all'
  const filteredStudents = selectedGrade === 'all' ? students : students.filter((s) => s.grade === selectedGrade);
  const filteredInvoices = selectedGrade === 'all' ? invoices : invoices.filter((i) => i.grade === selectedGrade);

  const totalStudents = filteredStudents.length;
  const totalTutors = tutors.length;
  const totalLeads = leads.length;

  const totalDue = filteredInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPaid = filteredInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalDebt = filteredInvoices.reduce((acc, i) => acc + i.remainingAmount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netCashflow = totalPaid - (selectedGrade === 'all' ? totalExpenses : 0);

  // Load AI Insights
  useEffect(() => {
    let isMounted = true;
    const fetchInsights = async () => {
      setLoadingAi(true);
      try {
        const res = await getAIBusinessInsights(students, invoices, expenses, leads, tutors);
        if (isMounted) setAiInsight(res);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoadingAi(false);
      }
    };
    fetchInsights();
    return () => {
      isMounted = false;
    };
  }, [students.length, invoices.length, expenses.length, leads.length]);

  // Grade Breakdown
  const grades = [6, 7, 8, 9];
  const gradeStats = grades.map((g) => {
    const stCount = students.filter((s) => s.grade === g).length;
    const invList = invoices.filter((i) => i.grade === g);
    const rev = invList.reduce((acc, i) => acc + i.totalAmount, 0);
    const debt = invList.reduce((acc, i) => acc + i.remainingAmount, 0);
    return { grade: g, studentCount: stCount, revenue: rev, debt };
  });

  // Subject Breakdown
  const subjectStats = subjects.map((sub) => {
    let count = 0;
    students.forEach((st) => {
      if (st.enrollments.some((e) => e.subjectId === sub.id && e.status === 'active')) {
        count++;
      }
    });
    return { subject: sub, enrolledCount: count, estimatedRevenue: count * sub.defaultFee };
  });

  // Urgent Debtors (remaining > 0)
  const urgentDebtors = invoices
    .filter((inv) => inv.remainingAmount > 0)
    .sort((a, b) => b.remainingAmount - a.remainingAmount)
    .slice(0, 4);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Hệ Thống Quản Trị</span>
            <span>/</span>
            <span className="text-slate-700">Dashboard Tổng Quan</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-1">
            <span>ANTAM EDUCATION – ĐIỀU HÀNH TRUNG TÂM</span>
            {selectedGrade !== 'all' && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                Đang lọc: Khối {selectedGrade}
              </span>
            )}
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Dữ liệu đồng bộ trực tiếp từ hoạt động thực tế & Excel (Học sinh, Thu chi, Lịch dạy, CRM Lead)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddStudent}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Học Sinh</span>
          </button>

          <button
            onClick={onOpenAddLead}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-600" />
            <span>Thêm Lead Mới</span>
          </button>

          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5 text-rose-600" />
            <span>Tạo Phiếu Chi</span>
          </button>
        </div>
      </div>

      {/* Main KPI Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Học sinh */}
        <div
          onClick={() => onNavigate('students')}
          className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TỔNG HỌC SINH</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{totalStudents}</span>
            <span className="text-xs text-emerald-600 font-bold">↑ 100% đang học</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Khối 6, 7, 8, 9</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
          </div>
        </div>

        {/* Card 2: Giáo viên & Trợ giảng */}
        <div
          onClick={() => onNavigate('tutors')}
          className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-purple-200 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GV & TRỢ GIẢNG</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{totalTutors + 8}</span>
            <span className="text-xs text-purple-600 font-bold">12 chính thức</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Biểu mẫu 1 (Sư Phạm/FTU)</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
          </div>
        </div>

        {/* Card 3: Lead CRM */}
        <div
          onClick={() => onNavigate('crm')}
          className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-amber-200 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">LEAD CRM PHỤ HUYNH</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{totalLeads}</span>
            <span className="text-xs text-amber-600 font-bold">Đang tư vấn</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Biểu mẫu 2 & Form</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
          </div>
        </div>

        {/* Card 4: Dòng tiền ròng */}
        <div
          onClick={() => onNavigate('finance')}
          className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-200 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">DÒNG TIỀN RÒNG</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-600">
              {formatShortCurrency(netCashflow)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Đã thu - Chi phí</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Financial Breakdown Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh thu dự kiến */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>Doanh Thu Dự Kiến</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(totalDue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Học phí định mức cả tháng</div>
        </div>

        {/* Đã thu */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã Thu Thực Tế</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            {formatCurrency(totalPaid)}
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, (totalPaid / (totalDue || 1)) * 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 mt-1.5">
            Đạt {((totalPaid / (totalDue || 1)) * 100).toFixed(1)}% chỉ tiêu
          </div>
        </div>

        {/* Công nợ */}
        <div className="p-5 rounded-xl bg-white border border-rose-200 shadow-xs">
          <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Công Nợ Cần Thu</span>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">
            {formatCurrency(totalDebt)}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            ⚠️ {invoices.filter((i) => i.remainingAmount > 0).length} học sinh chưa nộp đủ
          </div>
        </div>

        {/* Chi phí */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wider">
            <Receipt className="w-4 h-4 text-amber-600" />
            <span>Chi Phí Vận Hành</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Mặt bằng, AC, Vệ sinh, VPP...</div>
        </div>
      </div>

      {/* AI Business Insight Banner - Geometric Balance Rich Indigo Accent */}
      <div className="bg-indigo-900 rounded-xl p-6 text-white relative overflow-hidden shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-3 max-w-4xl">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-white">
                AI BUSINESS INSIGHT
              </span>
              <span className="text-xs text-indigo-200 font-medium">
                Chỉ số sức khỏe tài chính: <strong className="text-emerald-300 font-bold">{aiInsight?.healthScore || 85}/100</strong>
              </span>
            </div>
            <p className="text-sm lg:text-base font-normal leading-relaxed text-indigo-100">
              {loadingAi ? 'Đang phân tích số liệu tài chính & CRM...' : aiInsight?.executiveSummary}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <div className="bg-white/10 px-3.5 py-2 rounded-lg border border-white/10">
                <p className="text-[10px] text-indigo-300 font-bold uppercase">ĐỀ XUẤT</p>
                <p className="text-xs font-semibold text-white">Nhắc nợ tự động Zalo cho các học sinh quá hạn</p>
              </div>
              <div className="bg-white/10 px-3.5 py-2 rounded-lg border border-white/10">
                <p className="text-[10px] text-indigo-300 font-bold uppercase">CƠ HỘI</p>
                <p className="text-xs font-semibold text-white">Mở thêm lớp Tiếng Anh & Gia sư 1-on-1 Khối 8</p>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenAIAdvisor}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-bold shrink-0 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            <span>Báo Cáo Toàn Diện</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-indigo-500 rounded-full blur-3xl opacity-30 pointer-events-none" />
      </div>

      {/* Two Column Section: Grade Breakdown & Subject Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Phân tích theo khối (Khối 6, 7, 8, 9) */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Phân Bổ Học Sinh & Doanh Thu Theo Khối</span>
            </h2>
            <button
              onClick={() => onNavigate('students')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Xem danh sách →
            </button>
          </div>

          <div className="space-y-3">
            {gradeStats.map((item) => {
              const maxRev = 25000000;
              const percent = Math.min(100, (item.revenue / maxRev) * 100);
              return (
                <div key={item.grade} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">Khối {item.grade}</span>
                      <span className="text-slate-500">({item.studentCount} học sinh)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800">{formatCurrency(item.revenue)}</span>
                      {item.debt > 0 && (
                        <span className="text-[11px] text-rose-600 font-semibold ml-2">
                          (Nợ: {formatShortCurrency(item.debt)})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.grade === 8 ? 'bg-indigo-600' : item.grade === 9 ? 'bg-purple-600' : item.grade === 7 ? 'bg-blue-600' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Phân tích theo môn học */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Học Sinh & Định Mức Môn Học</span>
            </h2>
            <button
              onClick={() => onNavigate('finance')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Cấu hình học phí →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subjectStats.map((item) => (
              <div
                key={item.subject.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.subject.color }}
                    />
                    <span className="text-xs font-bold text-slate-800">{item.subject.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {item.enrolledCount} học sinh đăng ký
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-800">
                    {formatShortCurrency(item.subject.defaultFee)}/tháng
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">
                    Tổng: {formatShortCurrency(item.estimatedRevenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Urgent Debt Reminders & Today Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Debt Reminders (2 Columns) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Cảnh Báo Công Nợ Học Phí Cần Thu Hồi</span>
              </h2>
              <p className="text-xs text-slate-500">Danh sách học sinh chưa nộp đủ học phí tháng này</p>
            </div>
            <button
              onClick={() => onNavigate('finance')}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
            >
              Xem tất cả ({invoices.filter((i) => i.remainingAmount > 0).length}) →
            </button>
          </div>

          <div className="space-y-2.5">
            {urgentDebtors.map((inv) => (
              <div
                key={inv.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs lg:text-sm">{inv.studentName}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-medium">
                      Khối {inv.grade}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        inv.status === 'overdue'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {inv.status === 'overdue' ? 'Quá hạn' : 'Đóng thiếu'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Còn nợ: <strong className="text-rose-600 font-bold">{formatCurrency(inv.remainingAmount)}</strong> / {formatCurrency(inv.totalAmount)}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const msg = `Kính gửi phụ huynh em ${inv.studentName}, AN TÂM EDUCATION xin gửi bảng kê học phí tháng ${inv.month}/${inv.year} còn lại: ${inv.remainingAmount.toLocaleString()}đ. Kính mong phụ huynh chuyển khoản theo mã học sinh ${inv.studentCode}. Xin cảm ơn!`;
                      navigator.clipboard.writeText(msg);
                      alert('Đã sao chép tin nhắn nhắc học phí để gửi Zalo cho phụ huynh!');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    title="Sao chép tin nhắn Zalo"
                  >
                    <Send className="w-3 h-3 text-indigo-600" />
                    <span>Nhắc Zalo</span>
                  </button>

                  <button
                    onClick={() => onOpenPaymentModal(inv.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Thu Tiền</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Schedule Sessions (1 Column) */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h2 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Thời Khóa Biểu Hôm Nay</span>
              </h2>
              <span className="text-[10px] font-bold text-indigo-600">Thứ Hai</span>
            </div>

            <div className="space-y-3">
              {scheduleSessions.slice(0, 3).map((ses, idx) => (
                <div
                  key={ses.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="text-xs font-bold text-slate-400 w-12">
                    {ses.startTime}
                  </div>
                  <div className={`flex-1 border-l-2 ${idx === 0 ? 'border-indigo-600' : 'border-slate-300'} pl-3`}>
                    <p className="text-xs font-bold text-slate-900">{ses.className}</p>
                    <p className="text-[10px] text-slate-500">
                      GV: {ses.teacherName} | Phòng: {ses.room}
                    </p>
                  </div>
                  <div className="text-[10px] font-bold bg-white px-2 py-0.5 border border-slate-200 rounded text-slate-600 shadow-2xs">
                    {idx === 0 ? 'ĐANG HỌC' : 'CHƯA BẮT ĐẦU'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('timetable')}
            className="w-full mt-3 py-2 text-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 rounded-lg transition-colors"
          >
            Xem toàn bộ thời khóa biểu →
          </button>
        </div>
      </div>
    </div>
  );
};
