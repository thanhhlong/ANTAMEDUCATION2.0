import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  BookOpen,
  Send,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Search,
  UserCheck,
  Star,
  FileCheck,
  Phone,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TeacherWorkspaceProps {
  onNavigateToAttendance: (sessionId?: string) => void;
  onNavigateToLMS: () => void;
  onNavigateToTimetable: () => void;
  onNavigateToStudents: () => void;
}

export const TeacherWorkspace: React.FC<TeacherWorkspaceProps> = ({
  onNavigateToAttendance,
  onNavigateToLMS,
  onNavigateToTimetable,
  onNavigateToStudents,
}) => {
  const {
    currentUser,
    students,
    classes,
    scheduleSessions,
    attendance,
    assignments,
    submissions,
    gradeSubmission,
  } = useApp();

  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [quickGradingSubmissionId, setQuickGradingSubmissionId] = useState<string | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(9);
  const [gradingFeedback, setGradingFeedback] = useState<string>('Làm bài tốt, lập luận chặt chẽ và trình bày rõ ràng.');
  const [quickNoteStudentId, setQuickNoteStudentId] = useState<string | null>(null);
  const [studentNoteText, setStudentNoteText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Determine teacher's assigned classes & subjects
  const teacherName = currentUser?.fullName || 'Thầy Nguyễn Văn Nam';
  const teacherClasses = currentUser?.assignedClasses || ['8A1', '8A2', '9A1'];

  // Filter sessions taught by this teacher or in teacher's classes
  const teacherSessions = scheduleSessions.filter(
    (s) =>
      s.teacher.toLowerCase().includes(teacherName.toLowerCase().replace('thầy ', '').replace('cô ', '')) ||
      teacherClasses.includes(s.className)
  );

  // Today's sessions
  const todayName = 'Thứ 4'; // Mock active current day
  const todaySessions = teacherSessions.filter((s) => s.dayOfWeek === todayName || s.dayOfWeek === 'Thứ 2');

  // Filter students belonging to teacher's classes
  const myStudents = students.filter(
    (st) =>
      teacherClasses.includes(st.className) &&
      (selectedClassFilter === 'all' || st.className === selectedClassFilter) &&
      (st.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.className.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pending LMS submissions
  const pendingSubmissions = submissions.filter((sub) => sub.status === 'submitted');

  const handleQuickGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickGradingSubmissionId) return;

    gradeSubmission(quickGradingSubmissionId, Number(gradingScore), gradingFeedback, teacherName);
    setQuickGradingSubmissionId(null);
    setToastMessage('Đã chấm bài và gửi phản hồi đến học sinh thành công!');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveStudentNote = (student: typeof students[0]) => {
    if (!studentNoteText.trim()) return;
    setToastMessage(`Đã lưu nhận xét học tập cho em ${student.fullName} (Lớp ${student.className})!`);
    setQuickNoteStudentId(null);
    setStudentNoteText('');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 p-3.5 rounded-xl bg-emerald-600 text-white shadow-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner - Teacher Greeting */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 lg:p-6 shadow-md border border-slate-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-emerald-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 font-black text-xl flex items-center justify-center text-white shadow-lg border border-emerald-400/30">
              {currentUser?.fullName.split(' ').pop()?.slice(0, 2).toUpperCase() || 'GV'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white">
                  {currentUser?.fullName || 'Thầy Nguyễn Văn Nam'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                  Giáo Viên Chuyên Môn
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                <span>{currentUser?.title || 'Tổ Trưởng Chuyên Môn Toán & KHTN'}</span>
                <span>•</span>
                <span>Lớp phụ trách: <strong className="text-white">{teacherClasses.join(', ')}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onNavigateToAttendance(todaySessions[0]?.id)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Điểm Danh Ca Dạy Hôm Nay</span>
            </button>

            <button
              onClick={onNavigateToLMS}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Tạo Bài Tập / Đề Thi AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards Scoped for Teacher */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Lớp Đang Giảng Dạy</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {teacherClasses.length} <span className="text-xs text-slate-400 font-normal">lớp</span>
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">
            {teacherClasses.join(' • ')}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Học Sinh Quản Lý</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {myStudents.length} <span className="text-xs text-slate-400 font-normal">học sinh</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>98.2% chuyên cần tuần này</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Ca Dạy Trong Tuần</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {teacherSessions.length} <span className="text-xs text-slate-400 font-normal">buổi</span>
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            Hôm nay: {todaySessions.length} ca giảng dạy
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Bài Tập Cần Chấm</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {pendingSubmissions.length} <span className="text-xs text-slate-400 font-normal">bài nộp</span>
          </div>
          <div className="text-[11px] text-rose-600 font-semibold mt-1">
            {pendingSubmissions.length > 0 ? 'Cần phản hồi sớm' : 'Đã chấm hết'}
          </div>
        </div>
      </div>

      {/* Main 2-Column Working Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Schedule & Attendance (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Today & Upcoming Teaching Sessions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Lịch Giảng Dạy & Điểm Danh Ca Dạy
                </h2>
              </div>
              <button
                onClick={onNavigateToTimetable}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Xem Toàn Bộ Lịch Tuần</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {teacherSessions.slice(0, 4).map((session) => {
                const isToday = session.dayOfWeek === todayName || session.dayOfWeek === 'Thứ 2';
                return (
                  <div
                    key={session.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isToday
                        ? 'bg-emerald-50/40 border-emerald-200 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 ${
                          isToday
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="text-[10px] leading-none uppercase">{session.dayOfWeek}</span>
                        <span className="text-xs font-black mt-0.5">{session.className}</span>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {session.subjectName}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            Phòng: {session.room}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-2">
                          <span className="font-mono">{session.timeSlot}</span>
                          <span>•</span>
                          <span>{session.studentCount} Học sinh</span>
                          {session.tutorAssistant && (
                            <>
                              <span>•</span>
                              <span className="text-purple-700 font-medium">
                                Trợ giảng: {session.tutorAssistant}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => onNavigateToAttendance(session.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors ${
                          isToday
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{isToday ? 'Điểm Danh Ngay' : 'Sổ Điểm Danh'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Student Roster Scoped for Teacher */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>Danh Sách Học Sinh Phụ Trách ({myStudents.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Theo dõi học lực, chuyên cần & nhận xét gửi phụ huynh
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  <option value="all">Tất cả lớp phụ trách</option>
                  {teacherClasses.map((c) => (
                    <option key={c} value={c}>
                      Lớp {c}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên/mã HS..."
                    className="pl-7 pr-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-36 sm:w-44"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {myStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Không tìm thấy học sinh nào phù hợp với bộ lọc
                </div>
              ) : (
                myStudents.slice(0, 10).map((st) => (
                  <div
                    key={st.id}
                    className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 border border-indigo-100">
                        {st.fullName.split(' ').pop()?.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{st.fullName}</span>
                          <span className="font-mono text-[10px] text-slate-400">{st.code}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[10px]">
                            Lớp {st.className}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>Trường: {st.currentSchool}</span>
                          <span>•</span>
                          <span>PH: {st.parentName} ({st.parentPhone})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setQuickNoteStudentId(st.id);
                          setStudentNoteText(st.notes || '');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3 text-indigo-600" />
                        <span>Nhận xét</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={onNavigateToStudents}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Xem chi tiết hồ sơ toàn bộ học sinh →
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Pending Grading, LMS Quiz & Academic Notes (1 Col wide) */}
        <div className="space-y-6">
          {/* LMS Submissions to Grade */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-rose-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Bài Nộp Cần Chấm ({pendingSubmissions.length})
                </h2>
              </div>
              <button
                onClick={onNavigateToLMS}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Quản lý LMS
              </button>
            </div>

            <div className="p-4 space-y-3">
              {pendingSubmissions.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  <p className="font-semibold text-slate-700">Tất cả bài nộp đã được chấm điểm!</p>
                  <p className="text-[11px]">Học sinh chưa gửi thêm bài tập mới</p>
                </div>
              ) : (
                pendingSubmissions.slice(0, 3).map((sub) => {
                  const assign = assignments.find((a) => a.id === sub.assignmentId);
                  return (
                    <div
                      key={sub.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900">{sub.studentName}</div>
                          <div className="text-[11px] text-indigo-700 font-semibold">
                            {assign?.title || 'Bài tập tự luận'}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {sub.submittedAt.slice(0, 10)}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                        {sub.answers[0]?.textAnswer || 'Đã nộp bài giải câu 1, 2, 3'}
                      </div>

                      <button
                        onClick={() => {
                          setQuickGradingSubmissionId(sub.id);
                          setGradingScore(9);
                          setGradingFeedback('Làm bài tốt, lập luận chặt chẽ.');
                        }}
                        className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Chấm Điểm & Nhận Xét Ngay</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick AI Lesson Planner & Exercise Generator */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50/40 rounded-2xl border border-indigo-100 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                  Trợ Lý Giáo Viên AI
                </h3>
                <p className="text-[11px] text-indigo-700">
                  Tự động sinh đề kiểm tra & giáo án bám sát chương trình
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Thầy/Cô có thể tạo ngân hàng câu hỏi trắc nghiệm & tự luận theo ma trận đề thi chuẩn Bộ GD trong 30 giây.
            </p>

            <button
              onClick={onNavigateToLMS}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Mở Trình Tạo Đề Thi AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Teacher Contact Guidelines */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hỗ Trợ Học Vụ & Đổi Ca Dạy</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Nếu có nhu cầu đổi phòng học, xin dạy bù hoặc hỗ trợ thêm trợ giảng, vui lòng liên hệ trực tiếp:
            </p>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 font-semibold text-slate-700">
              Phòng Đào Tạo: <span className="text-indigo-600">0912.345.678 (Cô Hương)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Quick Grade Submission */}
      {quickGradingSubmissionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <span>Chấm Điểm & Phản Hồi Bài Nộp</span>
              </h3>
              <button
                onClick={() => setQuickGradingSubmissionId(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickGrade} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Điểm số (Thang điểm 10)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="10"
                  value={gradingScore}
                  onChange={(e) => setGradingScore(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-bold text-base text-center focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lời nhận xét / Lời khuyên của Giáo Viên
                </label>
                <textarea
                  rows={3}
                  value={gradingFeedback}
                  onChange={(e) => setGradingFeedback(e.target.value)}
                  placeholder="Nhận xét chi tiết về bài làm của học sinh..."
                  className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickGradingSubmissionId(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Lưu Điểm & Gửi Phản Hồi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Student Evaluation Note */}
      {quickNoteStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>Ghi Nhận Xét Học Tập</span>
              </h3>
              <button
                onClick={() => setQuickNoteStudentId(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Nhận xét này sẽ được lưu vào sổ học vụ và gửi thông báo trực tiếp đến sổ liên lạc điện tử của phụ huynh.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội dung nhận xét</label>
                <textarea
                  rows={4}
                  value={studentNoteText}
                  onChange={(e) => setStudentNoteText(e.target.value)}
                  placeholder="VD: Em tiếp thu bài nhanh, làm bài tập về nhà đầy đủ. Cần chú ý cẩn thận hơn ở các bước tính toán phân số..."
                  className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickNoteStudentId(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const st = students.find((s) => s.id === quickNoteStudentId);
                    if (st) handleSaveStudentNote(st);
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Lưu & Gửi Phụ Huynh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
