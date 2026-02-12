-- applicants テーブルに不足しているカラムを追加
ALTER TABLE applicants 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

COMMENT ON COLUMN applicants.email IS '連絡用メールアドレス';
COMMENT ON COLUMN applicants.phone IS '連絡用電話番号';
