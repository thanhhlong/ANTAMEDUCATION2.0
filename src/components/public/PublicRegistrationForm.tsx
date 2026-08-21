import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PublicRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublicRegistrationForm: React.FC<PublicRegistrationFormProps> = ({
  isOpen,
  onClose,
}) => {
  const { subjects, addLead } = useApp();

  const [formData, setFormData] = useState({
    parentName: '',
    phone: '',
    studentName: '',
    currentSchool: 'THCS',
    targetGrade: 8,
    interestedSubjects: ['Toán học'],
    serviceType: 'standard' as 'standard' | 'custom_tutoring',
    customTopic: '',
    customGoal: '',
    preferredSchedule: ['Tối Thứ 3, Thứ 5'],
  });

  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.parentName.trim() || !formData.phone.trim() || !formData.studentName.trim()) {
      alert('Vui lòng điền đầy đủ họ tên và số điện thoại');
      return;
    }

    addLead({
      parentName: formData.parentName.trim(),
      studentName: formData.studentName.trim(),
      phone: formData.phone.trim(),
      zalo: formData.phone.trim(),
      currentSchool: formData.currentSchool.trim(),
      targetGrade: formData.targetGrade,
      interestedSubjects: formData.interestedSubjects,
      interestedServices: [
        formData.serviceType === 'custom_tutoring' ? 'Gia sư theo yêu cầu 1-on-1' : 'Lớp học tiêu chuẩn',
      ],
      customTutoring:
        formData.serviceType === 'custom_tutoring'
          ? {
              topic: formData.customTopic || 'Bồi dưỡng môn học',
              targetGoal: formData.customGoal || 'Nâng cao điểm số',
              preferredSchedule: formData.preferredSchedule,
              status: 'pending_match',
            }
          : undefined,
      preferredSchedule: formData.preferredSchedule,
      referralSource: 'Form Đăng Ký Trực Tuyến',
      status: 'new',
    });

    setSubmitted(true);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 lg:p-7 space-y-5 shadow-xl relative text-slate-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs lg:text-sm">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mx-auto border border-indigo-100">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Đăng Ký Học Tại AN TÂM EDUCATION</h2>
              <p className="text-xs text-slate-500">
                Nhận lịch học thử miễn phí & tư vấn lộ trình bồi dưỡng theo năng lực
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Họ Tên Phụ Huynh *</label>
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="VD: Cô Minh Hạnh"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Số Điện Thoại / Zalo *</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="VD: 0988112201"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-slate-600 font-medium mb-1">Họ Tên Con / Học Sinh *</label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  placeholder="VD: Nguyễn Tuấn Minh"
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

            {/* Subject Checkboxes */}
            <div>
              <label className="block text-slate-600 font-medium mb-1">Môn Học Cần Đăng Ký</label>
              <div className="flex flex-wrap gap-1.5">
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
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Service Type */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-slate-700 font-bold text-xs">Hình Thức Học Mong Muốn</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, serviceType: 'standard' })}
                  className={`p-2 rounded-md border text-center text-xs font-semibold transition-colors cursor-pointer ${
                    formData.serviceType === 'standard'
                      ? 'bg-white text-indigo-700 border-indigo-300 shadow-2xs font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  Lớp Tiêu Chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, serviceType: 'custom_tutoring' })}
                  className={`p-2 rounded-md border text-center text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    formData.serviceType === 'custom_tutoring'
                      ? 'bg-white text-indigo-700 border-indigo-300 shadow-2xs font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Gia Sư Theo Yêu Cầu</span>
                </button>
              </div>

              {formData.serviceType === 'custom_tutoring' && (
                <div className="pt-2 space-y-2">
                  <input
                    type="text"
                    value={formData.customTopic}
                    onChange={(e) => setFormData({ ...formData, customTopic: e.target.value })}
                    placeholder="Chủ đề cần gia sư: VD Mất gốc Hình học, Luyện thi Chuyên..."
                    className="w-full px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-800 focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Gửi Đăng Ký Ngay
            </button>
          </form>
        ) : (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Đăng Ký Thành Công!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tư vấn viên của AN TÂM EDUCATION sẽ liên hệ qua Zalo/SĐT trong vòng 30 phút để xếp lịch học thử.
              </p>
            </div>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
            >
              Hoàn Tất
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
