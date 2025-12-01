import { parse, differenceInMinutes, isAfter, isBefore, isWithinInterval } from 'date-fns';
import type { BreakTime, WorkSpan } from '@/types';

/**
 * 時刻文字列（HH:mm形式）をDate型に変換
 * @param time HH:mm形式の時刻文字列
 * @param baseDate 基準日（デフォルトは2000-01-01）
 */
export function parseTimeString(time: string, baseDate: string = '2000-01-01'): Date {
  return parse(time, 'HH:mm', parse(baseDate, 'yyyy-MM-dd', new Date()));
}

/**
 * 2つの時刻間の分数を計算
 * @param startTime 開始時刻（HH:mm形式）
 * @param endTime 終了時刻（HH:mm形式）
 * @returns 分数
 */
export function calculateMinutesBetween(startTime: string, endTime: string): number {
  const start = parseTimeString(startTime);
  let end = parseTimeString(endTime);

  // 終了時刻が開始時刻より前の場合、翌日とみなす
  if (isBefore(end, start)) {
    end = parse(endTime, 'HH:mm', parse('2000-01-02', 'yyyy-MM-dd', new Date()));
  }

  return differenceInMinutes(end, start);
}

/**
 * 休憩時間の合計を計算
 * @param breaks 休憩時間の配列
 * @returns 休憩時間の合計（分）
 */
export function calculateTotalBreakMinutes(breaks: BreakTime[]): number {
  return breaks.reduce((total, breakTime) => {
    return total + calculateMinutesBetween(breakTime.start, breakTime.end);
  }, 0);
}

/**
 * 実働時間を計算
 * @param startTime 出勤時刻
 * @param endTime 退勤時刻
 * @param breaks 休憩時間の配列
 * @returns 実働時間（分）
 */
export function calculateWorkMinutes(
  startTime: string,
  endTime: string,
  breaks: BreakTime[]
): number {
  const totalMinutes = calculateMinutesBetween(startTime, endTime);
  const breakMinutes = calculateTotalBreakMinutes(breaks);
  return Math.max(0, totalMinutes - breakMinutes);
}

/**
 * 残業時間を計算（8時間を超えた分）
 * @param workMinutes 実働時間（分）
 * @returns 残業時間（分）
 */
export function calculateOvertimeMinutes(workMinutes: number): number {
  const standardWorkMinutes = 8 * 60; // 8時間 = 480分
  return Math.max(0, workMinutes - standardWorkMinutes);
}

/**
 * 深夜労働時間を計算（22:00〜翌05:00）
 * @param startTime 出勤時刻
 * @param endTime 退勤時刻
 * @param breaks 休憩時間の配列
 * @returns 深夜労働時間（分）
 */
export function calculateNightMinutes(
  startTime: string,
  endTime: string,
  breaks: BreakTime[]
): number {
  const nightStart = parseTimeString('22:00');
  const nightEnd = parseTimeString('05:00', '2000-01-02');

  const start = parseTimeString(startTime);
  let end = parseTimeString(endTime);

  // 終了時刻が開始時刻より前の場合、翌日とみなす
  if (isBefore(end, start)) {
    end = parseTimeString(endTime, '2000-01-02');
  }

  let nightMinutes = 0;

  // 勤務時間と深夜時間帯の重なりを計算
  if (isAfter(end, nightStart) || isBefore(start, nightEnd)) {
    const workStart = start;
    const workEnd = end;

    // 22:00〜24:00の深夜時間を計算
    if (isAfter(workEnd, nightStart)) {
      const periodStart = isAfter(workStart, nightStart) ? workStart : nightStart;
      const periodEnd = workEnd;

      if (isAfter(periodEnd, periodStart)) {
        nightMinutes += differenceInMinutes(periodEnd, periodStart);
      }
    }

    // 翌日00:00〜05:00の深夜時間を計算
    const nextDayStart = parseTimeString('00:00', '2000-01-02');
    if (isAfter(workEnd, nextDayStart)) {
      const periodStart = isAfter(workStart, nextDayStart) ? workStart : nextDayStart;
      const periodEnd = isBefore(workEnd, nightEnd) ? workEnd : nightEnd;

      if (isAfter(periodEnd, periodStart)) {
        nightMinutes += differenceInMinutes(periodEnd, periodStart);
      }
    }
  }

  // 休憩時間を差し引く
  const breakMinutesInNight = breaks.reduce((total, breakTime) => {
    const breakStart = parseTimeString(breakTime.start);
    const breakEnd = parseTimeString(breakTime.end);

    // 休憩時間が深夜時間帯に含まれるかチェック
    // （簡略化のため、完全に深夜時間帯に含まれる場合のみカウント）
    if (
      (isWithinInterval(breakStart, { start: nightStart, end: nightEnd }) ||
       isWithinInterval(breakStart, { start: nextDayStart, end: nightEnd })) &&
      (isWithinInterval(breakEnd, { start: nightStart, end: nightEnd }) ||
       isWithinInterval(breakEnd, { start: nextDayStart, end: nightEnd }))
    ) {
      return total + calculateMinutesBetween(breakTime.start, breakTime.end);
    }
    return total;
  }, 0);

  return Math.max(0, nightMinutes - breakMinutesInNight);
}

