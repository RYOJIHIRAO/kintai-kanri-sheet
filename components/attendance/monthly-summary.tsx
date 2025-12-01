'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AttendanceRecord, User } from '@/types';
import { formatMinutesToString, calculateEstimatedSalary } from '@/utils/time-calculation';

interface MonthlySummaryProps {
  user: User;
  attendanceRecords: AttendanceRecord[];
}

export function MonthlySummary({ user, attendanceRecords }: MonthlySummaryProps) {
  // 承認済みの記録のみを集計
  const approvedRecords = attendanceRecords.filter((record) => record.status === 'approved');

  const totalWorkMinutes = approvedRecords.reduce(
    (sum, record) => sum + record.computed_work_min,
    0
  );

  const totalOvertimeMinutes = approvedRecords.reduce(
    (sum, record) => sum + record.computed_overtime_min,
    0
  );

  const totalNightMinutes = approvedRecords.reduce(
    (sum, record) => sum + record.computed_night_min,
    0
  );

  const totalDaysWorked = approvedRecords.length;

  // 概算給与を計算（日本の労働基準法準拠: 基本給 + 残業割増 + 深夜割増）
  const estimatedSalary = calculateEstimatedSalary(
    totalWorkMinutes,
    totalOvertimeMinutes,
    totalNightMinutes,
    user.hourly_wage
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">総勤務時間</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatMinutesToString(totalWorkMinutes)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            出勤日数: {totalDaysWorked}日
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">残業時間</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatMinutesToString(totalOvertimeMinutes)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalOvertimeMinutes > 0 ? '8時間超過分' : '残業なし'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">深夜労働時間</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatMinutesToString(totalNightMinutes)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            22:00〜05:00
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">概算給与</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">¥{estimatedSalary.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            時給: ¥{user.hourly_wage.toLocaleString()} (残業+25%, 深夜+25%)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
