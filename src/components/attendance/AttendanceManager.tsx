import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AttendanceStatus } from '../../types';
import {
  ScanFace,
  Camera,
  Sparkles,
  Save,
  CheckCircle2,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AttendanceManagerProps {
  initialSessionId?: string;
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({ initialSessionId }) => {
  const { scheduleSessions, students, saveAttendance } = useApp();

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    initialSessionId || (scheduleSessions[0]?.id || '')
  );

  const selectedSession = scheduleSessions.find((s) => s.id === selectedSessionId) || scheduleSessions[0];

  // Get students in this grade or class
  const classStudents = students.filter(
    (st) => st.grade === (selectedSession?.grade || 8)
  );

  // Local attendance state
  const [attendanceMap, setAttendanceMap] = useState<{
    [studentId: string]: {
      status: AttendanceStatus;
      notes: string;
      checkInTime: string;
    };
  }>(() => {
    const map: any = {};
    classStudents.forEach((st) => {
      map[st.id] = {
        status: 'present' as AttendanceStatus,
        notes: '',
        checkInTime: '17:28',
      };
    });
    return map;
  });

  // Face AI Modal State
  const [isFaceAiOpen, setIsFaceAiOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedStudent, setDetectedStudent] = useState<string | null>(null);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { notes: '', checkInTime: '17:30' }),
        status,
      },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'present', checkInTime: '17:30' }),
        notes,
      },
    }));
  };

  const handleSaveAll = () => {
    if (!selectedSession) return;

    const records = classStudents.map((st) => {
      const record = attendanceMap[st.id] || { status: 'present', notes: '', checkInTime: '17:30' };
      return {
        studentId: st.id,
        studentName: st.fullName,
        date: selectedSession.date,
        status: record.status,
        checkInTime: record.checkInTime,
        homeworkDone: true,
        attitudeScore: 9,
        notes: record.notes,
      };
    });

    saveAttendance(selectedSession.id, records);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
    alert('Đã lưu điểm danh buổi học thành công!');
  };

  // Start Face AI scan simulation
  const handleStartFaceScan = () => {
    setIsScanning(true);
    setDetectedStudent(null);

    setTimeout(() => {
      if (classStudents.length > 0) {
        const randomStudent = classStudents[Math.floor(Math.random() * classStudents.length)];
        setDetectedStudent(randomStudent.fullName);
        handleStatusChange(randomStudent.id, 'present');
      }
      setIsScanning(false);
    }, 1800);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Đào Tạo</span>
            <span>/</span>
            <span className="text-slate-700">Điểm Danh & Chuyên Cần</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-1">
            <ScanFace className="w-6 h-6 text-emerald-600" />
            <span>ĐIỂM DANH LỚP HỌC & NHẬN DIỆN KHUÔN MẶT (FACE AI)</span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Ghi nhận chuyên cần, làm bài tập về nhà và tự động gửi thông báo đến Phụ huynh
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFaceAiOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Camera className="w-4 h-4 text-indigo-600" />
            <span>Quét Face AI</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Điểm Danh</span>
          </button>
        </div>
      </div>

      {/* Session Selector */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-600 font-medium text-xs mb-1">Chọn Ca Học Cần Điểm Danh</label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs lg:text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              {scheduleSessions.map((ses) => (
                <option key={ses.id} value={ses.id}>
                  {ses.className} ({ses.startTime} - {ses.endTime}, {ses.room})
                </option>
              ))}
            </select>
          </div>

          {selectedSession && (
            <>
              <div>
                <label className="block text-slate-600 font-medium text-xs mb-1">Giáo Viên & Trợ Giảng</label>
                <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  GV: <strong className="text-slate-900">{selectedSession.teacherName}</strong> • TG: <strong className="text-indigo-700 font-semibold">{selectedSession.tutorName || 'Chưa gán'}</strong>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium text-xs mb-1">Sĩ Số Lớp</label>
                <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-emerald-700">
                  {classStudents.length} học sinh (Khối {selectedSession.grade})
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Students Attendance List */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs lg:text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Học Sinh</th>
                <th className="px-4 py-3.5">Trạng Thái Điểm Danh</th>
                <th className="px-4 py-3.5">Giờ Đến</th>
                <th className="px-4 py-3.5">Đánh Giá & Nhận Xét Thái Độ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classStudents.map((student) => {
                const current = attendanceMap[student.id] || {
                  status: 'present',
                  notes: '',
                  checkInTime: '17:30',
                };
                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Student name & code */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{student.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {student.code} • {student.currentSchool}
                      </div>
                    </td>

                    {/* Status radio buttons */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          { id: 'present' as AttendanceStatus, label: 'Có mặt', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
                          { id: 'late' as AttendanceStatus, label: 'Đi muộn', color: 'bg-amber-50 text-amber-700 border-amber-300' },
                          { id: 'absent_excused' as AttendanceStatus, label: 'Phép', color: 'bg-blue-50 text-blue-700 border-blue-300' },
                          { id: 'absent_unexcused' as AttendanceStatus, label: 'K.Phép', color: 'bg-rose-50 text-rose-700 border-rose-300' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleStatusChange(student.id, opt.id)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                              current.status === opt.id
                                ? `${opt.color} shadow-2xs font-bold`
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* Check-in time */}
                    <td className="px-4 py-3.5">
                      <input
                        type="time"
                        value={current.checkInTime}
                        onChange={(e) =>
                          setAttendanceMap((prev) => ({
                            ...prev,
                            [student.id]: {
                              ...(prev[student.id] || { status: 'present', notes: '' }),
                              checkInTime: e.target.value,
                            },
                          }))
                        }
                        className="px-2 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-800 focus:border-indigo-500"
                      />
                    </td>

                    {/* Notes & Attitude */}
                    <td className="px-4 py-3.5">
                      <input
                        type="text"
                        value={current.notes}
                        onChange={(e) => handleNotesChange(student.id, e.target.value)}
                        placeholder="VD: Hăng hái phát biểu, làm bài tập đầy đủ..."
                        className="w-full px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Face AI Scanner Modal */}
      {isFaceAiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ScanFace className="w-5 h-5 text-indigo-600 animate-pulse" />
                <span className="font-bold text-slate-900 text-base">AN TÂM Face AI Check-in</span>
              </div>
              <button
                onClick={() => setIsFaceAiOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Live Camera Stream */}
            <div className="relative w-full aspect-video rounded-xl bg-slate-900 border border-slate-200 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent z-10" />

              {/* Scanning HUD grid */}
              <div className="absolute inset-4 border border-dashed border-indigo-400/50 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="w-24 h-24 border-2 border-emerald-400 rounded-lg animate-pulse" />
              </div>

              {isScanning && (
                <div className="absolute inset-0 bg-indigo-900/40 flex items-center justify-center z-20">
                  <div className="text-center space-y-2">
                    <Sparkles className="w-8 h-8 text-yellow-300 animate-spin mx-auto" />
                    <div className="text-xs font-bold text-white">Đang nhận diện khuôn mặt...</div>
                  </div>
                </div>
              )}

              {detectedStudent && (
                <div className="absolute bottom-4 left-4 right-4 z-20 p-2.5 rounded-lg bg-white/95 border border-emerald-500 text-emerald-800 text-xs flex items-center gap-2 shadow-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Nhận diện thành công: <strong>{detectedStudent}</strong> (Đã điểm danh Có mặt!)
                  </span>
                </div>
              )}

              <Camera className="w-12 h-12 text-slate-700" />
            </div>

            <div className="text-center">
              <button
                onClick={handleStartFaceScan}
                disabled={isScanning}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isScanning ? 'Đang phân tích...' : 'Bắt Đầu Quét Khuôn Mặt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