/**
 * 分を時間と分に変換
 * @param minutes 分数
 * @returns {hours, minutes} のオブジェクト
 */
export function convertMinutesToHoursAndMinutes(minutes: number): { hours: number; minutes: number } {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return { hours, minutes: remainingMinutes };
}

/**
 * 分を「〇時間〇分」形式の文字列に変換
 * @param minutes 分数
 * @returns 「〇時間〇分」形式の文字列
 */
export function formatMinutesToString(minutes: number): string {
  const { hours, minutes: mins } = convertMinutesToHoursAndMinutes(minutes);
  if (hours > 0 && mins > 0) {
    return `${hours}時間${mins}分`;
  } else if (hours > 0) {
    return `${hours}時間`;
  } else {
    return `${mins}分`;
  }
}

/**
 * 概算給与を計算（日本の労働基準法準拠）
 * @param totalWorkMinutes 総実働時間（分）
 * @param overtimeMinutes 残業時間（分）
 * @param nightMinutes 深夜時間（分）
 * @param hourlyWage 時給（円）
 * @returns 概算給与（円）
 */
export function calculateEstimatedSalary(
  totalWorkMinutes: number,
  overtimeMinutes: number,
  nightMinutes: number,
  hourlyWage: number
): number {
  // 分を時間に変換
  const totalHours = totalWorkMinutes / 60;
  const overtimeHours = overtimeMinutes / 60;
  const nightHours = nightMinutes / 60;

  // 1. ベース給与（全ての労働時間 × 時給）
  const baseSalary = totalHours * hourlyWage;

  // 2. 残業割増（残業時間 × 時給 × 0.25）
  const overtimeAllowance = overtimeHours * hourlyWage * 0.25;

  // 3. 深夜割増（深夜時間 × 時給 × 0.25）
  const nightAllowance = nightHours * hourlyWage * 0.25;

  // 合計（整数に丸める）
  return Math.floor(baseSalary + overtimeAllowance + nightAllowance);
}

/**
 * 時刻文字列（HH:mm）を分に変換（シンプル版）
 * @param timeStr 時刻文字列
 * @returns 分数
 */
function timeToMinutes(timeStr: string | undefined): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

/**
 * 日次勤怠統計を計算（重複判定ロジック使用）
 * @param workSpans 勤務時間枠の配列
 * @param breaks 休憩時間の配列
 * @returns 実働時間、残業時間、深夜時間（分）
 */
