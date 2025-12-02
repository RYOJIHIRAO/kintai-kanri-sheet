-- usersテーブルにpasswordカラムを追加し、管理者パスワードを更新
-- 実行方法: Supabase Dashboard > SQL Editor で実行

-- passwordカラムを追加（存在しない場合）
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- employment_typeカラムを追加（存在しない場合）
ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_type TEXT;

-- closing_dateカラムを追加（存在しない場合）
ALTER TABLE users ADD COLUMN IF NOT EXISTS closing_date INTEGER;

-- 管理者アカウントのパスワードを更新
UPDATE users
SET password = 'fkjahdiojFJ209u'
WHERE email = 'admin@example.com';

-- 従業員アカウントのパスワードを設定（まだ設定されていない場合）
UPDATE users
SET password = 'user123'
WHERE email = 'yamada@example.com' AND password IS NULL;

UPDATE users
SET password = 'user123'
WHERE email = 'sato@example.com' AND password IS NULL;

-- 確認用クエリ
SELECT employee_id, name, email, role, password FROM users;
