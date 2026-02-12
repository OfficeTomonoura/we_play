-- 1. Get IDs for random selection
-- We will use some common role names and referral sources since we know they exist from previous migration files.

DO $$
DECLARE
    role_director UUID;
    role_actor UUID;
    role_props UUID;
    role_producer UUID;
    ref_teacher UUID;
    ref_friend UUID;
    ref_sns UUID;
    school_id UUID;
    i INTEGER;
    names TEXT[] := ARRAY['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤'];
    first_names TEXT[] := ARRAY['太郎', '花子', '健太', '美咲', '一郎', '由美', '直樹', '恵', '拓海', '舞'];
    school_names TEXT[] := ARRAY['福山中学校', '福山高校', '備後中学校', '福山第一高校', '南部中学校'];
BEGIN
    -- Get some base IDs
    SELECT id INTO role_director FROM master_role WHERE name = '監督' LIMIT 1;
    SELECT id INTO role_actor FROM master_role WHERE name = '演者' LIMIT 1;
    SELECT id INTO role_props FROM master_role WHERE name = '小道具' LIMIT 1;
    SELECT id INTO role_producer FROM master_role WHERE name = 'プロデューサー' LIMIT 1;
    
    SELECT id INTO ref_teacher FROM master_referral_source WHERE name = '学校の先生' LIMIT 1;
    SELECT id INTO ref_friend FROM master_referral_source WHERE name = '友人・知人' LIMIT 1;
    SELECT id INTO ref_sns FROM master_referral_source WHERE name = 'SNS (Instagram/X)' LIMIT 1;

    -- Ensure schools exist for dummy data
    FOR i IN 1..5 LOOP
        INSERT INTO master_school (name, type, sort_order)
        VALUES (school_names[i], CASE WHEN school_names[i] LIKE '%高校' THEN '高校' ELSE '中学校' END, i * 10)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Insert 70 dummy applicants
    FOR i IN 1..70 LOOP
        SELECT id INTO school_id FROM master_school ORDER BY random() LIMIT 1;
        
        INSERT INTO applicants (
            full_name,
            full_kana,
            gender,
            school_id,
            grade,
            desired_role_1_id,
            desired_role_2_id,
            desired_role_3_id,
            referral_source_id,
            email,
            phone,
            message,
            status,
            created_at
        ) VALUES (
            names[floor(random() * 10) + 1] || ' ' || first_names[floor(random() * 10) + 1],
            'ダミー',
            CASE WHEN random() > 0.5 THEN '男性' ELSE '女性' END,
            school_id,
            (floor(random() * 3) + 1) || '年生',
            (SELECT id FROM master_role ORDER BY random() LIMIT 1),
            (SELECT id FROM master_role ORDER BY random() LIMIT 1),
            (SELECT id FROM master_role ORDER BY random() LIMIT 1),
            (SELECT id FROM master_referral_source ORDER BY random() LIMIT 1),
            'dummy' || i || '@example.com',
            '090-0000-' || LPAD(i::text, 4, '0'),
            'これはダミーメッセージです。番号: ' || i,
            CASE 
                WHEN random() > 0.8 THEN '採用'
                WHEN random() > 0.6 THEN '確認済み'
                WHEN random() > 0.4 THEN '不採用'
                ELSE '新規'
            END,
            now() - (random() * interval '30 days')
        );
    END LOOP;
END $$;
