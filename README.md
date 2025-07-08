# 📰 tech-collector-mcp

> **Qiita × MCP × Gemini** — AI クライアントから呼び出せる “技術記事収集・要約 & Notion 連携” プロトタイプ

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)

---

## ✨ What’s this?

`tech-collector-mcp` は **MCP (Model Context Protocol)** を使って複数ソース（Qiita / Dev.to / NewsAPI / Hacker News）の技術記事を一括収集し、 **Gemini API** で要約、さらに **Notion** データベースへ保存まで行える **CLI ベースの実験プロジェクト** です。

| 🔗 機能              | 説明                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| **Zero‑Server**      | JSON‑RPC over STDIO で動作 — Web サーバー不要                         |
| **Multi‑Source**     | Qiita / Dev.to / NewsAPI.org / Hacker News API を横断ラップ           |
| **Summarize**        | 任意 URL 要約 (`summarizeUrlArticle`) & Qiita 特化要約                |
| **Aggregate**        | 全ソース取得 (`fetchAllArticles`) & Notion 同期 (`aggregateArticles`) |
| **Recommend**        | ユーザー履歴＋タグ頻度で Notion から簡易レコメンド                    |
| **Easy Integration** | Claude Desktop などで関数呼び出し感覚で利用可能                       |

> **Prototyping Phase** 🛠️  スキーマ & プロンプトは今後も更新予定です。

---

## 🔧 Requirements

- Node.js **18.x** 以上
- npm または yarn
- `.env` に以下を設定（例は `.env.example` 参照）

```dotenv
# ==== API Keys & Tokens ====
GEMINI_API_KEY=your_gemini_api_key_here       # Google Generative AI
NEWSAPI_KEY=your_newsapi_api_key_here         # NewsAPI.org
QIITA_TOKEN=your_qiita_token_here             # Qiita (optional)

# ==== Pagination Settings ====
PAGE_LIMIT=3        # デフォルト取得件数/サービス
ITEMS_PER_PAGE=10   # ページネーション単位

# ==== Notion Integration ====
NOTION_API_KEY=your_notion_api_key_here       # Notion Integration Token
NOTION_DATABASE_ID=your_database_id_here      # 記事保存用DB ID
```

Dev.to / Hacker News は API キー不要です。

---

## 📦 Installation / Quick Start

```bash
# 1) Clone
$ git clone https://github.com/RuumaLilja/tech-collector-mcp.git
$ cd tech-collector-mcp

# 2) Install dependencies
$ npm install   # または yarn install

# 3) Environment variables
$ cp .env.example .env
# .env を編集して上記キーを入力

# 4) Run MCP server (STDIO mode)
$ node src/index.js
```

### 🛠️ Using with Claude Desktop

`settings.json` に MCP サーバーを登録：

```json
{
  "mcpServers": {
    "tech-collector": {
      "command": "node",
      "args": ["/absolute/path/to/tech-collector-mcp/src/index.js"]
    }
  }
}
```

起動後、チャットで例:

- `JavaScriptタグの人気記事を5件教えて`
- `Dev.toでreactタグの記事を3件取得して`
- `最新のテックニュースを取得して`
- `Hacker Newsの人気技術ネタを5件`
- `全部まとめて最新技術記事を取得して`
- `https://example.com/article を要約して`
- `取得した記事を Notion に保存して`

---

## 📂 Project Structure

```plaintext
tech-collector-mcp/
├── adapters/
│   └── notionSdkStorage.js           # Notion SDK 実装 (StoragePort)
├── clients/
│   ├── devtoClient.js
│   ├── geminiClient.js
│   ├── hackerNewsClient.js
│   ├── newsApiClient.js
│   └── qiitaClient.js
├── config/
│   ├── constants.js
│   ├── environment.js
│   ├── prompts.js                    # プロンプト定義
│   ├── toolDefinitions.dynamic.js    # Notion スキーマ連動ツール
│   └── toolDefinitions.static.js     # 静的ツール定義
├── ports/
│   └── storage.js                    # StoragePort インターフェース
├── services/
│   ├── aggregatorService.js          # 取得→同期パイプライン
│   ├── devtoService.js
│   ├── fetchService.js               # 全ソース取得
│   ├── hackerNewsService.js
│   ├── newsApiService.js
│   ├── qiitaRanking.js
│   ├── recommenderService.js         # Notion ベース簡易レコメンド
│   ├── reportService.js              # バッチ同期結果レポート
│   ├── summarizeService.js           # URL 要約
│   ├── syncBatchService.js           # Notion へ並列同期
│   └── syncService.js                # 単一記事同期
├── utils/
│   ├── errors.js
│   ├── fieldMapper.js                # 外部→Notion フィールド変換
│   ├── rpcHelpers.js
│   └── simhash.js                    # URL→SimHash (MD5)
└── index.js                          # エントリーポイント (STDIO ↔ JSON-RPC)
```

---

## 📖 JSON‑RPC Overview

| Method       | 説明               | Params              | Returns                               |
| ------------ | ------------------ | ------------------- | ------------------------------------- |
| `initialize` | MCP ハンドシェイク | —                   | 登録ツール一覧 (`capabilities.tools`) |
| `tools/list` | 利用可能ツール一覧 | —                   | `name`, `description`, `inputSchema`  |
| `tools/call` | ツール呼び出し     | `name`, `arguments` | 実行結果 (`content[]`)                |

### Main Tools (抜粋)

- **`getQiitaRanking`** — Qiita の人気記事ランキング取得
- **`getDevtoArticles`** — Dev.to のタグ/検索記事取得
- **`getNewsApiArticles`** — NewsAPI.org からテックニュース取得
- **`getHackerNewsTopStories`** — Hacker News トップストーリー取得
- **`fetchAllArticles`** — 全ソースをまとめて最新取得
- **`summarizeUrlArticle`** — 任意 URL 記事を Gemini で要約
- **`syncArticleToNotion`** — 記事を Notion に保存
- **`aggregateArticles`** — 全ソース取得 →Notion 一括同期
- **`recommendArticles`** — 未読 / タグ重み付けの簡易推薦

詳細は `toolDefinitions.*.js` を参照してください。

---

## 🩹 Troubleshooting

| エラー/症状                        | 解決策                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| **Unsupported content type: json** | MCP クライアントが `type: 'text'` でないレスポンスを受け取った場合。ツール実装側をチェック |
| **401 Unauthorized**               | `.env` の `NEWSAPI_KEY` または `NOTION_API_KEY` が正しいか確認                             |
| **ツールが自動呼び出されない**     | `description` が意図をカバーしているか確認後、クライアントを再起動                         |

---

## 🗺 Roadmap

1. **Phase 1**: Qiita ランキング＋要約 (✅)
2. **Phase 2**: マルチソース収集 (✅)
3. **Phase 3**: Notion / Obsidian / Slack 連携
4. **Phase 4**: パーソナライズ推薦 + 定期バッチ
5. **Phase 5**: Serverless 自動実行

---

_開発・記事執筆はマイペースに進行中です_ 🐢
