/**
 * 従業員情報の型定義
 */
export interface User {
  id: string; // UUID
  name: string; // 氏名
  email: string; // ログインIDとして使用
  employee_id: string; // 社員番号 (Unique)
  role: 'admin' | 'user'; // 権限
  employment_type: 'regular' | 'part_time' | 'contract'; // 正社員 / アルバイト / 業務委託
  hourly_wage: number; // 時給 (円)
  closing_date: number; // 締日 (例: 15, 20, 31=末日)
  password?: string; // パスワード (実装時のみ、保存時はハッシュ化)
}

/**
 * 勤務時間枠の型定義（複数回出退勤対応）
 */
export interface WorkSpan {
  id: string; // 一意なID (UUID等)
  start_time: string; // 'HH:mm' 形式 (出勤)
  end_time: string; // 'HH:mm' 形式 (退勤)
}

/**
 * 休憩時間の型定義
 */
export interface BreakTime {
  start: string; // 'HH:mm' 形式
  end: string; // 'HH:mm' 形式
}

/**
 * 勤怠記録のステータス
 */
export type AttendanceStatus = 'draft' | 'pending' | 'approved' | 'remanded';

/**
 * 勤怠記録の型定義（複数回出退勤対応）
 */
export interface AttendanceRecord {
  id: string; // UUID
  user_id: string; // Userテーブルへの外部キー
  date: string; // 'YYYY-MM-DD' 形式
  work_spans: WorkSpan[]; // 勤務時間枠の配列（複数回の出退勤に対応）
  breaks: BreakTime[]; // 休憩時間の配列
  note: string; // 備考（遅刻・早退理由など）
  status: AttendanceStatus; // 下書き/申請中/承認済/差戻し
  work_content: string; // 業務内容
  computed_work_min: number; // 実働時間（分）※自動計算
  computed_overtime_min: number; // 残業時間（分）※自動計算
  computed_night_min: number; // 深夜時間（分）※自動計算
}

/**
 * 月次集計データの型定義
 */
export interface MonthlySummary {
  user_id: string;
  year: number;
  month: number;
  total_work_min: number; // 総実働時間（分）
  total_overtime_min: number; // 総残業時間（分）
  total_night_min: number; // 総深夜時間（分）
  total_days_worked: number; // 出勤日数
  estimated_salary: number; // 概算給与（円）
}

/**
 * ログイン認証情報の型定義
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * セッション情報の型定義
 */
export interface Session {
  user: User;
  token?: string;
}
