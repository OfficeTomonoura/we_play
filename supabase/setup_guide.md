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

6. **`supabase/update_members_registration.sql`**
   - members テーブルに `is_registered` カラムを追加。

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

## 4. データベース設計書

本プロジェクトで使用されているデータベース（Supabase / PostgreSQL）のテーブル定義です。

### 1. `applicants` (応募者テーブル)
Webフォームからの応募データを格納します。

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | UUID | PK, デフォルト: `gen_random_uuid()` |
| `full_name` | VARCHAR(255) | 氏名 |
| `full_kana` | VARCHAR(255) | フリガナ |
| `school_name` | VARCHAR(255) | 学校名 |
| `grade` | VARCHAR(50) | 学年 |
| `gender` | VARCHAR(10) | 性別 ('男', '女', '選択しない') |
| `email` | VARCHAR(255) | メールアドレス |
| `phone` | VARCHAR(20) | 電話番号 |
| `message` | TEXT | 意気込み・メッセージ |
| `status` | VARCHAR(50) | ステータス ('新規', '確認済み', '選抜済', '不採用')。デフォルト: '新規' |
| `referral_source` | VARCHAR(255) | 認知経路（選択値） |
| `referral_source_other` | TEXT | 認知経路（その他詳細） |
| `desired_role_1` | VARCHAR(100) | 第一希望役職 |
| `desired_role_2` | VARCHAR(100) | 第二希望役職 |
| `desired_role_3` | VARCHAR(100) | 第三希望役職 |
| `assigned_role` | VARCHAR(100) | 決定役職 |
| `line_user_id` | VARCHAR(50) | LINE User ID (連携用) |
| `applied_at` | TIMESTAMPTZ | 応募日時。デフォルト: `now()` |
| `created_at` | TIMESTAMPTZ | 作成日時。デフォルト: `now()` |
| `updated_at` | TIMESTAMPTZ | 更新日時。デフォルト: `now()` |

### 2. `members` (正会員テーブル)
管理画面を利用する正会員（運営メンバー）の情報です。Supabase Authと連携します。

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | UUID | PK, デフォルト: `gen_random_uuid()` |
| `auth_user_id` | UUID | **Supabase Auth User ID** との紐付け用 |
| `full_name` | VARCHAR(255) | 氏名 |
| `full_kana` | VARCHAR(255) | フリガナ |
| `email` | VARCHAR(255) | メールアドレス (NOT NULL) |
| `phone` | VARCHAR(20) | 電話番号 |
| `organization_id` | UUID | 所属マスタID (organizationカラムは廃止予定) |
| `position_id` | UUID | 役職マスタID (positionカラムは廃止予定) |
| `project_role_id` | UUID | プロジェクト役割マスタID (project_roleカラムは廃止予定) |
| `is_staff` | BOOLEAN | 管理画面アクセス権限。デフォルト: `false` |
| `can_approve_line` | BOOLEAN | LINE配信承認権限。デフォルト: `false` |
| `is_registered` | BOOLEAN | 登録フォーム入力完了フラグ。デフォルト: `false` |
| `line_user_id` | VARCHAR(50) | LINE User ID |
| `created_at` | TIMESTAMPTZ | 作成日時 |
| `updated_at` | TIMESTAMPTZ | 更新日時 |

### 3. `line_messages` (LINE配信メッセージ)
公式LINEから配信するメッセージの管理テーブルです。承認フローを含みます。

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | UUID | PK, デフォルト: `gen_random_uuid()` |
| `status` | VARCHAR(50) | ステータス (`pending`:承認待ち, `scheduled`:送信待ち, `sent`:送信済, `rejected`:修正待ち) |
| `target_type` | VARCHAR(50) | 配信対象 (`external`:応募者/選抜者, `internal`:正会員) |
| `title` | VARCHAR(255) | 管理用タイトル |
| `message_body` | TEXT | メッセージ本文 |
| `scheduled_at` | TIMESTAMPTZ | 配信予定日時 |
| `created_by` | UUID | 作成者 (`members.id` へのFK) |
| `approved_by` | UUID | 承認者/却下者 (`members.id` へのFK, nullable) |
| `approved_at` | TIMESTAMPTZ | 承認日時 |
| `rejection_comment` | TEXT | **修正依頼コメント** (`status`='rejected'時) |
| `created_at` | TIMESTAMPTZ | 作成日時 |
| `updated_at` | TIMESTAMPTZ | 更新日時 |

