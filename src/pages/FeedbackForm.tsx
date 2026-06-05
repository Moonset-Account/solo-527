import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle, PartyPopper } from 'lucide-react';
import { feedbackApi, bookingsApi } from '@/lib/api';
import type { Booking } from '@/types';

const ratingDescriptions = ['很差', '较差', '一般', '满意', '非常满意'];

export default function FeedbackForm() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await bookingsApi.list({ status: 'completed' });
      setBookings(data);
    } catch {}
  };

  const handleBookingSelect = (booking: Booking) => {
    setSelectedBooking(booking.id);
    setSelectedSession(booking.session_id);
  };

  const handleSubmit = async () => {
    if (!selectedSession || !selectedBooking || rating === 0) return;
    setLoading(true);
    setError('');
    try {
      await feedbackApi.create(selectedSession, selectedBooking, rating, comment);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  const displayRating = hoverRating || rating;

  if (success) {
    return (
      <div className="page-enter flex items-center justify-center py-20">
        <div className="text-center relative">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="absolute -top-4 left-1/4 w-1.5 h-1.5 rounded-full bg-museum animate-bounce" style={{ animationDelay: '0.15s' }} />
          <div className="absolute -top-6 right-1/4 w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
          <div className="absolute -top-3 left-1/3 w-1 h-1 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0.45s' }} />
          <div className="absolute -top-10 right-1/3 w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.6s' }} />
          <div className="absolute top-4 -left-6 w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="absolute top-2 -right-6 w-2 h-2 rounded-full bg-museum/40 animate-bounce" style={{ animationDelay: '0.4s' }} />

          <div className="card-appear">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-100/50">
              <PartyPopper size={36} className="text-green-600" />
            </div>
            <h2 className="page-title mb-2">反馈提交成功</h2>
            <p className="text-slate-500 mb-2">感谢您的评价</p>
            <div className="flex items-center justify-center gap-1 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={20}
                  className={`${s <= rating ? 'text-gold fill-gold' : 'text-gray-200'}`}
                />
              ))}
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary"
            >
              返回工作台
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <h1 className="page-title">课后反馈</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-8">
        <div>
          <h3 className="section-title mb-3">选择已完成的报名</h3>
          {bookings.length === 0 ? (
            <p className="text-sm text-slate-400">暂无可评价的报名记录</p>
          ) : (
            <div className="grid gap-3">
              {bookings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleBookingSelect(b)}
                  className={`w-full p-4 rounded-xl border text-left transition-all duration-300 ${
                    selectedBooking === b.id
                      ? 'border-museum bg-museum/5 shadow-md shadow-museum/5 -translate-y-0.5'
                      : 'border-gray-200 card-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-museum">
                        {b.session?.course?.name || `课程#${b.session_id}`}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {b.session?.date} {b.session?.start_time}-{b.session?.end_time} · {b.type === 'group' ? '团体' : '散客'}报名
                      </p>
                    </div>
                    {selectedBooking === b.id && (
                      <CheckCircle size={20} className="text-museum flex-shrink-0 card-appear" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="section-title mb-3">评分</h3>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1.5 transition-transform duration-200 hover:scale-125 active:scale-95"
              >
                <Star
                  size={36}
                  className={`transition-all duration-300 ${
                    displayRating >= star
                      ? 'text-gold fill-gold drop-shadow-sm'
                      : 'text-gray-200 hover:text-gold/40'
                  }`}
                />
              </button>
            ))}
            {displayRating > 0 && (
              <div className="ml-3 card-appear">
                <span className={`text-sm font-medium ${
                  displayRating >= 4 ? 'text-green-600' : displayRating >= 3 ? 'text-amber-600' : 'text-red-500'
                }`}>
                  {ratingDescriptions[displayRating - 1]}
                </span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="section-title mb-3">评价内容</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="input-field resize-none"
            placeholder="请分享您的体验和建议..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selectedBooking || rating === 0 || loading}
          className="btn-primary w-full py-2.5"
        >
          {loading ? '提交中...' : '提交反馈'}
        </button>
      </div>
    </div>
  );
}
