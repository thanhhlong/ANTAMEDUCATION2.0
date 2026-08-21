import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportTuitionStudentsExcel, TuitionExportOptions } from '../../utils/excelParser';
import { formatCurrency } from '../../utils/formatters';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Users,
  Printer,
  Copy,
  Check,
  X,
  Filter,
  Layers,
  FileText,
  DollarSign,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TuitionExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'all' | 'paid' | 'debt' | 'partial';
}

export const TuitionExportModal: React.FC<TuitionExportModalProps> = ({
  isOpen,
  onClose,
  initialType = 'all',
}) => {
  const { students, invoices, selectedGrade } = useApp();

  const [exportType, setExportType] = useState<'all' | 'paid' | 'debt' | 'partial'>(initialType);
  const [gradeFilter, setGradeFilter] = useState<number | 'all'>(
    selectedGrade === 'all' ? 'all' : selectedGrade
  );
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  // Filter students based on grade
  const gradeStudents = gradeFilter === 'all' ? students : students.filter((s) => s.grade === gradeFilter);

  const paidList = gradeStudents.filter((s) => s.remainingDebt === 0 && s.totalTuitionDue > 0);
  const debtList = gradeStudents.filter((s) => s.remainingDebt > 0);
  const partialList = gradeStudents.filter((s) => s.totalPaid > 0 && s.remainingDebt > 0);

  const totalRevenue = gradeStudents.reduce((sum, s) => sum + s.totalTuitionDue, 0);
  const totalPaid = gradeStudents.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalDebt = gradeStudents.reduce((sum, s) => sum + s.remainingDebt, 0);

  // Filter active preview count
  let currentCount = gradeStudents.length;
  let currentAmount = totalRevenue;

  if (exportType === 'paid') {
    currentCount = paidList.length;
    currentAmount = totalPaid;
  } else if (exportType === 'debt') {
    currentCount = debtList.length;
    currentAmount = totalDebt;
  } else if (exportType === 'partial') {
    currentCount = partialList.length;
    currentAmount = partialList.reduce((sum, s) => sum + s.remainingDebt, 0);
  }

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const fileName = exportTuitionStudentsExcel(students, invoices, {
        filterType: exportType,
        grade: gradeFilter,
        month: 8,
        year: 2026,
      });

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });
      setTimeout(() => {
        setIsExporting(false);
      }, 500);
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi tạo file Excel');
      setIsExporting(false);
    }
  };

  const handleCopyZaloDebtList = () => {
    if (debtList.length === 0) {
      alert('Hiện không có học sinh nào còn nợ.');
      return;
    }

    const lines = [
      `📢 DANH SÁCH HỌC SINH CÒN NỢ HỌC PHÍ - AN TÂM EDUCATION (T8/2026)`,
      `Tổng số: ${debtList.length} học sinh | Tổng nợ: ${formatCurrency(totalDebt)}`,
      `----------------------------------------`,
      ...debtList.map(
        (st, idx) =>
          `${idx + 1}. ${st.fullName} (${st.code}) - ${st.className}\n   • Nợ: ${formatCurrency(st.remainingDebt)} / Tổng: ${formatCurrency(st.totalTuitionDue)}\n   • Phụ huynh: ${st.parentName} - SĐT: ${st.parentPhone}`
      ),
      `----------------------------------------`,
      `👉 Thông tin thanh toán: MBBank - STK: 0988112201 (AN TAM EDUCATION)`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 3000);
  };

  const handlePrintTable = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl text-slate-800 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 shadow-2xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Xuất Danh Sách Học Phí & Công Nợ</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                  Excel .XLSX
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Tải về danh sách học sinh đã đóng tiền, đã thu, hoặc còn nợ kèm đầy đủ số điện thoại phụ huynh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Chọn Phân Loại Xuất */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
            1. Chọn loại danh sách cần xuất:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Tất cả */}
            <button
              type="button"
              onClick={() => setExportType('all')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                exportType === 'all'
                  ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <Layers className="w-4 h-4" />
                </span>
                <span className="text-[11px] font-bold text-indigo-600">
                  {gradeStudents.length} HS
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">Báo Cáo Tổng Hợp</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Bao gồm cả Đã đóng + Còn nợ + Thống kê khối
                </div>
              </div>
            </button>

            {/* Đã đóng tiền */}
            <button
              type="button"
              onClick={() => setExportType('paid')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                exportType === 'paid'
                  ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <span className="text-[11px] font-bold text-emerald-600">
                  {paidList.length} HS
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">Đã Đóng Đủ (100%)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Đã hoàn tất học phí, phương thức nộp & ngày nộp
                </div>
              </div>
            </button>

            {/* Còn nợ tiền */}
            <button
              type="button"
              onClick={() => setExportType('debt')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                exportType === 'debt'
                  ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <span className="text-[11px] font-bold text-rose-600">
                  {debtList.length} HS
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">Còn Nợ / Chưa Nộp</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Kèm SĐT phụ huynh, số nợ & mẫu tin nhắn Zalo
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Chọn Khối Học */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
            2. Lọc theo khối học sinh:
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Tất Cả Các Khối' },
              { id: 6, label: 'Khối 6' },
              { id: 7, label: 'Khối 7' },
              { id: 8, label: 'Khối 8' },
              { id: 9, label: 'Khối 9' },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGradeFilter(g.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  gradeFilter === g.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Preview Box Metrics */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dữ liệu dự kiến xuất ra file:</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              {gradeFilter === 'all' ? 'Tất cả các khối' : `Khối ${gradeFilter}`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
              <div className="text-[11px] text-slate-400">Số lượng học sinh</div>
              <div className="text-lg font-bold text-white mt-0.5">
                {currentCount} <span className="text-xs font-normal text-slate-400">học sinh</span>
              </div>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
              <div className="text-[11px] text-slate-400">
                {exportType === 'paid' ? 'Tổng tiền đã thu' : exportType === 'debt' ? 'Tổng nợ cần thu' : 'Tổng doanh thu'}
              </div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                {formatCurrency(currentAmount)}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
              <div className="text-[11px] text-slate-400">Tỷ lệ thu hồi</div>
              <div className="text-lg font-bold text-indigo-300 mt-0.5">
                {((totalPaid / (totalRevenue || 1)) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* 4. Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportExcel}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>
                  {exportType === 'all'
                    ? 'Tải File Excel Báo Cáo Tổng Hợp (.XLSX)'
                    : exportType === 'paid'
                    ? 'Tải Danh Sách Học Sinh Đã Đóng Tiền (.XLSX)'
                    : 'Tải Danh Sách Học Sinh Còn Nợ (.XLSX)'}
                </span>
              </>
            )}
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyZaloDebtList}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            >
              {copiedZalo ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Đã Sao Chép DS Nợ Gửi Zalo!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-indigo-600" />
                  <span>Sao Chép DS Nợ Gửi Zalo ({debtList.length} HS)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrintTable}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>In Bảng Quyết Toán Học Phí</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
