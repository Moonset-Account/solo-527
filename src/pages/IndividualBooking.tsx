import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Check, BookOpen, Clock, MapPin, UserPlus } from 'lucide-react';
import { coursesApi, sessionsApi, bookingsApi } from '@/lib/api';
import type { Course, Session } from '@/types';

export default function IndividualBooking() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [participants, setParticipants] = useState<{ name: string; age: string }[]>([
    { name: '', age: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const currentCourse = courses.find((c) => c.id === selectedCourse);
  const currentSession = sessions.find((s) => s.id === selectedSession);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const courseData = await coursesApi.list();
      setCourses(courseData.filter((c) => c.status === 'active' || c.status === 'open'));
    } catch {}
  };

  const loadSessions = async (courseId: number) => {
    try {
      const data = await sessionsApi.list({ course_id: String(courseId) });
      setSessions(data.filter((s) => s.status === 'open'));
    } catch {}
  };

  const handleCourseSelect = (courseId: number) => {
    setSelectedCourse(courseId);
    setSelectedSession(null);
    loadSessions(courseId);
  };

  const isAgeValid = (age: string) => {
    if (!age || !currentCourse) return true;
    const num = Number(age);
    return num >= currentCourse.min_age && num <= currentCourse.max_age;
  };

  const validateAge = () => {
    if (!currentCourse) return true;
    return participants.every(
      (p) => !p.age || (Number(p.age) >= currentCourse.min_age && Number(p.age) <= currentCourse.max_age)
    );
  };

  const validParticipants = participants.filter((p) => p.name && p.age);

  const goToStep = (s: number) => {
    setStep(s);
    setAnimKey((k) => k + 1);
  };

  const handleSubmit = async () => {
    if (!selectedSession) return;
    if (validParticipants.length === 0) return;

    setLoading(true);
    setError('');
    try {
      await bookingsApi.createIndividual(
        selectedSession,
        validParticipants.map((p) => ({ name: p.name, age: Number(p.age) }))
      );
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || '报名失败');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['选择课程场次', '填写信息', '确认提交'];

  if (success) {
    return (
      <div className="page-enter flex items-center justify-center py-20">
        <div className="text-center card-appear">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={36} className="text-green-500" />
          </div>
          <h2 className="page-title mb-2">报名成功</h2>
          <p className="text-slate-500 mb-8">您的报名已提交，请等待审核</p>
          <button
            onClick={() => navigate('/my-bookings')}
            className="btn-primary"
          >
            查看我的报名
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost flex items-center gap-1"
      >
        <ArrowLeft size={16} />
        返回
      </button>

      <h1 className="page-title">散客报名</h1>

      <div className="flex items-center justify-between px-2">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                step > i + 1
                  ? 'bg-green-500 text-white shadow-md shadow-green-500/20'
                  : step === i + 1
                    ? 'bg-museum text-white shadow-md shadow-museum/20'
                    : 'bg-gray-100 text-gray-400'
              }`}>
                {step > i + 1 ? <Check size={16} /> : i + 1}
              </div>
              <span className={`mt-1.5 text-xs whitespace-nowrap ${
                step === i + 1 ? 'text-museum font-semibold' : step > i + 1 ? 'text-green-600 font-medium' : 'text-slate-400'
              }`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 mx-3 mt-[-18px]">
                <div className={`h-0.5 rounded-full transition-all duration-500 ${
                  step > i + 1 ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              </div>
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div key={`step1-${animKey}`} className="slide-up space-y-6">
          <div className="bg-white rounded-xl border border-gray-100/80 p-6 space-y-6 shadow-sm">
            <div>
              <label className="section-title text-base flex items-center gap-2 mb-4">
                <BookOpen size={18} className="text-gold" />
                选择课程
              </label>
              <div className="grid grid-cols-2 gap-3">
                {courses.map((course, ci) => (
                  <button
                    key={course.id}
                    onClick={() => handleCourseSelect(course.id)}
                    className={`card-hover p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      selectedCourse === course.id
                        ? 'border-museum bg-museum/5 shadow-md shadow-museum/5'
                        : 'border-gray-100 bg-white hover:border-museum/20'
                    } card-appear stagger-${ci + 1}`}
                  >
                    <p className="font-semibold text-museum">{course.name}</p>
                    <p className="text-xs text-slate-500 mt-1.5">
                      适合 {course.min_age}-{course.max_age} 岁 · 容量 {course.capacity} 人 · {course.duration_minutes} 分钟
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {selectedCourse && (
              <div>
                <label className="section-title text-base flex items-center gap-2 mb-4">
                  <Clock size={18} className="text-gold" />
                  选择场次
                </label>
                {sessions.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">该课程暂无可用场次</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((s, si) => {
                      const pct = s.capacity > 0 ? (s.booked_count / s.capacity) * 100 : 0;
                      const remaining = s.capacity - s.booked_count;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSession(s.id)}
                          className={`card-hover w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                            selectedSession === s.id
                              ? 'border-museum bg-museum/5 shadow-md shadow-museum/5'
                              : 'border-gray-100 bg-white hover:border-museum/20'
                          } card-appear stagger-${si + 1}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold text-museum">{s.date} {s.start_time}-{s.end_time}</p>
                              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                <MapPin size={11} /> {s.location}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-museum">{s.booked_count}/{s.capacity}</p>
                              <p className={`text-xs font-medium ${remaining <= 5 ? 'text-red-500' : 'text-slate-400'}`}>
                                剩余 {remaining} 位
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 progress-bar-animated ${
                                pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-green-400'
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => selectedCourse && selectedSession && goToStep(2)}
                disabled={!selectedCourse || !selectedSession}
                className="btn-primary"
              >
                下一步
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div key={`step2-${animKey}`} className="slide-up space-y-6">
          <div className="bg-white rounded-xl border border-gray-100/80 p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="section-title text-base flex items-center gap-2">
                <UserPlus size={18} className="text-gold" />
                儿童信息
              </label>
              <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                课程年龄要求：{currentCourse?.min_age}-{currentCourse?.max_age}岁
              </span>
            </div>

            {!validateAge() && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                有参与者年龄不在课程要求范围内（{currentCourse?.min_age}-{currentCourse?.max_age}岁）
              </div>
            )}

            <div className="space-y-4">
              {participants.map((p, i) => (
                <div key={i} className="bg-slate-50/60 rounded-xl p-4 card-appear" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-museum/10 text-museum text-xs flex items-center justify-center font-semibold">{i + 1}</span>
                    <span className="text-sm font-medium text-slate-600">儿童 {i + 1}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-500 mb-1.5">姓名</label>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => {
                          const updated = [...participants];
                          updated[i].name = e.target.value;
                          setParticipants(updated);
                        }}
                        className="input-field"
                        placeholder="请输入儿童姓名"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">年龄</label>
                      <input
                        type="number"
                        value={p.age}
                        onChange={(e) => {
                          const updated = [...participants];
                          updated[i].age = e.target.value;
                          setParticipants(updated);
                        }}
                        className={`input-field ${p.age && !isAgeValid(p.age) ? '!border-red-400 !ring-red-400/20 !focus:border-red-400' : ''}`}
                        placeholder="年龄"
                        min={1}
                        max={18}
                      />
                      {p.age && !isAgeValid(p.age) && (
                        <p className="text-xs text-red-500 mt-1">年龄需在 {currentCourse?.min_age}-{currentCourse?.max_age} 岁之间</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <button onClick={() => goToStep(1)} className="btn-secondary">
                上一步
              </button>
              <button
                onClick={() => validParticipants.length > 0 && goToStep(3)}
                disabled={validParticipants.length === 0}
                className="btn-primary"
              >
                下一步
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div key={`step3-${animKey}`} className="slide-up space-y-6">
          <div className="bg-white rounded-xl border border-gray-100/80 p-6 space-y-5 shadow-sm">
            <h2 className="section-title">确认报名信息</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="stat-card">
                <p className="text-xs text-slate-400 mb-1">课程名称</p>
                <p className="font-semibold text-museum text-sm">{currentCourse?.name}</p>
              </div>
              <div className="stat-card">
                <p className="text-xs text-slate-400 mb-1">参与人数</p>
                <p className="font-semibold text-museum text-sm">{validParticipants.length} 人</p>
              </div>
              <div className="stat-card">
                <p className="text-xs text-slate-400 mb-1">场次时间</p>
                <p className="font-semibold text-museum text-sm">{currentSession?.date} {currentSession?.start_time}-{currentSession?.end_time}</p>
              </div>
              <div className="stat-card">
                <p className="text-xs text-slate-400 mb-1">活动地点</p>
                <p className="font-semibold text-museum text-sm">{currentSession?.location}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">参与者名单</p>
              <div className="bg-slate-50/80 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-2">
                  {validParticipants.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-white rounded-lg px-3 py-2 card-appear" style={{ animationDelay: `${i * 0.04}s` }}>
                      <span className="w-5 h-5 rounded-full bg-museum/10 text-museum text-xs flex items-center justify-center font-semibold">{i + 1}</span>
                      <span className="text-slate-700 font-medium">{p.name}</span>
                      <span className="text-slate-400 text-xs">{p.age}岁</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button onClick={() => goToStep(2)} className="btn-secondary">
                上一步
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? '提交中...' : '确认报名'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
