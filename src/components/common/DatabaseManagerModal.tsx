import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Database,
  CloudUpload,
  Download,
  Upload,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Users,
  CreditCard,
  Receipt,
  BookOpen,
  Calendar,
  Layers,
  X,
  Loader2,
  HardDrive
} from 'lucide-react';

interface DatabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({ isOpen, onClose }) => {
  const {
    students,
    invoices,
    expenses,
    leads,
    tutors,
    classes,
    scheduleSessions,
    attendance,
    lessons,
    assignments,
    submissions,
    users,
    saveAllToDatabase,
    isSavingToDatabase,
    lastSavedTimestamp,
    showGlobalToast,
    exportJsonBackup,
    importJsonBackup,
    syncFromCloud,
    resetToCompactData,
  } = useApp();

  const [isProcessing, setIsProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalRecords =
    students.length +
    invoices.length +
    expenses.length +
    leads.length +
    tutors.length +
    classes.length +
    scheduleSessions.length +
    attendance.length +
    lessons.length +
    assignments.length +
    submissions.length +
    users.length;

  const handleSaveNow = async () => {
    setIsProcessing(true);
    try {
      const res = await saveAllToDatabase(true);
      if (res.success) {
        setImportStatus(`Đã lưu thành công ${res.totalSaved} bản ghi lên cơ sở dữ liệu!`);
      } else {
        setImportStatus(`Lưu thất bại: ${res.message}`);
      }
    } catch (err: any) {
      setImportStatus(`Lỗi: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportJson = () => {
    if (exportJsonBackup) {
      exportJsonBackup();
    } else {
      const data = {
        app: 'AN_TAM_EDUCATION',
        exportedAt: new Date().toISOString(),
        students,
        invoices,
        expenses,
        leads,
        tutors,
        classes,
        scheduleSessions,
        attendance,
        lessons,
        assignments,
        submissions,
        users,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `antam_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showGlobalToast('Đã tải tệp sao lưu JSON về máy tính!', 'success');
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        if (importJsonBackup) {
          const res = await importJsonBackup(content);
          if (res.success) {
            setImportStatus(`Khôi phục thành công ${res.count} bản ghi từ tệp sao lưu!`);
            showGlobalToast('Đã khôi phục và lưu dữ liệu thành công!', 'success');
          } else {
            setImportStatus(`Lỗi tệp: ${res.message}`);
          }
        }
      } catch (err: any) {
        setImportStatus('Tệp JSON không hợp lệ: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCloudSync = async () => {
    if (!syncFromCloud) return;
    setIsProcessing(true);
    try {
      const res = await syncFromCloud();
      if (res.success) {
        setImportStatus(`Đã nạp mới ${res.count} bản ghi từ Đám mây Firebase!`);
      } else {
        setImportStatus(res.message || 'Không tìm thấy dữ liệu trên Đám mây.');
      }
    } catch (err: any) {
      setImportStatus('Lỗi đồng bộ: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetSample = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại dữ liệu về mẫu chuẩn ban đầu không?')) {
      resetToCompactData();
      showGlobalToast('Đã đặt lại dữ liệu mẫu ban đầu!', 'info');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Quản Trị Lưu Trữ & Cơ Sở Dữ Liệu</h2>
              <p className="text-xs text-slate-500">Đồng bộ Firebase Firestore & Bộ nhớ máy tính (Offline-First)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status card */}
          <div className="p-4 rounded-xl bg-slate-900 text-white shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">Tổng dữ liệu đang quản lý:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold font-mono">
                  {totalRecords} Bản ghi
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {lastSavedTimestamp ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Lưu gần nhất: <strong className="text-slate-200">{lastSavedTimestamp}</strong>
                  </span>
                ) : (
                  <span className="text-amber-300">Chưa lưu phiên này</span>
                )}
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <div className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Users className="w-3.5 h-3.5 text-indigo-400" /> Học Sinh
                </div>
                <div className="text-sm font-bold text-white mt-0.5">{students.length}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <div className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Hóa Đơn Thu
                </div>
                <div className="text-sm font-bold text-white mt-0.5">{invoices.length}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <div className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Receipt className="w-3.5 h-3.5 text-rose-400" /> Chi Phí
                </div>
                <div className="text-sm font-bold text-white mt-0.5">{expenses.length}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <div className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" /> Lịch Học / Buổi
                </div>
                <div className="text-sm font-bold text-white mt-0.5">{scheduleSessions.length}</div>
              </div>
            </div>
          </div>

          {importStatus && (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Action Blocks */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thao Tác Lưu Trữ & Đồng Bộ</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Button 1: Save All */}
              <button
                onClick={handleSaveNow}
                disabled={isProcessing || isSavingToDatabase}
                className="p-4 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-left transition-all group flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    {isProcessing || isSavingToDatabase ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CloudUpload className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-200 text-indigo-800">
                    Phím tắt Ctrl+S
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-900">
                    Lưu Dữ Liệu Ngay
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 leading-snug">
                    Lưu tức thì vào LocalStorage và đồng bộ lên Firebase Firestore Cloud.
                  </div>
                </div>
              </button>

              {/* Button 2: Export JSON */}
              <button
                onClick={handleExportJson}
                className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-left transition-all group flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Download className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-800">
                    Sao lưu JSON
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-900">
                    Tải File Sao Lưu Về Máy (.json)
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 leading-snug">
                    Xuất toàn bộ 100% dữ liệu trung tâm thành 1 file để lưu trữ an toàn offline.
                  </div>
                </div>
              </button>

              {/* Button 3: Import JSON */}
              <label className="p-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-left transition-all group flex flex-col justify-between cursor-pointer">
                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-800">
                    Phục hồi
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-amber-900">
                    Khôi Phục Từ File JSON
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 leading-snug">
                    Chọn tệp sao lưu JSON từ máy tính để nạp lại toàn bộ hệ thống.
                  </div>
                </div>
              </label>

              {/* Button 4: Cloud Pull */}
              <button
                onClick={handleCloudSync}
                disabled={isProcessing}
                className="p-4 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-900 text-left transition-all group flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                    <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-200 text-sky-800">
                    Cloud Pull
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-sky-900">
                    Tải Lại Từ Firebase Cloud
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 leading-snug">
                    Lấy dữ liệu mới nhất được lưu trên Đám mây Firestore về máy.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Reset option */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Khôi phục về mẫu ban đầu khi cần thiết:</span>
            <button
              onClick={handleResetSample}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors cursor-pointer"
            >
              Đặt lại dữ liệu mẫu gốc
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
