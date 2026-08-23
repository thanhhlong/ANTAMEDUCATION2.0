import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ParentLead, LeadStatus } from '../../types';
import { ExcelImportModal } from '../excel/ExcelModals';
import {
  UserPlus,
  Search,
  Plus,
  Phone,
  Sparkles,
  UserCheck,
  X,
  History,
  Upload,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CrmManagerProps {
  onNavigateToTutoring: (leadId: string) => void;
}

export const CrmManager: React.FC<CrmManagerProps> = ({ onNavigateToTutoring }) => {
  const {
    leads,
    subjects,
    addLead,
    updateLeadStatus,
    convertLeadToStudent,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<ParentLead | null>(null);

  // Add lead form state
  const [formData, setFormData] = useState({
    parentName: '',
    studentName: '',
    phone: '',
    zalo: '',
    email: '',
    currentSchool: 'THCS',
    targetGrade: 8,
    interestedSubjects: ['Toán học'],
    interestedServices: ['Lớp học tiêu chuẩn'],
    customTutoringTopic: '',
    customTutoringTarget: '',
    preferredSchedule: ['Tối T3, T5', 'Chủ Nhật'],
    referralSource: 'Facebook',
    assignedConsultant: 'Tư vấn viên Thanh Hương',
    notes: '',
  });

  const filteredLeads = leads.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchP = l.parentName.toLowerCase().includes(q);
      const matchS = l.studentName.toLowerCase().includes(q);
      const matchPhone = l.phone.includes(q);
      const matchCode = l.code.toLowerCase().includes(q);
      if (!matchP && !matchS && !matchPhone && !matchCode) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setFormData({
      parentName: '',
      studentName: '',
      phone: '',
      zalo: '',
      email: '',
      currentSchool: 'THCS Cầu Giấy',
      targetGrade: 8,
      interestedSubjects: ['Toán học'],
      interestedServices: ['Lớp học tiêu chuẩn'],
      customTutoringTopic: '',
      customTutoringTarget: '',
      preferredSchedule: ['Tối T3, T5', 'Chủ Nhật'],
      referralSource: 'Biểu mẫu 2 / Hotline',
      assignedConsultant: 'Tư vấn viên Thanh Hương',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.parentName.trim() || !formData.phone.trim() || !formData.studentName.trim()) {
      alert('Vui lòng điền họ tên phụ huynh, SĐT và tên học sinh');
      return;
    }

    addLead({
      parentName: formData.parentName.trim(),
      studentName: formData.studentName.trim(),
      phone: formData.phone.trim(),
      zalo: formData.zalo.trim() || formData.phone.trim(),
      email: formData.email.trim(),
      currentSchool: formData.currentSchool.trim(),
      targetGrade: formData.targetGrade,
      interestedSubjects: formData.interestedSubjects,
      interestedServices: formData.interestedServices,
      customTutoring: formData.customTutoringTopic
        ? {
            topic: formData.customTutoringTopic,
            targetGoal: formData.customTutoringTarget || 'Nâng cao điểm số',
            preferredSchedule: formData.preferredSchedule,
            estimatedHours: 20,
            status: 'pending_match',
          }
        : undefined,
      preferredSchedule: formData.preferredSchedule,
      referralSource: formData.referralSource,
      assignedConsultant: formData.assignedConsultant,
      status: 'new',
    });

    setIsAddModalOpen(false);
  };

  const handleConvertToStudent = (lead: ParentLead) => {
    if (
      confirm(
        `Xác nhận chuyển đổi Lead "${lead.studentName}" (PH: ${lead.parentName}) thành học sinh chính thức? Hệ thống sẽ tự động tạo hồ sơ học sinh, đăng ký môn và phát hành hóa đơn học phí.`
      )
    ) {
      const newStudent = convertLeadToStudent(lead.id, `${lead.targetGrade}A1`);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      alert(`Đã chuyển đổi thành công! Học sinh ${newStudent.fullName} có mã: ${newStudent.code}`);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Tuyển Sinh</span>
            <span>/</span>
            <span className="text-slate-700">CRM Phụ Huynh</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-1">
            <UserPlus className="w-6 h-6 text-amber-600" />
            <span>CRM PHỤ HUYNH & QUẢN LÝ LEAD TUYỂN SINH</span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Dữ liệu đồng bộ từ Biểu mẫu 2 (Đăng ký học & Nhu cầu học theo yêu cầu)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs lg:text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4 text-amber-600" />
            <span>Nhập CRM Từ Excel (BM2)</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs lg:text-sm font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Lead Phụ Huynh</span>
          </button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { id: 'new', label: 'Lead Mới', count: leads.filter((l) => l.status === 'new').length, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { id: 'consulting', label: 'Đang Tư Vấn', count: leads.filter((l) => l.status === 'consulting').length, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
          { id: 'trial', label: 'Hẹn Học Thử', count: leads.filter((l) => l.status === 'trial').length, color: 'text-purple-700 bg-purple-50 border-purple-200' },
          { id: 'enrolled', label: 'Đã Chốt Nhập Học', count: leads.filter((l) => l.status === 'enrolled').length, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
          { id: 'cancelled', label: 'Hủy / Từ Chối', count: leads.filter((l) => l.status === 'cancelled').length, color: 'text-rose-700 bg-rose-50 border-rose-200' },
        ].map((st) => (
          <div
            key={st.id}
            onClick={() => setStatusFilter(statusFilter === st.id ? 'all' : st.id)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
              statusFilter === st.id
                ? 'ring-2 ring-indigo-600'
                : 'hover:border-slate-300'
            } ${st.color}`}
          >
            <div className="text-[11px] font-semibold opacity-90">{st.label}</div>
            <div className="text-xl lg:text-2xl font-bold mt-1">{st.count}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên PH, tên học sinh, SĐT, mã lead..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-xs lg:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs lg:text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tất cả trạng thái CRM</option>
              <option value="new">Lead Mới</option>
              <option value="consulting">Đang tư vấn</option>
              <option value="trial">Hẹn học thử</option>
              <option value="enrolled">Đã chốt (Học sinh chính thức)</option>
              <option value="cancelled">Hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs lg:text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Mã / Học Sinh</th>
                <th className="px-4 py-3.5">Phụ Huynh & SĐT</th>
                <th className="px-3 py-3.5">Khối / Môn</th>
                <th className="px-4 py-3.5">Nhu Cầu Chi Tiết</th>
                <th className="px-3 py-3.5">Trạng Thái</th>
                <th className="px-4 py-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Không có lead nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Student & Code */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{lead.studentName}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="text-amber-700 font-semibold">{lead.code}</span>
                        <span>•</span>
                        <span className="truncate max-w-[120px]">{lead.currentSchool}</span>
                      </div>
                    </td>

                    {/* Parent & Phone */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{lead.parentName}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{lead.phone}</span>
                      </div>
                    </td>

                    {/* Grade & Subjects */}
                    <td className="px-3 py-3.5">
                      <div className="font-semibold text-slate-900">Khối {lead.targetGrade}</div>
                      <div className="flex flex-wrap gap-1 mt-1 max-w-[140px]">
                        {lead.interestedSubjects.map((sub, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Need & Custom Request */}
                    <td className="px-4 py-3.5">
                      {lead.customTutoring ? (
                        <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs space-y-0.5">
                          <div className="flex items-center gap-1 font-bold text-indigo-700">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>Học theo yêu cầu: {lead.customTutoring.topic}</span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            Mục tiêu: {lead.customTutoring.targetGoal}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600">
                          {lead.interestedServices.join(', ')}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <select
                        value={lead.status}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border bg-white cursor-pointer ${
                          lead.status === 'enrolled'
                            ? 'text-emerald-700 border-emerald-300'
                            : lead.status === 'trial'
                            ? 'text-purple-700 border-purple-300'
                            : lead.status === 'consulting'
                            ? 'text-indigo-700 border-indigo-300'
                            : lead.status === 'cancelled'
                            ? 'text-rose-700 border-rose-300'
                            : 'text-amber-700 border-amber-300'
                        }`}
                      >
                        <option value="new">Mới</option>
                        <option value="consulting">Đang tư vấn</option>
                        <option value="trial">Hẹn học thử</option>
                        <option value="enrolled">Đã chốt</option>
                        <option value="cancelled">Hủy</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {lead.customTutoring && (
                          <button
                            onClick={() => onNavigateToTutoring(lead.id)}
                            title="Ghép gia sư AI cho nhu cầu này"
                            className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>Ghép Gia Sư</span>
                          </button>
                        )}

                        {lead.status !== 'enrolled' && (
                          <button
                            onClick={() => handleConvertToStudent(lead)}
                            title="Chuyển thành học sinh chính thức"
                            className="flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Chốt Lớp</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="p-1.5 rounded-md bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Lịch sử tương tác"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-600" />
                <span>Thêm Lead Phụ Huynh (Biểu Mẫu 2)</span>
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-3 text-xs lg:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Họ Tên Phụ Huynh *</label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="VD: Nguyễn Thị Lan"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Số Điện Thoại *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="VD: 0912345678"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-medium mb-1">Tên Học Sinh *</label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="VD: Nguyễn Minh Đức"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Khối Lớp</label>
                  <select
                    value={formData.targetGrade}
                    onChange={(e) => setFormData({ ...formData, targetGrade: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>
                        Khối {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Môn Học Quan Tâm</label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((sub) => {
                    const isChecked = formData.interestedSubjects.includes(sub.name);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setFormData({
                              ...formData,
                              interestedSubjects: formData.interestedSubjects.filter((s) => s !== sub.name),
                            });
                          } else {
                            setFormData({
                              ...formData,
                              interestedSubjects: [...formData.interestedSubjects, sub.name],
                            });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom tutoring sub-box */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Nhu Cầu Học Tập Theo Yêu Cầu (Tùy chọn)</span>
                </div>
                <input
                  type="text"
                  value={formData.customTutoringTopic}
                  onChange={(e) => setFormData({ ...formData, customTutoringTopic: e.target.value })}
                  placeholder="VD: Ôn thi giữa kỳ 1 Hình học, lấy gốc Toán Đại số..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={formData.customTutoringTarget}
                  onChange={(e) => setFormData({ ...formData, customTutoringTarget: e.target.value })}
                  placeholder="Mục tiêu: Đạt 8+ điểm bài thi, bồi dưỡng học sinh giỏi..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
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
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Lưu Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <span>Lịch Sử Tư Vấn Lead ({selectedLead.code})</span>
              </h2>
              <button onClick={() => setSelectedLead(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {selectedLead.timeline.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-mono">{item.date}</span>
                    <span className="font-semibold text-slate-700">{item.by}</span>
                  </div>
                  <div className="font-bold text-slate-900">{item.action}</div>
                  {item.notes && <div className="text-slate-600 italic">{item.notes}</div>}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLead(null)}
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
