import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Subject } from '../../types';
import { 
  Plus, 
  Settings, 
  Edit, 
  DollarSign, 
  BookOpen, 
  Save, 
  RotateCcw, 
  Check, 
  X, 
  Trash,
  HelpCircle
} from 'lucide-react';

export const SubjectManager: React.FC = () => {
  const { subjects, addSubject, updateSubject } = useApp();

  // State for Subject Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  
  // Form values
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [defaultFee, setDefaultFee] = useState(1000000);
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  
  // Specific grade fees overrides
  const [gradeFees, setGradeFees] = useState<{ [grade: number]: number }>({
    6: 1000000,
    7: 1000000,
    8: 1000000,
    9: 1000000,
  });

  // State for matrix quick editing
  const [isQuickEditingPrices, setIsQuickEditingPrices] = useState(false);
  const [tempGradeFees, setTempGradeFees] = useState<{ [subjectId: string]: { [grade: number]: number } }>({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setName('');
    setCode('');
    setColor('#3B82F6');
    setDefaultFee(1000000);
    setDescription('');
    setActive(true);
    setGradeFees({
      6: 1000000,
      7: 1000000,
      8: 1000000,
      9: 1000000,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setName(sub.name);
    setCode(sub.code);
    setColor(sub.color);
    setDefaultFee(sub.defaultFee);
    setDescription(sub.description || '');
    setActive(sub.active);
    
    // Fill specific grade overrides from 6 to 9
    const fees = { ...sub.gradeFees };
    setGradeFees({
      6: fees[6] !== undefined ? fees[6] : sub.defaultFee,
      7: fees[7] !== undefined ? fees[7] : sub.defaultFee,
      8: fees[8] !== undefined ? fees[8] : sub.defaultFee,
      9: fees[9] !== undefined ? fees[9] : sub.defaultFee,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    // Filter and prepare grade overrides
    const finalGradeFees: { [grade: number]: number } = {};
    [6, 7, 8, 9].forEach((g) => {
      finalGradeFees[g] = gradeFees[g];
    });

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        color,
        defaultFee,
        description: description.trim(),
        active,
        gradeFees: finalGradeFees,
      });
      alert(`Đã cập nhật môn học ${name.trim()} thành công!`);
    } else {
      addSubject({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || 'Môn học bồi dưỡng',
        defaultFee,
        color,
        gradeLevels: [6, 7, 8, 9, 10, 11, 12],
        active: true,
        gradeFees: finalGradeFees,
      });
      alert(`Đã thêm môn học mới ${name.trim()} thành công!`);
    }

    setIsModalOpen(false);
  };

  // Start quick editing prices
  const handleStartQuickEdit = () => {
    const initialTemp: typeof tempGradeFees = {};
    subjects.forEach((sub) => {
      initialTemp[sub.id] = {
        6: sub.gradeFees && sub.gradeFees[6] !== undefined ? sub.gradeFees[6] : sub.defaultFee,
        7: sub.gradeFees && sub.gradeFees[7] !== undefined ? sub.gradeFees[7] : sub.defaultFee,
        8: sub.gradeFees && sub.gradeFees[8] !== undefined ? sub.gradeFees[8] : sub.defaultFee,
        9: sub.gradeFees && sub.gradeFees[9] !== undefined ? sub.gradeFees[9] : sub.defaultFee,
      };
    });
    setTempGradeFees(initialTemp);
    setIsQuickEditingPrices(true);
  };

  // Save quick edited prices
  const handleSaveQuickPrices = () => {
    subjects.forEach((sub) => {
      const updatedFees = tempGradeFees[sub.id];
      if (updatedFees) {
        updateSubject(sub.id, {
          gradeFees: {
            ...(sub.gradeFees || {}),
            ...updatedFees,
          }
        });
      }
    });
    setIsQuickEditingPrices(false);
    alert('Đã lưu thành công biểu học phí tùy chỉnh cho các khối!');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span>Quản Lý Danh Mục Môn Học</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cấu hình chương trình đào tạo, đặt định mức học phí cơ sở và biểu học phí chi tiết từ khối 6 đến khối 9.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isQuickEditingPrices ? (
            <>
              <button
                onClick={() => setIsQuickEditingPrices(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Hủy</span>
              </button>
              <button
                onClick={handleSaveQuickPrices}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Học Phí Khối</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleStartQuickEdit}
                className="px-3.5 py-2 rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sửa Nhanh Học Phí</span>
              </button>
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Môn Học Mới</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info Tip */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-2.5 max-w-4xl text-slate-600">
        <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-slate-800 block">Hướng dẫn cài đặt học phí:</strong>
          <p>
            Mỗi môn học sẽ sử dụng <strong>Học phí chuẩn</strong> làm mức mặc định. Tuy nhiên, bạn có thể thiết lập mức giá riêng biệt cho từng khối học (ví dụ: Toán học chuẩn 1.000.000₫ nhưng đối với Khối 9 là 1.200.000₫). Hệ thống sẽ tự động đối chiếu và áp dụng khi tư vấn ghi nhận học viên hoặc tạo hóa đơn thu phí định kỳ.
          </p>
        </div>
      </div>

      {/* Subjects Main Board */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs lg:text-sm">
            <thead>
              <tr className="bg-slate-50 text-[10px] lg:text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3.5">Môn Học & Mã Code</th>
                <th className="px-4 py-3.5">Mô Tả</th>
                <th className="px-4 py-3.5">Học Phí Chuẩn (Mặc định)</th>
                <th className="px-4 py-3.5 text-center bg-indigo-50/20">Khối 6</th>
                <th className="px-4 py-3.5 text-center bg-indigo-50/20">Khối 7</th>
                <th className="px-4 py-3.5 text-center bg-indigo-50/20">Khối 8</th>
                <th className="px-4 py-3.5 text-center bg-indigo-50/20">Khối 9</th>
                <th className="px-4 py-3.5 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((sub) => {
                const getGradeFeeDisplay = (grade: number) => {
                  const hasOverride = sub.gradeFees && sub.gradeFees[grade] !== undefined;
                  const feeValue = hasOverride ? sub.gradeFees![grade] : sub.defaultFee;
                  return { hasOverride, feeValue };
                };

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Subject info */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs" 
                          style={{ backgroundColor: sub.color }} 
                        />
                        <div>
                          <div className="font-bold text-slate-900">{sub.name}</div>
                          <div className="font-mono text-[10px] text-slate-400 font-bold mt-0.5">{sub.code}</div>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-4 text-xs text-slate-500 max-w-[200px] truncate">
                      {sub.description || 'Môn học bồi dưỡng'}
                    </td>

                    {/* Default Standard Fee */}
                    <td className="px-4 py-4 font-semibold text-slate-800 font-mono">
                      {formatCurrency(sub.defaultFee)}
                    </td>

                    {/* Grade Overrides Pricing Columns */}
                    {[6, 7, 8, 9].map((grade) => {
                      const { hasOverride, feeValue } = getGradeFeeDisplay(grade);
                      
                      return (
                        <td key={grade} className="px-3 py-4 text-center bg-indigo-50/10 border-x border-slate-100">
                          {isQuickEditingPrices ? (
                            <div className="flex items-center justify-center gap-1 min-w-[100px]">
                              <input
                                type="number"
                                value={tempGradeFees[sub.id]?.[grade] ?? feeValue}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setTempGradeFees({
                                    ...tempGradeFees,
                                    [sub.id]: {
                                      ...tempGradeFees[sub.id],
                                      [grade]: isNaN(val) ? 0 : val
                                    }
                                  });
                                }}
                                className="w-20 px-1.5 py-1 text-center font-mono font-bold text-xs rounded border border-indigo-200 bg-white text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <span className="text-[10px] text-slate-400 font-bold">₫</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className={`font-mono font-bold text-xs ${hasOverride ? 'text-indigo-700' : 'text-slate-400 font-medium'}`}>
                                {formatCurrency(feeValue)}
                              </span>
                              {hasOverride ? (
                                <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-100 mt-0.5">
                                  Tùy biến
                                </span>
                              ) : (
                                <span className="text-[9px] font-medium text-slate-400 mt-0.5">
                                  Chuẩn
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Action buttons */}
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(sub)}
                          className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Chỉnh Sửa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl text-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <span>{editingSubject ? 'Chỉnh Sửa Thông Tin Môn Học' : 'Thêm Môn Học Mới'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Column 1: Tên môn học */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Tên Môn Học <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Toán Học, Ngữ Văn, Tiếng Anh"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-slate-900"
                  />
                </div>

                {/* Column 2: Mã môn học */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Mã Môn Học <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ví dụ: MATH, LIT, ENG"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-slate-900 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Column 1: Mức phí chuẩn */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Học Phí Chuẩn / Tháng <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={defaultFee}
                      onChange={(e) => setDefaultFee(parseInt(e.target.value, 10) || 0)}
                      className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono text-slate-900 font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₫</span>
                  </div>
                </div>

                {/* Column 2: Màu nhận diện */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Màu Nhận Diện <span className="text-rose-500">*</span></label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 shrink-0"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono text-slate-700 text-center uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Mô Tả Chi Tiết</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Chương trình bồi dưỡng nâng cao và ôn thi chuyên lớp THCS..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-slate-900"
                />
              </div>

              {/* Grade Fees Specific Matrix (Chỉnh học phí từng khối) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                    Cấu Hình Chi Tiết Học Phí Theo Khối Lớp (6 - 9)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setGradeFees({
                        6: defaultFee,
                        7: defaultFee,
                        8: defaultFee,
                        9: defaultFee,
                      });
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Áp dụng nhanh phí chuẩn</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[6, 7, 8, 9].map((grade) => (
                    <div key={grade} className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-1 text-center">
                      <span className="text-[11px] font-bold text-slate-500 block">Khối {grade}</span>
                      <div className="relative">
                        <input
                          type="number"
                          value={gradeFees[grade]}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setGradeFees({
                              ...gradeFees,
                              [grade]: isNaN(val) ? 0 : val,
                            });
                          }}
                          className="w-full py-1 text-center rounded border border-slate-200 font-mono font-bold text-xs text-indigo-700 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingSubject ? 'Lưu Thay Đổi' : 'Thêm Môn Học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
