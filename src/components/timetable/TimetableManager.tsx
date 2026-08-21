import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  Plus,
  Building,
  X,
  Trash2,
  ScanFace,
} from 'lucide-react';

interface TimetableManagerProps {
  onTakeAttendance: (sessionId: string) => void;
}

export const TimetableManager: React.FC<TimetableManagerProps> = ({ onTakeAttendance }) => {
  const {
    scheduleSessions,
    subjects,
    tutors,
    selectedGrade,
    addScheduleSession,
    deleteScheduleSession,
  } = useApp();

  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Session Form
  const [formData, setFormData] = useState({
    className: '8A1 - Chuyên Toán',
    subjectId: 'sub-toan',
    grade: 8,
    teacherName: 'Thầy Nguyễn Văn Nam',
    tutorName: 'Trần Phương Thảo',
    room: 'Phòng 201',
    dayOfWeek: 2,
    date: '2026-08-25',
    startTime: '17:30',
    endTime: '19:15',
    notes: 'Bài tập rút gọn biểu thức',
  });

  const days = [
    { dayNumber: 2, label: 'Thứ 2' },
    { dayNumber: 3, label: 'Thứ 3' },
    { dayNumber: 4, label: 'Thứ 4' },
    { dayNumber: 5, label: 'Thứ 5' },
    { dayNumber: 6, label: 'Thứ 6' },
    { dayNumber: 7, label: 'Thứ 7' },
    { dayNumber: 8, label: 'Chủ Nhật' },
  ];

  const filteredSessions = scheduleSessions.filter((s) => {
    if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false;
    if (selectedDay !== 'all' && s.dayOfWeek !== selectedDay) return false;
    if (selectedSubjectFilter !== 'all' && s.subjectId !== selectedSubjectFilter) return false;
    return true;
  });

  // Check clash
  const checkSessionClash = (day: number, start: string, end: string, room: string, teacher: string) => {
    const conflicting = scheduleSessions.filter((s) => {
      if (s.dayOfWeek !== day) return false;
      // Overlapping time check
      const overlap = !(end <= s.startTime || start >= s.endTime);
      if (!overlap) return false;

      const sameRoom = s.room.trim().toLowerCase() === room.trim().toLowerCase();
      const sameTeacher = s.teacherName.trim().toLowerCase() === teacher.trim().toLowerCase();
      return sameRoom || sameTeacher;
    });

    if (conflicting.length > 0) {
      const c = conflicting[0];
      const reason = c.room.toLowerCase() === room.toLowerCase() ? `trùng Phòng học (${room})` : `trùng Lịch giáo viên (${teacher})`;
      return `Cảnh báo xung đột: Ca học này ${reason} với lớp "${c.className}" (${c.startTime} - ${c.endTime}).`;
    }
    return null;
  };

  const handleOpenAdd = () => {
    setFormData({
      className: '8A1 - Toán Học',
      subjectId: 'sub-toan',
      grade: selectedGrade === 'all' ? 8 : selectedGrade,
      teacherName: 'Thầy Nguyễn Văn Nam',
      tutorName: 'Trần Phương Thảo',
      room: 'Phòng 201',
      dayOfWeek: 2,
      date: '2026-08-25',
      startTime: '17:30',
      endTime: '19:15',
      notes: '',
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
      classGroupId: `grp-${Date.now()}`,
      className: formData.className,
      subjectId: sub.id,
      subjectName: sub.name,
      grade: formData.grade,
      teacherId: 'tch-1',
      teacherName: formData.teacherName,
      tutorName: formData.tutorName,
      room: formData.room,
      dayOfWeek: formData.dayOfWeek,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      status: 'upcoming',
      notes: formData.notes,
    });

    setIsAddModalOpen(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Đào Tạo</span>
            <span>/</span>
            <span className="text-slate-700">Thời Khóa Biểu</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-1">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <span>THỜI KHÓA BIỂU & CHỐNG TRÙNG LỊCH HỌC</span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Lịch học hàng tuần, tự động phát hiện xung đột phòng học & giáo viên/trợ giảng
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs lg:text-sm font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thêm Ca Học Mới</span>
        </button>
      </div>

      {/* Filter & Day Selector */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        {/* Day Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setSelectedDay('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                selectedDay === 'all'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cả Tuần
            </button>
            {days.map((d) => (
              <button
                key={d.dayNumber}
                onClick={() => setSelectedDay(d.dayNumber)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  selectedDay === d.dayNumber
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tất cả môn học</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timetable Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSessions.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            Không có ca học nào trong ngày hoặc bộ lọc đã chọn.
          </div>
        ) : (
          filteredSessions.map((session) => {
            const dayObj = days.find((d) => d.dayNumber === session.dayOfWeek);
            const sub = subjects.find((s) => s.id === session.subjectId);
            return (
              <div
                key={session.id}
                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all space-y-3.5 shadow-xs relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: sub?.color || '#4F46E5' }}
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {dayObj?.label || 'Thứ 2'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{session.startTime} - {session.endTime}</span>
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{session.className}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                    <span className="font-semibold text-indigo-600">Khối {session.grade}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Building className="w-3 h-3 text-slate-400" />
                      {session.room}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-700">
                  <div><strong>Giáo viên:</strong> <span className="text-slate-900">{session.teacherName}</span></div>
                  <div><strong>Trợ giảng:</strong> <span className="text-indigo-700 font-semibold">{session.tutorName || 'Chưa gán'}</span></div>
                  {session.notes && <div className="text-slate-500 italic text-[11px] truncate">Ghi chú: {session.notes}</div>}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onTakeAttendance(session.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors text-xs font-semibold cursor-pointer"
                  >
                    <ScanFace className="w-3.5 h-3.5" />
                    <span>Điểm Danh Ca Này</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Xóa ca học ${session.className}?`)) {
                        deleteScheduleSession(session.id);
                      }
                    }}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Session Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Thêm Ca Học Vào Thời Khóa Biểu</span>
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
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
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Môn Học</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Thứ Trong Tuần</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  >
                    {days.map((d) => (
                      <option key={d.dayNumber} value={d.dayNumber}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Giờ Bắt Đầu</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Giờ Kết Thúc</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Phòng Học *</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="VD: Phòng 201"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Giáo Viên Giảng Dạy</label>
                  <input
                    type="text"
                    value={formData.teacherName}
                    onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                    placeholder="VD: Thầy Nguyễn Văn Nam"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Trợ Giảng Phụ Trách</label>
                <select
                  value={formData.tutorName}
                  onChange={(e) => setFormData({ ...formData, tutorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                >
                  <option value="">Chưa gán trợ giảng</option>
                  {tutors.map((t) => (
                    <option key={t.id} value={t.fullName}>
                      {t.fullName} ({t.university})
                    </option>
                  ))}
                </select>
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