### 4. `line_received_messages` (LINE受信メッセージ)
Webhook経由で受信したLINEメッセージのログです。

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | UUID | PK, デフォルト: `gen_random_uuid()` |
| `line_user_id` | VARCHAR(50) | 送信元 LINE User ID |
| `message_text` | TEXT | 受信メッセージ内容 |
| `received_at` | TIMESTAMPTZ | 受信日時。デフォルト: `now()` |
| `created_at` | TIMESTAMPTZ | 作成日時 |

### 5. `collaborators` (協力者テーブル)
事業に協力してくれる企業・個人の情報です。

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `company_name` | VARCHAR(255) | 企業・団体名 |
| `contact_name` | VARCHAR(255) | 担当者名 |
| `email` | VARCHAR(255) | メールアドレス |
| `phone` | VARCHAR(20) | 電話番号 |
| `category` | VARCHAR(100) | 協力種別 |
| `address` | VARCHAR(255) | 住所 |
| `notes` | TEXT | 備考 |
| `created_at` | TIMESTAMPTZ | 作成日時 |

### 6. マスタテーブル
 
#### `master_organization` (所属マスタ)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `name` | VARCHAR(255) | 所属名 (例: 未来人財育成委員会) |
| `sort_order` | INTEGER | 表示順 |

#### `master_position` (役職マスタ)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `name` | VARCHAR(255) | 役職名 (例: 委員長) |
| `sort_order` | INTEGER | 表示順 |

#### `master_project_role` (プロジェクト役割マスタ)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `name` | VARCHAR(255) | 役割名 (例: 統括) |
| `sort_order` | INTEGER | 表示順 |

### 7. その他マスタ (互換性のため維持)
以下のテーブルは初期設計の名残として存在しますが、現在はコード定数として扱われることが多いです。

*   `roles` (役職マスタ)
*   `referral_sources` (認知経路マスタ)

## 8. LINE通知機能のセットアップ

本システムでは、対内向け（運営メンバー用）と対外向け（応募者用）で2つのLINE公式アカウントを使用します。

### 1. 必要なシークレット変数

Supabase Dashboardの `Settings > Edge Functions > Secrets` に以下の変数を設定してください。

| キー名 | 説明 |
| :--- | :--- |
| `LINE_CHANNEL_ACCESS_TOKEN_INTERNAL` | **対内向け** Botのチャネルアクセストークン（長期） |
| `LINE_CHANNEL_ACCESS_TOKEN_EXTERNAL` | **対外向け** Botのチャネルアクセストークン（長期） |
| `LINE_TARGET_ID` | 管理者通知用グループID（対内向けBotを招待して取得） |

### 2. アクセストークンの取得手順（共通）

1.  [LINE Developers Console](https://developers.line.biz/console/) にログイン。
2.  各Botのチャネルを選択（ない場合は「Messaging API」チャネルを新規作成）。
3.  「Messaging API設定」タブの最下部にある「チャネルアクセストークン（長期）」を発行・コピーする。

### 3. 設定コマンド例

```bash
# 対内向け (Internal)
supabase secrets set LINE_CHANNEL_ACCESS_TOKEN_INTERNAL='your_internal_token_here'

# 対外向け (External)
supabase secrets set LINE_CHANNEL_ACCESS_TOKEN_EXTERNAL='your_external_token_here'
```

## 6. Row Level Security (RLS) の設定について

現在の設定ではテーブル作成時に RLS (Row Level Security) が有効になっていないか、あるいはポリシーが設定されていません。
本番運用時には、データの読み書き権限を制御するために RLS ポリシーを設定することを強く推奨します。

例: 誰でも読み取れるようにする場合（公開データ）
```sql
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON members FOR SELECT USING (true);
```
