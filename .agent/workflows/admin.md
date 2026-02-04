---
description: Admin開発モードを起動し、広範囲な対象から編集画面を選択します
---
1. Adminモードに切り替えます。
   - `task_boundary` を呼び出し、Modeを `PLANNING`、TaskNameを `Admin Development` に設定します。

2. 編集対象の画面を選択するようユーザーに尋ねます。
   - 以下のリストを提示し、どれを編集するか確認してください：
     1. LP画面 (`index.html`)
     2. ダッシュボード (`admin/index.html`)
     3. ログイン画面 (`admin/login.html`)
     4. 正会員登録画面 (`admin/member_registration.html`)
     5. 応募フォーム画面 (`register.html`)
     6. LINE連携画面 (`admin/line_link.html`)
     7. 応募者一覧 (`admin/applicants.html`)
     8. 選抜者 (`admin/selected.html`)
     9. 参加者（正会員） (`admin/members.html`)
     10. 協力者一覧 (`admin/collaborators.html`)
     11. 統計分析 (`admin/analysis.html`)
     12. LINE公式運用 (`admin/line.html`)
     13. 議案 (`admin/meeting-details.html`)
     14. マニュアル (`admin/manual_*.html`)
     15. 設定 (`admin/settings.html`)
     16. 共通コンポーネント (`admin/components.js`)

3. ユーザーの選択に応じて、必要なファイルのみを `view_file` で読み込みます。
   - **LP画面**: `index.html`, `assets/css/style.css`
   - **ダッシュボード**: `admin/index.html`, `assets/js/admin.js`, `admin/components.js`
   - **ログイン**: `admin/login.html`, `assets/js/supabase-client.js`
   - **正会員登録**: `admin/member_registration.html`, `admin/components.js`
   - **応募フォーム**: `register.html`, `assets/js/form.js`
   - **LINE連携**: `admin/line_link.html`, `admin/manual_liff.html`
   - **応募者一覧**: `admin/applicants.html`, `admin/components.js`
   - **選抜者**: `admin/selected.html`, `admin/components.js`
   - **参加者**: `admin/members.html`, `assets/js/members.js`, `admin/components.js`
   - **協力者**: `admin/collaborators.html`, `admin/components.js`
   - **統計分析**: `admin/analysis.html`, `assets/js/chart.js` (もしあれば), `admin/components.js`
   - **LINE運用**: `admin/line.html`, `admin/components.js`
   - **議案**: `admin/meeting-details.html`, `admin/agenda-item-details.html`, `admin/components.js`
   - **マニュアル**: `admin/manual_liff.html`, `admin/database.html`, `admin/manual_notify.html`
   - **設定**: `admin/settings.html`, `admin/components.js`
   - **共通**: `admin/components.js`, `admin/index.html`

4. ファイル読み込み完了後、具体的な開発指示（修正内容）をユーザーに求めます。
