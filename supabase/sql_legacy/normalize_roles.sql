-- 1. 役職マスタテーブル (roles) の作成
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE, -- システム内部識別用 (director, actor, etc)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. 初期データの投入
INSERT INTO roles (name, code)
VALUES 
    ('監督', 'director'),
    ('演者', 'actor'),
    ('小道具', 'props'),
    ('プロデューサー', 'producer')
ON CONFLICT (code) DO NOTHING;

-- 3. 応募者の希望役職管理用 中間テーブル (applicant_role_preferences) の作成
-- 既存の desired_role_1, 2, 3 カラムの代わりに使用
CREATE TABLE IF NOT EXISTS applicant_role_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    preference_rank INTEGER NOT NULL CHECK (preference_rank BETWEEN 1 AND 3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(applicant_id, preference_rank) -- 1人の応募者につき、同じ順位は1つまで
);

-- 4. applicantsテーブルに配属役職IDカラムを追加 (assigned_role の正規化用)
ALTER TABLE applicants 
ADD COLUMN IF NOT EXISTS assigned_role_id UUID REFERENCES roles(id);

COMMENT ON TABLE roles IS '役職マスタ';
COMMENT ON TABLE applicant_role_preferences IS '応募者の希望役職（優先順位付き）';
COMMENT ON COLUMN applicants.assigned_role_id IS '決定した配属役職のID';
