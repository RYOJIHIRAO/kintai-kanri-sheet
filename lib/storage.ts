import type { User, AttendanceRecord, WorkSpan } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * LocalStorageのキー定義
 */
const STORAGE_KEYS = {
  USERS: 'attendance_users',
  ATTENDANCE_RECORDS: 'attendance_records',
  CURRENT_USER: 'attendance_current_user',
} as const;

/**
 * LocalStorageからデータを取得
 */
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * LocalStorageにデータを保存
 */
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
}

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
export function getAllUsers(): User[] {
  return getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
}

/**
 * ユーザーをIDで取得
 */
export function getUserById(id: string): User | undefined {
  const users = getAllUsers();
  return users.find((user) => user.id === id);
}

/**
 * メールアドレスでユーザーを取得
 */
export function getUserByEmail(email: string): User | undefined {
  const users = getAllUsers();
  return users.find((user) => user.email === email);
}

/**
 * ユーザーを作成
 */
export function createUser(userData: Omit<User, 'id'>): User {
  const users = getAllUsers();
  const newUser: User = {
    ...userData,
    id: generateId(),
  };
  users.push(newUser);
  saveToStorage(STORAGE_KEYS.USERS, users);
  return newUser;
}

/**
 * ユーザーを更新
 */
export function updateUser(id: string, userData: Partial<User>): User | undefined {
  const users = getAllUsers();
  const index = users.findIndex((user) => user.id === id);

  if (index === -1) return undefined;

  users[index] = { ...users[index], ...userData };
  saveToStorage(STORAGE_KEYS.USERS, users);
  return users[index];
}

/**
 * ユーザーを削除
 */
export function deleteUser(id: string): boolean {
  const users = getAllUsers();
  const filteredUsers = users.filter((user) => user.id !== id);

  if (filteredUsers.length === users.length) return false;

  saveToStorage(STORAGE_KEYS.USERS, filteredUsers);
  return true;
}

// ================== AttendanceRecord関連 ==================

/**
 * 旧形式のデータを新形式にマイグレーション
 */
function migrateAttendanceRecords(records: any[]): AttendanceRecord[] {
  let needsSave = false;

  const migratedRecords = records.map((record) => {
    // 旧形式（start_time/end_time）のデータをwork_spans配列に変換
    if (record.start_time && record.end_time && !record.work_spans) {
      console.log(`マイグレーション中: ${record.id} (${record.date})`);
      needsSave = true;

      const workSpan: WorkSpan = {
        id: uuidv4(),
        start_time: record.start_time,
        end_time: record.end_time,
      };

      // 新形式に変換（start_time/end_timeは削除）
      const { start_time, end_time, ...rest } = record;
      return {
        ...rest,
        work_spans: [workSpan],
      } as AttendanceRecord;
    }

    // 既に新形式の場合はそのまま返す
    return record as AttendanceRecord;
  });

  // マイグレーションが行われた場合は保存
  if (needsSave) {
    console.log('マイグレーションされたデータを保存中...');
    saveToStorage(STORAGE_KEYS.ATTENDANCE_RECORDS, migratedRecords);
  }

  return migratedRecords;
}

/**
 * すべての勤怠記録を取得（自動マイグレーション付き）
 */
export function getAllAttendanceRecords(): AttendanceRecord[] {
  const rawRecords = getFromStorage<any[]>(STORAGE_KEYS.ATTENDANCE_RECORDS, []);
  return migrateAttendanceRecords(rawRecords);
}

/**
 * 勤怠記録をIDで取得
 */
export function getAttendanceRecordById(id: string): AttendanceRecord | undefined {
  const records = getAllAttendanceRecords();
  return records.find((record) => record.id === id);
}

/**
 * ユーザーIDで勤怠記録を取得
 */
export function getAttendanceRecordsByUserId(userId: string): AttendanceRecord[] {
  const records = getAllAttendanceRecords();
  return records.filter((record) => record.user_id === userId);
}

/**
 * ユーザーIDと日付で勤怠記録を取得
 */
export function getAttendanceRecordByUserIdAndDate(
  userId: string,
  date: string
): AttendanceRecord | undefined {
  const records = getAllAttendanceRecords();
  return records.find((record) => record.user_id === userId && record.date === date);
}

/**
 * ユーザーIDと年月で勤怠記録を取得
 */
export function getAttendanceRecordsByUserIdAndMonth(
  userId: string,
  year: number,
  month: number
): AttendanceRecord[] {
  const records = getAttendanceRecordsByUserId(userId);
  const monthStr = month.toString().padStart(2, '0');

  return records.filter((record) => {
    const [recordYear, recordMonth] = record.date.split('-');
    return recordYear === year.toString() && recordMonth === monthStr;
  });
}

/**
 * 勤怠記録を作成
 */
export function createAttendanceRecord(
  recordData: Omit<AttendanceRecord, 'id'>
): AttendanceRecord {
  const records = getAllAttendanceRecords();
  const newRecord: AttendanceRecord = {
    ...recordData,
    id: generateId(),
  };
  records.push(newRecord);
  saveToStorage(STORAGE_KEYS.ATTENDANCE_RECORDS, records);
  return newRecord;
}

/**
 * 勤怠記録を更新
 */
export function updateAttendanceRecord(
  id: string,
  recordData: Partial<AttendanceRecord>
): AttendanceRecord | undefined {
  const records = getAllAttendanceRecords();
  const index = records.findIndex((record) => record.id === id);

  if (index === -1) return undefined;

  records[index] = { ...records[index], ...recordData };
  saveToStorage(STORAGE_KEYS.ATTENDANCE_RECORDS, records);
  return records[index];
}

/**
 * 勤怠記録を削除
 */
export function deleteAttendanceRecord(id: string): boolean {
  const records = getAllAttendanceRecords();
  const filteredRecords = records.filter((record) => record.id !== id);

  if (filteredRecords.length === records.length) return false;

  saveToStorage(STORAGE_KEYS.ATTENDANCE_RECORDS, filteredRecords);
  return true;
}

// ================== Session関連 ==================

/**
 * 現在のユーザーを取得
 */
export function getCurrentUser(): User | null {
  return getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
}

/**
 * 現在のユーザーを設定
 */
export function setCurrentUser(user: User): void {
  saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
}

/**
 * ログアウト
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

/**
 * ログイン認証（簡易版）
 */
export function authenticate(email: string, password: string): User | null {
  const user = getUserByEmail(email);

  // 開発用：パスワードが設定されていない場合は認証成功
  if (user && (!user.password || user.password === password)) {
    setCurrentUser(user);
    return user;
  }

  return null;
}

// ================== 初期データ ==================

/**
 * 初期データをセットアップ
 */
export function setupInitialData(): void {
  const existingUsers = getAllUsers();

  if (existingUsers.length === 0) {
    // 管理者ユーザーを作成
    createUser({
      name: '管理者',
      email: 'admin@example.com',
      employee_id: 'ADMIN001',
      role: 'admin',
      employment_type: 'regular',
      hourly_wage: 2000,
      closing_date: 31,
      password: 'admin123',
    });

    // 一般ユーザーを作成
    createUser({
      name: '山田太郎',
      email: 'yamada@example.com',
      employee_id: 'EMP001',
      role: 'user',
      employment_type: 'regular',
      hourly_wage: 1500,
      closing_date: 31,
      password: 'user123',
    });

    createUser({
      name: '佐藤花子',
      email: 'sato@example.com',
      employee_id: 'EMP002',
      role: 'user',
      employment_type: 'part_time',
      hourly_wage: 1200,
      closing_date: 31,
      password: 'user123',
    });
  }
}
