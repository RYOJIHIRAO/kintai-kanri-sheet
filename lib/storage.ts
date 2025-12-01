import type { User, AttendanceRecord } from '@/types';
import { supabase } from '@/lib/supabase';

/**
 * UUIDを生成
 */
export function generateId(): string {
  return crypto.randomUUID();
}

// ================== User関連 ==================

/**
 * すべてのユーザーを取得
 */
export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return data || [];
}

/**
 * ユーザーをIDで取得
 */
export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }

  return data;
}

/**
 * メールアドレスでユーザーを取得
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }

  return data;
}

/**
 * 社員IDでユーザーを取得
 */
export async function getUserByEmployeeId(employeeId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('employee_id', employeeId)
    .single();

  if (error) {
    console.error('Error fetching user by employee ID:', error);
    return null;
  }

  return data;
}

/**
 * ユーザーを作成
 */
export async function createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .insert([userData as any])
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    return null;
  }

  return data;
}

/**
 * ユーザーを更新
 */
export async function updateUser(id: string, userData: Partial<User>): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    return null;
  }

  return data;
}

/**
 * ユーザーを削除
 */
export async function deleteUser(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting user:', error);
    return false;
  }

  return true;
}

// ================== AttendanceRecord関連 ==================

/**
 * すべての勤怠記録を取得
 */
export async function getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching attendance records:', error);
    return [];
  }

  return data || [];
}

/**
 * 勤怠記録をIDで取得
 */
export async function getAttendanceRecordById(id: string): Promise<AttendanceRecord | null> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching attendance record by ID:', error);
    return null;
  }

  return data;
}

/**
 * ユーザーIDで勤怠記録を取得
 */
export async function getAttendanceRecordsByUserId(userId: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching attendance records by user ID:', error);
    return [];
  }

  return data || [];
}

/**
 * ユーザーIDと日付で勤怠記録を取得
 */
export async function getAttendanceRecordByUserIdAndDate(
  userId: string,
  date: string
): Promise<AttendanceRecord | null> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  if (error) {
    console.error('Error fetching attendance record by user ID and date:', error);
    return null;
  }

  return data;
}

/**
 * ユーザーIDと年月で勤怠記録を取得
 */
export async function getAttendanceRecordsByUserIdAndMonth(
  userId: string,
  year: number,
  month: number
): Promise<AttendanceRecord[]> {
  const monthStr = month.toString().padStart(2, '0');
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-31`;

  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching attendance records by user ID and month:', error);
    return [];
  }

  return data || [];
}

/**
 * ステータスで勤怠記録を取得
 */
export async function getAttendanceRecordsByStatus(status: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('status', status)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching attendance records by status:', error);
    return [];
  }

  return data || [];
}

/**
 * 勤怠記録を作成
 */
export async function createAttendanceRecord(
  recordData: Omit<AttendanceRecord, 'id' | 'created_at'>
): Promise<AttendanceRecord | null> {
  const { data, error } = await supabase
    .from('attendance_records')
    .insert([recordData])
    .select()
    .single();

  if (error) {
    console.error('Error creating attendance record:', error);
    return null;
  }

  return data;
}

/**
 * 勤怠記録を更新
 */
export async function updateAttendanceRecord(
  id: string,
  recordData: Partial<AttendanceRecord>
): Promise<AttendanceRecord | null> {
  const { data, error } = await supabase
    .from('attendance_records')
    .update(recordData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating attendance record:', error);
    return null;
  }

  return data;
}

/**
 * 勤怠記録を削除
 */
export async function deleteAttendanceRecord(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('attendance_records')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting attendance record:', error);
    return false;
  }

  return true;
}

// ================== Session関連 ==================
// セッション管理はクライアント側のLocalStorageを継続使用（簡易実装）

const STORAGE_KEY_CURRENT_USER = 'attendance_current_user';

/**
 * 現在のユーザーを取得（LocalStorage）
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;

  try {
    const item = window.localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error reading current user from localStorage:', error);
    return null;
  }
}

/**
 * 現在のユーザーを設定（LocalStorage）
 */
export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving current user to localStorage:', error);
  }
}

/**
 * ログアウト
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  }
}

/**
 * ログイン認証（簡易版）
 */
export async function authenticate(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email);

  // 開発用：パスワードが設定されていない場合は認証成功
  if (user && (!user.password || user.password === password)) {
    setCurrentUser(user);
    return user;
  }

  return null;
}

/**
 * 社員IDでログイン認証（簡易版）
 */
export async function authenticateByEmployeeId(employeeId: string, password: string): Promise<User | null> {
  const user = await getUserByEmployeeId(employeeId);

  // 開発用：パスワードが設定されていない場合は認証成功
  if (user && (!user.password || user.password === password)) {
    setCurrentUser(user);
    return user;
  }

  return null;
}
