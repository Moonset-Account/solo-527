'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Rehearsal {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  production: { title: string };
  venue: { name: string };
  conflictCheckStatus: string;
}

export default function RehearsalCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRehearsals();
  }, [currentDate]);

  const fetchRehearsals = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);

      const res = await fetch(
        `/api/v1/rehearsals?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );
      if (res.ok) {
        const data = await res.json();
        setRehearsals(data);
      }
    } catch (error) {
      console.error('Failed to fetch rehearsals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getRehearsalsForDay = (date: Date | null) => {
    if (!date) return [];
    return rehearsals.filter((r) => {
      const rehearsalDate = new Date(r.startTime);
      return (
        rehearsalDate.getFullYear() === date.getFullYear() &&
        rehearsalDate.getMonth() === date.getMonth() &&
        rehearsalDate.getDate() === date.getDate()
      );
    });
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const days = getDaysInMonth();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'bg-green-100 border-green-300';
      case 'FAILED':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-yellow-100 border-yellow-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">
            排练日历
          </h1>
          <p className="text-gray-500 mt-1">查看和管理排练安排</p>
        </div>
        <Link
          href="/rehearsals/new"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>新建排练</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            const dayRehearsals = getRehearsalsForDay(date);
            const isToday =
              date &&
              date.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`min-h-24 p-2 border rounded-lg ${
                  date
                    ? isToday
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/30'
                    : 'border-transparent'
                }`}
              >
                {date && (
                  <>
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-primary' : 'text-gray-700'
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayRehearsals.slice(0, 2).map((rehearsal) => (
                        <div
                          key={rehearsal.id}
                          className={`text-xs p-1.5 rounded border ${getStatusColor(
                            rehearsal.conflictCheckStatus
                          )}`}
                        >
                          <p className="font-medium truncate">
                            {rehearsal.title}
                          </p>
                          <p className="text-gray-500 truncate">
                            {formatDate(rehearsal.startTime, 'HH:mm')}
                          </p>
                        </div>
                      ))}
                      {dayRehearsals.length > 2 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{dayRehearsals.length - 2} 更多
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
          冲突检测说明
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
            <span className="text-sm text-gray-600">无冲突</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300"></div>
            <span className="text-sm text-gray-600">待检测</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
            <span className="text-sm text-gray-600">存在冲突</span>
          </div>
        </div>
      </div>
    </div>
  );
}
