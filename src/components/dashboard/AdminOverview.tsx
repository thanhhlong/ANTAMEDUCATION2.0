import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatShortCurrency } from '../../utils/formatters';
import {
  Users,
  GraduationCap,
  UserPlus,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  TrendingUp,
  ArrowUpRight,
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
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  onNavigate,
  onOpenPaymentModal,
  onOpenAddStudent,
  onOpenAddExpense,
  onOpenAddLead,
}) => {
  const { students, subjects, invoices, expenses, leads, tutors, scheduleSessions, selectedGrade } = useApp();

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
            <span>Học Viện An Tâm</span>
            <span>/</span>
            <span className="text-slate-700 font-medium">Bảng Điều Hành Đào Tạo & Học Tập</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-1">
            <span>ANTAM EDUCATION – QUẢN LÝ ĐÀO TẠO</span>
            {selectedGrade !== 'all' && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                Đang lọc: Khối {selectedGrade}
              </span>
            )}
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Giám sát chất lượng giảng dạy, tỷ lệ chuyên cần, tiến độ bài tập LMS & hỗ trợ học viên kịp thời.
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
            onClick={() => onNavigate('timetable')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sắp Lịch Học</span>
          </button>

          <button
            onClick={() => onNavigate('lms')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tạo Bài Tập LMS</span>
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
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">HỌC VIÊN ĐANG HỌC</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{totalStudents}</span>
            <span className="text-xs text-emerald-600 font-bold">↑ 100% hoạt động</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Khối lớp 6, 7, 8, 9 THCS</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
          </div>
        </div>

        {/* Card 2: Giáo viên & Trợ giảng */}
        <div
          onClick={() => onNavigate('tutors')}
          className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-purple-200 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">THẦY CÔ & TRỢ GIẢNG</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{totalTutors + 8}</span>
            <span className="text-xs text-purple-600 font-bold">12 Giáo viên chính</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Cam kết sư phạm chuyên sâu</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
          </div>
        </div>

        {/* Card 3: Lớp Học & Chuyên Đề */}
        <div
          onClick={() => onNavigate('tutoring')}
          className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-amber-200 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">LỚP HỌC & CHUYÊN ĐỀ</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">18</span>
            <span className="text-xs text-amber-600 font-bold">Lớp bồi dưỡng</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Mô hình kèm nhóm chất lượng</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
          </div>
        </div>

        {/* Card 4: Tỷ lệ Chuyên Cần */}
        <div
          onClick={() => onNavigate('attendance')}
          className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-200 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TỶ LỆ CHUYÊN CẦN</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-600">
              96.4%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Điểm danh số hóa Face AI</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Academic Quality KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Homework Submission */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>Nộp Bài Tập LMS</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            92.5%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">428/462 học sinh hoàn thành tuần này</div>
        </div>

        {/* Average Score Progress */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Điểm Số Tiến Bộ</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            +1.4 điểm
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `82%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 mt-1.5">
            Điểm thi giữa kỳ đạt trung bình 8.25/10
          </div>
        </div>

        {/* Parent Communication Feedback */}
        <div className="p-5 rounded-xl bg-white border border-rose-200 shadow-xs">
          <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Tương Tác Phụ Huynh</span>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">
            98.2%
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            Sổ liên lạc điện tử được phụ huynh xem kịp thời
          </div>
        </div>

        {/* Active Learning Modules */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wider">
            <Plus className="w-4 h-4 text-amber-600" />
            <span>Bài Giảng Số LMS</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            48 Bài học
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Đầy đủ video, chuyên đề & lời giải chi tiết</div>
        </div>
      </div>

      {/* Academic Quality Banner */}
      <div className="bg-indigo-900 rounded-xl p-6 text-white relative overflow-hidden shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-3 max-w-4xl">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-white">
                BÁO CÁO CHẤT LƯỢNG ĐÀO TẠO
              </span>
              <span className="text-xs text-indigo-200 font-medium">
                Tỷ lệ hoàn thành bài tập về nhà môn Toán đạt: <strong className="text-emerald-300 font-bold">94.8%</strong>
              </span>
            </div>
            <p className="text-sm lg:text-base font-normal leading-relaxed text-indigo-100">
              Học viện An Tâm đang duy trì cam kết chất lượng dạy kèm cao, với điểm chuyên cần trung bình đạt 96.4%. Hiện đang đồng bộ và giảng dạy {totalStudents} học sinh chính thức khối THCS, hỗ trợ bồi dưỡng nâng cao và bù đắp lỗ hổng kiến thức kịp thời bởi đội ngũ Gia sư & Trợ giảng tài năng.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <div className="bg-white/10 px-3.5 py-2 rounded-lg border border-white/10">
                <p className="text-[10px] text-indigo-300 font-bold uppercase">BỒI DƯỠNG TRỌNG TÂM</p>
                <p className="text-xs font-semibold text-white">Tăng cường kèm riêng cho 4 học sinh có bài kiểm tra dưới 6.5</p>
              </div>
              <div className="bg-white/10 px-3.5 py-2 rounded-lg border border-white/10">
                <p className="text-[10px] text-indigo-300 font-bold uppercase">TƯƠNG TÁC PHỤ HUYNH</p>
                <p className="text-xs font-semibold text-white">Đã gửi nhận xét học tập tự động cho 100% phụ huynh tuần này</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('lms')}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-bold shrink-0 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            <span>Học Liệu & Bài Tập LMS</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-indigo-500 rounded-full blur-3xl opacity-30 pointer-events-none" />
      </div>

      {/* Two Column Section: Grade Breakdown & Subject Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Phân tích sĩ số & điểm số */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Phân Bổ Sĩ Số & Điểm Trung Bình Theo Khối</span>
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
              // Estimate an average score based on grade level
              const avgScore = item.grade === 9 ? 8.1 : item.grade === 8 ? 8.3 : item.grade === 7 ? 8.4 : 8.6;
              const percent = Math.min(100, (avgScore / 10) * 100);
              return (
                <div key={item.grade} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">Khối {item.grade}</span>
                      <span className="text-slate-500">({item.studentCount} học viên)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-indigo-700">Điểm TB: {avgScore}/10</span>
                      <span className="text-[11px] text-emerald-600 font-semibold ml-2">
                        (Tỷ lệ chuyên cần: {item.grade === 9 ? '95.5%' : '97.0%'})
                      </span>
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
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>Chương Trình & Học Liệu Môn Học</span>
            </h2>
            <button
              onClick={() => onNavigate('subjects')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Xem giáo án →
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
                    {item.enrolledCount} học sinh theo học
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-800">
                    {item.subject.code} Level
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">
                    Đã nộp: 94% bài tập
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Students needing support & Today Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Support student warnings */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Học Viên Cần Bồi Dưỡng & Đồng Hành Đặc Biệt</span>
              </h2>
              <p className="text-xs text-slate-500">Danh sách học sinh vắng học hoặc có kết quả bài tập thấp tuần này</p>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
            >
              Hỗ trợ ngay →
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
                      {inv.status === 'overdue' ? 'Vắng 2 buổi' : 'Chưa nộp bài tập'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Ghi chú học vụ: <strong className="text-rose-600 font-semibold">Cần trợ giảng kèm thêm chuyên đề tuần này</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const msg = `Kính gửi phụ huynh em ${inv.studentName}, AN TÂM EDUCATION xin gửi thông báo cập nhật học vụ tuần này. Hiện em đang vắng học hoặc chưa hoàn thiện bài tập bồi dưỡng môn học trên hệ thống LMS. Rất mong phụ huynh nhắc nhở em tranh thủ hoàn thành hoặc liên hệ trợ giảng để được hướng dẫn thêm. Xin cảm ơn phụ huynh!`;
                      navigator.clipboard.writeText(msg);
                      alert('Đã sao chép tin nhắn nhắc học tập để gửi Zalo cho phụ huynh!');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    title="Sao chép tin nhắn Zalo"
                  >
                    <Send className="w-3 h-3 text-indigo-600" />
                    <span>Gửi Nhắc Zalo</span>
                  </button>

                  <button
                    onClick={() => onNavigate('attendance')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Xem Điểm Danh</span>
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
              <h2 className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Thời Khóa Biểu Trung Tâm</span>
              </h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {scheduleSessions.length} Ca Học
              </span>
            </div>

            <div className="space-y-2.5">
              {scheduleSessions
                .filter((s) => selectedGrade === 'all' || s.grade === selectedGrade)
                .slice(0, 4)
                .map((ses, idx) => (
                  <div
                    key={ses.id}
                    onClick={() => onNavigate('timetable')}
                    className="flex items-center gap-2.5 p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200/80 cursor-pointer transition-colors"
                  >
                    <div className="text-[11px] font-mono font-bold text-slate-600 w-12 text-center bg-white py-1 rounded border border-slate-200 shadow-2xs">
                      {ses.startTime}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{ses.className}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        Khối {ses.grade} • {ses.room} • GV: {ses.teacherName}
                      </p>
                    </div>
                    <div className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                      Ca {ses.shift}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('timetable')}
            className="w-full mt-3 py-2 text-center text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
          >
            Xem bảng thời khóa biểu toàn diện →
          </button>
        </div>
      </div>
    </div>
  );
};
