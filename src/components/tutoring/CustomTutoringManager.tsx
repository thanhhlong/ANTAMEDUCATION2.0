import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ParentLead, CustomTutoringNeed } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { matchTutorForCustomRequest, TutorMatchResult } from '../../services/geminiService';
import {
  Sparkles,
  UserCheck,
  Calendar,
  BookOpen,
  Award,
  Zap,
  ArrowRight,
  CheckCircle2,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomTutoringManagerProps {
  initialLeadId?: string;
  onNavigateToTimetable: () => void;
}

export const CustomTutoringManager: React.FC<CustomTutoringManagerProps> = ({
  initialLeadId,
  onNavigateToTimetable,
}) => {
  const { leads, tutors, addScheduleSession, updateLeadStatus } = useApp();

  // Find leads that have custom tutoring requests or general tutoring needs
  const tutoringRequests = leads.filter((l) => l.customTutoring || l.interestedServices.some((s) => s.toLowerCase().includes('yêu cầu') || s.toLowerCase().includes('gia sư') || s.toLowerCase().includes('1-1')));

  const [selectedLead, setSelectedLead] = useState<ParentLead | null>(
    tutoringRequests.find((l) => l.id === initialLeadId) || tutoringRequests[0] || null
  );

  const [matchingResults, setMatchingResults] = useState<TutorMatchResult[]>([]);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [assignedTutorSuccess, setAssignedTutorSuccess] = useState<string | null>(null);

  const handleRunAIMatching = async (lead: ParentLead) => {
    setSelectedLead(lead);
    setLoadingMatch(true);
    setAssignedTutorSuccess(null);

    const need: CustomTutoringNeed = lead.customTutoring || {
      topic: `Bồi dưỡng môn ${lead.interestedSubjects.join(', ')}`,
      targetGoal: 'Củng cố kiến thức và nâng cao điểm số',
      preferredSchedule: lead.preferredSchedule,
      status: 'pending_match',
    };

    try {
      const results = await matchTutorForCustomRequest(
        need,
        lead.targetGrade,
        tutors
      );
      setMatchingResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMatch(false);
    }
  };

  const handleAssignTutor = (tutorResult: TutorMatchResult) => {
    if (!selectedLead) return;

    const chosenTutor = tutors.find((t) => t.id === tutorResult.tutorId);
    if (!chosenTutor) return;

    // Create a schedule session for this 1-on-1 tutoring
    addScheduleSession({
      classGroupId: `grp-tut-${Date.now()}`,
      className: `1-1: ${selectedLead.studentName} (${selectedLead.interestedSubjects[0] || 'Toán'})`,
      subjectId: 'sub-toan',
      subjectName: selectedLead.interestedSubjects[0] || 'Toán học',
      grade: selectedLead.targetGrade,
      teacherId: chosenTutor.id,
      teacherName: chosenTutor.fullName,
      tutorId: chosenTutor.id,
      tutorName: chosenTutor.fullName,
      room: 'Phòng VIP 102 (Gia sư 1-on-1)',
      dayOfWeek: 3,
      date: new Date().toISOString().split('T')[0],
      startTime: '19:30',
      endTime: '21:00',
      status: 'upcoming',
      notes: `Gia sư theo yêu cầu: ${selectedLead.customTutoring?.topic || 'Bồi dưỡng kiến thức'}`,
    });

    updateLeadStatus(selectedLead.id, 'enrolled', `Đã ghép gia sư ${chosenTutor.fullName} (${chosenTutor.university})`);

    setAssignedTutorSuccess(
      `Đã ghép thành công Trợ giảng ${chosenTutor.fullName} cho học sinh ${selectedLead.studentName}! Lịch dạy 1-on-1 đã được tự động thêm vào Thời khóa biểu.`
    );

    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Đào Tạo</span>
            <span>/</span>
            <span className="text-slate-700">AI Matching Gia Sư</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-1">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <span>HỌC TẬP THEO YÊU CẦU & AI MATCHING GIA SƯ</span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Thuật toán AI phân tích mục tiêu học sinh, kinh nghiệm gia sư & ma trận lịch rảnh
          </p>
        </div>

        <button
          onClick={onNavigateToTimetable}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Xem Thời Khóa Biểu</span>
        </button>
      </div>

      {assignedTutorSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs lg:text-sm flex items-start justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
            <span>{assignedTutorSuccess}</span>
          </div>
          <button
            onClick={() => setAssignedTutorSuccess(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left Request List & Right AI Matching Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 5 Cols - Tutoring Needs from Parents */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm lg:text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Yêu Cầu Từ Phụ Huynh ({tutoringRequests.length})</span>
            </h2>
          </div>

          <div className="space-y-3">
            {tutoringRequests.map((lead) => {
              const isSelected = selectedLead?.id === lead.id;
              return (
                <div
                  key={lead.id}
                  onClick={() => handleRunAIMatching(lead)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 shadow-xs ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-600 ring-1 ring-indigo-600'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{lead.studentName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                        Khối {lead.targetGrade}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-600">{lead.code}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="font-bold text-indigo-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{lead.customTutoring?.topic || `Bồi dưỡng ${lead.interestedSubjects.join(', ')}`}</span>
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      Mục tiêu: {lead.customTutoring?.targetGoal || 'Củng cố kiến thức mất gốc'}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Lịch rảnh mong muốn: {lead.preferredSchedule.join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">PH: {lead.parentName} ({lead.phone})</span>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-indigo-600 font-bold hover:text-indigo-800 text-xs"
                    >
                      <span>Ghép AI</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: 7 Cols - AI Tutor Matching Result */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm lg:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>AI Smart Match: Trợ Giảng & Gia Sư Phù Hợp Nhất</span>
                </h2>
                {selectedLead && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Đang phân tích ứng viên cho học sinh: <strong className="text-slate-800">{selectedLead.studentName}</strong> (Khối {selectedLead.targetGrade})
                  </p>
                )}
              </div>

              {selectedLead && (
                <button
                  onClick={() => handleRunAIMatching(selectedLead)}
                  disabled={loadingMatch}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{loadingMatch ? 'Đang ghép...' : 'Chạy lại AI'}</span>
                </button>
              )}
            </div>

            {loadingMatch ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="text-xs text-slate-600 font-medium">
                  Đang đối soát ma trận lịch rảnh, môn chuyên và đánh giá năng lực gia sư...
                </div>
              </div>
            ) : matchingResults.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Chọn một yêu cầu bên trái hoặc nhấn "Ghép AI" để xem danh sách gợi ý.
              </div>
            ) : (
              <div className="space-y-3">
                {matchingResults.map((tutorRes, idx) => {
                  const isTopMatch = idx === 0;
                  return (
                    <div
                      key={tutorRes.tutorId}
                      className={`p-4 rounded-xl border transition-all space-y-3 shadow-2xs ${
                        isTopMatch
                          ? 'bg-indigo-50/50 border-indigo-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                            {tutorRes.tutorName.split(' ').pop()?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{tutorRes.tutorName}</span>
                              {isTopMatch && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold flex items-center gap-1">
                                  <Award className="w-3 h-3 text-amber-600" />
                                  <span>Gợi ý tốt nhất</span>
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {tutorRes.university} • {formatCurrency(tutorRes.hourlyRate)}/giờ
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="text-right">
                            <div className="text-xs text-slate-500">Độ phù hợp:</div>
                            <div className="text-lg font-bold text-emerald-600">
                              {tutorRes.matchScore}%
                            </div>
                          </div>

                          <button
                            onClick={() => handleAssignTutor(tutorRes)}
                            className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Gán & Tạo Lịch</span>
                          </button>
                        </div>
                      </div>

                      {/* Strengths tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {tutorRes.strengths.map((str, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            ✓ {str}
                          </span>
                        ))}
                      </div>

                      {/* AI Recommendation Reason */}
                      <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed">
                        <strong className="text-indigo-700">Nhận xét từ AI:</strong> {tutorRes.recommendationReason}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
