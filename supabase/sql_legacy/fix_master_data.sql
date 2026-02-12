-- マスタデータ修正スクリプト
-- このスクリプトは、フォームの動作に必要な master_school, master_role, master_referral_source テーブルが存在するか確認し、
-- 不足しているデータを作成・修正します。

-- 1. master_school (学校マスタ) の作成
CREATE TABLE IF NOT EXISTS master_school (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- '中学校' または '高校'
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- データが存在しない場合のみ、デフォルトの学校データを挿入
INSERT INTO master_school (name, type, sort_order)
SELECT '福山中学校', '中学校', 10
WHERE NOT EXISTS (SELECT 1 FROM master_school WHERE name = '福山中学校');

INSERT INTO master_school (name, type, sort_order)
SELECT '福山高校', '高校', 20
WHERE NOT EXISTS (SELECT 1 FROM master_school WHERE name = '福山高校');

INSERT INTO master_school (name, type, sort_order)
SELECT '備後中学校', '中学校', 30
WHERE NOT EXISTS (SELECT 1 FROM master_school WHERE name = '備後中学校');

INSERT INTO master_school (name, type, sort_order)
SELECT '福山第一高校', '高校', 40
WHERE NOT EXISTS (SELECT 1 FROM master_school WHERE name = '福山第一高校');

INSERT INTO master_school (name, type, sort_order)
SELECT '南部中学校', '中学校', 50
WHERE NOT EXISTS (SELECT 1 FROM master_school WHERE name = '南部中学校');


-- 2. master_role (役職マスタ) の作成またはリネーム
DO $$
BEGIN
    -- 'roles' テーブルがあり、'master_role' がない場合はリネームする
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'roles') 
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'master_role') THEN
        ALTER TABLE roles RENAME TO master_role;
    -- 'master_role' も 'roles' もない場合は新規作成
    ELSIF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'master_role') THEN
        CREATE TABLE master_role (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    END IF;
END $$;

-- 役職データの確認と不足分の挿入
INSERT INTO master_role (name, sort_order)
SELECT '監督', 10 WHERE NOT EXISTS (SELECT 1 FROM master_role WHERE name = '監督');
INSERT INTO master_role (name, sort_order)
SELECT '演者', 20 WHERE NOT EXISTS (SELECT 1 FROM master_role WHERE name = '演者');
INSERT INTO master_role (name, sort_order)
SELECT '小道具', 30 WHERE NOT EXISTS (SELECT 1 FROM master_role WHERE name = '小道具');
INSERT INTO master_role (name, sort_order)
SELECT 'プロデューサー', 40 WHERE NOT EXISTS (SELECT 1 FROM master_role WHERE name = 'プロデューサー');


-- 3. master_referral_source (認知経路マスタ) の作成またはリネーム
DO $$
BEGIN
    -- 'referral_sources' テーブルがあり、'master_referral_source' がない場合はリネーム
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'referral_sources') 
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'master_referral_source') THEN
        ALTER TABLE referral_sources RENAME TO master_referral_source;
    -- どちらもない場合は新規作成
    ELSIF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'master_referral_source') THEN
        CREATE TABLE master_referral_source (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    END IF;
END $$;

-- 認知経路データの確認と不足分の挿入
INSERT INTO master_referral_source (name, sort_order)
SELECT '学校の先生', 10 WHERE NOT EXISTS (SELECT 1 FROM master_referral_source WHERE name = '学校の先生');
INSERT INTO master_referral_source (name, sort_order)
SELECT '部活動の顧問', 20 WHERE NOT EXISTS (SELECT 1 FROM master_referral_source WHERE name = '部活動の顧問');
INSERT INTO master_referral_source (name, sort_order)
SELECT 'ポスター・チラシ', 30 WHERE NOT EXISTS (SELECT 1 FROM master_referral_source WHERE name = 'ポスター・チラシ');
INSERT INTO master_referral_source (name, sort_order)
SELECT '友人・知人', 40 WHERE NOT EXISTS (SELECT 1 FROM master_referral_source WHERE name = '友人・知人');
INSERT INTO master_referral_source (name, sort_order)
SELECT '家族', 50 WHERE NOT EXISTS (SELECT 1 FROM master_referral_source WHERE name = '家族');
INSERT INTO master_referral_source (name, sort_order)
SELECT 'SNS (Instagram/X)', 60 WHERE NOT EXISTS (SELECT 1 FROM master_referral_source WHERE name = 'SNS (Instagram/X)');
INSERT INTO master_referral_source (name, sort_order)
SELECT 'その他', 99 WHERE NOT EXISTS (SELECT 1 FROM master_referral_source WHERE name = 'その他');


-- 4. RLS (Row Level Security) の設定と公開アクセスの許可
-- 匿名ユーザーがフォームでリストを取得できるようにするために必要です

-- master_school
ALTER TABLE master_school ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read School" ON master_school;
CREATE POLICY "Public Read School" ON master_school FOR SELECT TO anon, authenticated USING (true);

-- master_role
ALTER TABLE master_role ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Role" ON master_role;
CREATE POLICY "Public Read Role" ON master_role FOR SELECT TO anon, authenticated USING (true);

-- master_referral_source
ALTER TABLE master_referral_source ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Referrals" ON master_referral_source;
CREATE POLICY "Public Read Referrals" ON master_referral_source FOR SELECT TO anon, authenticated USING (true);

-- 完了メッセージ (ログ出力などがない環境では表示されませんが、区切りとして)
-- SELECT 'Master Data Fix Completed' as status;
