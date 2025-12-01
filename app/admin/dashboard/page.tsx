'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Users, Calendar, Eye, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
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
  getAllUsers,
  getAttendanceRecordsByUserIdAndMonth,
  getAllAttendanceRecords,
} from '@/lib/storage';
import type { User, AttendanceRecord } from '@/types';
import { formatMinutesToString } from '@/utils/time-calculation';

interface EmployeeSummary {
  user: User;
  totalWorkMinutes: number;
  totalOvertimeMinutes: number;
  totalDaysWorked: number;
  pendingCount: number;
  approvedCount: number;
}

export default function AdminDashboardPage() {
  const { user, isLoading, logout } = useAuth('admin');
  const router = useRouter();

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [employeeSummaries, setEmployeeSummaries] = useState<EmployeeSummary[]>([]);
  const [totalRecordsThisMonth, setTotalRecordsThisMonth] = useState(0);

  const loadEmployeeSummaries = useCallback(async () => {
    const allUsers = await getAllUsers();
    const users = allUsers.filter((u) => u.role === 'user');

    const summaries: EmployeeSummary[] = await Promise.all(
      users.map(async (u) => {
        const records = await getAttendanceRecordsByUserIdAndMonth(u.id, currentYear, currentMonth);

        const totalWorkMinutes = records.reduce((sum, r) => sum + r.computed_work_min, 0);
        const totalOvertimeMinutes = records.reduce((sum, r) => sum + r.computed_overtime_min, 0);
        const totalDaysWorked = records.filter((r) => r.status === 'approved').length;
        const pendingCount = records.filter((r) => r.status === 'pending').length;
        const approvedCount = records.filter((r) => r.status === 'approved').length;

        return {
          user: u,
          totalWorkMinutes,
          totalOvertimeMinutes,
          totalDaysWorked,
          pendingCount,
          approvedCount,
        };
      })
    );

    setEmployeeSummaries(summaries);

    // 今月の全レコード数を計算
    const allRecords = await getAllAttendanceRecords();
    const recordsCount = allRecords.filter((r) => {
      const [year, month] = r.date.split('-');
      return parseInt(year) === currentYear && parseInt(month) === currentMonth;
    }).length;
    setTotalRecordsThisMonth(recordsCount);
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadEmployeeSummaries();
  }, [loadEmployeeSummaries]);

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

  const handleViewEmployee = (userId: string) => {
    router.push(`/admin/attendance/${userId}`);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  const totalEmployees = employeeSummaries.length;
  const totalPending = employeeSummaries.reduce((sum, s) => sum + s.pendingCount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>
              <p className="text-sm text-gray-600 mt-1">
                {user.name} さん (管理者)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/employees')}
              >
                <Users className="h-4 w-4 mr-2" />
                従業員管理
              </Button>
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </div>
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

          {/* サマリーカード */}
          <div>
            <h3 className="text-lg font-semibold mb-4">概要</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">従業員数</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalEmployees}名</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    一般従業員
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalPending}件</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    申請中の勤怠記録
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">総記録数</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalRecordsThisMonth}件</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    当月の勤怠記録
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 従業員一覧 */}
          <Card>
            <CardHeader>
              <CardTitle>従業員別 勤怠状況</CardTitle>
              <CardDescription>
                {currentYear}年{currentMonth}月の勤怠集計
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>社員番号</TableHead>
                    <TableHead>氏名</TableHead>
                    <TableHead>雇用形態</TableHead>
                    <TableHead className="text-right">出勤日数</TableHead>
                    <TableHead className="text-right">総勤務時間</TableHead>
                    <TableHead className="text-right">残業時間</TableHead>
                    <TableHead className="text-right">承認待ち</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeSummaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        従業員データがありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    employeeSummaries.map((summary) => (
                      <TableRow key={summary.user.id}>
                        <TableCell className="font-medium">
                          {summary.user.employee_id}
                        </TableCell>
                        <TableCell>{summary.user.name}</TableCell>
                        <TableCell>
                          {summary.user.employment_type === 'regular'
                            ? '正社員'
                            : summary.user.employment_type === 'part_time'
                            ? 'アルバイト'
                            : '業務委託'}
                        </TableCell>
                        <TableCell className="text-right">
                          {summary.totalDaysWorked}日
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMinutesToString(summary.totalWorkMinutes)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMinutesToString(summary.totalOvertimeMinutes)}
                        </TableCell>
                        <TableCell className="text-right">
                          {summary.pendingCount > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {summary.pendingCount}件
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewEmployee(summary.user.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            詳細
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
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
