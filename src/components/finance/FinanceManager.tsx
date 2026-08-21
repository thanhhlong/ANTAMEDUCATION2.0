import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InvoiceRecord } from '../../types';
import { formatCurrency, formatShortCurrency } from '../../utils/formatters';
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
} from 'lucide-react';

interface FinanceManagerProps {
  onOpenPaymentModal: (invoiceId: string) => void;
}

export const FinanceManager: React.FC<FinanceManagerProps> = ({ onOpenPaymentModal }) => {
  const {
    invoices,
    subjects,
    selectedGrade,
    setSelectedGrade,
    addSubject,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid' | 'overdue'>('all');
  const [activeTab, setActiveTab] = useState<'invoices' | 'debtors' | 'pricing'>('invoices');

  // Viewing invoice details & Print receipt modal
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Subject Pricing Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectFee, setNewSubjectFee] = useState(400000);
  const [newSubjectColor, setNewSubjectColor] = useState('#3B82F6');

  // Filter invoices
  const filtered = invoices.filter((inv) => {
    if (selectedGrade !== 'all' && inv.grade !== selectedGrade) return false;
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

  const totalDue = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPaid = invoices.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalDebt = invoices.reduce((acc, i) => acc + i.remainingAmount, 0);

  const debtorsList = invoices.filter((i) => i.remainingAmount > 0);

  const handleCopyZaloMessage = (inv: InvoiceRecord) => {
    const msg = `Kính gửi Quý phụ huynh học sinh ${inv.studentName} (${inv.studentCode}),\nAN TÂM EDUCATION xin thông báo học phí tháng ${inv.month}/${inv.year}:\n- Tổng học phí: ${inv.totalAmount.toLocaleString()}đ\n- Đã nộp: ${inv.paidAmount.toLocaleString()}đ\n- Số tiền cần đóng: ${inv.remainingAmount.toLocaleString()}đ\n- Hạn thanh toán: ${inv.dueDate}\n\nQuý phụ huynh vui lòng chuyển khoản theo thông tin:\nNgân hàng: MBBank (Quân Đội)\nSTK: 0988112201 (AN TÂM EDUCATION)\nNội dung: ${inv.studentCode} HP T${inv.month}\nXin trân trọng cảm ơn!`;
    navigator.clipboard.writeText(msg);
    alert(`Đã sao chép tin nhắn nhắc học phí cho học sinh ${inv.studentName}! Bạn có thể dán trực tiếp vào Zalo.`);
  };

  const handlePrintReceipt = (inv: InvoiceRecord) => {
    setSelectedInvoice(inv);
    setIsPrintModalOpen(true);
  };

  const handleAddCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    addSubject({
      code: newSubjectName.slice(0, 4).toUpperCase(),
      name: newSubjectName.trim(),
      description: 'Môn học bổ sung',
      defaultFee: newSubjectFee,
      color: newSubjectColor,
      gradeLevels: [6, 7, 8, 9, 10, 11, 12],
      active: true,
    });
    setNewSubjectName('');
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
            <span className="text-slate-700">Học Phí & Công Nợ</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-1">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            <span>TÀI CHÍNH HỌC PHÍ & QUẢN LÝ CÔNG NỢ</span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Quản lý hóa đơn thu học phí, lịch sử giao dịch, cảnh báo nợ & bảng định mức học phí
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSubjectModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-indigo-600" />
            <span>Cấu Hình Học Phí</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Tổng Phải Thu (Tháng 8)</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {formatCurrency(totalDue)}
          </div>
          <div className="text-[11px] text-slate-500">
            {invoices.length} hóa đơn học sinh
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-emerald-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            <span>Đã Thu Thực Tế</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            {formatCurrency(totalPaid)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            Đạt {((totalPaid / (totalDue || 1)) * 100).toFixed(1)}% tỷ lệ thu hồi
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-rose-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-600 uppercase tracking-wider">
            <span>Công Nợ Còn Lại</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-bold text-rose-600">
            {formatCurrency(totalDebt)}
          </div>
          <div className="text-[11px] text-rose-600 font-medium">
            ⚠️ {debtorsList.length} học sinh chưa hoàn tất
          </div>
        </div>
      </div>

      {/* Sub-tabs & Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'invoices'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Tất Cả Hóa Đơn ({invoices.length})
            </button>

            <button
              onClick={() => setActiveTab('debtors')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'debtors'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Học Sinh Còn Nợ ({debtorsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'pricing'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Bảng Định Mức Học Phí
            </button>
          </div>

          {/* Grade Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="px-2 text-slate-500 font-medium">Khối:</span>
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
                className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedGrade === g.id ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Status Filter */}
        {activeTab !== 'pricing' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã hóa đơn, tên học sinh, mã HS..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-xs lg:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs lg:text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Tất cả trạng thái thanh toán</option>
                <option value="paid">Đã thu đủ</option>
                <option value="partial">Đóng thiếu một phần</option>
                <option value="overdue">Quá hạn thanh toán</option>
                <option value="unpaid">Chưa thu</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'pricing' ? (
        /* Pricing & Subjects Table */
        <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Bảng Mức Học Phí Chuẩn Theo Môn</h2>
              <p className="text-xs text-slate-500">
                Định mức thu học phí tự động áp dụng khi học sinh đăng ký môn
              </p>
            </div>
            <button
              onClick={() => setIsSubjectModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Môn Học</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span className="font-bold text-slate-900 text-sm">{sub.name}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {sub.code}
                  </span>
                </div>

                <div className="text-xs text-slate-500 line-clamp-2">{sub.description}</div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Định mức / tháng:</span>
                  <span className="text-sm font-bold text-indigo-700">
                    {formatCurrency(sub.defaultFee)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Invoices & Debtors Table */
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs lg:text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Mã HĐ / Học Sinh</th>
                  <th className="px-3 py-3.5">Khối</th>
                  <th className="px-4 py-3.5">Chi Tiết Môn Đăng Ký</th>
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
                      Không tìm thấy hóa đơn nào phù hợp.
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
                        </div>
                      </td>

                      {/* Grade */}
                      <td className="px-3 py-3.5 font-semibold text-slate-900">
                        Khối {inv.grade}
                      </td>

                      {/* Line items */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {inv.lineItems.map((li, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {li.subjectName} ({formatShortCurrency(li.amount)})
                            </span>
                          ))}
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

      {/* Subject Creation Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Thêm Môn Học Mới</span>
              </h2>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomSubject} className="space-y-3 text-xs lg:text-sm">
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
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
                >
                  Thêm Môn Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
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

              {/* Items */}
              <div className="border-t border-slate-200 pt-2 space-y-1.5">
                <div className="font-bold text-slate-800">Chi tiết các môn:</div>
                {selectedInvoice.lineItems.map((li, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span>• {li.subjectName}</span>
                    <span className="font-mono font-semibold">{formatCurrency(li.amount)}</span>
                  </div>
                ))}
              </div>

              {/* Total & Paid */}
              <div className="border-t border-slate-200 pt-2 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Tổng cộng:</span>
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
    </div>
  );
};