export function calculateDailyStats(
  workSpans: WorkSpan[],
  breaks: BreakTime[]
): { workTime: number; overtime: number; nightTime: number } {
  let totalWorkMinutes = 0;
  let totalNightMinutes = 0;
  const NIGHT_START = 1320; // 22:00

  // 1. 勤務枠の計算（実働 ＆ 深夜）
  workSpans.forEach((span) => {
    const spanStart = timeToMinutes(span.start_time);
    const spanEnd = timeToMinutes(span.end_time);

    if (spanStart > 0 && spanEnd > spanStart) {
      // --- A. 実働時間の計算（前回と同じ） ---
      const duration = spanEnd - spanStart;
      let deduction = 0;

      // この枠内の休憩時間を計算
      breaks.forEach((brk) => {
        const brkStart = timeToMinutes(brk.start);
        const brkEnd = timeToMinutes(brk.end);
        if (brkEnd > brkStart) {
          const overlapStart = Math.max(spanStart, brkStart);
          const overlapEnd = Math.min(spanEnd, brkEnd);
          if (overlapEnd > overlapStart) {
            deduction += (overlapEnd - overlapStart);
          }
        }
      });

      const actualSpanDuration = Math.max(0, duration - deduction);
      totalWorkMinutes += actualSpanDuration;

      // --- B. 深夜時間の計算（新規追加） ---
      // 勤務枠のうち22:00以降の部分
      const nightWorkStart = Math.max(spanStart, NIGHT_START);
      const nightWorkEnd = Math.max(spanEnd, NIGHT_START); // 22:00より前ならStartと同じになるので0になる

      if (nightWorkEnd > nightWorkStart) {
        let nightDuration = nightWorkEnd - nightWorkStart;
        let nightDeduction = 0;

        // 深夜帯にかかっている休憩を引く
        breaks.forEach((brk) => {
          const brkStart = timeToMinutes(brk.start);
          const brkEnd = timeToMinutes(brk.end);
          if (brkEnd > brkStart) {
            // 「勤務枠内の休憩」かつ「22:00以降」の部分
            const brkOverlapStart = Math.max(nightWorkStart, brkStart);
            const brkOverlapEnd = Math.min(nightWorkEnd, brkEnd);

            if (brkOverlapEnd > brkOverlapStart) {
              nightDeduction += (brkOverlapEnd - brkOverlapStart);
            }
          }
        });

        totalNightMinutes += Math.max(0, nightDuration - nightDeduction);
      }
    }
  });

  // 2. 残業計算（変更なし）
  const overtimeMinutes = totalWorkMinutes > 480 ? totalWorkMinutes - 480 : 0;

  return {
    workTime: totalWorkMinutes,
    overtime: overtimeMinutes,
    nightTime: totalNightMinutes // 計算結果を返す
  };
}

/**
 * 複数の勤務時間枠から実働時間を計算（複数回出退勤対応）
 * @deprecated calculateDailyStats を使用してください
 * @param workSpans 勤務時間枠の配列
 * @param breaks 休憩時間の配列
 * @returns 実働時間（分）
 */
export function calculateWorkMinutesFromSpans(
  workSpans: WorkSpan[],
  breaks: BreakTime[]
): number {
  const result = calculateDailyStats(workSpans, breaks);
  return result.workTime;
}

/**
 * 複数の勤務時間枠から深夜労働時間を計算（複数回出退勤対応）
 * @param workSpans 勤務時間枠の配列
 * @param breaks 休憩時間の配列
 * @returns 深夜労働時間（分）
 */
export function calculateNightMinutesFromSpans(
  workSpans: WorkSpan[],
  breaks: BreakTime[]
): number {
  // 各勤務時間枠の深夜時間を合計
  const totalNightMinutes = workSpans.reduce((total, span) => {
    return total + calculateNightMinutes(span.start_time, span.end_time, []);
  }, 0);

  // 休憩時間が深夜帯に含まれる場合は差し引く
  const breakMinutesInNight = breaks.reduce((total, breakTime) => {
    const nightStart = parseTimeString('22:00');
    const nightEnd = parseTimeString('05:00', '2000-01-02');
    const nextDayStart = parseTimeString('00:00', '2000-01-02');

    const breakStart = parseTimeString(breakTime.start);
    const breakEnd = parseTimeString(breakTime.end);

    // 休憩時間が深夜時間帯に含まれるかチェック（簡略化版）
    if (
      (isWithinInterval(breakStart, { start: nightStart, end: nightEnd }) ||
       isWithinInterval(breakStart, { start: nextDayStart, end: nightEnd })) &&
      (isWithinInterval(breakEnd, { start: nightStart, end: nightEnd }) ||
       isWithinInterval(breakEnd, { start: nextDayStart, end: nightEnd }))
    ) {
      return total + calculateMinutesBetween(breakTime.start, breakTime.end);
    }
    return total;
  }, 0);

  return Math.max(0, totalNightMinutes - breakMinutesInNight);
}
