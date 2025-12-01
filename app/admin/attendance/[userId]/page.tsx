'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import {
  getUserById,
  getAttendanceRecordsByUserIdAndMonth,
  updateAttendanceRecord,
} from '@/lib/storage';
import type { User, AttendanceRecord } from '@/types';
import { formatMinutesToString, calculateEstimatedSalary } from '@/utils/time-calculation';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function EmployeeAttendancePage() {
  const { user: adminUser, isLoading: authLoading, logout } = useAuth('admin');
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [employee, setEmployee] = useState<User | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const loadEmployeeData = useCallback(() => {
    const emp = getUserById(userId);
    if (!emp) {
      router.push('/admin/dashboard');
      return;
    }

    setEmployee(emp);
    const records = getAttendanceRecordsByUserIdAndMonth(userId, currentYear, currentMonth);
    setAttendanceRecords(records.sort((a, b) => a.date.localeCompare(b.date)));
  }, [userId, currentYear, currentMonth, router]);

  useEffect(() => {
    if (userId) {
      loadEmployeeData();
    }
  }, [userId, loadEmployeeData]);

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

  const handleApprove = (recordId: string) => {
    updateAttendanceRecord(recordId, { status: 'approved' });
    loadEmployeeData();
  };

  const handleRemand = (recordId: string) => {
    updateAttendanceRecord(recordId, { status: 'remanded' });
    loadEmployeeData();
  };

  const handleExportCSV = () => {
    if (!employee) return;

    const headers = [
      '日付',
      '社員ID',
      '氏名',
      '出勤時刻',
      '退勤時刻',
      '休憩時間合計',
      '実働時間',
      '残業時間',
      '深夜時間',
      '業務内容',
      '備考',
      'ステータス',
    ];

    const rows = attendanceRecords.map((record) => {
      const breakMinutes = record.breaks.reduce((sum, b) => {
        const start = new Date(`2000-01-01 ${b.start}`);
        const end = new Date(`2000-01-01 ${b.end}`);
        return sum + (end.getTime() - start.getTime()) / 60000;
      }, 0);

      // 勤務時間枠の表示（最初と最後の時刻）
      const firstSpan = record.work_spans?.[0];
      const lastSpan = record.work_spans?.[record.work_spans.length - 1];
      const startTime = firstSpan?.start_time || '';
      const endTime = lastSpan?.end_time || '';

      return [
        record.date,
        employee.employee_id,
        employee.name,
        startTime,
        endTime,
        formatMinutesToString(breakMinutes),
        formatMinutesToString(record.computed_work_min),
        formatMinutesToString(record.computed_overtime_min),
        formatMinutesToString(record.computed_night_min),
        record.work_content,
        record.note,
        record.status === 'approved'
          ? '承認済'
          : record.status === 'pending'
          ? '申請中'
          : record.status === 'remanded'
          ? '差戻し'
          : '下書き',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `勤怠データ_${employee.name}_${currentYear}年${currentMonth}月.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            承認済
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            申請中
          </span>
        );
      case 'remanded':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            差戻し
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            下書き
          </span>
        );
      default:
        return null;
    }
  };

  if (authLoading || !adminUser || !employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  const totalWorkMinutes = attendanceRecords
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + r.computed_work_min, 0);
  const totalOvertimeMinutes = attendanceRecords
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + r.computed_overtime_min, 0);
  const totalNightMinutes = attendanceRecords
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + r.computed_night_min, 0);

  // 概算給与を計算（日本の労働基準法準拠: 基本給 + 残業割増 + 深夜割増）
  const estimatedSalary = calculateEstimatedSalary(
    totalWorkMinutes,
    totalOvertimeMinutes,
    totalNightMinutes,
    employee.hourly_wage
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/admin/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                戻る
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {employee.name} さんの勤怠詳細
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {employee.employee_id} | {currentYear}年{currentMonth}月
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV出力
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

          {/* サマリー */}
          <div>
            <h3 className="text-lg font-semibold mb-4">サマリー</h3>
            <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">総勤務時間</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatMinutesToString(totalWorkMinutes)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">残業時間</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatMinutesToString(totalOvertimeMinutes)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">深夜時間</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatMinutesToString(totalNightMinutes)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  22:00〜
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">概算給与</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ¥{estimatedSalary.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  時給: ¥{employee.hourly_wage.toLocaleString()} (残業+25%, 深夜+25%)
                </p>
              </CardContent>
            </Card>
          </div>
          </div>

          {/* 勤怠記録一覧 */}
          <Card>
            <CardHeader>
              <CardTitle>勤怠記録一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日付</TableHead>
                    <TableHead>出勤</TableHead>
                    <TableHead>退勤</TableHead>
                    <TableHead className="text-right">実働時間</TableHead>
                    <TableHead className="text-right">残業</TableHead>
                    <TableHead className="text-right">深夜</TableHead>
                    <TableHead>業務内容</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        勤怠記録がありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendanceRecords.map((record) => {
                      // 勤務時間枠の表示（最初と最後の時刻）
                      const firstSpan = record.work_spans?.[0];
                      const lastSpan = record.work_spans?.[record.work_spans.length - 1];
                      const startTime = firstSpan?.start_time || '-';
                      const endTime = lastSpan?.end_time || '-';

                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {format(new Date(record.date), 'M月d日(E)', { locale: ja })}
                          </TableCell>
                          <TableCell>{startTime}</TableCell>
                          <TableCell>{endTime}</TableCell>
                          <TableCell className="text-right">
                            {formatMinutesToString(record.computed_work_min)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatMinutesToString(record.computed_overtime_min)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatMinutesToString(record.computed_night_min)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {record.work_content || '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell>
                            {record.status === 'pending' && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApprove(record.id)}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemand(record.id)}
                                >
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
