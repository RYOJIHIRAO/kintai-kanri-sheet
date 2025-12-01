import { z } from 'zod';
import { isAfter, isFuture, parse } from 'date-fns';
import { parseTimeString } from './time-calculation';

/**
 * 時刻文字列（HH:mm形式）のバリデーション
 */
export const timeStringSchema = z
  .string()
  .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, '時刻はHH:mm形式で入力してください');

/**
 * 日付文字列（YYYY-MM-DD形式）のバリデーション
 */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください');

/**
 * 休憩時間のバリデーションスキーマ
 */
export const breakTimeSchema = z.object({
  start: timeStringSchema,
  end: timeStringSchema,
});

/**
 * 勤務時間枠のバリデーションスキーマ（複数回出退勤対応）
 */
export const workSpanSchema = z.object({
  id: z.string().min(1, 'IDは必須です'),
  start_time: timeStringSchema,
  end_time: timeStringSchema,
});

/**
 * 勤怠記録のバリデーションスキーマ（複数回出退勤対応）
 */
export const attendanceRecordSchema = z.object({
  date: dateStringSchema,
  work_spans: z.array(workSpanSchema).min(1, '少なくとも1つの勤務時間枠を入力してください'),
  breaks: z.array(breakTimeSchema).default([]),
  note: z.string().max(500, '備考は500文字以内で入力してください').optional().or(z.literal('')),
  work_content: z.string().max(500, '業務内容は500文字以内で入力してください').optional().or(z.literal('')),
  status: z.enum(['draft', 'pending', 'approved', 'remanded']),
});

/**
 * ユーザー情報のバリデーションスキーマ
 */
export const userSchema = z.object({
  name: z.string().min(1, '氏名を入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  employee_id: z.string().min(1, '社員番号を入力してください'),
  role: z.enum(['admin', 'user']),
  employment_type: z.enum(['regular', 'part_time', 'contract']),
  hourly_wage: z.number().min(0, '時給は0以上である必要があります'),
  closing_date: z.number().min(1).max(31, '締日は1〜31の範囲で指定してください'),
  password: z.string().min(6, 'パスワードは6文字以上である必要があります').optional(),
});

/**
 * ログイン情報のバリデーションスキーマ
 */
export const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

/**
 * 未来の日付かどうかをチェック
 */
export function isFutureDate(dateString: string): boolean {
  const date = parse(dateString, 'yyyy-MM-dd', new Date());
  return isFuture(date);
}
