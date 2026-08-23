import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  parseUploadedExcel, 
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
  AlertTriangle,
  Info,
  Check,
  FileText
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<'merge' | 'create_new' | 'skip'>('merge');
  const [importDone, setImportDone] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'students' | 'expenses' | 'leads' | 'tutors' | 'diagnostics'>('students');
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  const processFile = async (selected: File) => {
    setFile(selected);
    setParsing(true);
    setErrorMessage(null);
    try {
      const result = await parseUploadedExcel(selected, students);
      const totalParsed =
        result.students.length +
        result.expenses.length +
        result.parentLeads.length +
        result.tutorApplicants.length;

      if (totalParsed === 0) {
        setErrorMessage(
          'Không tìm thấy dữ liệu hợp lệ trong file. Vui lòng kiểm tra lại tiêu đề các cột (ví dụ: "Họ và tên", "Số điện thoại", "Số tiền", "Nội dung") hoặc tải file mẫu chuẩn bên dưới để đối chiếu.'
        );
      } else {
        // Auto set active preview tab based on content
        if (result.students.length > 0) setActivePreviewTab('students');
        else if (result.expenses.length > 0) setActivePreviewTab('expenses');
        else if (result.parentLeads.length > 0) setActivePreviewTab('leads');
        else if (result.tutorApplicants.length > 0) setActivePreviewTab('tutors');
        else setActivePreviewTab('diagnostics');
      }
      setImportResult(result);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Lỗi khi đọc file: ${err?.message || 'Định dạng file không được hỗ trợ'}. Hãy dùng file .xlsx, .xls hoặc .csv.`);
    } finally {
      setParsing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    await processFile(selected);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected) {
      await processFile(selected);
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

  const totalImportCount = importResult
    ? importResult.students.length +
      importResult.expenses.length +
      importResult.parentLeads.length +
      importResult.tutorApplicants.length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl text-slate-800 animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 lg:p-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100 shadow-2xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Nhập Dữ Liệu Từ File Excel / CSV
              </h2>
              <p className="text-xs text-slate-500">
                Hỗ trợ định dạng .xlsx, .xls, .csv từ mọi nguồn (Google Sheets, cPanel, Excel, K6-K12)
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

        {/* Modal Body */}
        <div className="p-4 lg:p-6 overflow-y-auto space-y-5 flex-1">
          {!importDone ? (
            <div className="space-y-5">
              {/* If no result yet, show upload and sample templates */}
              {!importResult ? (
                <>
                  {/* Upload Box */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center space-y-4 transition-all ${
                      isDragOver
                        ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
                        : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60'
                    }`}
                  >
                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
                      <FileSpreadsheet className="w-7 h-7" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm sm:text-base font-bold text-slate-800">
                        Kéo thả file Excel hoặc CSV vào đây
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Tự động nhận diện thông minh các cột: Họ tên, Số điện thoại, Khối/Lớp, Phụ huynh, Học phí, Chi phí, Trợ giảng, Lead CRM
                      </p>
                    </div>

                    <div className="pt-1">
                      <label className="cursor-pointer inline-block">
                        <span className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <span>Chọn File Từ Máy Tính</span>
                        </span>
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {parsing && (
                      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 animate-pulse pt-2">
                        <div className="w-3 h-3 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                        <span>Đang phân tích cấu trúc bảng tính & đối soát dữ liệu...</span>
                      </div>
                    )}
                  </div>

                  {errorMessage && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-rose-900">Không thể nhập dữ liệu:</div>
                        <p>{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Download Templates Section */}
                  <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 tracking-wider">
                      <Download className="w-4 h-4 text-indigo-600" />
                      <span>TẢI CÁC FILE MẪU EXCEL CHUẨN (NẾU CẦN ĐỐI SOÁT CẤU TRÚC)</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Bạn có thể tải các file mẫu chuẩn dưới đây để điền dữ liệu đúng định dạng, hoặc dùng trực tiếp file Excel hiện tại của bạn:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {/* 1. All-in-one */}
                      <button
                        type="button"
                        onClick={() => generateSampleExcelWorkbook()}
                        className="p-3 text-left bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs rounded-xl transition-all cursor-pointer flex items-start gap-3 group"
                      >
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            1. Mẫu Tổng Hợp Toàn Trung Tâm
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Gồm 6 sheets: Dashboard, Khối 8, Khối 9, Chi phí, Biểu mẫu 1 & 2
                          </p>
                        </div>
                      </button>

                      {/* 2. Students */}
                      <button
                        type="button"
                        onClick={() => generateSampleStudentsTemplate()}
                        className="p-3 text-left bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs rounded-xl transition-all cursor-pointer flex items-start gap-3 group"
                      >
                        <Users className="w-5 h-5 text-indigo-600 shrink-0 group-hover:scale-110 transition-transform mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            2. Mẫu Danh Sách Học Sinh (K6-K12)
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Mã HS, Họ tên, Lớp, Phụ huynh, SĐT, Học phí theo từng môn
                          </p>
                        </div>
                      </button>

                      {/* 3. Expenses */}
                      <button
                        type="button"
                        onClick={() => generateSampleExpensesTemplate()}
                        className="p-3 text-left bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs rounded-xl transition-all cursor-pointer flex items-start gap-3 group"
                      >
                        <Wallet className="w-5 h-5 text-rose-600 shrink-0 group-hover:scale-110 transition-transform mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            3. Mẫu Chi Phí Vận Hành
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Ngày chi, Loại chi, Nội dung, Số tiền, Người thanh toán
                          </p>
                        </div>
                      </button>

                      {/* 4. CRM Leads */}
                      <button
                        type="button"
                        onClick={() => generateSampleLeadsTemplate()}
                        className="p-3 text-left bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs rounded-xl transition-all cursor-pointer flex items-start gap-3 group"
                      >
                        <HeartHandshake className="w-5 h-5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            4. Mẫu CRM Tuyển Sinh (Biểu Mẫu 2)
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Họ tên HS & PH, SĐT, Khối dự kiến, Nhu cầu gia sư theo yêu cầu
                          </p>
                        </div>
                      </button>

                      {/* 5. Tutors */}
                      <button
                        type="button"
                        onClick={() => generateSampleTutorsTemplate()}
                        className="p-3 text-left bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs rounded-xl transition-all cursor-pointer flex items-start gap-3 group sm:col-span-2"
                      >
                        <BookOpen className="w-5 h-5 text-purple-600 shrink-0 group-hover:scale-110 transition-transform mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            5. Mẫu Tuyển Dụng Trợ Giảng / Gia Sư (Biểu Mẫu 1)
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Thông tin ứng viên, trường đại học, chuyên ngành, môn có thể dạy
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Parsed Preview Screen */
                <div className="space-y-4">
                  {/* File status bar */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900">{file?.name}</span>
                        <span className="text-slate-500 ml-2">
                          ({(file?.size ? file.size / 1024 : 0).toFixed(1)} KB — {importResult.sheetNames.length} sheet)
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setImportResult(null);
                        setFile(null);
                        setErrorMessage(null);
                      }}
                      className="px-2.5 py-1 rounded-md text-rose-600 hover:text-rose-800 hover:bg-rose-50 font-semibold cursor-pointer transition-colors"
                    >
                      Chọn file khác
                    </button>
                  </div>

                  {/* Summary badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('students')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        activePreviewTab === 'students'
                          ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Học sinh</span>
                      </div>
                      <div className="text-lg font-bold text-indigo-700 mt-1">
                        {importResult.students.length} <span className="text-xs font-normal text-slate-500">em</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('expenses')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        activePreviewTab === 'expenses'
                          ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        <Wallet className="w-3.5 h-3.5 text-rose-600" />
                        <span>Chi phí</span>
                      </div>
                      <div className="text-lg font-bold text-rose-700 mt-1">
                        {importResult.expenses.length} <span className="text-xs font-normal text-slate-500">khoản</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('leads')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        activePreviewTab === 'leads'
                          ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
                        <span>Lead CRM</span>
                      </div>
                      <div className="text-lg font-bold text-amber-700 mt-1">
                        {importResult.parentLeads.length} <span className="text-xs font-normal text-slate-500">lead</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('tutors')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        activePreviewTab === 'tutors'
                          ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500/20'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                        <span>Trợ giảng</span>
                      </div>
                      <div className="text-lg font-bold text-purple-700 mt-1">
                        {importResult.tutorApplicants.length} <span className="text-xs font-normal text-slate-500">ứng viên</span>
                      </div>
                    </button>
                  </div>

                  {/* Tabbed Data Preview */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>
                          {activePreviewTab === 'students' && `Xem trước Danh sách Học sinh (${importResult.students.length} bản ghi)`}
                          {activePreviewTab === 'expenses' && `Xem trước Danh sách Chi phí (${importResult.expenses.length} khoản)`}
                          {activePreviewTab === 'leads' && `Xem trước Lead CRM Tuyển sinh (${importResult.parentLeads.length} lead)`}
                          {activePreviewTab === 'tutors' && `Xem trước Trợ giảng / Gia sư (${importResult.tutorApplicants.length} ứng viên)`}
                          {activePreviewTab === 'diagnostics' && 'Chi tiết phân tích cấu trúc các Sheet'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActivePreviewTab('diagnostics')}
                        className="text-[11px] text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Xem chi tiết Sheet ({importResult.sheetNames.length})</span>
                      </button>
                    </div>

                    <div className="max-h-56 overflow-y-auto p-2 text-xs">
                      {/* Students Preview Table */}
                      {activePreviewTab === 'students' && (
                        importResult.students.length > 0 ? (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/80">
                                <th className="py-2 px-2.5">Mã HS</th>
                                <th className="py-2 px-2.5">Họ và tên</th>
                                <th className="py-2 px-2.5">Khối/Lớp</th>
                                <th className="py-2 px-2.5">SĐT PH</th>
                                <th className="py-2 px-2.5 text-right">Tổng học phí</th>
                                <th className="py-2 px-2.5 text-center">Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {importResult.students.slice(0, 15).map((st, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="py-1.5 px-2.5 font-mono font-bold text-indigo-600">{st.data.code}</td>
                                  <td className="py-1.5 px-2.5 font-semibold text-slate-900">{st.data.fullName}</td>
                                  <td className="py-1.5 px-2.5">{st.data.className || `Khối ${st.grade}`}</td>
                                  <td className="py-1.5 px-2.5 font-mono text-slate-600">{st.data.parentPhone || '-'}</td>
                                  <td className="py-1.5 px-2.5 text-right font-semibold text-emerald-600">
                                    {(st.data.totalTuitionDue || 0).toLocaleString()} đ
                                  </td>
                                  <td className="py-1.5 px-2.5 text-center">
                                    {st.isDuplicate ? (
                                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">
                                        Trùng
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                                        Hợp lệ
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="py-6 text-center text-slate-400">
                            Không tìm thấy bản ghi học sinh nào trong file này.
                          </div>
                        )
                      )}

                      {/* Expenses Preview Table */}
                      {activePreviewTab === 'expenses' && (
                        importResult.expenses.length > 0 ? (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/80">
                                <th className="py-2 px-2.5">Ngày</th>
                                <th className="py-2 px-2.5">Danh mục</th>
                                <th className="py-2 px-2.5">Nội dung chi</th>
                                <th className="py-2 px-2.5 text-right">Số tiền</th>
                                <th className="py-2 px-2.5">Người chi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {importResult.expenses.slice(0, 15).map((exp, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="py-1.5 px-2.5 font-mono text-slate-600">{exp.data.date}</td>
                                  <td className="py-1.5 px-2.5 font-semibold text-slate-800">{exp.data.categoryName}</td>
                                  <td className="py-1.5 px-2.5 text-slate-700">{exp.data.description}</td>
                                  <td className="py-1.5 px-2.5 text-right font-bold text-rose-600">
                                    {(exp.data.amount || 0).toLocaleString()} đ
                                  </td>
                                  <td className="py-1.5 px-2.5 text-slate-600">{exp.data.payer}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="py-6 text-center text-slate-400">
                            Không tìm thấy bản ghi chi phí nào trong file này.
                          </div>
                        )
                      )}

                      {/* Leads Preview Table */}
                      {activePreviewTab === 'leads' && (
                        importResult.parentLeads.length > 0 ? (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/80">
                                <th className="py-2 px-2.5">Mã Lead</th>
                                <th className="py-2 px-2.5">Phụ huynh</th>
                                <th className="py-2 px-2.5">Học sinh</th>
                                <th className="py-2 px-2.5">SĐT/Zalo</th>
                                <th className="py-2 px-2.5">Môn quan tâm</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {importResult.parentLeads.slice(0, 15).map((lead, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="py-1.5 px-2.5 font-mono font-bold text-amber-600">{lead.data.code}</td>
                                  <td className="py-1.5 px-2.5 font-semibold text-slate-900">{lead.data.parentName}</td>
                                  <td className="py-1.5 px-2.5 text-slate-800">{lead.data.studentName}</td>
                                  <td className="py-1.5 px-2.5 font-mono text-slate-600">{lead.data.phone}</td>
                                  <td className="py-1.5 px-2.5 text-slate-600">{lead.data.interestedSubjects?.join(', ')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="py-6 text-center text-slate-400">
                            Không tìm thấy bản ghi lead CRM nào trong file này.
                          </div>
                        )
                      )}

                      {/* Tutors Preview Table */}
                      {activePreviewTab === 'tutors' && (
                        importResult.tutorApplicants.length > 0 ? (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/80">
                                <th className="py-2 px-2.5">Ứng viên</th>
                                <th className="py-2 px-2.5">SĐT</th>
                                <th className="py-2 px-2.5">Trường ĐH</th>
                                <th className="py-2 px-2.5">Chuyên ngành</th>
                                <th className="py-2 px-2.5">Môn có thể dạy</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {importResult.tutorApplicants.slice(0, 15).map((tut, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="py-1.5 px-2.5 font-semibold text-purple-900">{tut.data.fullName}</td>
                                  <td className="py-1.5 px-2.5 font-mono text-slate-600">{tut.data.phone}</td>
                                  <td className="py-1.5 px-2.5 text-slate-800">{tut.data.university}</td>
                                  <td className="py-1.5 px-2.5 text-slate-600">{tut.data.major}</td>
                                  <td className="py-1.5 px-2.5 text-slate-600">{tut.data.subjectsCanTeach?.join(', ')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="py-6 text-center text-slate-400">
                            Không tìm thấy bản ghi trợ giảng nào trong file này.
                          </div>
                        )
                      )}

                      {/* Diagnostics View */}
                      {activePreviewTab === 'diagnostics' && (
                        <div className="space-y-2 p-1">
                          {importResult.diagnostics.map((diag, i) => (
                            <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800">{diag.sheetName}</span>
                                <span className="text-indigo-600 font-bold">{diag.rowCount} dòng dữ liệu</span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Cột nhận diện: {diag.detectedColumns.slice(0, 8).join(', ')}
                                {diag.detectedColumns.length > 8 ? '...' : ''}
                              </div>
                              <div className="text-[11px] text-emerald-700 font-medium">
                                {diag.messages.join('. ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Duplicate Strategy Option */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="font-bold text-slate-800">Cơ chế xử lý khi trùng lặp thông tin học sinh:</div>
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
                          className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                            duplicateAction === opt.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setImportResult(null);
                        setFile(null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Quay Lại Chọn File
                    </button>
                    <button
                      type="button"
                      disabled={totalImportCount === 0}
                      onClick={handleConfirmImport}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Xác Nhận Nhập {totalImportCount} Bản Ghi</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Import Success State */
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Nhập Dữ Liệu Thành Công!
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Toàn bộ danh sách học sinh, biểu phí, phiếu chi và biểu mẫu từ file Excel đã được nạp vào hệ thống trung tâm An Tâm Education.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Đóng & Xem Dữ Liệu Ngay
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
