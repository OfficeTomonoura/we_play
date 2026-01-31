-- 1. 認知経路マスタテーブルの統一 (既存があればリネーム、なければ作成)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'referral_sources') THEN
        ALTER TABLE referral_sources RENAME TO master_referral_source;
    ELSE
        CREATE TABLE IF NOT EXISTS master_referral_source (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL UNIQUE,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    END IF;
END $$;

-- display_order を sort_order に統一 (既存カラム名が違う場合)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'master_referral_source' AND column_name = 'display_order') THEN
        ALTER TABLE master_referral_source RENAME COLUMN display_order TO sort_order;
    END IF;
END $$;

-- 2. 初期データ (既存データがない場合のみ)
INSERT INTO master_referral_source (name, sort_order)
VALUES 
    ('学校の先生', 10),
    ('部活動の顧問', 20),
    ('ポスター・チラシ', 30),
    ('友人・知人', 40),
    ('家族', 50),
    ('SNS (Instagram/X)', 60),
    ('その他', 99)
ON CONFLICT (name) DO NOTHING;

-- 3. applicantsテーブルへの外部キーカラム追加 (既存であればスキップ)
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS referral_source_id UUID REFERENCES master_referral_source(id);

-- 4. データ移行: テキスト値に基づいてIDをセット
UPDATE applicants a
SET referral_source_id = rs.id
FROM master_referral_source rs
WHERE (a.referral_source = rs.name OR 
      (a.referral_source = 'teacher' AND rs.name = '学校の先生') OR
      (a.referral_source = 'advisor' AND rs.name = '部活動の顧問') OR
      (a.referral_source = 'friend' AND rs.name = '友人・知人') OR
      (a.referral_source = 'poster' AND rs.name = 'ポスター・チラシ') OR
      (a.referral_source = 'family' AND rs.name = '家族') OR
      (a.referral_source = 'sns' AND rs.name = 'SNS (Instagram/X)') OR
      (a.referral_source = 'other' AND rs.name = 'その他'))
AND a.referral_source_id IS NULL;

-- 5. 古いカラムを削除
ALTER TABLE applicants DROP COLUMN IF EXISTS referral_source;

-- 6. RLS設定
ALTER TABLE master_referral_source ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON master_referral_source;
CREATE POLICY "Public Read Access" ON master_referral_source FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin All Access" ON master_referral_source;
CREATE POLICY "Admin All Access" ON master_referral_source FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMENT ON TABLE master_referral_source IS '認知経路マスター';
