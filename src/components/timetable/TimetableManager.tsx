import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  Plus,
  Building,
  X,
  Trash2,
  ScanFace,
  Printer,
  Share2,
  CheckCircle2,
  AlertCircle,
  Filter,
  Grid,
  Table as TableIcon,
  Layers,
  Sparkles,
  Users,
  Search,
  BookOpen,
  MapPin,
  RefreshCw,
  Copy,
  Info,
} from 'lucide-react';
import { ScheduleSession } from '../../types';
import { INITIAL_SCHEDULE_SESSIONS } from '../../data/initialData';

interface TimetableManagerProps {
  onTakeAttendance: (sessionId: string) => void;
}

type ViewMode = 'matrix' | 'grade_tabs' | 'cards';

interface SlotCellData {
  session?: ScheduleSession;
  subjectName?: string;
  room?: string;
  icon?: string;
  colorClass?: string;
  grade: number;
}

export const TimetableManager: React.FC<TimetableManagerProps> = ({ onTakeAttendance }) => {
  const {
    scheduleSessions,
    subjects,
    tutors,
    students,
    classes,
    selectedGrade,
    setSelectedGrade,
    addScheduleSession,
    deleteScheduleSession,
  } = useApp();

  const [viewMode, setViewMode] = useState<ViewMode>('matrix');
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selected session for detail modal / drawer
  const [activeSessionDetail, setActiveSessionDetail] = useState<ScheduleSession | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Add Session Form
  const [formData, setFormData] = useState({
    className: '8A1 - Chuyên Toán',
    subjectId: 'sub-toan',
    grade: 8,
    teacherName: 'Thầy Trần Quốc Toàn',
    tutorName: 'Nguyễn Thùy Linh',
    room: 'Phòng 3',
    dayOfWeek: 2,
    date: '2026-08-24',
    shift: 3,
    startTime: '17:30',
    endTime: '19:00',
    topic: '',
  });

  const days = [
    { dayNumber: 2, label: 'Thứ 2', shortLabel: 'T2' },
    { dayNumber: 3, label: 'Thứ 3', shortLabel: 'T3' },
    { dayNumber: 4, label: 'Thứ 4', shortLabel: 'T4' },
    { dayNumber: 5, label: 'Thứ 5', shortLabel: 'T5' },
    { dayNumber: 6, label: 'Thứ 6', shortLabel: 'T6' },
    { dayNumber: 7, label: 'Thứ 7', shortLabel: 'T7' },
  ];

  const shifts = [
    { shiftNumber: 1, time: '13:30 - 15:00', start: '13:30', end: '15:00', label: 'Ca 1' },
    { shiftNumber: 2, time: '15:30 - 17:00', start: '15:30', end: '17:00', label: 'Ca 2' },
    { shiftNumber: 3, time: '17:30 - 19:00', start: '17:30', end: '19:00', label: 'Ca 3' },
  ];

  const grades = [6, 7, 8, 9];

  // Helper to get subject display details & icon
  const getSubjectBadge = (session?: ScheduleSession) => {
    if (!session) return null;
    const name = session.topic || session.subjectName;
    const lower = (session.subjectName + ' ' + (session.topic || '')).toLowerCase();

    if (lower.includes('toán') || lower.includes('toan')) {
      return {
        label: 'TOÁN',
        icon: '🧮',
        bg: 'bg-blue-600 text-white',
        border: 'border-blue-700',
        roomBg: 'bg-blue-50 text-blue-800 border-blue-200',
      };
    }
    if (lower.includes('văn') || lower.includes('van')) {
      return {
        label: 'VĂN',
        icon: '📖',
        bg: 'bg-pink-600 text-white',
        border: 'border-pink-700',
        roomBg: 'bg-pink-50 text-pink-800 border-pink-200',
      };
    }
    if (lower.includes('anh')) {
      return {
        label: 'ANH',
        icon: '🎧',
        bg: 'bg-emerald-600 text-white',
        border: 'border-emerald-700',
        roomBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    }
    if (lower.includes('lý') || lower.includes('ly')) {
      return {
        label: 'KHTN (LÝ)',
        icon: '⚖',
        bg: 'bg-amber-600 text-white',
        border: 'border-amber-700',
        roomBg: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    }
    if (lower.includes('hóa') || lower.includes('hoa')) {
      return {
        label: 'KHTN (HÓA)',
        icon: '⚛',
        bg: 'bg-cyan-700 text-white',
        border: 'border-cyan-800',
        roomBg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      };
    }
    if (lower.includes('khtn')) {
      return {
        label: 'KHTN',
        icon: '⚖',
        bg: 'bg-amber-600 text-white',
        border: 'border-amber-700',
        roomBg: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    }
    return {
      label: session.subjectName,
      icon: '📚',
      bg: 'bg-slate-700 text-white',
      border: 'border-slate-800',
      roomBg: 'bg-slate-50 text-slate-800 border-slate-200',
    };
  };

  // Filtered sessions for Card view
  const filteredSessions = useMemo(() => {
    return scheduleSessions.filter((s) => {
      if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false;
      if (selectedDay !== 'all' && s.dayOfWeek !== selectedDay) return false;
      if (selectedSubjectFilter !== 'all' && s.subjectId !== selectedSubjectFilter) return false;
      if (selectedRoomFilter !== 'all' && !s.room.toLowerCase().includes(selectedRoomFilter.toLowerCase())) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          s.className.toLowerCase().includes(q) ||
          s.teacherName.toLowerCase().includes(q) ||
          (s.tutorName && s.tutorName.toLowerCase().includes(q)) ||
          s.room.toLowerCase().includes(q) ||
          s.topic.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [scheduleSessions, selectedGrade, selectedDay, selectedSubjectFilter, selectedRoomFilter, searchQuery]);

  // Matrix lookup: (dayOfWeek, shiftNumber, grade) -> ScheduleSession
  const getSessionForSlot = (dayNumber: number, shiftNumber: number, grade: number) => {
    return scheduleSessions.find((s) => s.dayOfWeek === dayNumber && s.shift === shiftNumber && s.grade === grade);
  };

  // Clash detector
  const checkSessionClash = (day: number, start: string, end: string, room: string, teacher: string) => {
    const conflicting = scheduleSessions.filter((s) => {
      if (s.dayOfWeek !== day) return false;
      const overlap = !(end <= s.startTime || start >= s.endTime);
      if (!overlap) return false;

      const sameRoom = s.room.trim().toLowerCase() === room.trim().toLowerCase();
      const sameTeacher = s.teacherName.trim().toLowerCase() === teacher.trim().toLowerCase();
      return sameRoom || sameTeacher;
    });

    if (conflicting.length > 0) {
      const c = conflicting[0];
      const reason =
        c.room.toLowerCase() === room.toLowerCase()
          ? `trùng Phòng học (${room})`
          : `trùng Giáo viên (${teacher})`;
      return `Cảnh báo xung đột: Ca học này ${reason} với lớp "${c.className}" (${c.startTime} - ${c.endTime}).`;
    }
    return null;
  };

  const handleOpenAdd = () => {
    setFormData({
      className: '8A1 - Chuyên Toán',
      subjectId: 'sub-toan',
      grade: selectedGrade === 'all' ? 8 : selectedGrade,
      teacherName: 'Thầy Trần Quốc Toàn',
      tutorName: 'Nguyễn Thùy Linh',
      room: 'Phòng 3',
      dayOfWeek: 2,
      date: '2026-08-24',
      shift: 3,
      startTime: '17:30',
      endTime: '19:00',
      topic: '',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    const clash = checkSessionClash(
      formData.dayOfWeek,
      formData.startTime,
      formData.endTime,
      formData.room,
      formData.teacherName
    );

    if (clash) {
      if (!confirm(`${clash}\n\nBạn có muốn bỏ qua cảnh báo và tiếp tục lưu ca học?`)) {
        return;
      }
    }

    const sub = subjects.find((s) => s.id === formData.subjectId) || subjects[0];

    addScheduleSession({
      classId: `cls-${formData.subjectId}-${formData.grade}`,
      className: formData.className,
      subjectId: sub.id,
      subjectName: sub.name,
      grade: formData.grade,
      teacherId: 'tch-manual',
      teacherName: formData.teacherName,
      tutorId: 'tut-manual',
      tutorName: formData.tutorName,
      room: formData.room,
      date: formData.date,
      dayOfWeek: formData.dayOfWeek,
      shift: formData.shift,
      startTime: formData.startTime,
      endTime: formData.endTime,
      topic: formData.topic || `${sub.name} Khối ${formData.grade}`,
      status: 'scheduled',
    });

    setIsAddModalOpen(false);
  };

  // Copy Zalo schedule summary
  const handleCopyZaloSchedule = () => {
    let text = `📅 THỜI KHÓA BIỂU AN TÂM EDUCATION\n"Học đúng – Hiểu sâu – Làm giỏi"\n----------------------------------------\n`;
    days.forEach((d) => {
      const daySessions = scheduleSessions.filter((s) => s.dayOfWeek === d.dayNumber);
      if (daySessions.length > 0) {
        text += `\n📍 ${d.label.toUpperCase()}:\n`;
        daySessions.forEach((s) => {
          text += `  • Ca ${s.shift} (${s.startTime}-${s.endTime}): Lớp ${s.grade} - ${s.className} (${s.room}) | GV: ${s.teacherName}\n`;
        });
      }
    });
    text += `\n----------------------------------------\n📞 Hotline & CSKH: 0901 234 567 | An Tâm Education`;
    navigator.clipboard.writeText(text);
    setCopySuccess('Đã sao chép toàn bộ thời khóa biểu để gửi Zalo!');
    setTimeout(() => setCopySuccess(null), 4000);
  };

  // Copy single session
  const handleCopySingleSession = (s: ScheduleSession) => {
    const dayObj = days.find((d) => d.dayNumber === s.dayOfWeek);
    const text = `🔔 THÔNG BÁO CA HỌC - AN TÂM EDUCATION\nLớp: ${s.className} (Khối ${s.grade})\nThời gian: ${dayObj?.label}, Ca ${s.shift} (${s.startTime} - ${s.endTime})\nPhòng học: ${s.room}\nGiáo viên: ${s.teacherName}\nTrợ giảng: ${s.tutorName || 'Ban trợ giảng An Tâm'}\nChuyên đề: ${s.topic || 'Học theo lộ trình chuyên môn'}\nKính chúc các em học tập hiệu quả!`;
    navigator.clipboard.writeText(text);
    setCopySuccess(`Đã sao chép lịch ${s.className} gửi phụ huynh!`);
    setTimeout(() => setCopySuccess(null), 3000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Official An Tam Header Banner */}
      <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chương Trình Đào Tạo Chuẩn An Tâm</span>
            </div>
            
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Calendar className="w-7 h-7 text-emerald-400" />
              <span>THỜI KHÓA BIỂU AN TÂM EDUCATION</span>
            </h1>
            
            <p className="text-sm font-semibold text-emerald-200">
              LỚP TOÁN – VĂN – ANH – KHTN – VẬT LÍ – HÓA
            </p>
            
            <p className="text-xs text-slate-300 italic flex items-center gap-1.5 pt-0.5">
              <span>Phương châm đào tạo:</span>
              <strong className="text-emerald-300 not-italic font-bold">Học đúng – Hiểu sâu – Làm giỏi</strong>
              <span>❤️</span>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
              title="In hoặc lưu file PDF"
            >
              <Printer className="w-4 h-4 text-emerald-300" />
              <span>In / Lưu PDF</span>
            </button>

            <button
              onClick={handleCopyZaloSchedule}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Sao Chép Gửi Zalo</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Ca Học</span>
            </button>
          </div>
        </div>
      </div>

      {/* Copy Alert Toast */}
      {copySuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{copySuccess}</span>
          </div>
          <button onClick={() => setCopySuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* View Switcher & Controls Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* View Modes */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Bảng Tổng Thể (Chuẩn An Tâm)</span>
            </button>

            <button
              onClick={() => setViewMode('grade_tabs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grade_tabs'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Theo Từng Khối (6, 7, 8, 9)</span>
            </button>

            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Thẻ Chi Tiết & Chống Trùng</span>
            </button>
          </div>

          {/* Quick Grade Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-xs font-bold text-slate-500 shrink-0">Lọc Khối:</span>
            <button
              onClick={() => setSelectedGrade('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                selectedGrade === 'all'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất Cả Khối
            </button>
            {grades.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  selectedGrade === g
                    ? 'bg-emerald-700 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Khối {g}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters for Day, Subject & Room */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Day filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Thứ:</span>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-emerald-600 font-medium"
            >
              <option value="all">Cả tuần (T2 - T7)</option>
              {days.map((d) => (
                <option key={d.dayNumber} value={d.dayNumber}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subject filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Môn:</span>
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-emerald-600 font-medium"
            >
              <option value="all">Tất cả môn học</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Room filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Phòng:</span>
            <select
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-emerald-600 font-medium"
            >
              <option value="all">Tất cả các phòng</option>
              <option value="Phòng 1">Phòng 1</option>
              <option value="Phòng 2">Phòng 2</option>
              <option value="Phòng 3">Phòng 3</option>
              <option value="Phòng 4">Phòng 4</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo giáo viên, phòng học, bài học..."
              className="w-full pl-8 pr-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 text-xs"
            />
          </div>

          {/* Conflict status indicator */}
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>0 Xung Đột Phòng/GV</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: MATRIX VIEW (The Official An Tam Timetable Table) */}
      {/* ========================================================================= */}
      {viewMode === 'matrix' && (
        <div className="p-4 lg:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-emerald-700" />
                <span>BẢNG THỜI KHÓA BIỂU TOÀN TRUNG TÂM</span>
              </h2>
              <p className="text-xs text-slate-500">
                Nhấp vào bất kỳ ô ca học nào để xem chi tiết giáo viên, trợ giảng, phòng học & điểm danh.
              </p>
            </div>

            <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
              Tổng số ca: <strong className="text-emerald-700">{scheduleSessions.length} ca học</strong>
            </div>
          </div>

          {/* Table Matrix */}
          <div className="overflow-x-auto rounded-xl border border-slate-300 shadow-2xs">
            <table className="w-full border-collapse text-center text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-300">
                  <th
                    rowSpan={2}
                    className="p-3 bg-slate-800 text-white font-black uppercase text-xs tracking-wider border-r border-slate-700 min-w-[70px]"
                  >
                    THỨ
                  </th>
                  <th
                    rowSpan={2}
                    className="p-3 bg-slate-800 text-white font-black uppercase text-xs tracking-wider border-r border-slate-700 min-w-[60px]"
                  >
                    CA
                  </th>
                  <th
                    rowSpan={2}
                    className="p-3 bg-slate-800 text-white font-black uppercase text-xs tracking-wider border-r border-slate-700 min-w-[110px]"
                  >
                    THỜI GIAN
                  </th>

                  {/* Lớp 6 Header */}
                  <th
                    colSpan={2}
                    className="p-2.5 bg-[#2d7738] text-white font-black uppercase tracking-wider text-xs border-r border-emerald-800"
                  >
                    LỚP 6
                  </th>

                  {/* Lớp 7 Header */}
                  <th
                    colSpan={2}
                    className="p-2.5 bg-[#1c5d99] text-white font-black uppercase tracking-wider text-xs border-r border-blue-900"
                  >
                    LỚP 7
                  </th>

                  {/* Lớp 8 Header */}
                  <th
                    colSpan={2}
                    className="p-2.5 bg-[#6b2d5c] text-white font-black uppercase tracking-wider text-xs border-r border-purple-950"
                  >
                    LỚP 8
                  </th>

                  {/* Lớp 9 Header */}
                  <th
                    colSpan={2}
                    className="p-2.5 bg-[#a31d24] text-white font-black uppercase tracking-wider text-xs"
                  >
                    LỚP 9
                  </th>
                </tr>

                {/* Sub-headers for Môn & Phòng */}
                <tr className="border-b border-slate-300 text-[11px] font-bold text-slate-700">
                  {/* Lớp 6 sub */}
                  <th className="p-1.5 bg-emerald-100/70 border-r border-slate-200">Môn Học</th>
                  <th className="p-1.5 bg-emerald-100/70 border-r border-emerald-300 min-w-[65px]">Phòng</th>

                  {/* Lớp 7 sub */}
                  <th className="p-1.5 bg-blue-100/70 border-r border-slate-200">Môn Học</th>
                  <th className="p-1.5 bg-blue-100/70 border-r border-blue-300 min-w-[65px]">Phòng</th>

                  {/* Lớp 8 sub */}
                  <th className="p-1.5 bg-purple-100/70 border-r border-slate-200">Môn Học</th>
                  <th className="p-1.5 bg-purple-100/70 border-r border-purple-300 min-w-[65px]">Phòng</th>

                  {/* Lớp 9 sub */}
                  <th className="p-1.5 bg-rose-100/70 border-r border-slate-200">Môn Học</th>
                  <th className="p-1.5 bg-rose-100/70 min-w-[65px]">Phòng</th>
                </tr>
              </thead>

              <tbody>
                {days
                  .filter((d) => selectedDay === 'all' || selectedDay === d.dayNumber)
                  .map((day) => {
                    return shifts.map((shift, shiftIndex) => {
                      const isFirstShiftOfDay = shiftIndex === 0;

                      return (
                        <tr
                          key={`${day.dayNumber}-${shift.shiftNumber}`}
                          className={`hover:bg-slate-50/80 transition-colors border-b ${
                            shiftIndex === shifts.length - 1 ? 'border-b-2 border-b-slate-400' : 'border-slate-200'
                          }`}
                        >
                          {/* Day column: spans all 3 shifts */}
                          {isFirstShiftOfDay && (
                            <td
                              rowSpan={3}
                              className="p-2 bg-slate-100 font-black text-slate-900 border-r border-slate-300 text-center uppercase tracking-wide text-xs"
                            >
                              <div className="py-2">
                                <div>{day.label}</div>
                              </div>
                            </td>
                          )}

                          {/* Shift Label */}
                          <td className="p-2 font-bold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                            {shift.label}
                          </td>

                          {/* Time */}
                          <td className="p-2 font-mono text-[11px] font-semibold text-slate-600 border-r border-slate-300 whitespace-nowrap bg-slate-50/50">
                            {shift.time}
                          </td>

                          {/* Grades 6, 7, 8, 9 slots */}
                          {grades.map((grade, gIndex) => {
                            const session = getSessionForSlot(day.dayNumber, shift.shiftNumber, grade);
                            const badge = getSubjectBadge(session);
                            const isGradeRightBorder = gIndex < grades.length - 1;

                            if (!session) {
                              return (
                                <React.Fragment key={`${grade}-${day.dayNumber}-${shift.shiftNumber}`}>
                                  <td className="p-2 border-r border-slate-200 text-slate-300 text-center font-bold">
                                    -
                                  </td>
                                  <td
                                    className={`p-2 text-slate-300 text-center ${
                                      isGradeRightBorder ? 'border-r border-slate-300' : ''
                                    }`}
                                  >
                                    -
                                  </td>
                                </React.Fragment>
                              );
                            }

                            return (
                              <React.Fragment key={`${grade}-${day.dayNumber}-${shift.shiftNumber}`}>
                                {/* Subject Slot */}
                                <td
                                  onClick={() => setActiveSessionDetail(session)}
                                  className="p-1.5 border-r border-slate-200 cursor-pointer hover:opacity-90 transition-all text-center"
                                >
                                  <div
                                    className={`py-1.5 px-2 rounded-lg font-black text-xs shadow-2xs flex items-center justify-center gap-1 ${
                                      badge?.bg || 'bg-slate-700 text-white'
                                    }`}
                                    title={`${session.className} - GV: ${session.teacherName}`}
                                  >
                                    <span>{badge?.icon}</span>
                                    <span>{badge?.label}</span>
                                  </div>
                                </td>

                                {/* Room Slot */}
                                <td
                                  onClick={() => setActiveSessionDetail(session)}
                                  className={`p-1.5 cursor-pointer hover:opacity-90 transition-all text-center ${
                                    isGradeRightBorder ? 'border-r border-slate-300' : ''
                                  }`}
                                >
                                  <span
                                    className={`inline-block py-1 px-1.5 rounded-md font-bold text-[11px] border whitespace-nowrap ${
                                      badge?.roomBg || 'bg-slate-100 text-slate-800 border-slate-200'
                                    }`}
                                  >
                                    {session.room}
                                  </span>
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      );
                    });
                  })}
              </tbody>
            </table>
          </div>

          {/* Quick Legend Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-600">Chú thích môn:</span>
              <span className="inline-flex items-center gap-1 font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                <span>🧮</span> TOÁN
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-pink-800 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                <span>📖</span> NGỮ VĂN
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span>🎧</span> TIẾNG ANH
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <span>⚖</span> KHTN (LÝ)
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                <span>⚛</span> KHTN (HÓA)
              </span>
            </div>

            <div className="text-[11px] text-slate-400 italic">
              * Nhấp vào môn học để xem thông tin giáo viên, trợ giảng & điểm danh.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: GRADE TABS VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'grade_tabs' && (
        <div className="space-y-6">
          {grades
            .filter((g) => selectedGrade === 'all' || selectedGrade === g)
            .map((grade) => {
              const gradeSessions = scheduleSessions.filter((s) => s.grade === grade);
              const headerColor =
                grade === 6
                  ? 'from-emerald-700 to-emerald-900 border-emerald-600'
                  : grade === 7
                  ? 'from-blue-700 to-blue-900 border-blue-600'
                  : grade === 8
                  ? 'from-purple-700 to-purple-900 border-purple-600'
                  : 'from-rose-700 to-rose-900 border-rose-600';

              return (
                <div
                  key={grade}
                  className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden"
                >
                  {/* Grade Banner */}
                  <div className={`p-4 bg-linear-to-r ${headerColor} text-white flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-lg">
                        K{grade}
                      </div>
                      <div>
                        <h3 className="font-bold text-base">THỜI KHÓA BIỂU KHỐI {grade}</h3>
                        <p className="text-xs text-white/80">Lộ trình học tập chuẩn & các chuyên đề trọng điểm</p>
                      </div>
                    </div>
                    <div className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-lg backdrop-blur-xs">
                      {gradeSessions.length} buổi/tuần
                    </div>
                  </div>

                  {/* Sessions Grid for this grade */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {gradeSessions.map((session) => {
                      const dayObj = days.find((d) => d.dayNumber === session.dayOfWeek);
                      const badge = getSubjectBadge(session);

                      return (
                        <div
                          key={session.id}
                          onClick={() => setActiveSessionDetail(session)}
                          className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all cursor-pointer space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 shadow-2xs">
                              {dayObj?.label} • Ca {session.shift}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-600 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {session.startTime} - {session.endTime}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div
                              className={`py-1 px-2.5 rounded-md font-black text-xs ${
                                badge?.bg || 'bg-slate-800 text-white'
                              }`}
                            >
                              {badge?.icon} {badge?.label}
                            </div>
                            <span className="text-xs font-bold text-slate-900">{session.className}</span>
                          </div>

                          <div className="text-xs text-slate-600 space-y-1 bg-white p-2.5 rounded-lg border border-slate-200/70">
                            <div className="flex items-center justify-between">
                              <span><strong>Phòng:</strong> {session.room}</span>
                              <span><strong>GV:</strong> {session.teacherName}</span>
                            </div>
                            <div className="text-indigo-700">
                              <strong>Trợ giảng:</strong> {session.tutorName || 'Chưa gán'}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-xs">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTakeAttendance(session.id);
                              }}
                              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                            >
                              <ScanFace className="w-3.5 h-3.5" />
                              Điểm danh
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopySingleSession(session);
                              }}
                              className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Gửi Zalo
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: DETAILED CARDS & CONFLICT MANAGEMENT */}
      {/* ========================================================================= */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                Không tìm thấy ca học nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              filteredSessions.map((session) => {
                const dayObj = days.find((d) => d.dayNumber === session.dayOfWeek);
                const sub = subjects.find((s) => s.id === session.subjectId);
                const badge = getSubjectBadge(session);

                return (
                  <div
                    key={session.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all space-y-3.5 shadow-xs relative overflow-hidden flex flex-col justify-between"
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: sub?.color || '#059669' }}
                    />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {dayObj?.label} • Ca {session.shift}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {session.startTime} - {session.endTime}
                          </span>
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`py-0.5 px-2 rounded font-black text-xs ${
                              badge?.bg || 'bg-slate-800 text-white'
                            }`}
                          >
                            {badge?.icon} {badge?.label}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm truncate">{session.className}</h3>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-1.5">
                          <span className="font-semibold text-emerald-700">Khối {session.grade}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Building className="w-3 h-3 text-slate-400" />
                            {session.room}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5 text-slate-700">
                        <div>
                          <strong>Giáo viên:</strong> <span className="text-slate-900 font-semibold">{session.teacherName}</span>
                        </div>
                        <div>
                          <strong>Trợ giảng:</strong>{' '}
                          <span className="text-indigo-700 font-semibold">{session.tutorName || 'Chưa gán'}</span>
                        </div>
                        {session.topic && (
                          <div className="text-slate-500 text-[11px] line-clamp-2 pt-1 border-t border-slate-200/60">
                            <strong>Chuyên đề:</strong> {session.topic}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onTakeAttendance(session.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors text-xs font-semibold cursor-pointer"
                        >
                          <ScanFace className="w-3.5 h-3.5" />
                          <span>Điểm Danh</span>
                        </button>

                        <button
                          onClick={() => handleCopySingleSession(session)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Sao chép gửi Zalo"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Xóa ca học ${session.className}?`)) {
                            deleteScheduleSession(session.id);
                          }
                        }}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xóa ca học"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SESSION DETAIL MODAL / DRAWER */}
      {/* ========================================================================= */}
      {activeSessionDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 animate-in fade-in">
            {/* Modal Header */}
            <div className="p-5 bg-linear-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
                  {getSubjectBadge(activeSessionDetail)?.icon}
                </div>
                <div>
                  <h3 className="font-bold text-base">{activeSessionDetail.className}</h3>
                  <p className="text-xs text-emerald-200">
                    Khối {activeSessionDetail.grade} • {activeSessionDetail.room}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveSessionDetail(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs lg:text-sm text-slate-800">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-xs">Thứ & Ca học</span>
                  <strong className="text-slate-900">
                    {days.find((d) => d.dayNumber === activeSessionDetail.dayOfWeek)?.label} (Ca{' '}
                    {activeSessionDetail.shift})
                  </strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">Thời gian</span>
                  <strong className="text-slate-900 font-mono">
                    {activeSessionDetail.startTime} - {activeSessionDetail.endTime}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">Giáo viên phụ trách</span>
                  <strong className="text-slate-900">{activeSessionDetail.teacherName}</strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">Trợ giảng đồng hành</span>
                  <strong className="text-indigo-700">{activeSessionDetail.tutorName || 'Chưa gán'}</strong>
                </div>
              </div>

              {/* Topic / Syllabus */}
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/70 space-y-1">
                <span className="text-emerald-800 font-bold text-xs uppercase flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Nội dung / Chuyên đề giảng dạy</span>
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {activeSessionDetail.topic || 'Giảng dạy theo đề cương chương trình chuẩn An Tâm Education.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleCopySingleSession(activeSessionDetail)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao Chép Gửi Zalo</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const id = activeSessionDetail.id;
                      setActiveSessionDetail(null);
                      onTakeAttendance(id);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <ScanFace className="w-4 h-4" />
                    <span>Vào Điểm Danh Ca Này</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD SESSION MODAL */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Thêm Ca Học Mới Vào Thời Khóa Biểu</span>
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="space-y-3 text-xs lg:text-sm">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Tên Lớp / Ca Học *</label>
                <input
                  type="text"
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  placeholder="VD: 8A1 - Chuyên Toán"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Môn Học</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-emerald-600 focus:outline-none"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Khối Lớp</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-emerald-600 focus:outline-none"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>
                        Khối {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Thứ Trong Tuần</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-emerald-600 focus:outline-none"
                  >
                    {days.map((d) => (
                      <option key={d.dayNumber} value={d.dayNumber}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Ca Học</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => {
                      const sh = Number(e.target.value);
                      const shiftObj = shifts.find((s) => s.shiftNumber === sh);
                      setFormData({
                        ...formData,
                        shift: sh,
                        startTime: shiftObj?.start || formData.startTime,
                        endTime: shiftObj?.end || formData.endTime,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value={1}>Ca 1 (13:30 - 15:00)</option>
                    <option value={2}>Ca 2 (15:30 - 17:00)</option>
                    <option value={3}>Ca 3 (17:30 - 19:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Phòng Học *</label>
                  <select
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Phòng 1">Phòng 1</option>
                    <option value="Phòng 2">Phòng 2</option>
                    <option value="Phòng 3">Phòng 3</option>
                    <option value="Phòng 4">Phòng 4</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Giáo Viên Giảng Dạy *</label>
                  <input
                    type="text"
                    value={formData.teacherName}
                    onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                    placeholder="VD: Thầy Trần Quốc Toàn"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Trợ Giảng Đồng Hành</label>
                  <select
                    value={formData.tutorName}
                    onChange={(e) => setFormData({ ...formData, tutorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="">Chưa gán trợ giảng</option>
                    {tutors.map((t) => (
                      <option key={t.id} value={t.fullName}>
                        {t.fullName} ({t.university})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Chuyên Đề Giảng Dạy</label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="VD: Đại số - Phân tích đa thức thành nhân tử"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Lưu Ca Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
