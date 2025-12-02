-- usersテーブルのRLSポリシー修正
-- 実行方法: Supabase Dashboard > SQL Editor で実行

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- INSERT: 全ユーザーが従業員を作成できる（簡易版）
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT
  WITH CHECK (true);

-- UPDATE: 全ユーザーが従業員情報を更新できる（簡易版）
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE
  USING (true);

-- DELETE: 全ユーザーが従業員を削除できる（簡易版）
CREATE POLICY "users_delete_policy" ON users
  FOR DELETE
  USING (true);

-- 確認用クエリ
-- SELECT * FROM users;
