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
  HelpCircle,
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  Users,
  Layers,
  GraduationCap,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const SubjectManager: React.FC = () => {
  const { subjects, addSubject, updateSubject } = useApp();

  const [activeTab, setActiveTab] = useState<'subjects' | 'curriculum_framework' | 'standards'>('subjects');

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
        description: description.trim() || 'Môn học bồi dưỡng chính thức',
        defaultFee,
        color,
        gradeLevels: [6, 7, 8, 9],
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

  const officialCurriculums = [
    {
      name: 'Toán Học Tư Duy & Luyện Thi Vào 10',
      icon: '🧮',
      color: 'bg-blue-600',
      grades: 'Khối 6, 7, 8, 9',
      duration: '90 phút / buổi (2 buổi/tuần)',
      description: 'Chương trình phát triển tư duy logic, nắm vững nền tảng số học, đại số và hình học không gian. Rèn luyện kỹ năng giải toán vận dụng cao và các dạng đề thi chuyên/vào 10.',
      pillars: ['Toán Đại Số & Số Học', 'Hình Học Trực Quan & Suy Luận', 'Chuyên Đề Điểm 9-10 Thi Tuyển Sinh'],
    },
    {
      name: 'Ngữ Văn Đổi Mới & Đọc Hiểu Sâu',
      icon: '📖',
      color: 'bg-pink-600',
      grades: 'Khối 6, 7, 8, 9',
      duration: '90 phút / buổi (2 buổi/tuần)',
      description: 'Tiếp cận phương pháp giảng dạy Ngữ văn theo chương trình GDPT mới. Rèn luyện tư duy phản biện, kỹ năng viết bài nghị luận văn học và nghị luận xã hội giàu cảm xúc, lập luận chặt chẽ.',
      pillars: ['Đọc hiểu văn bản đa dạng', 'Nghị luận xã hội thực tế', 'Kỹ thuật làm bài thi vào 10 đạt điểm cao'],
    },
    {
      name: 'Tiếng Anh Học Thuật & Giao Tiếp Chuẩn',
      icon: '🎧',
      color: 'bg-emerald-600',
      grades: 'Khối 6, 7, 8, 9',
      duration: '90 phút / buổi (2 buổi/tuần)',
      description: 'Hệ thống hóa toàn diện ngữ pháp cốt lõi, mở rộng vốn từ vựng học thuật theo chủ điểm, luyện kỹ năng nghe - phát âm chuẩn và làm quen với format đề thi chuyển cấp CLC.',
      pillars: ['Ngữ Pháp & Cấu Trúc Chuyên Sâu', 'Từ Vựng & Đọc Hiểu Nâng Cao', 'Chiến Thuật Thi Vào 10 & Chuyên'],
    },
    {
      name: 'Khoa Học Tự Nhiên - Phân Môn Vật Lí',
      icon: '⚖',
      color: 'bg-amber-600',
      grades: 'Khối 6, 7, 8, 9',
      duration: '90 phút / buổi',
      description: 'Giải thích hiện tượng tự nhiên qua lăng kính vật lý thực nghiệm: Cơ học, Nhiệt học, Điện học và Quang học. Chú trọng hiểu bản chất định luật thay vì học vẹt công thức.',
      pillars: ['Thực hành & Hiện Tượng Đời Sống', 'Phương Pháp Giải Bài Tập Định Lượng', 'Bồi Dưỡng Học Sinh Giỏi'],
    },
    {
      name: 'Khoa Học Tự Nhiên - Phân Môn Hóa Học',
      icon: '⚛',
      color: 'bg-cyan-700',
      grades: 'Khối 8, 9',
      duration: '90 phút / buổi',
      description: 'Nắm chắc kiến thức nguyên tử, bảng tuần hoàn, các loại hợp chất vô cơ, phản ứng oxi hóa - khử, bài toán nồng độ dung dịch và phương pháp nhận biết chất.',
      pillars: ['Bản Chất Phản Ứng & PTHH', 'Toán Nồng Độ & Tỉ Khối Khí', 'Luyện Đề Chuyên Hóa & Vào 10'],
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Official Curriculum Banner */}
      <div className="bg-linear-to-r from-slate-900 via-emerald-950 to-teal-950 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chương Trình Đào Tạo Chính Thức 2026 - 2027</span>
            </div>
            
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-emerald-400" />
              <span>KHUNG CHƯƠNG TRÌNH ĐÀO TẠO AN TÂM</span>
            </h1>
            
            <p className="text-sm font-semibold text-emerald-200">
              LỘ TRÌNH 5 TRỤ CỘT: TOÁN – NGỮ VĂN – TIẾNG ANH – KHTN (LÝ) – KHTN (HÓA)
            </p>
            
            <p className="text-xs text-slate-300 italic flex items-center gap-1.5 pt-0.5">
              <span>Phương châm đào tạo:</span>
              <strong className="text-emerald-300 not-italic font-bold">Học đúng – Hiểu sâu – Làm giỏi</strong>
              <span>❤️</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isQuickEditingPrices ? (
              <>
                <button
                  onClick={() => setIsQuickEditingPrices(false)}
                  className="px-3.5 py-2 rounded-xl border border-white/20 text-white bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Hủy</span>
                </button>
                <button
                  onClick={handleSaveQuickPrices}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-sm transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Học Phí Khối</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleStartQuickEdit}
                  className="px-3.5 py-2 rounded-xl border border-emerald-400/40 text-emerald-200 bg-emerald-900/40 hover:bg-emerald-800/60 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Sửa Nhanh Học Phí</span>
                </button>
                <button
                  onClick={handleOpenAdd}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm Môn Học</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'subjects'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Danh Mục Môn & Định Mức Học Phí</span>
        </button>

        <button
          onClick={() => setActiveTab('curriculum_framework')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'curriculum_framework'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Khung Lộ Trình 5 Trụ Cột</span>
        </button>

        <button
          onClick={() => setActiveTab('standards')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'standards'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Tiêu Chuẩn Giảng Dạy & Sĩ Số Vàng</span>
        </button>
      </div>

      {/* TAB 1: SUBJECTS & FEES TABLE */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-2.5 max-w-4xl text-slate-600">
            <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-slate-800 block">Định mức học phí chuẩn & phân bổ theo khối:</strong>
              <p>
                Mỗi môn học sử dụng <strong>Học phí chuẩn</strong> làm mức cơ sở. Hệ thống áp dụng tự động cho học sinh các khối 6, 7, 8, 9 và đồng bộ sang Hóa đơn, CRM tuyển sinh và Cổng tra cứu phụ huynh.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs lg:text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[10px] lg:text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-3.5">Môn Học & Mã Code</th>
                    <th className="px-4 py-3.5">Mô Tả & Trọng Tâm</th>
                    <th className="px-4 py-3.5">Học Phí Chuẩn</th>
                    <th className="px-4 py-3.5 text-center bg-emerald-50/40">Khối 6</th>
                    <th className="px-4 py-3.5 text-center bg-blue-50/40">Khối 7</th>
                    <th className="px-4 py-3.5 text-center bg-purple-50/40">Khối 8</th>
                    <th className="px-4 py-3.5 text-center bg-rose-50/40">Khối 9</th>
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
                        <td className="px-4 py-4 text-slate-600 max-w-xs text-xs">
                          {sub.description || 'Chương trình chuẩn An Tâm Education'}
                        </td>

                        {/* Default fee */}
                        <td className="px-4 py-4 font-bold text-slate-800 whitespace-nowrap">
                          {formatCurrency(sub.defaultFee)}
                        </td>

                        {/* Grade 6 to 9 Fees */}
                        {[6, 7, 8, 9].map((g) => {
                          const { hasOverride, feeValue } = getGradeFeeDisplay(g);
                          return (
                            <td key={g} className="px-4 py-4 text-center whitespace-nowrap">
                              {isQuickEditingPrices ? (
                                <input
                                  type="number"
                                  step="50000"
                                  value={tempGradeFees[sub.id]?.[g] ?? feeValue}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setTempGradeFees((prev) => ({
                                      ...prev,
                                      [sub.id]: {
                                        ...(prev[sub.id] || {}),
                                        [g]: val,
                                      },
                                    }));
                                  }}
                                  className="w-24 px-2 py-1 border border-slate-300 rounded text-center text-xs font-semibold focus:outline-none focus:border-emerald-600 bg-white"
                                />
                              ) : (
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                  hasOverride 
                                    ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200' 
                                    : 'text-slate-600'
                                }`}>
                                  {formatCurrency(feeValue)}
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Actions */}
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(sub)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Sửa môn học"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CURRICULUM FRAMEWORK */}
      {activeTab === 'curriculum_framework' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {officialCurriculums.map((curr, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl">
                    {curr.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{curr.name}</h3>
                    <p className="text-[11px] font-semibold text-emerald-700">{curr.grades}</p>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                  {curr.duration}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {curr.description}
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block uppercase">
                  Trọng tâm đào tạo:
                </span>
                <div className="space-y-1">
                  {curr.pillars.map((pil, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{pil}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: STANDARDS & METHODOLOGY */}
      {activeTab === 'standards' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">HỌC ĐÚNG</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Học đúng trọng tâm đề cương thi, đúng bản chất kiến thức chuẩn của Bộ GD&ĐT. Không học lan man, không nhồi nhét, xây dựng nền tảng gốc rễ vững chắc từ lớp 6.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">HIỂU SÂU</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hiểu bản chất công thức toán học, nguyên lý khoa học tự nhiên và ngữ cảnh văn học. Tự tay giải thích được các bước giải và phản biện logic khi làm bài.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">LÀM GIỎI</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thành thạo kỹ năng phân tích đề thi, tối ưu thời gian làm bài, phản xạ nhanh với các dạng bài nâng cao và chinh phục điểm 9-10 trong các kỳ thi tuyển sinh.
              </p>
            </div>
          </div>

          {/* Golden Standards */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Tiêu Chuẩn Lớp Học Tại An Tâm Education</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-slate-400 block">Sĩ Số Vàng</span>
                <strong className="text-white text-sm">12 - 18 Học Sinh / Lớp</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-slate-400 block">Mô Hình Đồng Hành</span>
                <strong className="text-white text-sm">1 Giáo Viên + 1 Trợ Giảng</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-slate-400 block">Thời Lượng Chuẩn</span>
                <strong className="text-white text-sm">90 Phút / Ca Học</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-slate-400 block">Kiểm Tra Định Kỳ</span>
                <strong className="text-white text-sm">Hàng Tuần & Hàng Tháng</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 animate-in fade-in">
            <div className="p-5 bg-linear-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingSubject ? 'Chỉnh Sửa Môn Học' : 'Thêm Môn Học Mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs lg:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Môn Học *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Toán Học, Ngữ Văn, Tiếng Anh..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="TOAN, VAN, ENG..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Học Phí Chuẩn (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    step="50000"
                    value={defaultFee}
                    onChange={(e) => setDefaultFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô Tả & Trọng Tâm</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Mục tiêu đầu ra, nội dung chương trình..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
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
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
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
                          className="w-full py-1 text-center rounded border border-slate-200 font-mono font-bold text-xs text-emerald-800 focus:outline-none focus:border-emerald-600"
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
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
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
