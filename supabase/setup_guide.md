# Supabase 連携セットアップガイド

このプロジェクトを Supabase と連携させるための手順です。

## 1. Supabase プロジェクトの作成
1. [Supabase](https://supabase.com/) にアクセスし、ログインします。
2. 「New Project」をクリックして新しいプロジェクトを作成します。
   - **Name**: We Play (任意)
   - **Database Password**: 強力なパスワードを設定し、保存しておいてください。
   - **Region**: Tokyo (Japan) を推奨します。

## 2. データベース（テーブル）の作成
プロジェクトが作成されたら、以下のファイルの内容を SQL Editor で実行してテーブルを作成します。

1. 左サイドバーから **SQL Editor** アイコンをクリックします。
2. 「New Query」をクリックします。
3. 以下のファイルの SQL を **順番に** 実行してください。

### 実行順序

1. **`supabase/schema.sql`**
   - 基盤となるテーブル（members, applicantsなど）を作成します。

2. **`supabase/update_applicants.sql`**
   - applicants テーブルに `phone`, `email` カラムなどを追加します。

3. **`supabase/update_applicants_gender.sql`**
   - applicants テーブルに `gender` カラムを追加します。

4. **`supabase/normalize_roles.sql`**
   - 役職マスタ (`roles`) の作成と、役職希望の中間テーブル (`applicant_role_preferences`) 作成。
   - applicants テーブルに `assigned_role_id` (決定役職ID) を追加。

5. **`supabase/referral_sources.sql`**
   - 認知経路マスタ (`referral_sources`) の作成。
   - applicants テーブルに `referral_source_id` (認知経路ID) を追加。

## 3. クライアントライブラリのセットアップ

### HTMLでの読み込み
HTMLファイルの `<head>` または `<body>` の最後（他のスクリプトより前）に以下のコードを追加して、Supabase JS ライブラリを読み込みます。

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### 初期化スクリプトの作成
プロジェクトルートの `assets/js` などに `supabase-client.js` を作成し、以下のように記述します。

```javascript
// Supabaseクライアントの初期化
// ※実際のURLとKEYはSupabaseダッシュボードの Project Settings > API から取得してください。
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// グローバルで使えるようにする（必要であれば）
window.supabaseClient = supabase;
```

## 4. データベース設計の変更履歴と構造

### 主要テーブル

#### `applicants` (応募者テーブル)
Webフォームからの応募データを格納します。
- `id`: UUID (Primary Key)
- `full_name`: 氏名
- `grade`: 学年（"〇〇年生"）
- `gender`: 性別 ('男', '女', '選択しない')
- `email`: メールアドレス
- `phone`: 電話番号
- `status`: ステータス ('新規', '確認済み', '採用', '不採用')
- `referral_source`: 認知経路コード（旧仕様・互換性のため維持）
- `referral_source_id`: **(New)** 認知経路マスタID
- `referral_source_other`: 認知経路が「その他」の場合の詳細
- `desired_role_1`, `2`, `3`: 役職希望コード（旧仕様・互換性のため維持）
- `assigned_role`: 決定した役職名（旧仕様・互換性のため維持）
- `assigned_role_id`: **(New)** 決定した役職のマスタID

#### `roles` (役職マスタ)
- `id`: UUID
- `name`: 役職名 ('監督', '演者' など)
- `code`: システム識別コード ('director', 'actor' など)

#### `referral_sources` (認知経路マスタ)
- `id`: UUID
- `name`: 名称 ('学校の先生', 'SNS' など)
- `display_order`: 表示順

#### `applicant_role_preferences` (希望役職テーブル)
応募者の希望役職を正規化して管理します。
- `applicant_id`: 応募者ID
- `role_id`: 役職ID
- `preference_rank`: 希望順位 (1, 2, 3)

## 5. Row Level Security (RLS) の設定について
現在の設定ではテーブル作成時に RLS (Row Level Security) が有効になっていないか、あるいはポリシーが設定されていません。
本番運用時には、データの読み書き権限を制御するために RLS ポリシーを設定することを強く推奨します。

例: 誰でも読み取れるようにする場合（公開データ）
```sql
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON members FOR SELECT USING (true);
```
