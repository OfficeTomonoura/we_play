# LINE通知機能（応募通知）導入マニュアル

応募フォームから新しい応募があった際に、指定したLINEグループへ自動的に通知を送る機能のセットアップ手順です。
LINE Notifyのサービス終了（2025年3月）に伴い、**Messaging API** を使用した実装になっています。

## 1. 仕組みの概要
1. ユーザーがWebフォームから応募・送信。
2. `form.js` が Supabase Edge Function (`notify-applicant`) を呼び出す。
3. Edge Function が LINE Messaging API を叩き、指定されたグループID宛にプッシュメッセージを送信する。

## 2. LINE公式アカウントの準備
通知を送る主体となる「Bot（公式アカウント）」を作成します。

1. [LINE Developers Console](https://developers.line.biz/console/) にログイン。
2. **プロバイダー**を作成（プロジェクト名や組織名）。
3. **「Messaging API」** チャネルを新規作成。
   - 名前: `We Play 通知Bot` など
   - 説明: 任意の適当な説明
4. 作成後、**「Messaging API設定」** タブを開く。
5. 最下部の **「チャネルアクセストークン（長期）」** を発行し、コピーして控えておく。

## 3. 通知先グループIDの取得
ここが少し特殊な手順になります。BotをLINEグループに参加させ、その「参加イベント」のログからグループID (`C...` で始まるID) を特定する必要があります。

1. 通知を送りたいLINEグループを作成（または既存のグループを使用）。
2. 作成したBot（公式アカウント）を友だち追加し、そのグループに**「招待」**する。
3. グループIDを知る方法はいくつかありますが、開発中であれば以下の手順で確認できます：
   - Edge Functionにあらかじめ `console.log(webhookEvent)` を仕込んでおく。
   - LINE Developersで Webhook URL を設定 (`.../functions/v1/notify-applicant`) し、「Webhookの利用」をONにする。
   - Botをグループに招待した瞬間に Supabase ダッシュボードの `Functions > Logs` にIDが出力されるので、それを控える。
   - ※今回はすでに取得済み (`Cbb7ca1a458e722d7e9ec355b4f287e2e`) ですが、別のグループに変える場合は再取得が必要です。

## 4. Supabase Edge Functions のセットアップ

### 4.1. 環境変数の設定
取得したトークンとIDを Supabase プロジェクトの環境変数（Secrets）として設定します。
ターミナルで以下を実行します。

```bash
supabase secrets set LINE_CHANNEL_ACCESS_TOKEN='（取得したチャネルアクセストークン）'
supabase secrets set LINE_TARGET_ID='（取得したグループID: Cxxxxxxxx...）'
```

### 4.2. 関数のデプロイ
関数 `notify-applicant` を Supabase 上にアップロードします。
認証なしで呼び出せるように `--no-verify-jwt` フラグを付けます。

```bash
supabase functions deploy notify-applicant --no-verify-jwt
```

## 5. クライアント側の設定
Webフォーム (`assets/js/form.js`) 側で、送信成功時に関数を呼び出す処理が必要です。

```javascript
// form.js の送信成功処理内
const { error } = await window.supabaseClient.functions.invoke('notify-applicant', {
    body: {
        record: insertedRecord, // 応募者データ
        roles: ['監督', '演者']   // 希望役職リスト
    }
});
```

## 6. 運用・保守
- **通知先を変えたい場合**: 
  新しいグループにBotを招待してIDを取得し、`supabase secrets set LINE_TARGET_ID='...'` で更新してください。再デプロイは不要です。
- **メッセージ内容を変えたい場合**:
  `supabase/functions/notify-applicant/index.ts` の `messageText` を編集し、再度 `supabase functions deploy` を実行してください。

## 参考情報
- [LINE Messaging API Reference](https://developers.line.biz/ja/reference/messaging-api/)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
