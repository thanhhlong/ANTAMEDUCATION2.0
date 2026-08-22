import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  HeartHandshake,
  CheckCircle2,
  Award,
  CreditCard,
  BookOpen,
  Calendar,
  Clock,
  Building,
} from 'lucide-react';

interface ParentPortalProps {
  onOpenPaymentModal: (invoiceId: string) => void;
  onNavigateToTutoring: (leadId: string) => void;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({
  onOpenPaymentModal,
}) => {
  const { students, invoices, scheduleSessions } = useApp();

  const [searchPhoneOrCode, setSearchPhoneOrCode] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(students[0] || null);

  // Find student by code or phone
  const handleSearch = () => {
    if (!searchPhoneOrCode.trim()) return;
    const q = searchPhoneOrCode.toLowerCase().trim();
    const found = students.find(
      (s) =>
        s.code.toLowerCase() === q ||
        s.parentPhone.includes(q) ||
        s.phone.includes(q) ||
        s.fullName.toLowerCase().includes(q)
    );
    if (found) {
      setSelectedStudent(found);
    } else {
      alert('Không tìm thấy học sinh với thông tin tra cứu đã nhập.');
    }
  };

  const studentInvoice = selectedStudent
    ? invoices.find((i) => i.studentId === selectedStudent.id)
    : null;

  // Student's weekly schedule based on their grade & classes
  const studentSessions = selectedStudent
    ? scheduleSessions.filter((s) => s.grade === selectedStudent.grade)
    : [];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Dịch Vụ</span>
            <span>/</span>
            <span className="text-slate-700">Cổng Phụ Huynh</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-1">
            <HeartHandshake className="w-6 h-6 text-indigo-600" />
            <span>CỔNG THÔNG TIN PHỤ HUYNH & HỌC SINH</span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Theo dõi tiến độ học tập, chuyên cần, điểm số và đóng học phí trực tuyến cho con
          </p>
        </div>

        {/* Quick Student Selector / Phone Search */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchPhoneOrCode}
            onChange={(e) => setSearchPhoneOrCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Nhập SĐT Phụ huynh hoặc Mã HS..."
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Tra Cứu
          </button>
        </div>
      </div>

      {selectedStudent ? (
        <div className="space-y-6">
          {/* Top Profile Card */}
          <div className="p-5 lg:p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xl shadow-2xs">
                  {selectedStudent.fullName.split(' ').pop()?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{selectedStudent.fullName}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                      Khối {selectedStudent.grade} ({selectedStudent.className})
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Mã HS: <strong className="font-mono text-indigo-600 font-bold">{selectedStudent.code}</strong> • Trường: {selectedStudent.currentSchool}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  Phụ huynh: <strong className="text-slate-900">{selectedStudent.parentName}</strong> ({selectedStudent.parentPhone})
                </div>
              </div>
            </div>
          </div>

          {/* 3 Metric Cards for Parent */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tuition Status */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Học Phí Tháng 8</span>
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {formatCurrency(selectedStudent.totalTuitionDue)}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Đã nộp: <strong className="text-emerald-700 font-mono">{formatCurrency(selectedStudent.totalPaid)}</strong></span>
                {selectedStudent.remainingDebt > 0 ? (
                  <button
                    onClick={() => studentInvoice && onOpenPaymentModal(studentInvoice.id)}
                    className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Nộp Học Phí
                  </button>
                ) : (
                  <span className="text-emerald-700 font-bold">Đã thu đủ ✓</span>
                )}
              </div>
            </div>

            {/* Attendance Score */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Chuyên Cần & Đúng Giờ</span>
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl font-bold text-emerald-700">
                100% Có mặt
              </div>
              <div className="text-xs text-slate-500">
                Ghi nhận đầy đủ bài tập và tích cực phát biểu
              </div>
            </div>

            {/* Homework & Academic Average */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Điểm Đánh Giá Học Tập</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-bold text-amber-600">
                8.8 / 10 (Giỏi)
              </div>
              <div className="text-xs text-slate-500">
                Đã hoàn thành 5 bài tập về nhà gần nhất
              </div>
            </div>
          </div>

          {/* Enrolled Subjects & Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Các Môn Học Con Đang Đăng Ký</span>
              </h3>

              <div className="space-y-2">
                {selectedStudent.enrollments.map((en) => (
                  <div
                    key={en.id}
                    className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{en.subjectName}</div>
                      <div className="text-slate-500 text-[11px]">Bắt đầu từ: {en.startDate}</div>
                    </div>
                    <div className="font-mono font-bold text-slate-800">
                      {formatCurrency(en.finalFee)} / tháng
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance & Teacher feedback history */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Nhận Xét Của Giáo Viên Gần Nhất</span>
              </h3>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-bold text-indigo-700">Toán Học - Thầy Nguyễn Văn Nam</span>
                    <span>20/08/2026</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    "Em An tiếp thu rất nhanh phần hằng đẳng thức đáng nhớ. Bài tập về nhà trình bày sạch sẽ, đạt 9.5 điểm."
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-bold text-indigo-700">Tiếng Anh - Cô Mai Hương</span>
                    <span>18/08/2026</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    "Cần chú ý ôn lại cách chia động từ bất quy tắc ở thì quá khứ đơn."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Student's Weekly Timetable */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Thời Khóa Biểu Học Tập Trong Tuần (Khối {selectedStudent.grade})</span>
              </h3>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                {studentSessions.length} Buổi học / tuần
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {studentSessions.map((ses) => (
                <div
                  key={ses.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 shadow-2xs">
                      Thứ {ses.dayOfWeek} • Ca {ses.shift}
                    </span>
                    <span className="font-mono text-slate-600 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {ses.startTime} - {ses.endTime}
                    </span>
                  </div>

                  <div className="font-bold text-slate-900 text-sm">{ses.className}</div>

                  <div className="text-slate-600 space-y-0.5 text-[11px]">
                    <div>Phòng: <strong className="text-slate-800">{ses.room}</strong></div>
                    <div>GV: <strong className="text-slate-800">{ses.teacherName}</strong></div>
                    {ses.tutorName && (
                      <div className="text-indigo-700 font-medium">Trợ giảng: {ses.tutorName}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-400 text-xs">
          Vui lòng nhập thông tin để tra cứu hồ sơ học sinh.
        </div>
      )}
    </div>
  );
};
