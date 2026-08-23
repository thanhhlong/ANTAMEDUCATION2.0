import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseItem, ExpenseCategory } from '../../types';
import { formatCurrency, formatShortCurrency } from '../../utils/formatters';
import { ExcelImportModal } from '../excel/ExcelModals';
import {
  Receipt,
  Plus,
  Search,
  Paperclip,
  Trash2,
  Calendar,
  DollarSign,
  X,
  Upload,
} from 'lucide-react';

export const ExpenseManager: React.FC = () => {
  const { expenses, addExpense, deleteExpense } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<ExpenseItem | null>(null);

  // Add Expense form
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'other' as ExpenseCategory,
    categoryName: 'Thuê nhà',
    description: '',
    amount: 1000000,
    payer: 'Kế toán Thu Trang',
    status: 'paid' as const,
    notes: '',
    hasReceipt: true,
    receiptFileName: 'chung-tu-thanh-toan.pdf',
  });

  const categoryList: { id: ExpenseCategory; name: string }[] = [
    { id: 'rent', name: 'Thuê nhà' },
    { id: 'cleaning', name: 'Vệ sinh' },
    { id: 'equipment', name: 'Thiết bị' },
    { id: 'ac', name: 'Máy lạnh' },
    { id: 'tv', name: 'Tivi' },
    { id: 'furniture', name: 'Bàn ghế' },
    { id: 'lock_security', name: 'Khóa' },
    { id: 'stationery', name: 'Văn phòng phẩm' },
    { id: 'salary', name: 'Lương' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'internet', name: 'Internet' },
    { id: 'utilities', name: 'Điện nước' },
    { id: 'other', name: 'Khác' },
  ];

  const filtered = expenses.filter((exp) => {
    if (selectedCategoryFilter !== 'all' && exp.categoryName !== selectedCategoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = exp.description.toLowerCase().includes(q);
      const matchCode = exp.expenseCode.toLowerCase().includes(q);
      const matchPayer = exp.payer.toLowerCase().includes(q);
      const matchCat = exp.categoryName.toLowerCase().includes(q);
      if (!matchDesc && !matchCode && !matchPayer && !matchCat) return false;
    }
    return true;
  });

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category for chart / stats
  const categoryStats = categoryList.map((cat) => {
    const total = expenses
      .filter((e) => e.categoryName.toLowerCase().includes(cat.name.toLowerCase()) || e.category === cat.id)
      .reduce((sum, e) => sum + e.amount, 0);
    return { name: cat.name, total };
  }).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || formData.amount <= 0) {
      alert('Vui lòng nhập đầy đủ nội dung và số tiền chi');
      return;
    }

    addExpense({
      date: formData.date,
      category: formData.category,
      categoryName: formData.categoryName,
      description: formData.description.trim(),
      amount: formData.amount,
      payer: formData.payer,
      status: formData.status,
      receiptMetadata: formData.hasReceipt
        ? {
            fileName: formData.receiptFileName,
            fileUrl: '#',
            fileType: formData.receiptFileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
          }
        : undefined,
      notes: formData.notes,
    });

    setIsAddModalOpen(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Tài Chính</span>
            <span>/</span>
            <span className="text-slate-700">Chi Phí Vận Hành</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-1">
            <Receipt className="w-6 h-6 text-rose-600" />
            <span>QUẢN LÝ CHI PHÍ VẬN HÀNH TRUNG TÂM</span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Dữ liệu đồng bộ trực tiếp từ Sheet CHI PHÍ (Mặt bằng, Máy lạnh, Vệ sinh, Bàn ghế, VPP...)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs lg:text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4 text-rose-600" />
            <span>Nhập Chi Phí Từ Excel</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs lg:text-sm font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tạo Phiếu Chi Mới</span>
          </button>
        </div>
      </div>

      {/* Top Cards: Total Expense & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Total Expense Card */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Tổng Chi Phí Tháng 8</span>
            <DollarSign className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-bold text-rose-600">
            {formatCurrency(totalExpenseAmount)}
          </div>
          <div className="text-xs text-slate-500">
            Đã thanh toán {expenses.length} khoản chi định kỳ và phát sinh
          </div>
        </div>

        {/* Top Expense Categories (2 Columns) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Cơ Cấu Chi Phí Chính (Sheet CHI PHÍ)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {categoryStats.slice(0, 4).map((c, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-xs text-slate-700 font-semibold truncate">{c.name}</div>
                <div className="text-xs font-bold text-slate-900 font-mono">{formatShortCurrency(c.total)}</div>
                <div className="text-[10px] text-slate-500">
                  {((c.total / totalExpenseAmount) * 100).toFixed(0)}% tổng chi
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo nội dung, mã phiếu, người thanh toán..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-xs lg:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs lg:text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tất cả danh mục chi</option>
              {categoryList.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expense Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs lg:text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Mã / Ngày Chi</th>
                <th className="px-3 py-3.5">Loại Chi</th>
                <th className="px-4 py-3.5">Nội Dung Chi Tiết</th>
                <th className="px-3 py-3.5">Số Tiền</th>
                <th className="px-3 py-3.5">Người Thanh Toán</th>
                <th className="px-3 py-3.5">Chứng Từ</th>
                <th className="px-4 py-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Không có khoản chi nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Code & Date */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-indigo-600 font-semibold">{exp.expenseCode}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{exp.date}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-3 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                        {exp.categoryName}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{exp.description}</div>
                      {exp.notes && (
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-sm">
                          {exp.notes}
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-3 py-3.5 font-bold text-rose-600 whitespace-nowrap">
                      {formatCurrency(exp.amount)}
                    </td>

                    {/* Payer */}
                    <td className="px-3 py-3.5 text-slate-700">
                      {exp.payer}
                    </td>

                    {/* Receipt / Invoice Attachment */}
                    <td className="px-3 py-3.5">
                      {exp.receiptMetadata ? (
                        <button
                          onClick={() => setViewingReceipt(exp)}
                          className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{exp.receiptMetadata.fileName}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Không đính kèm</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Xóa phiếu chi ${exp.expenseCode} (${formatCurrency(exp.amount)})?`)) {
                            deleteExpense(exp.id);
                          }
                        }}
                        className="p-1.5 rounded-md bg-slate-100 text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-600" />
                <span>Tạo Phiếu Chi Vận Hành</span>
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs lg:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Ngày Chi *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Loại Chi (Danh Mục) *</label>
                  <select
                    value={formData.categoryName}
                    onChange={(e) => {
                      const sel = categoryList.find((c) => c.name === e.target.value);
                      setFormData({
                        ...formData,
                        categoryName: e.target.value,
                        category: sel ? sel.id : 'other',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  >
                    {categoryList.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Nội Dung Chi Tiết *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="VD: Mua văn phòng phẩm giấy A4, bút dạ bảng..."
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Số Tiền (VNĐ) *</label>
                <input
                  type="number"
                  step="10000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-rose-600 font-bold font-mono text-base focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Người Thanh Toán</label>
                  <input
                    type="text"
                    value={formData.payer}
                    onChange={(e) => setFormData({ ...formData, payer: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Đính Kèm Chứng Từ</label>
                  <input
                    type="text"
                    value={formData.receiptFileName}
                    onChange={(e) => setFormData({ ...formData, receiptFileName: e.target.value })}
                    placeholder="VD: hoa-don-vpp.pdf"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Ghi Chú</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú thêm về nhà cung cấp, phương thức thanh toán..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Lưu Phiếu Chi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewing Receipt Metadata Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-indigo-600" />
                <span>Chi Tiết Chứng Từ / Hóa Đơn</span>
              </h2>
              <button onClick={() => setViewingReceipt(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div><strong>Mã phiếu chi:</strong> <span className="font-mono text-indigo-600">{viewingReceipt.expenseCode}</span></div>
              <div><strong>Khoản chi:</strong> {viewingReceipt.description}</div>
              <div><strong>Số tiền:</strong> <span className="text-rose-600 font-bold">{formatCurrency(viewingReceipt.amount)}</span></div>
              <div><strong>Tệp đính kèm:</strong> {viewingReceipt.receiptMetadata?.fileName}</div>
              <div><strong>Loại tệp:</strong> {viewingReceipt.receiptMetadata?.fileType}</div>
              <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-500 text-center italic mt-2">
                (Đã lưu trữ metadata hóa đơn an toàn trong hệ thống)
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
