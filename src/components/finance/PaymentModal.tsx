import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  CreditCard,
  QrCode,
  DollarSign,
  Building,
  CheckCircle2,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  invoiceId: string;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ invoiceId, onClose }) => {
  const { invoices, addPayment } = useApp();

  const invoice = invoices.find((i) => i.id === invoiceId);

  if (!invoice) return null;

  const [amount, setAmount] = useState<number>(invoice.remainingAmount);
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [referenceCode, setReferenceCode] = useState(`FT${Date.now().toString().slice(-6)}`);
  const [collectedBy, setCollectedBy] = useState('Kế toán Thu Trang');
  const [notes, setNotes] = useState('Phụ huynh thanh toán học phí');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Số tiền thanh toán phải lớn hơn 0');
      return;
    }

    addPayment(invoiceId, {
      studentId: invoice.studentId,
      studentName: invoice.studentName,
      amount,
      paymentDate: new Date().toISOString().split('T')[0],
      method,
      referenceCode,
      collectedBy,
      notes,
    });

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
    });

    onClose();
  };

  const qrTransferContent = `AT ${invoice.studentCode} HP T${invoice.month}`;
  const vietQrUrl = `https://img.vietqr.io/image/mbbank-0988112201-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    qrTransferContent
  )}&accountName=${encodeURIComponent('AN TAM EDUCATION')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-xl text-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Thu Học Phí Học Sinh</h2>
              <p className="text-xs text-slate-500 font-mono">
                {invoice.studentName} ({invoice.studentCode}) • HĐ: {invoice.invoiceCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <div className="text-slate-500">Tổng học phí: {formatCurrency(invoice.totalAmount)}</div>
            <div className="text-emerald-700 font-medium">Đã nộp: {formatCurrency(invoice.paidAmount)}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-500">Công nợ cần thu:</div>
            <div className="text-base font-bold text-rose-600">
              {formatCurrency(invoice.remainingAmount)}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs lg:text-sm">
          {/* Amount to pay */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">Số Tiền Nộp Đợt Này (VNĐ) *</label>
            <div className="relative">
              <input
                type="number"
                step="50000"
                max={invoice.remainingAmount}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-emerald-700 font-bold text-base focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setAmount(invoice.remainingAmount)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded bg-slate-100 text-[11px] text-slate-700 hover:text-slate-900 hover:bg-slate-200 font-semibold border border-slate-200 cursor-pointer"
              >
                Nộp đủ tất cả
              </button>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-slate-600 font-medium mb-1.5">Phương Thức Thanh Toán</label>
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
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
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
          {(method === 'qr_code' || method === 'bank_transfer') && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
              <img
                src={vietQrUrl}
                alt="VietQR AN TAM EDUCATION"
                className="w-28 h-28 rounded-lg bg-white p-1 shrink-0 border border-slate-200 shadow-2xs"
              />
              <div className="text-[11px] space-y-1 text-slate-600">
                <div className="font-bold text-slate-900 text-xs">Mã QR Thanh Toán Tự Động</div>
                <div>Ngân hàng: <strong>MBBank</strong></div>
                <div>Số tài khoản: <strong className="font-mono text-indigo-700 font-bold">0988112201</strong></div>
                <div>Chủ TK: <strong>AN TAM EDUCATION</strong></div>
                <div>Nội dung: <strong className="font-mono text-indigo-700">{qrTransferContent}</strong></div>
              </div>
            </div>
          )}

          {/* Reference & Collected By */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Mã Tham Chiếu / Giao Dịch</label>
              <input
                type="text"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Người Thu Tiền</label>
              <input
                type="text"
                value={collectedBy}
                onChange={(e) => setCollectedBy(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">Ghi Chú Thu Tiền</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Phụ huynh chuyển qua MBBank lúc 14:30"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác Nhận Thu {formatCurrency(amount)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
