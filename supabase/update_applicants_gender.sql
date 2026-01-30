-- applicants テーブルに gender カラムを追加
ALTER TABLE applicants 
ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

COMMENT ON COLUMN applicants.gender IS '性別';
