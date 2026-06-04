import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { useAuthStore } from '@/stores/authStore';
import StatusBadge from '@/components/StatusBadge';

export default function MyAppointments() {
  const { user } = useAuthStore();
  const { appointments, loading, fetchAppointments } = useAppointmentStore();
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (user?.member_id) {
      fetchAppointments({ member_id: user.member_id });
    }
  }, [user?.member_id, fetchAppointments]);

  const filteredAppointments = statusFilter
    ? appointments.filter((a) => a.status === statusFilter)
    : appointments;

  const upcomingAppointments = filteredAppointments.filter((a) => a.status === 'booked');
  const pastAppointments = filteredAppointments.filter(
    (a) => a.status === 'checked_in' || a.status === 'cancelled' || a.status === 'no_show'
  );

  if (loading && appointments.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">我的预约</h2>
        <div className="flex gap-1">
          {['', 'booked', 'checked_in', 'cancelled', 'no_show'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm rounded-btn transition-colors ${
                statusFilter === s
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === '' ? '全部' : s === 'booked' ? '已预约' : s === 'checked_in' ? '已签到' : s === 'cancelled' ? '已取消' : '未到'}
            </button>
          ))}
        </div>
      </div>

      {upcomingAppointments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-600 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />即将到来 ({upcomingAppointments.length})
          </h3>
          {upcomingAppointments.map((apt) => (
            <div key={apt.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {apt.type === 'private' ? '私教课' : '团课'}
                    </h4>
                    <StatusBadge status={apt.status} />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{apt.start_time?.slice(0, 10)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{apt.start_time?.slice(11, 16)} - {apt.end_time?.slice(11, 16)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>教练 #{apt.coach_id}</span>
                    </div>
                  </div>
                  {apt.notes && (
                    <p className="mt-3 text-sm text-gray-500 bg-gray-50 p-2 rounded-btn">
                      备注: {apt.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {apt.status === 'booked' && (
                    <div className="flex items-center gap-1 text-xs text-accent bg-accent/10 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      待上课
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pastAppointments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-600 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-gray-400" />历史记录 ({pastAppointments.length})
          </h3>
          {pastAppointments.map((apt) => (
            <div key={apt.id} className="card p-5 opacity-70">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-gray-700 font-medium">
                    {apt.type === 'private' ? '私教课' : '团课'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {apt.start_time?.slice(0, 10)} {apt.start_time?.slice(11, 16)}
                  </span>
                  <span className="text-sm text-gray-400">教练 #{apt.coach_id}</span>
                </div>
                <StatusBadge status={apt.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredAppointments.length === 0 && !loading && (
        <div className="card text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">暂无预约记录</p>
        </div>
      )}
    </div>
  );
}
