import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { InvoiceRecord, InvoiceLineItem } from '../../types';
import { formatCurrency, formatShortCurrency } from '../../utils/formatters';
import { exportTuitionStudentsExcel, exportMonthlySettlementExcel } from '../../utils/excelParser';
import { TuitionExportModal } from './TuitionExportModal';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Search,
  Send,
  Plus,
  DollarSign,
  Printer,
  X,
  Settings,
  FileSpreadsheet,
  Download,
  Check,
  Calendar,
  Layers,
  Lock,
  Unlock,
  Sparkles,
  PieChart,
  Clock,
  BookOpen,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FinanceManagerProps {
  onOpenPaymentModal: (invoiceId: string) => void;
}

export const FinanceManager: React.FC<FinanceManagerProps> = ({ onOpenPaymentModal }) => {
  const {
    students,
    invoices,
    subjects,
    selectedGrade,
    setSelectedGrade,
    addSubject,
    updateSubject,
    createMonthlyInvoices,
    settleMonthlyInvoices,
    syncAcademicToOperations,
  } = useApp();

  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(8);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid' | 'overdue'>('all');
  const [activeTab, setActiveTab] = useState<'invoices' | 'debtors' | 'settlement' | 'pricing'>('invoices');

  // Secondary sub-tab for pricing: standard default or grade-specific overrides
  const [pricingSubTab, setPricingSubTab] = useState<'standard' | 'grade_adjusted'>('grade_adjusted');
  const [editingGrade, setEditingGrade] = useState<number>(8);
  const [feeInputs, setFeeInputs] = useState<{ [key: string]: string }>({});

  // Initialize input values for the selected grade
  React.useEffect(() => {
    const initialInputs: { [key: string]: string } = {};
    subjects.forEach((sub) => {
      const currentVal = sub.gradeFees && sub.gradeFees[editingGrade] !== undefined
        ? String(sub.gradeFees[editingGrade])
        : '';
      initialInputs[sub.id] = currentVal;
    });
    setFeeInputs(initialInputs);
  }, [editingGrade, subjects]);

  const handleSaveGradeFee = (subjectId: string) => {
    const inputValue = feeInputs[subjectId];
    const sub = subjects.find((s) => s.id === subjectId);
    if (!sub) return;

    const updatedGradeFees = { ...(sub.gradeFees || {}) };
    if (!inputValue || inputValue.trim() === '') {
      delete updatedGradeFees[editingGrade];
    } else {
      const num = parseInt(inputValue, 10);
      if (isNaN(num) || num < 0) {
        alert('Vui lòng nhập số tiền hợp lệ!');
        return;
      }
      updatedGradeFees[editingGrade] = num;
    }

    updateSubject(subjectId, { gradeFees: updatedGradeFees });
    alert(`Đã cập nhật học phí môn ${sub.name} cho Khối ${editingGrade} thành công!`);
  };

  const handleResetGradeFee = (subjectId: string) => {
    const sub = subjects.find((s) => s.id === subjectId);
    if (!sub) return;

    const updatedGradeFees = { ...(sub.gradeFees || {}) };
    delete updatedGradeFees[editingGrade];

    updateSubject(subjectId, { gradeFees: updatedGradeFees });
    setFeeInputs((prev) => ({ ...prev, [subjectId]: '' }));
    alert(`Đã khôi phục học phí môn ${sub.name} về mức mặc định cho Khối ${editingGrade}.`);
  };

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportInitialType, setExportInitialType] = useState<'all' | 'paid' | 'debt'>('all');
  const [copiedBatchZalo, setCopiedBatchZalo] = useState(false);

  // Viewing invoice details & Print receipt modal
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Subject Pricing Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectFee, setNewSubjectFee] = useState(400000);
  const [newSubjectColor, setNewSubjectColor] = useState('#3B82F6');

  // Monthly invoice generation modal
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [genMonth, setGenMonth] = useState<number>(9);
  const [genYear, setGenYear] = useState<number>(2026);
  const [genDueDate, setGenDueDate] = useState<string>('2026-09-15');

  const handleOpenAddSubject = () => {
    setEditingSubjectId(null);
    setNewSubjectName('');
    setNewSubjectFee(400000);
    setNewSubjectColor('#3B82F6');
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (sub: any) => {
    setEditingSubjectId(sub.id);
    setNewSubjectName(sub.name);
    setNewSubjectFee(sub.defaultFee);
    setNewSubjectColor(sub.color);
    setIsSubjectModalOpen(true);
  };

  // Filter invoices based on Grade, Month, Year, Search & Status
  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (selectedMonth !== 'all' && inv.month !== selectedMonth) return false;
      if (inv.year !== selectedYear) return false;
      if (selectedGrade !== 'all' && inv.grade !== selectedGrade) return false;
      if (activeTab === 'debtors' && inv.remainingAmount <= 0) return false;
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = inv.studentName.toLowerCase().includes(q);
        const matchCode = inv.studentCode.toLowerCase().includes(q);
        const matchInv = inv.invoiceCode.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchInv) return false;
      }
      return true;
    });
  }, [invoices, selectedMonth, selectedYear, selectedGrade, activeTab, statusFilter, searchQuery]);

  const totalDue = filtered.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPaid = filtered.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalDebt = filtered.reduce((acc, i) => acc + i.remainingAmount, 0);

  const debtorsList = filtered.filter((i) => i.remainingAmount > 0);
  const paidList = filtered.filter((i) => i.status === 'paid');

  // Monthly settlement statistics for the selected month
  const settlementMonthInvoices = useMemo(() => {
    const m = selectedMonth === 'all' ? 8 : selectedMonth;
    return invoices.filter((inv) => inv.month === m && inv.year === selectedYear);
  }, [invoices, selectedMonth, selectedYear]);

  const settlementStats = useMemo(() => {
    const total = settlementMonthInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
    const paid = settlementMonthInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
    const debt = settlementMonthInvoices.reduce((acc, i) => acc + i.remainingAmount, 0);
    const isAllSettled = settlementMonthInvoices.length > 0 && settlementMonthInvoices.every((i) => i.isSettled || i.status === 'paid');
    const fullyPaidCount = settlementMonthInvoices.filter((i) => i.status === 'paid').length;
    const partialCount = settlementMonthInvoices.filter((i) => i.status === 'partial').length;
    const unpaidCount = settlementMonthInvoices.filter((i) => i.status === 'unpaid' || i.status === 'overdue').length;

    // Per subject breakdown in settlement
    const subjectStatsMap: { [subjectId: string]: { name: string; totalDue: number; totalPaid: number; studentCount: number; paidCount: number } } = {};

    settlementMonthInvoices.forEach((inv) => {
      inv.lineItems.forEach((li) => {
        if (!subjectStatsMap[li.subjectId]) {
          subjectStatsMap[li.subjectId] = {
            name: li.subjectName,
            totalDue: 0,
            totalPaid: 0,
            studentCount: 0,
            paidCount: 0,
          };
        }
        subjectStatsMap[li.subjectId].totalDue += li.amount;
        subjectStatsMap[li.subjectId].totalPaid += li.paidAmount || 0;
        subjectStatsMap[li.subjectId].studentCount += 1;
        if (li.status === 'paid') {
          subjectStatsMap[li.subjectId].paidCount += 1;
        }
      });
    });

    return {
      total,
      paid,
      debt,
      isAllSettled,
      fullyPaidCount,
      partialCount,
      unpaidCount,
      subjectBreakdown: Object.values(subjectStatsMap),
    };
  }, [settlementMonthInvoices]);

  const handleQuickExport = (type: 'all' | 'paid' | 'debt') => {
    exportTuitionStudentsExcel(students, invoices, {
      filterType: type,
      grade: selectedGrade,
      month: selectedMonth === 'all' ? 8 : selectedMonth,
      year: selectedYear,
    });
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const handleExportSettlementExcel = () => {
    const m = selectedMonth === 'all' ? 8 : selectedMonth;
    const fileName = exportMonthlySettlementExcel(invoices, m, selectedYear);
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });
    alert(`Đã xuất báo cáo quyết toán Tháng ${m}/${selectedYear} thành công vào tệp ${fileName}!`);
  };

  const handleSettleMonth = () => {
    const m = selectedMonth === 'all' ? 8 : selectedMonth;
    if (window.confirm(`Xác nhận Khóa Sổ & Quyết Toán Học Phí Tháng ${m}/${selectedYear}? Toàn bộ hóa đơn trong tháng sẽ được đánh dấu đã quyết toán.`)) {
      settleMonthlyInvoices(m, selectedYear);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      alert(`Đã hoàn tất quyết toán tài chính Tháng ${m}/${selectedYear}!`);
    }
  };

  const handleBatchCopyZaloReminders = () => {
    const list = debtorsList;
    if (list.length === 0) {
      alert('Không có học sinh nào còn nợ!');
      return;
    }

    const currentM = selectedMonth === 'all' ? 8 : selectedMonth;
    const content = [
      `📢 DANH SÁCH THÔNG BÁO HỌC PHÍ THÁNG ${currentM}/${selectedYear} - AN TÂM EDUCATION`,
      `Tổng số học sinh còn nợ: ${list.length} | Tổng tiền: ${formatCurrency(totalDebt)}`,
      `----------------------------------------`,
      ...list.map(
        (inv, idx) =>
          `${idx + 1}. Em ${inv.studentName} (${inv.studentCode}) - Khối ${inv.grade}\n   • Số tiền cần đóng: ${formatCurrency(inv.remainingAmount)} (Đã nộp: ${formatCurrency(inv.paidAmount)})\n   • Hạn nộp: ${inv.dueDate}\n   • Trạng thái: ${inv.status === 'overdue' ? 'ĐÃ QUÁ HẠN' : 'Chờ thanh toán'}`
      ),
      `----------------------------------------`,
      `STK nhận học phí: MBBank 0988112201 - AN TAM EDUCATION (Cú pháp: [Mã HS] HP T${currentM})`,
    ];

    navigator.clipboard.writeText(content.join('\n'));
    setCopiedBatchZalo(true);
    setTimeout(() => setCopiedBatchZalo(false), 3000);
  };

  const handleCopyZaloMessage = (inv: InvoiceRecord) => {
    const lines = [
      `Kính gửi Quý phụ huynh học sinh ${inv.studentName} (${inv.studentCode}) - Khối ${inv.grade},`,
      `Trung tâm AN TÂM EDUCATION xin gửi thông báo học phí Tháng ${inv.month}/${inv.year}:`,
      `• Tổng học phí các môn: ${formatCurrency(inv.totalAmount)}`,
      `• Đã nộp: ${formatCurrency(inv.paidAmount)}`,
      `• Còn nợ cần thanh toán: ${formatCurrency(inv.remainingAmount)}`,
      `• Hạn nộp: ${inv.dueDate}`,
      `Chi tiết các môn:`,
      ...inv.lineItems.map(
        (li) =>
          `  - ${li.subjectName}: ${formatCurrency(li.amount)} (Đã nộp: ${formatCurrency(li.paidAmount || 0)}${
            li.paidDate ? ` - Ngày nộp: ${li.paidDate}` : ''
          })`
      ),
      `------------------------`,
      `Thông tin thanh toán:`,
      `Ngân hàng MBBank: STK 0988112201 - Chủ TK: AN TAM EDUCATION`,
      `Nội dung: AT ${inv.studentCode} HP T${inv.month}`,
      `Trân trọng cảm ơn Quý phụ huynh!`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    alert(`Đã sao chép tin nhắn nhắc học phí Zalo cho phụ huynh em ${inv.studentName}!`);
  };

  const handlePrintReceipt = (inv: InvoiceRecord) => {
    setSelectedInvoice(inv);
    setIsPrintModalOpen(true);
  };

  const handleGenerateNewMonthInvoices = (e: React.FormEvent) => {
    e.preventDefault();
    const count = createMonthlyInvoices(genMonth, genYear, genDueDate);
    setIsGenModalOpen(false);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
    alert(`Đã tạo thành công ${count} hóa đơn học phí mới cho Tháng ${genMonth}/${genYear}!`);
    setSelectedMonth(genMonth);
    setSelectedYear(genYear);
  };

  const handleAddCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    if (editingSubjectId) {
      updateSubject(editingSubjectId, {
        name: newSubjectName.trim(),
        defaultFee: newSubjectFee,
        color: newSubjectColor,
      });
      alert(`Đã cập nhật thông tin môn học ${newSubjectName.trim()} thành công!`);
    } else {
      addSubject({
        code: newSubjectName.slice(0, 4).toUpperCase(),
        name: newSubjectName.trim(),
        description: 'Môn học bổ sung',
        defaultFee: newSubjectFee,
        color: newSubjectColor,
        gradeLevels: [6, 7, 8, 9],
        active: true,
      });
      alert(`Đã thêm môn học ${newSubjectName.trim()} thành công!`);
    }

    setNewSubjectName('');
    setEditingSubjectId(null);
    setIsSubjectModalOpen(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Tài Chính</span>
            <span>/</span>
            <span className="text-slate-700">Học Phí, Thu Theo Môn & Quyết Toán</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-1">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            <span>TÀI CHÍNH HỌC PHÍ & QUYẾT TOÁN THEO THÁNG</span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Thu học phí từng môn riêng biệt kèm ngày nộp, nộp tổng trọn gói, và quyết toán tài chính định kỳ theo tháng
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sync Academic Data Button */}
          <button
            onClick={() => {
              if (syncAcademicToOperations) {
                const res = syncAcademicToOperations();
                confetti({
                  particleCount: 50,
                  spread: 60,
                  origin: { y: 0.6 },
                });
              }
            }}
            title="Đồng bộ danh sách môn học, học sinh từ phần Học Tập sang Hóa Đơn & Tài Chính"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Đồng Bộ Học Tập ({students.length} HS)</span>
          </button>

          {/* Create Monthly Invoices Button */}
          <button
            onClick={() => setIsGenModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Calendar className="w-4 h-4 text-white" />
            <span>Tạo Hóa Đơn Tháng Mới</span>
          </button>

          {/* Main Excel Export Trigger */}
          <button
            onClick={() => {
              setExportInitialType('all');
              setIsExportModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs lg:text-sm font-bold shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel Danh Sách</span>
          </button>

          <button
            onClick={() => setIsSubjectModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-indigo-600" />
            <span>Cấu Hình Học Phí</span>
          </button>
        </div>
      </div>

      {/* Month / Period Filter Strip */}
      <div className="p-3 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="font-bold uppercase tracking-wider text-slate-300">Kỳ Học Phí:</span>
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            {[8, 9, 10, 11, 12].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedMonth === m
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tháng {m}
              </button>
            ))}
            <button
              onClick={() => setSelectedMonth('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedMonth === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả
            </button>
          </div>
          <span className="text-slate-400 font-mono text-xs">Năm {selectedYear}</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {settlementStats.isAllSettled ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-[11px]">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tháng {selectedMonth === 'all' ? 8 : selectedMonth} đã quyết toán</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-[11px]">
              <Unlock className="w-3.5 h-3.5 text-amber-400" />
              <span>Tháng {selectedMonth === 'all' ? 8 : selectedMonth} đang thu & quyết toán</span>
            </span>
          )}

          <button
            onClick={() => setActiveTab('settlement')}
            className="px-3 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            Xem Quyết Toán Tháng 📊
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Tổng Phải Thu (T{selectedMonth === 'all' ? 'Tất cả' : selectedMonth})</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {formatCurrency(totalDue)}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>{filtered.length} hóa đơn học sinh</span>
            <button
              onClick={() => handleQuickExport('all')}
              className="text-indigo-600 hover:underline font-bold cursor-pointer"
            >
              Xuất Excel 📥
            </button>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            <span>Đã Thu Thực Tế ({paidList.length} HS)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            {formatCurrency(totalPaid)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium flex items-center justify-between">
            <span>Đạt {((totalPaid / (totalDue || 1)) * 100).toFixed(1)}% tỷ lệ thu</span>
            <button
              onClick={() => handleQuickExport('paid')}
              className="font-bold underline cursor-pointer hover:text-emerald-800"
            >
              Xuất DS Đã Đóng 📥
            </button>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-600 uppercase tracking-wider">
            <span>Công Nợ Còn Lại ({debtorsList.length} HS)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-bold text-rose-600">
            {formatCurrency(totalDebt)}
          </div>
          <div className="text-[11px] text-rose-600 font-medium flex items-center justify-between">
            <span>⚠️ {debtorsList.length} học sinh chưa hoàn tất</span>
            <button
              onClick={() => handleQuickExport('debt')}
              className="font-bold underline cursor-pointer hover:text-rose-800"
            >
              Xuất DS Còn Nợ 📥
            </button>
          </div>
        </div>
      </div>

      {/* Sub-tabs & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'invoices'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Tất Cả Hóa Đơn & Môn ({filtered.length})
            </button>

            <button
              onClick={() => setActiveTab('debtors')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'debtors'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Học Sinh Còn Nợ ({debtorsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settlement')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'settlement'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Quyết Toán Tháng {selectedMonth === 'all' ? 8 : selectedMonth}</span>
            </button>

            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'pricing'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Bảng Định Mức Học Phí
            </button>
          </div>

          {/* Fast Quick Export Buttons Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuickExport('paid')}
              title="Xuất file Excel danh sách học sinh đã đóng đủ tiền"
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Xuất DS Đã Nộp ({paidList.length})</span>
            </button>

            <button
              onClick={() => handleQuickExport('debt')}
              title="Xuất file Excel danh sách học sinh còn nợ tiền"
              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Xuất DS Còn Nợ ({debtorsList.length})</span>
            </button>
          </div>
        </div>

        {/* Search & Status Filter & Grade Selector */}
        {activeTab !== 'pricing' && activeTab !== 'settlement' && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="relative sm:col-span-6">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã hóa đơn, tên học sinh, mã HS, môn học..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs lg:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs lg:text-sm text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="paid">Đã thu đủ (100%)</option>
                <option value="partial">Đóng thiếu một phần</option>
                <option value="overdue">Quá hạn thanh toán</option>
                <option value="unpaid">Chưa thu</option>
              </select>
            </div>

            {/* Grade Selector */}
            <div className="sm:col-span-3 flex items-center justify-end gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <span className="px-1.5 text-slate-500 font-medium">Khối:</span>
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
                  className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    selectedGrade === g.id ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Batch Actions when on Debtors Tab */}
        {activeTab === 'debtors' && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-rose-800 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>
                Hiện có {debtorsList.length} học sinh chưa hoàn tất học phí (Tổng nợ: {formatCurrency(totalDebt)})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBatchCopyZaloReminders}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-100 text-rose-700 font-bold border border-rose-300 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                {copiedBatchZalo ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Đã Sao Chép DS Zalo!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-rose-600" />
                    <span>Sao Chép Mẫu Nhắc Zalo Hàng Loạt</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleQuickExport('debt')}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải File Excel DS Còn Nợ</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'settlement' ? (
        /* TAB: MONTHLY SETTLEMENT DASHBOARD */
        <div className="space-y-5">
          {/* Settlement Top Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    Báo Cáo Quyết Toán Học Phí Tháng {selectedMonth === 'all' ? 8 : selectedMonth}/{selectedYear}
                  </h2>
                  {settlementStats.isAllSettled ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã Khóa Sổ & Quyết Toán</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Đang Thu & Quyết Toán</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bảng tổng hợp thu chi học phí theo từng môn học, tỷ lệ hoàn tất nộp tiền và chốt sổ kỳ thu
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportSettlementExcel}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất Excel Quyết Toán</span>
                </button>

                {!settlementStats.isAllSettled && (
                  <button
                    type="button"
                    onClick={handleSettleMonth}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Khóa Sổ & Quyết Toán Tháng</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4 Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Học Phí Dự Thu:</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{formatCurrency(settlementStats.total)}</div>
                <div className="text-[10px] text-slate-400 mt-1">{settlementMonthInvoices.length} học sinh đăng ký</div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-[11px] text-emerald-700 font-medium">Đã Thu Thực Tế:</div>
                <div className="text-lg font-bold text-emerald-600 mt-0.5">{formatCurrency(settlementStats.paid)}</div>
                <div className="text-[10px] text-emerald-700 mt-1">{settlementStats.fullyPaidCount} HS đóng đủ 100%</div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
                <div className="text-[11px] text-rose-700 font-medium">Công Nợ Chưa Thu:</div>
                <div className="text-lg font-bold text-rose-600 mt-0.5">{formatCurrency(settlementStats.debt)}</div>
                <div className="text-[10px] text-rose-600 mt-1">{settlementStats.unpaidCount + settlementStats.partialCount} HS còn nợ</div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
                <div className="text-[11px] text-indigo-700 font-medium">Tỷ Lệ Thu Hồi:</div>
                <div className="text-lg font-bold text-indigo-700 mt-0.5">
                  {((settlementStats.paid / (settlementStats.total || 1)) * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-indigo-600 mt-1">
                  {settlementStats.fullyPaidCount}/{settlementMonthInvoices.length} hóa đơn hoàn tất
                </div>
              </div>
            </div>
          </div>

          {/* Per-Subject Settlement Breakdown Table */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Quyết Toán Chi Tiết Từng Môn Học (Tháng {selectedMonth === 'all' ? 8 : selectedMonth})
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                {settlementStats.subjectBreakdown.length} môn học đang mở lớp
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs lg:text-sm text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Môn Học</th>
                    <th className="px-4 py-3 text-center">Số HS Học</th>
                    <th className="px-4 py-3 text-center">Đã Đóng Đủ</th>
                    <th className="px-4 py-3">Tổng Dự Thu</th>
                    <th className="px-4 py-3">Đã Thu Thực Tế</th>
                    <th className="px-4 py-3">Còn Nợ</th>
                    <th className="px-4 py-3 text-center">Tỷ Lệ Thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {settlementStats.subjectBreakdown.map((sub, idx) => {
                    const subDebt = Math.max(0, sub.totalDue - sub.totalPaid);
                    const rate = ((sub.totalPaid / (sub.totalDue || 1)) * 100).toFixed(1);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                          <span>{sub.name}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-medium text-slate-700">
                          {sub.studentCount} HS
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-xs">
                            {sub.paidCount} / {sub.studentCount}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                          {formatCurrency(sub.totalDue)}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-emerald-600">
                          {formatCurrency(sub.totalPaid)}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-rose-600">
                          {subDebt > 0 ? formatCurrency(subDebt) : '0 ₫'}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${Math.min(100, Number(rate))}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700">{rate}%</span>
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
      ) : activeTab === 'pricing' ? (
        /* Pricing & Subjects Table */
        <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-5 shadow-xs">
          {/* Subheader and Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Quản Lý & Cấu Hình Học Phí</h2>
              <p className="text-xs text-slate-500">
                Điều chỉnh học phí chuẩn của môn học hoặc cấu hình mức giá riêng biệt theo từng khối lớp (K6 - K12)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setPricingSubTab('standard')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                    pricingSubTab === 'standard'
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Mức Phí Chuẩn
                </button>
                <button
                  onClick={() => setPricingSubTab('grade_adjusted')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                    pricingSubTab === 'grade_adjusted'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Điều Chỉnh Theo Khối
                </button>
              </div>

              <button
                onClick={handleOpenAddSubject}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Môn Học</span>
              </button>
            </div>
          </div>

          {/* Auto-Sync Notice */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between gap-3 text-emerald-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold">Đồng bộ tự động:</span>
              <span className="text-emerald-800">Mọi thay đổi biểu phí môn học sẽ lập tức áp dụng và tính lại học phí, công nợ cho toàn bộ học sinh đang theo học theo đúng khối lớp.</span>
            </div>
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-extrabold uppercase">
              Tự Động 100%
            </span>
          </div>

          {pricingSubTab === 'standard' ? (
            /* Sub-tab 1: Standard Tuition Table with Edit Action */
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs lg:text-sm text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Môn Học</th>
                    <th className="px-4 py-3">Mã Môn</th>
                    <th className="px-4 py-3">Mô Tả</th>
                    <th className="px-4 py-3">Học Phí Chuẩn / Tháng</th>
                    <th className="px-4 py-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color || '#3B82F6' }}
                        />
                        <span>{sub.name}</span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-600">
                        {sub.code}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {sub.description || 'Chương trình tiêu chuẩn'}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-indigo-700">
                        {formatCurrency(sub.defaultFee)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenEditSubject(sub)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Sửa mức phí
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Sub-tab 2: Grade-Adjusted Tuition Matrix */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <span>Chọn Khối Lớp Để Tùy Chỉnh:</span>
                  <div className="flex gap-1">
                    {[6, 7, 8, 9].map((g) => (
                      <button
                        key={g}
                        onClick={() => setEditingGrade(g)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          editingGrade === g
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Khối {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  Đang chỉnh sửa mức học phí cho: <strong className="text-indigo-700">Khối {editingGrade}</strong>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs lg:text-sm text-slate-700">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Môn Học</th>
                      <th className="px-4 py-3">Học Phí Chuẩn Gốc</th>
                      <th className="px-4 py-3">Học Phí Áp Dụng Khối {editingGrade} (VNĐ)</th>
                      <th className="px-4 py-3 text-center">Trạng Thái</th>
                      <th className="px-4 py-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjects.map((sub) => {
                      const hasOverride = sub.gradeFees && sub.gradeFees[editingGrade] !== undefined;
                      const activeFee = hasOverride ? sub.gradeFees![editingGrade] : sub.defaultFee;

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: sub.color || '#3B82F6' }}
                            />
                            <span>{sub.name}</span>
                          </td>

                          <td className="px-4 py-3 text-slate-500 font-mono">
                            {formatCurrency(sub.defaultFee)}
                          </td>

                          {/* Editable Price Input for this Grade */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="50000"
                                placeholder={`Mặc định (${sub.defaultFee})`}
                                value={feeInputs[sub.id] !== undefined ? feeInputs[sub.id] : ''}
                                onChange={(e) =>
                                  setFeeInputs((prev) => ({
                                    ...prev,
                                    [sub.id]: e.target.value,
                                  }))
                                }
                                className={`w-40 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                  hasOverride
                                    ? 'border-indigo-400 bg-indigo-50/40 text-indigo-900'
                                    : 'border-slate-300 bg-white text-slate-700'
                                }`}
                              />
                              <span className="text-[11px] text-slate-400">₫/tháng</span>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-3 text-center">
                            {hasOverride ? (
                              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold border border-indigo-200">
                                Đã điều chỉnh ({formatShortCurrency(activeFee)})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                                Theo chuẩn gốc
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleSaveGradeFee(sub.id)}
                                className="px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                              >
                                Lưu áp dụng
                              </button>
                              {hasOverride && (
                                <button
                                  onClick={() => handleResetGradeFee(sub.id)}
                                  className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-medium transition-all cursor-pointer"
                                  title="Khôi phục về mức học phí chuẩn mặc định"
                                >
                                  Đặt lại
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
          )}
        </div>
      ) : (
        /* Invoices & Debtors Table (With Granular Per-Subject Breakdown & Paid Dates) */
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs lg:text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Mã HĐ / Học Sinh</th>
                  <th className="px-3 py-3.5">Khối</th>
                  <th className="px-4 py-3.5 min-w-[280px]">Chi Tiết Từng Môn & Ngày Nộp</th>
                  <th className="px-3 py-3.5">Tổng Phải Thu</th>
                  <th className="px-3 py-3.5">Đã Nộp</th>
                  <th className="px-3 py-3.5">Còn Nợ</th>
                  <th className="px-3 py-3.5">Trạng Thái</th>
                  <th className="px-4 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      Không tìm thấy hóa đơn nào phù hợp trong kỳ đã chọn.
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Inv Code & Student */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{inv.studentName}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span className="text-indigo-600 font-semibold">{inv.invoiceCode}</span>
                          <span>•</span>
                          <span>{inv.studentCode}</span>
                          {inv.isSettled && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                              Quyết toán
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Grade */}
                      <td className="px-3 py-3.5 font-semibold text-slate-900">
                        Khối {inv.grade}
                      </td>

                      {/* Granular Per-Subject Payment Status, Amounts & Dates */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1.5 min-w-[280px]">
                          {inv.lineItems.map((li, idx) => {
                            const lineAmount = li.amount || 0;
                            const linePaid = li.paidAmount !== undefined ? li.paidAmount : (inv.status === 'paid' ? lineAmount : 0);
                            const lineRemaining = li.remainingAmount !== undefined ? li.remainingAmount : Math.max(0, lineAmount - linePaid);
                            const isPaid = lineRemaining === 0;
                            const isPartial = linePaid > 0 && !isPaid;

                            return (
                              <div
                                key={idx}
                                className={`p-2 rounded-lg border text-[11px] transition-colors ${
                                  isPaid
                                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                    : isPartial
                                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                {/* Header row: Subject Name + Total Subject Fee + Mode Tag */}
                                <div className="flex items-center justify-between gap-2 font-medium">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900">{li.subjectName}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      ({formatShortCurrency(lineAmount)})
                                    </span>
                                  </div>

                                  {li.paymentMode && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-white/80 text-slate-600 border border-slate-200">
                                      {li.paymentMode === 'per_subject' ? 'Từng môn' : 'Nộp tổng'}
                                    </span>
                                  )}
                                </div>

                                {/* Status & Amount & Paid Date details */}
                                <div className="flex flex-wrap items-center justify-between gap-1.5 mt-1 pt-1 border-t border-slate-200/60 text-[10px]">
                                  {isPaid ? (
                                    <div className="flex items-center gap-1 font-semibold text-emerald-700">
                                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span>Đã nộp đủ: <strong>{formatCurrency(linePaid || lineAmount)}</strong></span>
                                    </div>
                                  ) : isPartial ? (
                                    <div className="flex items-center gap-1 font-semibold text-amber-700">
                                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      <span>
                                        Đã nộp: <strong>{formatCurrency(linePaid)}</strong> (Nợ: {formatCurrency(lineRemaining)})
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 font-medium text-rose-600">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                                      <span>Chưa nộp (Nợ: {formatCurrency(lineRemaining)})</span>
                                    </div>
                                  )}

                                  {/* Paid Date */}
                                  {li.paidDate ? (
                                    <div className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                                      <Calendar className="w-2.5 h-2.5 text-indigo-500" />
                                      <span>{li.paidDate}</span>
                                    </div>
                                  ) : (
                                    !isPaid && (
                                      <span className="text-[9px] text-slate-400 font-mono">Chưa thanh toán</span>
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Total Due */}
                      <td className="px-3 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(inv.totalAmount)}
                      </td>

                      {/* Paid */}
                      <td className="px-3 py-3.5 text-emerald-600 font-semibold whitespace-nowrap">
                        {formatCurrency(inv.paidAmount)}
                      </td>

                      {/* Debt */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {inv.remainingAmount > 0 ? (
                          <span className="font-bold text-rose-600">
                            {formatCurrency(inv.remainingAmount)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">0 ₫</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                            inv.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : inv.status === 'partial'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : inv.status === 'overdue'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {inv.status === 'paid'
                            ? 'Đã thu đủ'
                            : inv.status === 'partial'
                            ? 'Đóng thiếu'
                            : inv.status === 'overdue'
                            ? 'Quá hạn'
                            : 'Chưa thu'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.remainingAmount > 0 ? (
                            <>
                              <button
                                onClick={() => handleCopyZaloMessage(inv)}
                                title="Sao chép tin nhắn nhắc học phí Zalo"
                                className="p-1.5 rounded-md bg-slate-100 text-indigo-600 hover:text-indigo-800 hover:bg-slate-200 transition-colors cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onOpenPaymentModal(inv.id)}
                                className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                              >
                                Thu tiền
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handlePrintReceipt(inv)}
                              title="In phiếu thu / hóa đơn điện tử"
                              className="p-1.5 rounded-md bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Phiếu thu</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Batch Create Invoices for New Month Modal */}
      {isGenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span>Tạo Hóa Đơn Học Phí Tháng Mới</span>
              </h2>
              <button
                onClick={() => setIsGenModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateNewMonthInvoices} className="space-y-3.5 text-xs lg:text-sm">
              <p className="text-slate-600 text-xs leading-relaxed">
                Hệ thống sẽ tự động tổng hợp danh sách môn học đăng ký của tất cả học sinh đang học và xuất hóa đơn tương ứng cho tháng mới.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">Tháng *</label>
                  <select
                    value={genMonth}
                    onChange={(e) => setGenMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500 font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>Tháng {m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">Năm *</label>
                  <input
                    type="number"
                    value={genYear}
                    onChange={(e) => setGenYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono font-bold focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">Hạn Nộp Học Phí *</label>
                <input
                  type="date"
                  value={genDueDate}
                  onChange={(e) => setGenDueDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGenModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Tạo Hóa Đơn Hàng Loạt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Creation / Edit Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {editingSubjectId ? (
                  <Settings className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Plus className="w-4 h-4 text-indigo-600" />
                )}
                <span>{editingSubjectId ? 'Chỉnh Sửa Thông Tin Môn Học' : 'Thêm Môn Học Mới'}</span>
              </h2>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomSubject} className="space-y-3 text-xs lg:text-sm">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                <label className="block text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                  Chọn môn học để chỉnh sửa (hoặc thêm mới):
                </label>
                <select
                  value={editingSubjectId || ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) {
                      setEditingSubjectId(null);
                      setNewSubjectName('');
                      setNewSubjectFee(400000);
                      setNewSubjectColor('#3B82F6');
                    } else {
                      const selectedSub = subjects.find((s) => s.id === id);
                      if (selectedSub) {
                        setEditingSubjectId(selectedSub.id);
                        setNewSubjectName(selectedSub.name);
                        setNewSubjectFee(selectedSub.defaultFee);
                        setNewSubjectColor(selectedSub.color);
                      }
                    }
                  }}
                  className="w-full px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer"
                >
                  <option value="">-- Tạo Môn Học Mới --</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code}) - Mức chuẩn: {formatCurrency(sub.defaultFee)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Tên Môn Học *</label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="VD: Lịch sử, Địa lý, Tin học, Luyện đề chuyên..."
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Định Mức Học Phí (VNĐ / Tháng) *</label>
                <input
                  type="number"
                  step="50000"
                  value={newSubjectFee}
                  onChange={(e) => setNewSubjectFee(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Màu Nhận Diện</label>
                <div className="flex items-center gap-2">
                  {['#4F46E5', '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewSubjectColor(col)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        newSubjectColor === col ? 'scale-125 ring-2 ring-indigo-600 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingSubjectId ? 'Lưu Thay Đổi' : 'Thêm Môn Học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal with Per-Subject Payment Breakdown & Dates */}
      {isPrintModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span>PHIẾU THU HỌC PHÍ ĐIỆN TỬ</span>
              </h2>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Container */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
              <div className="text-center border-b border-slate-200 pb-3 space-y-1">
                <div className="font-extrabold text-base text-slate-900 tracking-wider">
                  HỆ THỐNG GIÁO DỤC ANTAM EDUCATION
                </div>
                <div className="text-[11px] text-slate-500">
                  Cơ sở: Cầu Giấy, Hà Nội • Hotline: 0988.11.22.01
                </div>
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-widest pt-1">
                  BIÊN LAI THU HỌC PHÍ THÁNG {selectedInvoice.month}/{selectedInvoice.year}
                </div>
              </div>

              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span>Mã hóa đơn:</span>
                  <strong className="font-mono text-slate-900">{selectedInvoice.invoiceCode}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Họ tên học sinh:</span>
                  <strong className="text-slate-900">{selectedInvoice.studentName} ({selectedInvoice.studentCode})</strong>
                </div>
                <div className="flex justify-between">
                  <span>Khối lớp:</span>
                  <span>Khối {selectedInvoice.grade}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ngày phát hành:</span>
                  <span>{selectedInvoice.createdAt}</span>
                </div>
              </div>

              {/* Items with Per-Subject Payment Date */}
              <div className="border-t border-slate-200 pt-2 space-y-2">
                <div className="font-bold text-slate-800">Chi tiết từng môn học:</div>
                {selectedInvoice.lineItems.map((li, idx) => (
                  <div key={idx} className="p-2 rounded bg-white border border-slate-200 text-[11px] space-y-0.5">
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>• {li.subjectName}</span>
                      <span className="font-mono">{formatCurrency(li.amount)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>
                        Đã nộp: <strong className="text-emerald-600">{formatCurrency(li.paidAmount || 0)}</strong>
                        {li.paidDate && ` (Ngày nộp: ${li.paidDate})`}
                      </span>
                      <span>
                        Còn nợ: <strong className="text-rose-600">{formatCurrency(li.remainingAmount || 0)}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Paid */}
              <div className="border-t border-slate-200 pt-2 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Tổng học phí:</span>
                  <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Số tiền đã thu:</span>
                  <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Còn lại:</span>
                  <span>{formatCurrency(selectedInvoice.remainingAmount)}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                Cảm ơn Quý phụ huynh đã đồng hành cùng AN TÂM EDUCATION!
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 no-print">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>In Phiếu Thu</span>
              </button>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Specialized Tuition Export Modal */}
      <TuitionExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        initialType={exportInitialType}
      />
    </div>
  );
};
