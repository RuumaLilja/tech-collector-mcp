# 📰 tech-collector-mcp

> **Qiita × MCP × Gemini** — AI クライアントから呼び出せる “技術記事収集・要約 & Notion 連携” プロトタイプ

---

## ✨ What’s this?

`tech-collector-mcp` は **MCP (Model Context Protocol)** を使い、複数ソース（Qiita／Dev.to／NewsAPI／Hacker News）から技術記事を一括取得し、**Gemini API** で要約、**Notion** データベースへ自動同期まで行う **CLI ベースの実験プロジェクト** です。

> **AI-Powered Prototyping**: ChatGPT や Claude を活用した迅速なプロトタイピングを実施しています。

| 機能                 | 説明                                                                        |
| -------------------- | --------------------------------------------------------------------------- |
| **Zero‑Server**      | JSON‑RPC over STDIO — Web サーバー不要                                      |
| **Multi‑Source**     | Qiita／Dev.to／NewsAPI.org／Hacker News API を横断ラップ                    |
| **Summarize**        | URL 要約 (`summarizeUrlArticle`) ＆ Qiita 特化要約                          |
| **Aggregate**        | 全ソース取得 (`fetchAllArticles`) ＆ 一括 Notion 同期 (`aggregateArticles`) |
| **Recommend**        | 読了 × 評価 × タグベースの簡易レコメンド (`recommendArticles`)              |
| **Easy Integration** | Claude Desktop などで関数呼び出し感覚で利用可能                             |

> **Prototyping Phase** 🛠️  スキーマ & プロンプトは随時更新中。

---

## 🔧 Requirements

- Node.js **18.x** 以上
- npm または yarn
- `.env` は `.env.example` を参照して作成

```
# ==== API Keys & Tokens ====
GEMINI_API_KEY=your_gemini_api_key_here     # Google Generative AI
NEWSAPI_KEY=your_newsapi_api_key_here       # NewsAPI.org
QIITA_TOKEN=your_qiita_token_here           # Qiita (optional)

# ==== Pagination Settings ====
PAGE_LIMIT=3        # デフォルト取得件数/サービス
ITEMS_PER_PAGE=10   # ページネーション単位

# ==== Notion Integration ====
NOTION_API_KEY=your_notion_api_key_here     # Notion Integration Token
NOTION_DATABASE_ID=your_database_id_here    # 記事保存用DB ID
```

Dev.to／Hacker News は API キー不要です。

---

## 📦 Installation / Quick Start

```
# 1) Clone
$ git clone https://github.com/RuumaLilja/tech-collector-mcp.git
$ cd tech-collector-mcp

# 2) Install dependencies
$ npm install   # または yarn install

# 3) Setup environment
$ cp .env.example .env
# .env を編集して各種キーを入力

# 4) Run MCP server (STDIO mode)
$ node src/index.js
```

### 🛠️ Using with Claude Desktop

`settings.json` に MCP サーバーを登録：

```
{
  "mcpServers": {
    "tech-collector": {
      "command": "node",
      "args": ["/absolute/path/to/tech-collector-mcp/src/index.js"]
    }
  }
}
```

起動後、チャット例：

```
Dev.toでreactタグの記事を3件取得して
最新テックニュースを取得して
Hacker Newsのトップ技術ネタを5件
https://example.com/article を要約して
取得した記事を Notion に保存して
全ソースを取得して Notion に同期して
全部まとめて最新技術記事を取得して
おすすめ記事（パーソナライズ推薦）を5件教えて```
```

---

## 📂 Project Structure

```
tech-collector-mcp/
├── adapters/
│   └── notionSdkStorage.js       # Notion SDK 実装 (StoragePort)
├── clients/
│   ├── devtoClient.js
│   ├── geminiClient.js
│   ├── hackerNewsClient.js
│   ├── newsApiClient.js
│   └── qiitaClient.js
├── config/
│   ├── constants.js
│   ├── environment.js
│   ├── prompts.js                # プロンプト定義
│   ├── toolDefinitions.dynamic.js# Notionスキーマ連動ツール
│   └── toolDefinitions.static.js # 静的ツール定義
├── ports/
│   └── storage.js                # StoragePort インターフェース
├── services/
│   ├── aggregatorService.js      # 全ソース取得→Notion同期
│   ├── devtoService.js
│   ├── fetchService.js           # 全ソース取得
│   ├── hackerNewsService.js
│   ├── newsApiService.js
│   ├── qiitaRanking.js
│   ├── recommenderService.js     # 読了×評価×タグベース推薦
│   ├── reportService.js          # 同期結果レポート
│   ├── summarizeService.js       # URL要約
│   ├── syncBatchService.js       # Notion並列同期
│   └── syncService.js            # 単一記事同期
├── utils/
│   ├── errors.js
│   ├── fieldMapper.js            # 外部→Notionフィールド変換
│   ├── rpcHelpers.js
│   └── simhash.js                # URL→SimHash (MD5)
└── index.js                      # エントリーポイント
```

---

## 📖 JSON‑RPC Overview

|              |                    |                     |                                      |
| ------------ | ------------------ | ------------------- | ------------------------------------ |
| Method       | 説明               | Params              | Returns                              |
| `initialize` | MCP ハンドシェイク | —                   | `capabilities.tools`                 |
| `tools/list` | 利用可能ツール一覧 | —                   | `name`, `description`, `inputSchema` |
| `tools/call` | ツール実行         | `name`, `arguments` | 実行結果 (`content[]`)               |

### Main Tools (抜粋)

- `getQiitaRanking` — Qiita 人気記事ランキング取得
- `getDevtoArticles` — Dev.to のタグ/検索記事取得
- `getNewsApiArticles` — NewsAPI.org からテックニュース取得
- `getHackerNewsTopStories` — Hacker News トップストーリー取得
- `fetchAllArticles` — 全ソースまとめて最新取得
- `summarizeUrlArticle` — 任意 URL 記事を Gemini で要約
- `syncArticleToNotion` — 記事を Notion に保存
- `aggregateArticles` — 全ソース取得 →Notion 一括同期
- `recommendArticles` — 読了 × 評価 × タグで簡易推薦

詳細は `toolDefinitions.*.js` を参照。

---

## 🩹 Troubleshooting

|                                |                                                                           |
| ------------------------------ | ------------------------------------------------------------------------- |
| エラー／症状                   | 解決策                                                                    |
| Unsupported content type: json | MCP クライアントが `type:'text'` 以外のレスポンスを受信。ツール実装を確認 |
| 401 Unauthorized               | `.env` の `NEWSAPI_KEY` または `NOTION_API_KEY` を確認                    |
| ツールが呼ばれない             | `descriptionForModel`／`inputSchema` を見直し、クライアント再起動         |

---

## 🗺 Roadmap

1. **Phase 1**: Qiita ランキング＋要約 (✅)
2. **Phase 2**: マルチソース収集 (✅)
3. **Phase 3**: Notion 連携 & パーソナライズ推薦 (✅)
4. **Phase 4**: Slack 連携
5. **Phase 5**: 定期バッチ
