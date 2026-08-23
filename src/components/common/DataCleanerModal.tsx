import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { diagnoseData, cleanAndNormalizeAllData } from '../../utils/dataCleaner';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Database,
  Layers,
  FileCheck,
  X,
  Phone,
  User,
  Calculator,
  Copy,
  TableProperties,
  Cloud,
  Server,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DataCleanerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataCleanerModal: React.FC<DataCleanerModalProps> = ({ isOpen, onClose }) => {
  const {
    students,
    invoices,
    expenses,
    leads,
    tutors,
    cleanAndNormalizeData,
    resetToCompactData,
    clearAllData,
    isCompactView,
    setIsCompactView,
    isLoadingFromCloud,
    isFirebaseConnected,
  } = useApp();

  const [options, setOptions] = useState({
    cleanNames: true,
    cleanPhones: true,
    recalcTuition: true,
    deduplicate: true,
    removeEmpty: true,
  });

  const [lastResult, setLastResult] = useState<{
    fixedNames: number;
    fixedPhones: number;
    recalculatedFinances: number;
    removedDuplicates: number;
    removedEmpty: number;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'clean' | 'compact_preset' | 'clear'>('clean');

  // Diagnose current data
  const diagnostics = useMemo(() => {
    return diagnoseData(students, invoices, expenses, leads, tutors);
  }, [students, invoices, expenses, leads, tutors]);

  const totalIssues =
    diagnostics.unformattedNamesCount +
    diagnostics.unformattedPhonesCount +
    diagnostics.mismatchedDebtCount +
    diagnostics.duplicateStudentsCount +
    diagnostics.emptyRecordsCount;

  if (!isOpen) return null;

  const handleExecuteClean = () => {
    const res = cleanAndNormalizeData(options);
    setLastResult(res);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const handleResetToCompact = () => {
    if (window.confirm('Bạn có chắc chắn muốn nạp bộ dữ liệu tinh gọn chuẩn? (Dữ liệu học sinh, chi phí, hóa đơn hiện tại sẽ được cập nhật thành bộ mẫu chuẩn gọn gàng)')) {
      resetToCompactData();
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });
      onClose();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('CẢNH BÁO: Thao tác này sẽ xóa toàn bộ danh sách học sinh, hóa đơn, phiếu chi và leads về trống để bạn nạp file Excel riêng. Bạn có chắc chắn không?')) {
      clearAllData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Làm Gọn & Chuẩn Hóa Dữ Liệu Hệ Thống
              </h2>
              <p className="text-xs text-indigo-200/80">
                Tối ưu hóa bảng biểu, làm sạch tên/SĐT, sửa lỗi công nợ & gộp bản ghi trùng
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('clean')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors cursor-pointer border-b-2 ${
              activeTab === 'clean'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>1. Dọn Dẹp & Chuẩn Hóa</span>
            {totalIssues > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                {totalIssues} cần sửa
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('compact_preset')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors cursor-pointer border-b-2 ${
              activeTab === 'compact_preset'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Nạp Dữ Liệu Tinh Gọn Mẫu</span>
          </button>

          <button
            onClick={() => setActiveTab('clear')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors cursor-pointer border-b-2 ${
              activeTab === 'clear'
                ? 'bg-white text-rose-700 border-rose-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>3. Xóa Trắng Dữ Liệu</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-sm">
          {activeTab === 'clean' && (
            <>
              {/* Database Persistence Info Banner */}
              <div className="p-4 rounded-xl border flex items-center justify-between bg-emerald-50/20 border-emerald-200/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border shadow-2xs ${
                    isLoadingFromCloud 
                      ? 'bg-amber-50 text-amber-600 border-amber-200 animate-spin' 
                      : isFirebaseConnected 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {isLoadingFromCloud ? (
                      <RefreshCw className="w-5 h-5" />
                    ) : (
                      <Cloud className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>Cơ Sở Dữ Liệu Đồng Bộ Đám Mây</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        isLoadingFromCloud
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : isFirebaseConnected
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isLoadingFromCloud ? 'Đang tải...' : isFirebaseConnected ? 'Đã kết nối' : 'Ngoại tuyến'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isLoadingFromCloud 
                        ? 'Đang tải và đồng bộ toàn bộ dữ liệu từ Google Firebase Firestore...' 
                        : isFirebaseConnected 
                        ? 'Dữ liệu của bạn được tự động lưu trữ và đồng bộ liên tục lên Cloud Firestore của Google. An tâm tuyệt đối khi nâng cấp phần mềm.' 
                        : 'Không thể kết nối Cloud. Toàn bộ dữ liệu của bạn đang được lưu tạm cục bộ trên trình duyệt.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Density View Toggle Banner */}
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white text-indigo-600 border border-slate-200 shadow-2xs">
                    <TableProperties className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Chế Độ Xem Bảng Thu Gọn (Compact Density Mode)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Giảm khoảng cách dòng (padding) trên tất cả danh sách để hiển thị được nhiều học sinh/chi phí hơn
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCompactView}
                    onChange={(e) => setIsCompactView(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Data Health Diagnosis Grid */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span>Chẩn Đoán Tình Trạng Dữ Liệu Hiện Tại</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="text-slate-500 text-xs font-medium">Tổng Học Sinh</div>
                    <div className="text-lg font-bold text-slate-900 mt-1">{diagnostics.totalStudents}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {diagnostics.totalInvoices} hóa đơn • {diagnostics.totalExpenses} phiếu chi
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
                      <span>Tên Chưa Chuẩn</span>
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div className={`text-lg font-bold mt-1 ${diagnostics.unformattedNamesCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {diagnostics.unformattedNamesCount}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Khoảng trắng / Chữ hoa</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
                      <span>SĐT Chưa Chuẩn</span>
                      <Phone className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div className={`text-lg font-bold mt-1 ${diagnostics.unformattedPhonesCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {diagnostics.unformattedPhonesCount}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">+84 / Dấu cách / Dấu chấm</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
                      <span>Lệch Học Phí / Trùng</span>
                      <Calculator className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <div className={`text-lg font-bold mt-1 ${diagnostics.mismatchedDebtCount + diagnostics.duplicateStudentsCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {diagnostics.mismatchedDebtCount + diagnostics.duplicateStudentsCount}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Cần tính toán & gộp lại</div>
                  </div>
                </div>
              </div>

              {/* Cleaning Options */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Chọn Các Tác Vụ Làm Gọn Sẽ Thực Hiện</span>
                </h3>

                <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.cleanNames}
                      onChange={(e) => setOptions({ ...options, cleanNames: e.target.checked })}
                      className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        Chuẩn hóa danh xưng & viết hoa Họ Tên (Proper Title Case)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Chuyển các tên viết thường hoặc khoảng trắng thừa thành chuẩn tiếng Việt (ví dụ: "  nguyễn   văn an" → "Nguyễn Văn An").
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.cleanPhones}
                      onChange={(e) => setOptions({ ...options, cleanPhones: e.target.checked })}
                      className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        Chuẩn hóa số điện thoại về định dạng 10 chữ số
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Xóa dấu cách, dấu chấm, chuyển đổi đầu mã vùng +84 hoặc thiếu số 0 thành dạng số điện thoại chuẩn (ví dụ: "+84 912.345.678" → "0912345678").
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.recalcTuition}
                      onChange={(e) => setOptions({ ...options, recalcTuition: e.target.checked })}
                      className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        Tự động tính toán lại công nợ & đồng bộ học phí các môn
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Cộng tổng học phí thực tế từ các môn học sinh đã đăng ký và tính toán lại Còn nợ = Phải thu − Đã nộp một cách chính xác 100%.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.deduplicate}
                      onChange={(e) => setOptions({ ...options, deduplicate: e.target.checked })}
                      className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        Gộp bản ghi trùng lặp (Deduplication)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Tự động phát hiện học sinh trùng mã hoặc trùng cả Họ tên & SĐT phụ huynh để gộp danh sách môn học và học phí đã đóng.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.removeEmpty}
                      onChange={(e) => setOptions({ ...options, removeEmpty: e.target.checked })}
                      className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        Xóa bản ghi rỗng / dữ liệu rác
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Loại bỏ các dòng học sinh không có họ tên hoặc chi phí bằng 0đ.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Execution Notification */}
              {lastResult && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">
                      Đã Làm Gọn Dữ Liệu Thành Công!
                    </h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      Đã chuẩn hóa {lastResult.fixedNames} họ tên, {lastResult.fixedPhones} số điện thoại, tính lại công nợ cho {lastResult.recalculatedFinances} học sinh, gộp {lastResult.removedDuplicates} bản ghi trùng lặp.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'compact_preset' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Bộ Dữ Liệu Tinh Gọn Chuẩn (Clean Preset)
                </h4>
                <p className="text-xs text-indigo-700 mt-1">
                  Đây là bộ dữ liệu mẫu chuẩn được tối ưu gọn gàng, đại diện đầy đủ cho 4 khối THCS (Khối 6, 7, 8, 9), có sẵn biểu đồ thu chi, phiếu chi mẫu, ứng viên gia sư và lead CRM hoàn chỉnh.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="font-semibold text-slate-800">Đặc điểm của bộ dữ liệu tinh gọn:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Phân bổ chuẩn xác học sinh các khối 6, 7, 8, 9 không trùng lặp</li>
                  <li>Số điện thoại và họ tên chuẩn chỉ 100%</li>
                  <li>Số liệu công nợ và học phí từng môn khớp hoàn toàn</li>
                  <li>Có sẵn lịch học, điểm danh và bài tập LMS mẫu</li>
                </ul>
              </div>

              <button
                onClick={handleResetToCompact}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs lg:text-sm shadow-md transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Nạp Lại Bộ Dữ Liệu Tinh Gọn Chuẩn Ngay</span>
              </button>
            </div>
          )}

          {activeTab === 'clear' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Xóa Trắng Dữ Liệu (Clean Slate)
                </h4>
                <p className="text-xs text-rose-700 mt-1">
                  Thao tác này sẽ dọn sạch toàn bộ dữ liệu học sinh, hóa đơn, chi phí và leads để bảng dữ liệu hoàn toàn trống, sẵn sàng cho việc nhập file Excel thực tế của trung tâm bạn.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Lưu ý:</span> Cấu hình môn học và tài khoản người dùng quản trị vẫn được giữ nguyên.
              </div>

              <button
                onClick={handleClearAll}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs lg:text-sm shadow-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác Nhận Xóa Trắng Dữ Liệu Về Trống</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {diagnostics.totalStudents} học sinh trong cơ sở dữ liệu
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Đóng
            </button>

            {activeTab === 'clean' && (
              <button
                onClick={handleExecuteClean}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Thực Hiện Làm Gọn Dữ Liệu</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
