'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MonthlyCalendar } from '@/components/attendance/monthly-calendar';
import { MonthlySummary } from '@/components/attendance/monthly-summary';
import { AttendanceEditModal } from '@/components/attendance/attendance-edit-modal';
import { useAuth } from '@/hooks/use-auth';
import {
  getAttendanceRecordsByUserIdAndMonth,
  getAttendanceRecordByUserIdAndDate,
  createAttendanceRecord,
  updateAttendanceRecord,
} from '@/lib/storage';
import type { AttendanceRecord } from '@/types';

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth('user');
  const router = useRouter();

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadAttendanceRecords = useCallback(async () => {
    if (!user) return;

    const records = await getAttendanceRecordsByUserIdAndMonth(user.id, currentYear, currentMonth);
    setAttendanceRecords(records);
  }, [user, currentYear, currentMonth]);

  useEffect(() => {
    if (user) {
      loadAttendanceRecords();
    }
  }, [user, loadAttendanceRecords]);

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleSaveAttendance = async (data: Omit<AttendanceRecord, 'id' | 'user_id'>) => {
    if (!user || !selectedDate) return;

    // 日付の整合性を確保
    const saveData = {
      ...data,
      date: selectedDate, // 選択した日付を強制的に設定
    };

    // 既存レコードをチェック（user_idとdateで検索）
    const existingRecord = await getAttendanceRecordByUserIdAndDate(user.id, selectedDate);

    if (existingRecord) {
      // 更新
      console.log('勤怠記録を更新:', existingRecord.id, saveData);
      await updateAttendanceRecord(existingRecord.id, saveData);
    } else {
      // 新規作成
      console.log('新規勤怠記録を作成:', saveData);
      await createAttendanceRecord({
        ...saveData,
        user_id: user.id,
      });
    }

    // データを再読み込み
    loadAttendanceRecords();
    setIsModalOpen(false);
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  const existingRecord = selectedDate
    ? getAttendanceRecordByUserIdAndDate(user.id, selectedDate)
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">勤怠管理システム</h1>
              <p className="text-sm text-gray-600 mt-1">
                {user.name} さん ({user.employee_id})
              </p>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 月選択 */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {currentYear}年{currentMonth}月
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                前月
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
              >
                次月
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* 月次サマリー */}
          <div>
            <h3 className="text-lg font-semibold mb-4">サマリー</h3>
            <MonthlySummary user={user} attendanceRecords={attendanceRecords} />
          </div>

          {/* カレンダー */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>勤怠カレンダー</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePreviousMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[120px] text-center">
                    {currentYear}年{currentMonth}月
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MonthlyCalendar
                year={currentYear}
                month={currentMonth}
                attendanceRecords={attendanceRecords}
                onDateClick={handleDateClick}
              />
            </CardContent>
          </Card>

          {/* 凡例 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ステータス凡例</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border-2 border-green-300 bg-green-100" />
                  <span>承認済</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border-2 border-yellow-300 bg-yellow-100" />
                  <span>申請中</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border-2 border-red-300 bg-red-100" />
                  <span>差戻し</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border-2 border-gray-300 bg-gray-100" />
                  <span>下書き</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 勤怠入力モーダル */}
      {selectedDate && (
        <AttendanceEditModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          date={selectedDate}
          userId={user.id}
          existingRecord={attendanceRecords.find((r) => r.date === selectedDate)}
          onSave={handleSaveAttendance}
        />
      )}
    </div>
  );
}
