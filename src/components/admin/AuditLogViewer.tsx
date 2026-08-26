import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AuditLogEntry, AuditActionType } from '../../types';
import { getLocalAuditLogs, fetchRemoteAuditLogs, logAuditEvent } from '../../services/auditService';
import {
  FileText,
  ShieldCheck,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  User,
  Tag,
  AlertTriangle,
  Info,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const { currentUser, showGlobalToast } = useApp();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const fetched = await fetchRemoteAuditLogs();
      if (fetched && fetched.length > 0) {
        setLogs(fetched);
      } else {
        const local = getLocalAuditLogs();
        setLogs(local);
      }
    } catch (e) {
      setLogs(getLocalAuditLogs());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleExportLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `antam_audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showGlobalToast('Đã tải tệp nhật ký kiểm toán JSON về máy!', 'success');
  };

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entityId && log.entityId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchSeverity = severityFilter === 'ALL' || log.severity === severityFilter;

    return matchSearch && matchAction && matchSeverity;
  });

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'PAYMENT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'AUTH':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'AI_QUERY':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'BACKUP':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'IMPORT':
      case 'EXPORT':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getSeverityIcon = (severity: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      case 'info':
      default:
        return <Info className="w-3.5 h-3.5 text-sky-500" />;
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                AUDIT LOG PILLAR
              </span>
              <span className="text-xs text-slate-400">ANTAM EDUCATION 3.0</span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">Nhật Ký Hoạt Động & Kiểm Toán Hệ Thống</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Ghi vết bất biến các thay đổi dữ liệu, tài chính, điểm số, đăng nhập và phân tích AI.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm Mới
          </button>
          <button
            onClick={handleExportLogs}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Xuất File JSON
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mô tả, người thực hiện, thực thể..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Action Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5" />
            <span>Hành động:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-slate-50 focus:outline-none"
            >
              <option value="ALL">Tất cả hành động</option>
              <option value="CREATE">CREATE (Tạo mới)</option>
              <option value="UPDATE">UPDATE (Cập nhật)</option>
              <option value="DELETE">DELETE (Xóa)</option>
              <option value="PAYMENT">PAYMENT (Thanh toán)</option>
              <option value="AUTH">AUTH (Đăng nhập / Quyền)</option>
              <option value="AI_QUERY">AI_QUERY (Truy vấn Gemini)</option>
              <option value="BACKUP">BACKUP (Sao lưu)</option>
              <option value="IMPORT">IMPORT (Nhập dữ liệu)</option>
              <option value="EXPORT">EXPORT (Xuất dữ liệu)</option>
            </select>
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-slate-50 focus:outline-none"
          >
            <option value="ALL">Mọi mức độ</option>
            <option value="info">Info (Thông thường)</option>
            <option value="warning">Warning (Cảnh báo)</option>
            <option value="critical">Critical (Nghiêm trọng)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="text-xs font-bold text-slate-700">
            Hiển thị <span className="text-sky-600">{filteredLogs.length}</span> / {logs.length} bản ghi nhật ký
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Immutable Audit Stream Active
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
            Không có nhật ký nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Thời Gian</th>
                  <th className="py-2.5 px-4">Mức Độ</th>
                  <th className="py-2.5 px-4">Hành Động</th>
                  <th className="py-2.5 px-4">Đối Tượng</th>
                  <th className="py-2.5 px-4">Chi Tiết Thao Tác</th>
                  <th className="py-2.5 px-4">Người Thực Hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {getSeverityIcon(log.severity)}
                        <span className="capitalize text-[11px] font-medium text-slate-700">
                          {log.severity}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                        {log.entity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.description}</div>
                      {log.entityId && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {log.entityId}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.actorName}</div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {log.actorRole}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
