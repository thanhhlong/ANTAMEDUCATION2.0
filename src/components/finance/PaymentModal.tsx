import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod, PaymentMode } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  CreditCard,
  QrCode,
  DollarSign,
  Building,
  CheckCircle2,
  X,
  Layers,
  CheckSquare,
  Square,
  Calendar,
  Sparkles,
  Info,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  invoiceId: string;
  onClose: () => void;
}

interface SubjectItemState {
  subjectId: string;
  subjectName: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  selected: boolean;
  paymentAmount: number;
  paidDate: string;
  notes: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ invoiceId, onClose }) => {
  const { invoices, addPayment } = useApp();

  const invoice = invoices.find((i) => i.id === invoiceId);

  if (!invoice) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('per_subject');
  const [commonPaymentDate, setCommonPaymentDate] = useState<string>(todayStr);

  // Per-subject line item states
  const [subjectStates, setSubjectStates] = useState<SubjectItemState[]>(() => {
    return invoice.lineItems.map((li) => {
      const alreadyPaid = li.paidAmount || 0;
      const remaining = li.remainingAmount !== undefined ? li.remainingAmount : Math.max(0, li.amount - alreadyPaid);
      return {
        subjectId: li.subjectId,
        subjectName: li.subjectName,
        amount: li.amount,
        paidAmount: alreadyPaid,
        remainingAmount: remaining,
        selected: remaining > 0, // default select if still owes
        paymentAmount: remaining,
        paidDate: li.paidDate || todayStr,
        notes: '',
      };
    });
  });

  // Lump sum total amount state
  const [lumpSumAmount, setLumpSumAmount] = useState<number>(invoice.remainingAmount);

  // Common payment details
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [referenceCode, setReferenceCode] = useState(`FT${Date.now().toString().slice(-6)}`);
  const [collectedBy, setCollectedBy] = useState('Kế toán Thu Trang');
  const [notes, setNotes] = useState('Phụ huynh thanh toán học phí');

  // Compute total amount to pay
  const calculatedTotalAmount = useMemo(() => {
    if (paymentMode === 'full') {
      return lumpSumAmount;
    }
    return subjectStates
      .filter((s) => s.selected)
      .reduce((sum, s) => sum + (s.paymentAmount || 0), 0);
  }, [paymentMode, lumpSumAmount, subjectStates]);

  // Handlers for subject items
  const handleToggleSubject = (subjectId: string) => {
    setSubjectStates((prev) =>
      prev.map((s) => (s.subjectId === subjectId ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleSubjectAmountChange = (subjectId: string, value: number) => {
    setSubjectStates((prev) =>
      prev.map((s) => (s.subjectId === subjectId ? { ...s, paymentAmount: Math.max(0, value) } : s))
    );
  };

  const handleSubjectDateChange = (subjectId: string, date: string) => {
    setSubjectStates((prev) =>
      prev.map((s) => (s.subjectId === subjectId ? { ...s, paidDate: date } : s))
    );
  };

  const handleSelectAllSubjects = (selectAll: boolean) => {
    setSubjectStates((prev) =>
      prev.map((s) => ({
        ...s,
        selected: selectAll,
        paymentAmount: selectAll ? s.remainingAmount : 0,
      }))
    );
  };

  const handleApplyCommonDateToAll = () => {
    setSubjectStates((prev) =>
      prev.map((s) => ({
        ...s,
        paidDate: commonPaymentDate,
      }))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (calculatedTotalAmount <= 0) {
      alert('Vui lòng chọn ít nhất một môn học hoặc nhập số tiền nộp lớn hơn 0đ.');
      return;
    }

    if (paymentMode === 'per_subject') {
      const selectedSubjects = subjectStates.filter((s) => s.selected && s.paymentAmount > 0);
      if (selectedSubjects.length === 0) {
        alert('Vui lòng chọn môn học và nhập số tiền thanh toán cho môn đó.');
        return;
      }

      addPayment(invoiceId, {
        studentId: invoice.studentId,
        studentName: invoice.studentName,
        amount: calculatedTotalAmount,
        paymentDate: commonPaymentDate,
        method,
        referenceCode,
        collectedBy,
        notes: notes || `Thu học phí từng môn (${selectedSubjects.map((s) => s.subjectName).join(', ')})`,
        paymentMode: 'per_subject',
        subjectBreakdown: selectedSubjects.map((s) => ({
          subjectId: s.subjectId,
          subjectName: s.subjectName,
          amount: s.paymentAmount,
          paidDate: s.paidDate || commonPaymentDate,
          notes: s.notes,
        })),
      });
    } else {
      // Full / Lump sum mode
      addPayment(invoiceId, {
        studentId: invoice.studentId,
        studentName: invoice.studentName,
        amount: calculatedTotalAmount,
        paymentDate: commonPaymentDate,
        method,
        referenceCode,
        collectedBy,
        notes: notes || 'Thu nộp tổng học phí cả kỳ',
        paymentMode: 'full',
      });
    }

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
    });

    onClose();
  };

  const qrTransferContent = `AT ${invoice.studentCode} HP T${invoice.month}`;
  const vietQrUrl = `https://img.vietqr.io/image/mbbank-0988112201-compact2.png?amount=${calculatedTotalAmount}&addInfo=${encodeURIComponent(
    qrTransferContent
  )}&accountName=${encodeURIComponent('AN TAM EDUCATION')}`;

  const remainingAfterThisPay = Math.max(0, invoice.remainingAmount - calculatedTotalAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-5 sm:p-6 space-y-4 shadow-2xl text-slate-800 my-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Thu Học Phí Tháng {invoice.month}/{invoice.year}</span>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {invoice.invoiceCode}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {invoice.studentName} ({invoice.studentCode}) • Khối {invoice.grade}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Top Summary */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <div className="text-slate-500 text-[11px]">Tổng học phí kỳ này:</div>
            <div className="text-sm font-bold text-slate-900">{formatCurrency(invoice.totalAmount)}</div>
          </div>
          <div>
            <div className="text-emerald-700 text-[11px] font-medium">Đã thu trước đó:</div>
            <div className="text-sm font-bold text-emerald-600">{formatCurrency(invoice.paidAmount)}</div>
          </div>
          <div className="text-right">
            <div className="text-rose-600 text-[11px] font-medium">Công nợ cần thu:</div>
            <div className="text-sm sm:text-base font-bold text-rose-600">
              {formatCurrency(invoice.remainingAmount)}
            </div>
          </div>
        </div>

        {/* Mode Selector Tab */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            Hình Thức Thu Tiền:
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setPaymentMode('per_subject')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                paymentMode === 'per_subject'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <span>Nộp Từng Môn Riêng Biệt</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('full')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                paymentMode === 'full'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Nộp Tổng (Gói Trọn Kỳ)</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* SECTION 1: PER SUBJECT MODE */}
          {paymentMode === 'per_subject' && (
            <div className="space-y-2.5 rounded-xl border border-indigo-100 bg-indigo-50/30 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Chọn Môn Học Cần Nộp & Ngày Nộp Từng Môn</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleSelectAllSubjects(true)}
                    className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAllSubjects(false)}
                    className="text-slate-500 hover:underline font-semibold cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* Subject Items Table/List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {subjectStates.map((sub) => {
                  const isPaidFull = sub.remainingAmount === 0;
                  return (
                    <div
                      key={sub.subjectId}
                      className={`p-3 rounded-xl border transition-all ${
                        sub.selected
                          ? 'bg-white border-indigo-300 shadow-2xs'
                          : 'bg-slate-50/70 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSubject(sub.subjectId)}
                            className="text-indigo-600 cursor-pointer"
                          >
                            {sub.selected ? (
                              <CheckSquare className="w-5 h-5 text-indigo-600" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-400" />
                            )}
                          </button>
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                              <span>{sub.subjectName}</span>
                              {isPaidFull ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                                  Đã nộp đủ
                                </span>
                              ) : sub.paidAmount > 0 ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                                  Nộp 1 phần
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-semibold">
                                  Chưa nộp
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>Học phí: <strong>{formatCurrency(sub.amount)}</strong></span>
                              <span>•</span>
                              <span>Đã nộp: <strong className="text-emerald-600">{formatCurrency(sub.paidAmount)}</strong></span>
                              <span>•</span>
                              <span>Còn nợ: <strong className="text-rose-600">{formatCurrency(sub.remainingAmount)}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Payment input & Date picker for this subject */}
                        {sub.selected && (
                          <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            {/* Amount for this subject */}
                            <div>
                              <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                                Số tiền nộp (VNĐ)
                              </label>
                              <input
                                type="number"
                                step="10000"
                                max={sub.remainingAmount > 0 ? sub.remainingAmount : sub.amount}
                                value={sub.paymentAmount}
                                onChange={(e) => handleSubjectAmountChange(sub.subjectId, Number(e.target.value))}
                                className="w-28 sm:w-32 px-2 py-1 rounded-lg bg-white border border-indigo-200 text-xs font-bold text-emerald-700 focus:border-indigo-500"
                              />
                            </div>

                            {/* Paid Date for this subject */}
                            <div>
                              <label className="block text-[10px] text-slate-500 font-medium mb-0.5 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-indigo-500" />
                                <span>Ngày nộp môn</span>
                              </label>
                              <input
                                type="date"
                                value={sub.paidDate}
                                onChange={(e) => handleSubjectDateChange(sub.subjectId, e.target.value)}
                                className="px-2 py-1 rounded-lg bg-white border border-indigo-200 text-[11px] text-slate-800 focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Batch date synchronizer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-indigo-100 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Áp dụng nhanh ngày chung:</span>
                  <input
                    type="date"
                    value={commonPaymentDate}
                    onChange={(e) => setCommonPaymentDate(e.target.value)}
                    className="px-2 py-0.5 rounded border border-indigo-200 text-[11px] bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCommonDateToAll}
                    className="px-2 py-0.5 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-[11px] font-semibold cursor-pointer"
                  >
                    Gán cho tất cả môn
                  </button>
                </div>
                <div className="font-bold text-indigo-950">
                  Tổng tiền các môn chọn: <span className="text-emerald-600 text-xs">{formatCurrency(calculatedTotalAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: FULL LUMP SUM MODE */}
          {paymentMode === 'full' && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">
                    Số Tiền Nộp Tổng Kỳ Này (VNĐ) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="50000"
                      max={invoice.remainingAmount}
                      value={lumpSumAmount}
                      onChange={(e) => setLumpSumAmount(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-emerald-700 font-bold text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setLumpSumAmount(invoice.remainingAmount)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 hover:bg-slate-200 font-semibold border border-slate-200 cursor-pointer"
                    >
                      Nộp đủ tất cả
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Ngày Nộp Tiền *</span>
                  </label>
                  <input
                    type="date"
                    value={commonPaymentDate}
                    onChange={(e) => setCommonPaymentDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-1.5">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  Chế độ nộp tổng sẽ tự động phân bổ số tiền đã nộp vào các môn học còn nợ theo thứ tự và cập nhật ngày nộp chung <strong>{commonPaymentDate}</strong> cho tất cả môn được tất toán.
                </span>
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 text-xs">
              Phương Thức Thanh Toán
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bank_transfer' as PaymentMethod, label: 'Chuyển Khoản', icon: Building },
                { id: 'qr_code' as PaymentMethod, label: 'Quét VietQR', icon: QrCode },
                { id: 'cash' as PaymentMethod, label: 'Tiền Mặt', icon: DollarSign },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VietQR Quick Display when QR or Bank Transfer selected */}
          {(method === 'qr_code' || method === 'bank_transfer') && calculatedTotalAmount > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
              <img
                src={vietQrUrl}
                alt="VietQR AN TAM EDUCATION"
                className="w-24 h-24 rounded-lg bg-white p-1 shrink-0 border border-slate-200 shadow-2xs"
              />
              <div className="text-[11px] space-y-1 text-slate-600">
                <div className="font-bold text-slate-900 text-xs">Mã QR Thanh Toán Tự Động MBBank</div>
                <div>Số tài khoản: <strong className="font-mono text-indigo-700 font-bold">0988112201</strong> (AN TAM EDUCATION)</div>
                <div>Số tiền: <strong className="text-emerald-700 font-bold font-mono">{formatCurrency(calculatedTotalAmount)}</strong></div>
                <div>Nội dung CK: <strong className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{qrTransferContent}</strong></div>
              </div>
            </div>
          )}

          {/* Reference & Collected By */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1 text-xs">Mã Tham Chiếu / Giao Dịch</label>
              <input
                type="text"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono focus:border-indigo-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1 text-xs">Người Thu Tiền</label>
              <input
                type="text"
                value={collectedBy}
                onChange={(e) => setCollectedBy(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500 text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-600 font-medium mb-1 text-xs">Ghi Chú Thu Tiền</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Phụ huynh nộp trước môn Toán & Anh"
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Balance summary preview */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs">
            <div>
              <span className="text-slate-600">Dự kiến thu đợt này: </span>
              <strong className="text-emerald-700 text-sm font-bold font-mono">{formatCurrency(calculatedTotalAmount)}</strong>
            </div>
            <div>
              <span className="text-slate-600">Công nợ còn lại sau thu: </span>
              <strong className="text-rose-600 font-bold font-mono">{formatCurrency(remainingAfterThisPay)}</strong>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={calculatedTotalAmount <= 0}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác Nhận Nộp {formatCurrency(calculatedTotalAmount)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
