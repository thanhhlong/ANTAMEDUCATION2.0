import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  parseCenterExcelFile, 
  ExcelImportResult,
  generateSampleExcelWorkbook,
  generateSampleStudentsTemplate,
  generateSampleExpensesTemplate,
  generateSampleTutorsTemplate,
  generateSampleLeadsTemplate
} from '../../utils/excelParser';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  FileCheck,
  X,
  Download,
  Users,
  Wallet,
  HeartHandshake,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose }) => {
  const { students, importExcelData } = useApp();

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<'merge' | 'create_new' | 'skip'>('merge');
  const [importDone, setImportDone] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setParsing(true);
    try {
      const existingCodes = students.map((s) => s.code);
      const existingPhoneParents = students.map((s) => `${s.fullName}_${s.parentPhone}`);
      const result = await parseCenterExcelFile(selected, existingCodes, existingPhoneParents);
      setImportResult(result);
    } catch (err) {
      console.error(err);
      alert('Không thể đọc file Excel. Vui lòng kiểm tra định dạng file .xlsx');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!importResult) return;

    importExcelData(importResult, duplicateAction);
    setImportDone(true);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 lg:p-6 space-y-5 shadow-xl text-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Nhập Dữ Liệu Từ File Excel Thực Tế</h2>
              <p className="text-xs text-slate-500">
                Tự động nhận diện các sheet: DASHBOARD, KHỐI 6/7/8/9, CHI PHÍ, BIỂU MẪU 1 & 2
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!importDone ? (
          <div className="space-y-4">
            {/* Upload Area */}
            {!importResult ? (
              <>
                {/* Download Templates Section */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    <Download className="w-4 h-4 text-indigo-600" />
                    <span>TẢI FILE MẪU CHUẨN ĐỂ NHẬP LIỆU (CHỌN PHÂN HỆ PHÙ HỢP)</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Hệ thống hỗ trợ nhập dữ liệu hàng loạt từ file Excel. Bạn chỉ cần tải file mẫu tương ứng dưới đây, điền thông tin và tải lên hệ thống.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {/* 1. All-in-one */}
                    <button
                      onClick={() => generateSampleExcelWorkbook()}
                      className="p-3 text-left bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-2xs rounded-lg transition-all cursor-pointer flex items-start gap-3 group text-slate-800"
                    >
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Mẫu Tổng Hợp Toàn Diện</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Bao gồm đầy đủ cả 4 phân hệ (Học sinh, Chi phí, Lead CRM, Trợ giảng)</p>
                      </div>
                    </button>

                    {/* 2. Students */}
                    <button
                      onClick={() => generateSampleStudentsTemplate()}
                      className="p-3 text-left bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-2xs rounded-lg transition-all cursor-pointer flex items-start gap-3 group text-slate-800"
                    >
                      <Users className="w-5 h-5 text-indigo-600 shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Mẫu Danh Sách Học Sinh</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Nhập học sinh theo khối (Khối 6, 7, 8, 9), lớp học, thông tin phụ huynh & học phí</p>
                      </div>
                    </button>

                    {/* 3. Expenses */}
                    <button
                      onClick={() => generateSampleExpensesTemplate()}
                      className="p-3 text-left bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-2xs rounded-lg transition-all cursor-pointer flex items-start gap-3 group text-slate-800"
                    >
                      <Wallet className="w-5 h-5 text-rose-600 shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Mẫu Chi Phí Vận Hành</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Nhập danh sách phiếu chi, loại chi phí, số tiền và người thanh toán thực tế</p>
                      </div>
                    </button>

                    {/* 4. CRM Leads */}
                    <button
                      onClick={() => generateSampleLeadsTemplate()}
                      className="p-3 text-left bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-2xs rounded-lg transition-all cursor-pointer flex items-start gap-3 group text-slate-800"
                    >
                      <HeartHandshake className="w-5 h-5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Mẫu CRM Lead Phụ Huynh</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Đăng ký thông tin phụ huynh quan tâm, nhu cầu học tập gia sư theo yêu cầu (Biểu mẫu 2)</p>
                      </div>
                    </button>

                    {/* 5. Tutors */}
                    <button
                      onClick={() => generateSampleTutorsTemplate()}
                      className="p-3 text-left bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-2xs rounded-lg transition-all cursor-pointer flex items-start gap-3 group sm:col-span-2 text-slate-800"
                    >
                      <BookOpen className="w-5 h-5 text-purple-600 shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Mẫu Tuyển Dụng Trợ Giảng / Gia Sư</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Thông tin ứng viên trợ giảng, chuyên ngành học, các môn có thể giảng dạy (Biểu mẫu 1)</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-8 text-center space-y-3 transition-colors bg-slate-50">
                  <FileSpreadsheet className="w-12 h-12 text-emerald-600 mx-auto" />
                  <div>
                    <label className="cursor-pointer">
                      <span className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-block shadow-xs transition-colors">
                        Chọn File Excel (.xlsx)
                      </span>
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-slate-500 mt-2">
                      Hỗ trợ file AN TÂM EDUCATION.xlsx hoặc các file xuất biểu mẫu
                    </p>
                  </div>
                  {parsing && (
                    <div className="text-xs text-indigo-600 font-semibold animate-pulse">
                      Đang quét cấu trúc bảng tính và đối soát dữ liệu...
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Parsed Preview */
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900">{file?.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      setImportResult(null);
                      setFile(null);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                  >
                    Chọn file khác
                  </button>
                </div>

                {/* Sheet Recognition Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-0.5">
                    <div className="text-slate-500">Học sinh các khối:</div>
                    <div className="text-base font-bold text-indigo-700">
                      {importResult.students.length} bản ghi
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-0.5">
                    <div className="text-slate-500">Phiếu chi vận hành:</div>
                    <div className="text-base font-bold text-rose-600">
                      {importResult.expenses.length} khoản chi
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-0.5">
                    <div className="text-slate-500">Lead tuyển sinh:</div>
                    <div className="text-base font-bold text-amber-600">
                      {importResult.parentLeads.length} leads (BM2)
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-0.5">
                    <div className="text-slate-500">Trợ giảng ứng tuyển:</div>
                    <div className="text-base font-bold text-purple-600">
                      {importResult.tutorApplicants.length} ứng viên (BM1)
                    </div>
                  </div>
                </div>

                {/* Duplicate Strategy Option */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-700">Xử lý khi trùng lặp mã hoặc học sinh:</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'merge' as const, label: 'Gộp & Cập nhật' },
                      { id: 'create_new' as const, label: 'Tạo mã mới' },
                      { id: 'skip' as const, label: 'Bỏ qua bản ghi trùng' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDuplicateAction(opt.id)}
                        className={`p-2 rounded-md border text-center font-semibold transition-colors cursor-pointer ${
                          duplicateAction === opt.id
                            ? 'bg-white text-indigo-700 border-indigo-300 shadow-2xs font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Xác Nhận Nhập Dữ Liệu
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Nhập Dữ Liệu Thành Công!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Toàn bộ học sinh, học phí, chi phí và biểu mẫu đã được đồng bộ vào hệ thống.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
            >
              Đóng & Xem Dữ Liệu
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
