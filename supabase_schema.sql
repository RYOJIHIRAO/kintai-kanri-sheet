-- 勤怠管理システムのSupabaseスキーマ定義
-- 実行方法: Supabase Dashboard > SQL Editor で実行

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'admin')),
  hourly_wage INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 勤怠記録テーブル
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  work_spans JSONB NOT NULL DEFAULT '[]'::jsonb,
  breaks JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'remanded')),
  note TEXT DEFAULT '',
  work_content TEXT DEFAULT '',
  computed_work_min INTEGER NOT NULL DEFAULT 0,
  computed_overtime_min INTEGER NOT NULL DEFAULT 0,
  computed_night_min INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_id ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_date ON attendance_records(user_id, date);

-- Row Level Security (RLS) の有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: usersテーブル
-- 全ユーザーが全ユーザー情報を読み取れる（簡易版）
CREATE POLICY "users_select_policy" ON users
  FOR SELECT
  USING (true);

-- RLSポリシー: attendance_recordsテーブル
-- 全ユーザーが全勤怠記録を読み取れる（簡易版）
CREATE POLICY "attendance_records_select_policy" ON attendance_records
  FOR SELECT
  USING (true);

-- 全ユーザーが勤怠記録を作成できる
CREATE POLICY "attendance_records_insert_policy" ON attendance_records
  FOR INSERT
  WITH CHECK (true);

-- 全ユーザーが勤怠記録を更新できる
CREATE POLICY "attendance_records_update_policy" ON attendance_records
  FOR UPDATE
  USING (true);

-- 全ユーザーが勤怠記録を削除できる
CREATE POLICY "attendance_records_delete_policy" ON attendance_records
  FOR DELETE
  USING (true);

-- 初期データ挿入（開発用）
INSERT INTO users (employee_id, name, email, role, hourly_wage)
VALUES
  ('E001', '山田太郎', 'yamada@example.com', 'employee', 1500),
  ('E002', '佐藤花子', 'sato@example.com', 'employee', 1400),
  ('A001', '管理者太郎', 'admin@example.com', 'admin', 2000)
ON CONFLICT (employee_id) DO NOTHING;

-- 確認用クエリ
-- SELECT * FROM users;
-- SELECT * FROM attendance_records;
