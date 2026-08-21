import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LMSLesson, LMSAssignment } from '../../types';
import {
  BookOpenCheck,
  FileText,
  CheckCircle2,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LMSManager: React.FC = () => {
  const {
    lessons,
    assignments,
    students,
    subjects,
    submitAssignmentAnswers,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'lessons' | 'assignments'>('assignments');
  const [selectedLesson, setSelectedLesson] = useState<LMSLesson | null>(lessons[0] || null);
  const [selectedAssignment, setSelectedAssignment] = useState<LMSAssignment | null>(assignments[0] || null);

  // Quiz Taking state
  const [studentAnswers, setStudentAnswers] = useState<{ [qId: string]: number }>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const handleSubmitQuiz = () => {
    if (!selectedAssignment) return;

    const answerPayload = Object.entries(studentAnswers).map(([qId, optionIdx]) => ({
      questionId: qId,
      selectedOption: optionIdx,
    }));

    submitAssignmentAnswers(
      selectedAssignment.id,
      students[0]?.id || 'st-default',
      students[0]?.fullName || 'Học sinh kiểm tra',
      answerPayload
    );

    let score = 0;
    selectedAssignment.questions.forEach((q) => {
      if (studentAnswers[q.id] === q.correctOptionIndex) {
        score += q.points;
      }
    });

    setQuizScore(score);
    setQuizFinished(true);

    if (score >= 7) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Học Tập</span>
            <span>/</span>
            <span className="text-slate-700">LMS & Học Liệu</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-1">
            <BookOpenCheck className="w-6 h-6 text-indigo-600" />
            <span>LMS BÀI GIẢNG & BÀI TẬP TỰ ĐỘNG CHẤM ĐIỂM</span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Học liệu số hóa, kho bài tập phong phú và tự động chấm điểm chính xác
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'assignments' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Bài Tập & Đề Thi ({assignments.length})
        </button>

        <button
          onClick={() => setActiveTab('lessons')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'lessons' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tài Liệu & Bài Giảng ({lessons.length})
        </button>
      </div>

      {/* Tab 1: Assignments & Interactive Quiz Taker */}
      {activeTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List of assignments (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            {assignments.map((asg) => {
              const isSelected = selectedAssignment?.id === asg.id;
              return (
                <div
                  key={asg.id}
                  onClick={() => {
                    setSelectedAssignment(asg);
                    setStudentAnswers({});
                    setQuizFinished(false);
                    setQuizScore(null);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 shadow-xs ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-600 ring-1 ring-indigo-600'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      Khối {asg.grade} • {asg.subjectName}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">Hạn: {asg.dueDate}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{asg.title}</h3>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>{asg.questions.length} câu hỏi trắc nghiệm</span>
                    <span className="text-emerald-700 font-semibold">{asg.submissionsCount} bài nộp</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Quiz Viewer & Taker (8 cols) */}
          <div className="lg:col-span-8">
            {selectedAssignment ? (
              <div className="p-5 lg:p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{selectedAssignment.title}</h2>
                    <p className="text-xs text-slate-500">
                      Môn {selectedAssignment.subjectName} • Khối {selectedAssignment.grade} • Thang điểm: 10
                    </p>
                  </div>

                  {quizFinished && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>Điểm số: {quizScore} / 10</span>
                    </div>
                  )}
                </div>

                {/* Questions List */}
                <div className="space-y-5">
                  {selectedAssignment.questions.map((q, qIndex) => {
                    const selected = studentAnswers[q.id];
                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-slate-900 text-sm">
                            Câu {qIndex + 1}: {q.content}
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-bold">
                            {q.points} điểm
                          </span>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options?.map((opt, optIdx) => {
                            const isThisSelected = selected === optIdx;
                            const showResult = quizFinished;
                            let btnStyle = 'bg-white border-slate-200 text-slate-700 hover:border-slate-300';

                            if (showResult) {
                              if (optIdx === q.correctOptionIndex) {
                                btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold';
                              } else if (isThisSelected) {
                                btnStyle = 'bg-rose-50 border-rose-300 text-rose-700 line-through';
                              }
                            } else if (isThisSelected) {
                              btnStyle = 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold shadow-2xs';
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                disabled={quizFinished}
                                onClick={() =>
                                  setStudentAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: optIdx,
                                  }))
                                }
                                className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between cursor-pointer disabled:cursor-default ${btnStyle}`}
                              >
                                <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                {showResult && optIdx === q.correctOptionIndex && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation when finished */}
                        {quizFinished && q.explanation && (
                          <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
                            <strong className="text-emerald-700 font-bold">Lời giải chi tiết:</strong>
                            <p className="leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Quiz Action button */}
                <div className="flex justify-end pt-3 border-t border-slate-100">
                  {!quizFinished ? (
                    <button
                      onClick={handleSubmitQuiz}
                      className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Nộp Bài & Tự Động Chấm Điểm
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setStudentAnswers({});
                        setQuizFinished(false);
                        setQuizScore(null);
                      }}
                      className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Làm Lại Bài Thi
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Chọn một bài tập để bắt đầu làm bài.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Lessons & Study Materials */}
      {activeTab === 'lessons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-3">
            {lessons.map((ls) => (
              <div
                key={ls.id}
                onClick={() => setSelectedLesson(ls)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 shadow-xs ${
                  selectedLesson?.id === ls.id
                    ? 'bg-indigo-50/70 border-indigo-600 ring-1 ring-indigo-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 w-fit">
                  Khối {ls.grade} • {ls.subjectName}
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{ls.title}</h3>
                <div className="text-xs text-slate-500">Tác giả: {ls.author}</div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-8">
            {selectedLesson ? (
              <div className="p-5 lg:p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <div className="text-xs font-bold text-indigo-600">
                    Khối {selectedLesson.grade} • Môn {selectedLesson.subjectName}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedLesson.title}</h2>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs lg:text-sm leading-relaxed whitespace-pre-line">
                  {selectedLesson.content}
                </div>

                {selectedLesson.attachments.length > 0 && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-slate-700">Tài liệu đính kèm:</div>
                    {selectedLesson.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{att.fileName}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Chọn một bài giảng để đọc tài liệu.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
