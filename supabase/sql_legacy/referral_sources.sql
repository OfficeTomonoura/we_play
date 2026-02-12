-- 1. 認知経路マスタテーブル (referral_sources) の作成
CREATE TABLE IF NOT EXISTS referral_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE, -- 名称 (学校の先生, ポスター, etc)
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. 初期データの投入
INSERT INTO referral_sources (name, display_order)
VALUES 
    ('学校の先生', 10),
    ('部活動の顧問', 20),
    ('ポスター・チラシ', 30),
    ('友人・知人', 40),
    ('家族', 50),
    ('SNS (Instagram/X)', 60),
    ('その他', 99)
ON CONFLICT (name) DO NOTHING;

-- 3. applicantsテーブルに認知経路IDカラムを追加
ALTER TABLE applicants 
ADD COLUMN IF NOT EXISTS referral_source_id UUID REFERENCES referral_sources(id);

COMMENT ON TABLE referral_sources IS '認知経路マスタ';
COMMENT ON COLUMN applicants.referral_source_id IS '選択された認知経路のID';
