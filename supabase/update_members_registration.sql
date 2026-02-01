-- members テーブルに is_registered カラムを追加
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_registered BOOLEAN DEFAULT false;

-- 既存のデータを更新（必要であれば。既存ユーザーは登録済みとする場合）
-- UPDATE members SET is_registered = true WHERE full_name IS NOT NULL;
