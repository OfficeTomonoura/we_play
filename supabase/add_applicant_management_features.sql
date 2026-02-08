-- Migration: Add support for detailed applicant management
-- Created: 2026-02-08
-- Description: Adds emergency contact fields, support schedules, and comment system

-- 1. Add emergency contact fields to applicants table
ALTER TABLE applicants
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_category TEXT,
ADD COLUMN IF NOT EXISTS period_start DATE,
ADD COLUMN IF NOT EXISTS period_end DATE;

COMMENT ON COLUMN applicants.emergency_contact_phone IS '緊急連絡先の電話番号';
COMMENT ON COLUMN applicants.emergency_contact_category IS '緊急連絡先のカテゴリー（続柄・関係性）例: 母親の勤務先, 父親, 保護者';
COMMENT ON COLUMN applicants.period_start IS '活動期間開始日';
COMMENT ON COLUMN applicants.period_end IS '活動期間終了日';

-- 2. Create supporter schedules table
CREATE TABLE IF NOT EXISTS supporter_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    supporter_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

COMMENT ON TABLE supporter_schedules IS '選抜者の担当サポーター予定管理';
COMMENT ON COLUMN supporter_schedules.applicant_id IS '対象の選抜者ID';
COMMENT ON COLUMN supporter_schedules.supporter_name IS '担当サポーターの氏名';
COMMENT ON COLUMN supporter_schedules.start_date IS '担当開始日';
COMMENT ON COLUMN supporter_schedules.end_date IS '担当終了日';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_supporter_schedules_applicant_id ON supporter_schedules(applicant_id);
CREATE INDEX IF NOT EXISTS idx_supporter_schedules_dates ON supporter_schedules(start_date, end_date);

-- 3. Create applicant comments table
CREATE TABLE IF NOT EXISTS applicant_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_id UUID, -- 将来的にmembersテーブルと連携予定
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT content_length_limit CHECK (char_length(content) <= 2000)
);

COMMENT ON TABLE applicant_comments IS '選抜者への備考・コメント';
COMMENT ON COLUMN applicant_comments.applicant_id IS '対象の選抜者ID';
COMMENT ON COLUMN applicant_comments.author_name IS 'コメント記入者の氏名';
COMMENT ON COLUMN applicant_comments.author_id IS 'コメント記入者のID（将来的にmembersテーブルと連携）';
COMMENT ON COLUMN applicant_comments.content IS 'コメント内容（最大2000文字）';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_applicant_comments_applicant_id ON applicant_comments(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applicant_comments_created_at ON applicant_comments(created_at DESC);

-- 4. Create comment edit history table
CREATE TABLE IF NOT EXISTS comment_edit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES applicant_comments(id) ON DELETE CASCADE,
    previous_content TEXT NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE comment_edit_history IS 'コメントの編集履歴';
COMMENT ON COLUMN comment_edit_history.comment_id IS '編集されたコメントのID';
COMMENT ON COLUMN comment_edit_history.previous_content IS '編集前のコメント内容';
COMMENT ON COLUMN comment_edit_history.edited_at IS '編集日時';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_comment_edit_history_comment_id ON comment_edit_history(comment_id);

-- 5. Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Add triggers for updated_at columns
CREATE TRIGGER update_supporter_schedules_updated_at
    BEFORE UPDATE ON supporter_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applicant_comments_updated_at
    BEFORE UPDATE ON applicant_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
