'use client';

import { useEffect, useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Room {
  id: string;
  name: string;
  location: string;
  capacity: number;
}

interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  roomId: string;
  host: {
    name: string;
  };
  visitors: Array<{
    id: string;
    name: string;
  }>;
}

export default function CalendarPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

  useEffect(() => {
    loadData();
  }, [currentWeek, selectedRoom]);

  async function loadData() {
    setLoading(true);
    try {
      const [roomsRes, meetingsRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch(
          `/api/meetings?startDate=${weekStart.toISOString()}&endDate=${weekEnd.toISOString()}` +
          (selectedRoom ? `&roomId=${selectedRoom}` : '')
        ),
      ]);

      const [roomsData, meetingsData] = await Promise.all([
        roomsRes.json(),
        meetingsRes.json(),
      ]);

      setRooms(roomsData.rooms || []);
      setMeetings(meetingsData.meetings || []);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getMeetingsForRoomAndDay(roomId: string, day: Date) {
    return meetings.filter((m) => {
      const meetingStart = new Date(m.startTime);
      return m.roomId === roomId && isSameDay(meetingStart, day);
    });
  }

  const displayRooms = selectedRoom ? rooms.filter((r) => r.id === selectedRoom) : rooms;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">会议室日历</h1>
          <p className="text-gray-600 mt-1">查看会议室预约情况</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            className="input max-w-xs"
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
          >
            <option value="">所有会议室</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
              className="btn btn-secondary"
            >
              ← 上周
            </button>
            <span className="font-medium">
              {format(weekStart, 'MM月dd日', { locale: zhCN })} -{' '}
              {format(weekEnd, 'MM月dd日', { locale: zhCN })}
            </span>
            <button
              onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
              className="btn btn-secondary"
            >
              下周 →
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-center py-12">加载中...</div>
        ) : (
          <div className="min-w-[800px]">
            <div className="grid" style={{ gridTemplateColumns: `120px repeat(${days.length}, 1fr)` }}>
              <div className="p-2 border-b border-r font-medium text-gray-500 text-sm">
                时间 / 会议室
              </div>
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`p-2 border-b text-center ${
                    isSameDay(day, new Date()) ? 'bg-primary-50' : ''
                  }`}
                >
                  <p className="font-medium">
                    {format(day, 'EEE', { locale: zhCN })}
                  </p>
                  <p className={`text-sm ${isSameDay(day, new Date()) ? 'text-primary-600 font-bold' : 'text-gray-500'}`}>
                    {format(day, 'MM/dd', { locale: zhCN })}
                  </p>
                </div>
              ))}

              {displayRooms.map((room) => (
                <div key={room.id} className="contents">
                  <div className="p-2 border-b border-r bg-gray-50">
                    <p className="font-medium text-sm truncate">{room.name}</p>
                    <p className="text-xs text-gray-500 truncate">{room.location}</p>
                  </div>
                  {days.map((day) => {
                    const dayMeetings = getMeetingsForRoomAndDay(room.id, day);
                    return (
                      <div
                        key={`${room.id}-${day.toISOString()}`}
                        className="p-1 border-b border-r min-h-[100px] relative"
                      >
                        {dayMeetings.map((meeting) => {
                          const startHour = new Date(meeting.startTime).getHours();
                          const endHour = new Date(meeting.endTime).getHours();
                          const top = (startHour - 8) * 40;
                          const height = (endHour - startHour) * 40;

                          return (
                            <div
                              key={meeting.id}
                              className="absolute left-1 right-1 bg-primary-100 border border-primary-300 rounded p-1 overflow-hidden cursor-pointer hover:bg-primary-200 transition-colors"
                              style={{ top: `${top}px`, height: `${Math.max(height - 4, 36)}px` }}
                              title={`${meeting.title}\n${format(new Date(meeting.startTime), 'HH:mm')}-${format(new Date(meeting.endTime), 'HH:mm')}\n主持人: ${meeting.host.name}\n访客: ${meeting.visitors.length}人`}
                            >
                              <p className="text-xs font-medium text-primary-800 truncate">
                                {format(new Date(meeting.startTime), 'HH:mm')} {meeting.title}
                              </p>
                              <p className="text-xs text-primary-600 truncate">
                                {meeting.host.name} ({meeting.visitors.length}访客)
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">图例说明</h3>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-primary-100 border border-primary-300 rounded mr-2"></div>
            <span>已预约会议</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-primary-50 border border-primary-200 rounded mr-2"></div>
            <span>今天</span>
          </div>
        </div>
      </div>
    </div>
  );
}
