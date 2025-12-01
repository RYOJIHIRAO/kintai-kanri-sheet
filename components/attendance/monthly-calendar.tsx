'use client';

import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import type { AttendanceRecord } from '@/types';
import { formatMinutesToString, calculateDailyStats } from '@/utils/time-calculation';

interface MonthlyCalendarProps {
  year: number;
  month: number;
  attendanceRecords: AttendanceRecord[];
  onDateClick: (date: string) => void;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function MonthlyCalendar({ year, month, attendanceRecords, onDateClick }: MonthlyCalendarProps) {
  const currentDate = new Date(year, month - 1);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 月の最初の日が何曜日か（0 = 日曜日）
  const firstDayOfWeek = getDay(monthStart);

  // カレンダーの空白セルを作成
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const getAttendanceForDate = (date: Date): AttendanceRecord | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return attendanceRecords.find((record) => record.date === dateStr);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 border-green-300';
      case 'pending':
        return 'bg-yellow-100 border-yellow-300';
      case 'remanded':
        return 'bg-red-100 border-red-300';
      case 'draft':
        return 'bg-gray-100 border-gray-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'approved':
        return '承認済';
      case 'pending':
        return '申請中';
      case 'remanded':
        return '差戻し';
      case 'draft':
        return '下書き';
      default:
        return '';
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold">
          {format(currentDate, 'yyyy年M月', { locale: ja })}
        </h2>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* 曜日ヘッダー */}
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={`text-center font-semibold py-2 ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}

        {/* 空白セル */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* 日付セル */}
        {daysInMonth.map((date) => {
          const attendance = getAttendanceForDate(date);
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayOfWeek = getDay(date);
          const isToday = isSameDay(date, new Date());

          return (
            <Card
              key={dateStr}
              className={`
                aspect-square p-2 cursor-pointer hover:shadow-md transition-shadow
                ${attendance ? getStatusColor(attendance.status) : 'border-gray-200'}
                ${isToday ? 'ring-2 ring-blue-500' : ''}
              `}
              onClick={() => onDateClick(dateStr)}
            >
              <div className="h-full flex flex-col">
                <div
                  className={`text-sm font-semibold mb-1 ${
                    dayOfWeek === 0
                      ? 'text-red-600'
                      : dayOfWeek === 6
                      ? 'text-blue-600'
                      : 'text-gray-700'
                  }`}
                >
                  {format(date, 'd')}
                </div>

                {attendance && (() => {
                  // 【修正後】共通ロジックを使ってその場で計算
                  const stats = calculateDailyStats(attendance.work_spans || [], attendance.breaks || []);
                  const displayHours = Math.floor(stats.workTime / 60); // 分を時間に変換
                  const displayMinutes = stats.workTime % 60;

                  // 勤務時間枠の表示（最初と最後の時刻を表示）
                  const firstSpan = attendance.work_spans?.[0];
                  const lastSpan = attendance.work_spans?.[attendance.work_spans.length - 1];
                  const timeDisplay = firstSpan && lastSpan
                    ? `${firstSpan.start_time} - ${lastSpan.end_time}`
                    : '';

                  return (
                    <div className="flex-1 flex flex-col justify-between text-xs">
                      <div className="space-y-0.5">
                        {timeDisplay && (
                          <div className="font-medium">
                            {timeDisplay}
                          </div>
                        )}
                        <div className="text-gray-600">
                          {displayHours}時間{displayMinutes > 0 ? `${displayMinutes}分` : ''}
                        </div>
                      </div>
                      <div className="text-xs font-medium mt-1">
                        {getStatusText(attendance.status)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
