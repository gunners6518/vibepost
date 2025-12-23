# Vercel デプロイ手順

このドキュメントでは、Vibepost を Vercel にデプロイする手順を説明します。

## 前提条件

- Vercel アカウントを持っていること
- GitHub リポジトリにコードがプッシュされていること
- 必要な環境変数の値を準備していること

## デプロイ手順

### 1. Vercel にプロジェクトをインポート

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. 「Add New...」→ 「Project」を選択
3. GitHub リポジトリを選択（または接続）
4. プロジェクトを選択して「Import」をクリック

### 2. ビルド設定の確認

Vercel は Nuxt 3 を自動検出しますが、以下の設定が自動的に適用されます：

- **Framework Preset**: Nuxt.js
- **Build Command**: `nuxt build`（自動検出）
- **Output Directory**: `.output`（自動検出）
- **Install Command**: `yarn install` または `npm install`（自動検出）

### 3. 環境変数の設定

**重要**: 以下の環境変数はすべて **Server Only**（サーバー側のみ）で使用されます。クライアント側には公開されません。

プロジェクト設定画面で「Environment Variables」セクションに以下を追加してください：

#### 必須環境変数

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `CRON_SECRET` | Cron ジョブの認証用シークレット | 任意のランダムな文字列（例: `openssl rand -hex 32`） |
| `SUPABASE_URL` | Supabase プロジェクトの URL | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key（**重要**: 管理者権限） | Supabase Dashboard → Settings → API → service_role key |
| `OPENAI_API_KEY` | OpenAI API キー | OpenAI Dashboard → API Keys |
| `TYPEFULLY_API_KEY` | Typefully API キー | Typefully Dashboard → Settings → API |
| `TYPEFULLY_SOCIAL_SET_ID` | Typefully Social Set ID | Typefully Dashboard → Social Sets |

#### 環境変数の設定方法

1. Vercel プロジェクトの「Settings」→「Environment Variables」に移動
2. 各環境変数を追加：
   - **Name**: 変数名（上記の表を参照）
   - **Value**: 実際の値
   - **Environment**: Production, Preview, Development すべてにチェック（または必要に応じて選択）
3. 「Save」をクリック

**注意**: 
- `SUPABASE_SERVICE_ROLE_KEY` は **Service Role Key** を使用してください（Anon Key ではありません）
- すべての環境変数は **Server Only** として扱われ、クライアント側のコードには公開されません
- 環境変数を変更した場合は、再デプロイが必要です

### 4. デプロイの実行

1. 環境変数を設定後、「Deploy」ボタンをクリック
2. ビルドログを確認して、エラーがないことを確認
3. デプロイが完了すると、本番 URL が表示されます（例: `https://your-project.vercel.app`）

### 5. 動作確認

#### 基本動作確認

1. **トップページ**: `https://your-project.vercel.app/`
2. **Items ページ**: `https://your-project.vercel.app/items`
3. **Sources ページ**: `https://your-project.vercel.app/sources`

#### API エンドポイントの確認

##### `/api/cron/fetch` (認証必須)

Cron ジョブ用のエンドポイントです。`CRON_SECRET` を使用して認証します。

```bash
# 正しい認証（200 OK）
curl "https://your-project.vercel.app/api/cron/fetch?secret=YOUR_CRON_SECRET"

# 認証なし（401 Unauthorized）
curl "https://your-project.vercel.app/api/cron/fetch"
```

**Vercel Cron の設定**:
- Vercel Dashboard → プロジェクト → Settings → Cron Jobs
- 新しい Cron Job を追加：
  - **Path**: `/api/cron/fetch`
  - **Schedule**: 例: `0 */6 * * *` (6時間ごと)
  - **Secret**: `CRON_SECRET` の値

##### `/api/items/fetch`

RSS フィードからアイテムを取得するエンドポイントです。

```bash
curl -X POST "https://your-project.vercel.app/api/items/fetch"
```

##### `/api/items/[id]/draft`

ドラフトを生成するエンドポイントです。

```bash
curl -X POST "https://your-project.vercel.app/api/items/YOUR_ITEM_ID/draft"
```

#### エラーが発生した場合

1. **ビルドエラー**: Vercel のビルドログを確認
2. **API エラー**: ブラウザの開発者ツールの Network タブを確認
3. **環境変数エラー**: 環境変数が正しく設定されているか確認
4. **Supabase エラー**: `SUPABASE_SERVICE_ROLE_KEY` が Service Role Key であることを確認

## トラブルシューティング

### 環境変数が読み込まれない

- 環境変数を変更した後は、必ず再デプロイしてください
- 変数名のタイプミスがないか確認してください
- Vercel の Environment Variables 設定で、適切な Environment（Production/Preview/Development）にチェックが入っているか確認してください

### API が 500 エラーを返す

- サーバーログ（Vercel Dashboard → Functions → Logs）を確認
- 環境変数が正しく設定されているか確認
- Supabase の接続情報が正しいか確認

### Cron ジョブが動作しない

- Vercel Cron の設定で、`secret` パラメータが正しく設定されているか確認
- `/api/cron/fetch` エンドポイントが 401 を返さないか確認（手動でテスト）

## セキュリティに関する注意事項

- **すべての環境変数は Server Only** です。クライアント側のコードには公開されません
- `SUPABASE_SERVICE_ROLE_KEY` は管理者権限を持つため、絶対にクライアント側で使用しないでください
- `CRON_SECRET` は推測困難なランダムな文字列を使用してください
- 環境変数は Git リポジトリにコミットしないでください（`.gitignore` で `.env` を除外済み）

## 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Nuxt 3 Deployment](https://nuxt.com/docs/getting-started/deployment)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

