-- 70件のダミーデータをmembersテーブルに挿入するスクリプト
-- ランダムな氏名、高校、所属、役職、役割を生成します。

INSERT INTO members (
    id,
    full_name,
    full_kana,
    high_school,
    organization_id,
    position_id,
    project_role_id,
    email,
    is_registered,
    created_at,
    updated_at
)
SELECT
    uuid_generate_v4(), -- ID
    
    -- ランダムな氏名生成
    (ARRAY['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水'])[floor(random() * 20 + 1)] || ' ' || 
    (ARRAY['太郎', '次郎', '花子', '健太', '美咲', '翔', '愛', '大輔', 'さくら', '拓也', '美優', '直人', '菜々子', '達也', '結衣', '健一', '千尋', '剛', '恵', '亮太'])[floor(random() * 20 + 1)],
    
    'ダミー カナ', -- 簡易的に固定（必要なら上記と同様にランダム化可能だが、表示確認用としては十分）

    -- ランダムな高校
    (ARRAY['福山誠之館高等学校', '福山葦陽高等学校', '福山明王台高等学校', '大門高等学校', '神辺旭高等学校', '福山工業高等学校', '福山商業高等学校', '近畿大学附属広島高等学校福山校', '盈進高等学校', '銀河学院高等学校'])[floor(random() * 10 + 1)],

    -- 所属 (ランダム)
    (SELECT id FROM master_organization ORDER BY random() LIMIT 1),

    -- 役職 (ランダム)
    (SELECT id FROM master_position ORDER BY random() LIMIT 1),

    -- 事業役割 (ランダム、NULLも含める場合は調整)
    (SELECT id FROM master_project_role ORDER BY random() LIMIT 1),

    -- ダミーEmail
    'dummy_' || floor(random() * 100000)::text || '@example.com',

    true, -- is_registered
    NOW(),
    NOW()
FROM
    generate_series(1, 70);
