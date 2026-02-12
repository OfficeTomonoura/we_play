-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 協力者 (collaborators)
CREATE TABLE IF NOT EXISTS collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255),
    company_kana VARCHAR(255),
    contact_name VARCHAR(255),
    contact_kana VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    category VARCHAR(100),
    zip_code VARCHAR(10),
    address VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. 正会員 (members)
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255),
    full_kana VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_staff BOOLEAN DEFAULT false,
    can_approve_line BOOLEAN DEFAULT false,
    line_user_id VARCHAR(50),
    high_school VARCHAR(255), -- 出身高校
    organization VARCHAR(255), -- 主たる所属
    position VARCHAR(100),    -- 役職
    project_role VARCHAR(100), -- 事業役割
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
 );

-- 3. 応募者 (applicants)
CREATE TABLE IF NOT EXISTS applicants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255),
    full_kana VARCHAR(255),
    school_name VARCHAR(255),
    grade VARCHAR(50),
    desired_role_1 VARCHAR(100),
    desired_role_2 VARCHAR(100),
    desired_role_3 VARCHAR(100),
    assigned_role VARCHAR(100),
    referral_source VARCHAR(255),
    referral_source_other TEXT,
    message TEXT,
    status VARCHAR(50) DEFAULT '新規', -- 新規, 確認済み, 選抜済 など
    line_user_id VARCHAR(50),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. LINEメッセージ (line_messages)
CREATE TABLE IF NOT EXISTS line_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type VARCHAR(50), -- external (対外), internal (対内)
    title VARCHAR(255),
    message_body TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES members(id) ON DELETE SET NULL, -- 作成者ID (外部キー)
    approved_by UUID REFERENCES members(id) ON DELETE SET NULL, -- 承認者ID (外部キー)
    approved_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, scheduled, sent, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. LINE受信メッセージ (line_received_messages)
CREATE TABLE IF NOT EXISTS line_received_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_user_id VARCHAR(50) NOT NULL,
    message_text TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comments for documentation (Optional but recommended)
COMMENT ON TABLE collaborators IS '事業協力者（企業・個人）の情報';
COMMENT ON TABLE members IS '福山JC正会員情報';
COMMENT ON TABLE applicants IS '外部公募による中高生応募者情報';
COMMENT ON TABLE line_messages IS '公式LINE配信メッセージ管理';
COMMENT ON TABLE line_received_messages IS 'LINE公式アカウント受信メッセージログ';
