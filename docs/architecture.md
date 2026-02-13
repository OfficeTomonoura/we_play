# 構成ルール

このプロジェクトのディレクトリ構成と開発ルールを以下に定めます。

## ディレクトリ構成

- **site/**: 公開サイト（本番用）のHTMLファイル置き場。Viteのビルド入口（ルート）。
  - **admin/**: 管理画面のHTMLファイル。
- **legacy/**: 旧構成の退避領域。参照禁止。
  - **legacy/admin_root/**: 旧 `admin/_legacy`。
  - **legacy/admin_root_remaining/**: 旧 `admin/` 直下の未使用ファイル。
- **src/**: 実装の正。ソースコードの中心。
  - **api/**: 外部API（Supabase等）との通信層。
  - **lib/**: アプリケーション共通のロジックやUIコンポーネント。
  - **pages/**: 各画面ごとのエントリーポイントとなるJSファイル (`src/pages/**/main.js`)。
  - **styles/**: CSSファイル。
    - **admin/**: 管理画面専用の分割されたCSS。`tokens.css`, `base.css`, `layout.css`, `components.css`, `modal.css`, `animations.css`, `responsive.css` で構成。
- **playground/**: 試作・検証専用。本番リリースには含まれません。
- **docs/**: 資料専用。デプロイ対象外です。
- **supabase/migrations**: 本番用のマイグレーションファイル。
- **supabase/seeds**: 開発用のシードデータ。
- **supabase/sql_legacy**: 参照専用の過去のSQL。

## 開発ルール

1. **実装の正は `src/`**:
   - 新規開発や修正は原則として `src/` ディレクトリ配下で行います。

2. **本番HTMLは `site/` 配下に配置**:
   - Webサイトの公開ファイル（HTML）は `site/` ディレクトリに置きます。
   - `admin/` 直下のHTMLは `site/admin/` へ移動しました。

3. **ページJSは `src/pages/**/main.js` を正とする**:
   - 各画面のロジックは `src/pages/` 配下の対応するディレクトリにある `main.js` に記述します。

4. **playground/ は試作・検証専用**:
   - 新しい機能の検証や実験的なコードは `playground/` 配下で作成します。

5. **docs/ は資料専用**:
   - 設計書やマニュアルなどのドキュメントは `docs/` 配下に配置します。

6. **データベース関連**:
   - `supabase/migrations`: 本番環境への反映に使用するマイグレーションファイル。
   - `supabase/seeds`: 開発環境の初期データ投入に使用するシードファイル。
   - `supabase/sql_legacy`: 過去に使用したSQLファイルなどのアーカイブ。参照専用。

7. **legacy/admin_root は退避領域**:
   - 旧 `admin/_legacy` 内のファイルであり、参照してはいけません。
   - これらのファイルは将来的に削除される可能性があります。

8. **assets/js は原則として新規追加禁止**:
   - JSファイルの実装は原則 `src/` 配下で行います。
   - `assets/js` には、外部ライブラリの配置や、既存資産の維持の場合のみファイルを置きます。
   - `assets/js/_legacy/` は退避領域であり、参照禁止です。

9. **実装の配置ガイドライン**:
   - **外部データ取得**: `src/api/` に関数を作成して呼び出します。
   - **共通ロジック/UI**: 複数ページで利用する場合は `src/lib/` に配置します。
   - **ページ固有処理**: 特定ページのみで完結するロジックは `src/pages/` 配下に記述します。
   - **定数**: アプリケーション全体で使う定数は、必要に応じて `src/constants/` を作成して管理します（現状は未作成）。

10. **パス参照ルール**:
    - **HTMLからの参照**: `/src/...` のような絶対パス参照は禁止です。`site/` rootを前提とした相対パス（例: `../src/...`）または、JSファイル内での import を利用してください。
    - **CSS/JS**: CSSはHTMLから直接読み込まず、エントリーポイントとなるJSファイルから import します。
    - **静的資産**: 画像などの静的ファイルは `public/assets/` に配置し、HTML/CSSからは `/assets/...` のパスで参照します。
    - **欠落資産の暫定対応**: ビルド時に資産が不足している場合、無関係な画像への恒久的な差し替えは行わず、暫定対応であることをコード内のコメント（`TODO`）とドキュメントに残してください。復帰手順も明記すること。
    - **管理画面CSSの分割管理**: `src/styles/admin.css` は巨大化を防ぐため `src/styles/admin/*.css` に分割されています。
      - **エントリーポイント**: `src/styles/admin/index.js` がすべての分割CSSを読み込む入口となります。
      - **利用方法**: 各管理画面ページ（`main.js`）では、この `index.js` を1行読み込むだけで全てのスタイルが適用されます。
      - **読み込み順序**: スタイル優先度を維持するため、`index.js` 内でのimport順序は厳密に固定されています：
        1. `tokens.css` (変数)
        2. `base.css` (リセット/ベース)
        3. `layout.css` (構造)
        4. `components.css` (部品)
        5. `modal.css` (共通モーダル)
        6. `animations.css` (アニメーション)
        7. `responsive.css` (レスポンシブ)
        8. `admin-legacy.css` (レガシー・残存スタイル)
      - **新規ページ追加**: 新しい管理画面ページを作成する際は、`import '../../../styles/admin/index.js';` を記述してください。
