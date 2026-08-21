import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LMSLesson, LMSAssignment } from '../../types';
import { generateAIQuiz, askAITutor } from '../../services/geminiService';
import {
  BookOpenCheck,
  Sparkles,
  FileText,
  CheckCircle2,
  Award,
  Send,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LMSManager: React.FC = () => {
  const {
    lessons,
    assignments,
    students,
    subjects,
    addAssignment,
    submitAssignmentAnswers,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'lessons' | 'assignments' | 'ai_tutor'>('assignments');
  const [selectedLesson, setSelectedLesson] = useState<LMSLesson | null>(lessons[0] || null);
  const [selectedAssignment, setSelectedAssignment] = useState<LMSAssignment | null>(assignments[0] || null);

  // Quiz Taking state
  const [studentAnswers, setStudentAnswers] = useState<{ [qId: string]: number }>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // AI Quiz Generator Modal state
  const [isAiQuizModalOpen, setIsAiQuizModalOpen] = useState(false);
  const [aiSubject, setAiSubject] = useState('Toán học');
  const [aiGrade, setAiGrade] = useState(8);
  const [aiTopic, setAiTopic] = useState('Hằng đẳng thức đáng nhớ & Rút gọn phân thức');
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  // AI Tutor Ask state
  const [aiTutorSubject, setAiTutorSubject] = useState('Toán học');
  const [aiTutorGrade, setAiTutorGrade] = useState(8);
  const [aiTutorPrompt, setAiTutorPrompt] = useState('');
  const [aiTutorAnswer, setAiTutorAnswer] = useState<string | null>(null);
  const [askingAi, setAskingAi] = useState(false);

  const handleGenerateAIQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const generatedQuestions = await generateAIQuiz(aiSubject, aiGrade, aiTopic, 4);

      const newAssignment: Omit<LMSAssignment, 'id' | 'submissionsCount' | 'createdAt'> = {
        title: `[AI Đề Xuất] Bài Tập: ${aiTopic}`,
        subjectId: subjects.find((s) => s.name === aiSubject)?.id || 'sub-toan',
        subjectName: aiSubject,
        grade: aiGrade,
        dueDate: '2026-08-30',
        maxScore: 10,
        questions: generatedQuestions,
      };

      addAssignment(newAssignment);
      setIsAiQuizModalOpen(false);
      alert(`Đã tạo thành công bộ câu hỏi AI cho môn ${aiSubject} Khối ${aiGrade}!`);
    } catch (e) {
      console.error(e);
      alert('Không thể tạo quiz lúc này, vui lòng thử lại.');
    } finally {
      setGeneratingQuiz(false);
    }
  };

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

  const handleAskAITutor = async () => {
    if (!aiTutorPrompt.trim()) return;
    setAskingAi(true);
    try {
      const answer = await askAITutor(aiTutorPrompt, aiTutorSubject, aiTutorGrade);
      setAiTutorAnswer(answer);
    } catch (e) {
      console.error(e);
    } finally {
      setAskingAi(false);
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
            <span className="text-slate-700">LMS & Trợ Lý Học Tập</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-1">
            <BookOpenCheck className="w-6 h-6 text-indigo-600" />
            <span>LMS BÀI GIẢNG, BÀI TẬP & TRỢ LÝ AI QUIZ</span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Học liệu số hóa, giao bài tập tự động chấm điểm và Trợ giảng AI sư phạm
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAiQuizModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs lg:text-sm font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Tạo Đề Thi Bằng AI</span>
          </button>
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

        <button
          onClick={() => setActiveTab('ai_tutor')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'ai_tutor' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Hỏi Trợ Lý AI Tutor</span>
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

      {/* Tab 3: Ask AI Tutor */}
      {activeTab === 'ai_tutor' && (
        <div className="p-5 lg:p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-5 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Trợ Giảng Sư Phạm AI (ANTAM Smart Tutor)</h2>
              <p className="text-xs text-slate-500">
                Giải đáp câu hỏi toán, văn, anh, lý, hóa theo phương pháp sư phạm kiên nhẫn
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Chọn Môn Học</label>
              <select
                value={aiTutorSubject}
                onChange={(e) => setAiTutorSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Khối Lớp</label>
              <select
                value={aiTutorGrade}
                onChange={(e) => setAiTutorGrade(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
              >
                {[6, 7, 8, 9].map((g) => (
                  <option key={g} value={g}>
                    Khối {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-slate-600 font-medium text-xs">Nội Dung Câu Hỏi Cần Trợ Giúp</label>
            <div className="flex gap-2">
              <textarea
                value={aiTutorPrompt}
                onChange={(e) => setAiTutorPrompt(e.target.value)}
                rows={3}
                placeholder="VD: Hãy giải thích cách phân tích đa thức thành nhân tử bằng phương pháp đặt nhân tử chung kèm ví dụ..."
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-xs lg:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleAskAITutor}
                disabled={askingAi || !aiTutorPrompt.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{askingAi ? 'Đang giải đáp...' : 'Gửi Câu Hỏi Cho AI'}</span>
              </button>
            </div>
          </div>

          {/* AI Response Display */}
          {aiTutorAnswer && (
            <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs lg:text-sm text-slate-800 leading-relaxed whitespace-pre-line space-y-2">
              <div className="font-bold text-indigo-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Phản hồi sư phạm từ AI Tutor:</span>
              </div>
              <div>{aiTutorAnswer}</div>
            </div>
          )}
        </div>
      )}

      {/* AI Quiz Generator Modal */}
      {isAiQuizModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Tạo Bộ Đề Thi Bằng Gemini AI</span>
              </h2>
              <button onClick={() => setIsAiQuizModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs lg:text-sm">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Môn Học</label>
                <select
                  value={aiSubject}
                  onChange={(e) => setAiSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Khối Lớp</label>
                <select
                  value={aiGrade}
                  onChange={(e) => setAiGrade(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                >
                  {[6, 7, 8, 9].map((g) => (
                    <option key={g} value={g}>
                      Khối {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Chủ Đề Kiến Thức Cần Tạo Đề</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="VD: Hằng đẳng thức, Thì Hiện Tại Hoàn Thành, Định luật Ôm..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAiQuizModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleGenerateAIQuiz}
                  disabled={generatingQuiz}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{generatingQuiz ? 'AI Đang Tạo Câu Hỏi...' : 'Bắt Đầu Sinh Đề'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
