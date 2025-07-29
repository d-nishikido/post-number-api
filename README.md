# Post Number API

郵便番号を入力として住所情報を取得するRESTful APIを提供するサービスです。

## 🚀 クイックスタート

### 前提条件

- Docker 24+
- Docker Compose 2.0+
- Git

### 開発環境のセットアップ

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/d-nishikido/post-number-api.git
   cd post-number-api
   ```

2. **環境変数の設定**
   ```bash
   cp .env.example .env
   # 必要に応じて .env ファイルを編集
   ```

3. **Docker環境の起動**
   ```bash
   # 開発環境（ホットリロード有効）
   docker compose up -d

   # または本番環境設定で起動
   docker compose -f docker compose.yml up -d
   ```

4. **動作確認**
   ```bash
   # ヘルスチェック
   curl http://localhost/health

   # API情報確認
   curl http://localhost/v1
   ```

### CSVデータのインポート

日本郵便の郵便番号データをインポートするには：

1. `utf_ken_all.csv` を `docs/` ディレクトリに配置
2. インポートスクリプトを実行：
   ```bash
   # Dockerコンテナ内で実行
   docker compose exec app ./scripts/import-csv.sh

   # またはホストから実行
   ./scripts/import-csv.sh
   ```

## 🏗️ アーキテクチャ

```
[Client] → [Nginx] → [Node.js API] → [PostgreSQL]
```

### 技術スタック

- **Node.js**: 18+ (TypeScript)
- **Express.js**: 4.18+
- **PostgreSQL**: 15+
- **Nginx**: 1.24+
- **Docker**: 24+

## 📁 プロジェクト構造

```
post-number-api/
├── src/                    # TypeScriptソースコード
│   ├── config/            # 設定ファイル
│   ├── controllers/       # コントローラー
│   ├── middlewares/       # ミドルウェア
│   ├── models/           # データモデル
│   ├── routes/           # ルート定義
│   ├── services/         # ビジネスロジック
│   └── utils/            # ユーティリティ
├── tests/                 # テストファイル
├── scripts/              # ユーティリティスクリプト
├── migrations/           # データベースマイグレーション
├── nginx/                # Nginx設定
├── postgres/             # PostgreSQL初期化スクリプト
├── docker-compose.yml    # 本番用Docker Compose設定
├── docker-compose.override.yml # 開発用オーバーライド
└── Dockerfile           # Node.jsアプリ用Dockerfile
```

## 🛠️ 開発

### 利用可能なコマンド

```bash
# 開発サーバー起動（ホットリロード）
npm run dev

# TypeScriptビルド
npm run build

# 本番サーバー起動
npm start

# テスト実行
npm test

# テスト（ウォッチモード）
npm run test:watch

# カバレッジ付きテスト
npm run test:coverage

# リント
npm run lint

# リント（自動修正）
npm run lint:fix

# 型チェック
npm run typecheck

# コードフォーマット
npm run format
```

### Docker開発環境

```bash
# 開発環境起動
docker compose up -d

# ログ確認
docker compose logs -f app

# アプリケーションコンテナに接続
docker compose exec app sh

# データベースコンテナに接続
docker compose exec db psql -U postgres -d post_number_api_dev

# 環境停止
docker compose down

# 環境リセット（ボリューム削除）
docker compose down -v
```

## 🧪 テスト

```bash
# 全テスト実行
npm test

# 特定のテストファイル実行
npm test -- tests/health.test.ts

# カバレッジレポート生成
npm run test:coverage
```

## 📊 モニタリング

### ヘルスチェック

```bash
curl http://localhost/health
```

### ログ確認

```bash
# アプリケーションログ
docker compose logs -f app

# Nginxログ
docker compose logs -f nginx

# データベースログ
docker compose logs -f db
```

## 🚀 デプロイ

### 本番環境用設定

1. **環境変数の設定**
   ```bash
   cp .env.production.example .env.production
   # 本番環境の設定を記入
   ```

2. **本番環境での起動**
   ```bash
   docker compose -f docker-compose.yml --env-file .env.production up -d
   ```

## 🤝 開発に参加する

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトは ISC ライセンスの下で公開されています。

## 🆘 トラブルシューティング

### よくある問題

**問題**: Docker起動時にポートが既に使用されている
```bash
# 使用中のポートを確認
sudo lsof -i :80
sudo lsof -i :3000
sudo lsof -i :5432

# または別のポートを使用（.envファイルを編集）
NGINX_PORT=8080
PORT=3001
DB_PORT=5433
```

**問題**: データベース接続エラー
```bash
# データベースの起動を確認
docker compose ps db

# データベースログを確認
docker compose logs db

# データベースの手動接続テスト
docker compose exec db psql -U postgres -d post_number_api_dev
```

**問題**: TypeScriptビルドエラー
```bash
# 依存関係の再インストール
npm ci

# 型チェック実行
npm run typecheck

# リント確認
npm run lint
```
