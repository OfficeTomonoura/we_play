-- applicants テーブルに LINE連携用のカラムを追加する
-- 既に存在する場合はエラーにならないように DO ブロック等は使えない環境もあるため、単純な ALTER TABLE を使い、
-- 失敗しても問題ない運用にするか、あるいは安全な書き方をする。
-- Supabase SQL Editorで実行することを想定。

ALTER TABLE applicants ADD COLUMN IF NOT EXISTS line_user_id TEXT;
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS line_display_name TEXT;
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS line_picture_url TEXT;

-- インデックスを追加（検索しやすいように）
CREATE INDEX IF NOT EXISTS idx_applicants_line_user_id ON applicants(line_user_id);
