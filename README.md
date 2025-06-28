# 📰 tech-collector-mcp

> **Qiita × MCP × Gemini** — AI クライアントから呼び出せる“技術記事収集・要約”プロトタイプ

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE) ![Node](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)

---

## ✨ What’s this?

`tech-collector-mcp` は **MCP (Model Context Protocol)** を使い、
複数ソース（Qiita / Dev.to / NewsAPI / HackerNews）から記事を収集し、
**Gemini API**（LLM）で要約まで行える CLI ベースの実験プロジェクトです。

- **Zero‑Server**：JSON‑RPC over STDIO で動作。Web サーバー不要
- **Multi‑Source**：Qiita, Dev.to, NewsAPI.org, Hacker News 各 API をラップ
- **Summarize**：URLベースの汎用要約ツール (`summarize_url_article`) や Qiita 特化要約
- **Aggregate**：全ソースを一括取得する `get_all_tech_articles` ツール
- **Easy Integration**：Claude Desktop 等で関数呼び出し感覚で利用可能

> **プロトタイプ段階** 🛠️ ツール定義やプロンプトは頻繁に更新予定です。

---

## 🔧 Requirements

- Node.js **18.x** 以上
- npm または yarn
- **.env** ファイルに以下を設定
  ```dotenv
  GEMINI_API_KEY=（必須）
  NEWSAPI_KEY=（必須）
  QIITA_TOKEN=（任意：Qiita Personal Access Token）
  ```
- Dev.to / Hacker News はキー不要

---

## 📦 Installation / Quick Start

```bash
# 1) Clone
$ git clone https://github.com/RuumaLilja/tech-collector-mcp.git
$ cd tech-collector-mcp

# 2) Install dependencies
$ npm install   # または yarn install

# 3) 環境変数設定
$ cp .env.example .env
# .env に GEMINI_API_KEY, NEWSAPI_KEY, 必要なら QIITA_TOKEN を記述
```

### 🛠️ Claude Desktop での利用例

`settings.json` に MCP サーバーを登録:

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

1. Claude Desktop を再起動
2. チャットでプロンプト例:
   - `JavaScriptタグの人気記事を5件教えて`
   - `Dev.toでreactタグの注目記事を3件教えて`
   - `最新のテックニュースを5件取得して`
   - `Hacker Newsで盛り上がっている技術ネタを5件教えて`
   - `全部まとめて最新技術記事を取得して`
   - `https://example.com/article の内容を要約して`

---

## 📂 Project Structure

```plaintext
tech-collector-mcp/
├── .env.example           # 環境変数サンプル (.env にコピー)
├── src/
│   ├── clients/           # 外部 API クライアント
│   │   ├── devtoClient.js
│   │   ├── newsApiClient.js
│   │   ├── hackerNewsClient.js
│   │   ├── qiitaClient.js
│   │   └── geminiClient.js
│   ├── config/            # 各種設定
│   │   ├── environment.js
│   │   ├── prompts.js     # 汎用・技術記事向けプロンプト定義
│   │   └── toolDefinitions.js
│   ├── services/          # ドメインロジック
│   │   ├── devtoService.js
│   │   ├── newsApiService.js
│   │   ├── hackerNewsService.js
│   │   ├── qiitaRanking.js
│   │   ├── summarizeService.js  # 汎用URL要約
│   │   └── aggregatorService.js
│   ├── utils/             # ヘルパー
│   │   ├── errors.js
│   │   └── rpcHelpers.js
│   └── index.js           # エントリーポイント (STDIO ↔ JSON-RPC)
└── README.md              # このファイル
```

---

## 📖 JSON‑RPC Methods

| Method                 | Description                                     | Params                                   | Returns                        |
| ---------------------- | ----------------------------------------------- | ---------------------------------------- | ------------------------------ |
| `initialize`           | MCP ハンドシェイク                               | —                                        | 登録ツール一覧 (`capabilities.tools`) |
| `tools/list`           | 利用可能なツール一覧を取得                       | —                                        | `name`, `descriptionForHumans`, `inputSchema` |
| `tools/call`           | ツールを呼び出し                                 | `name` (_string_), `arguments` (_object_) | `content` 配列 (type/text JSON) |

### 主なツール

- **`get_qiita_ranking`**       — Qiita API から人気記事ランキング取得
- **`get_devto_articles`**     — Dev.to API から注目・タグ・検索記事取得
- **`get_newsapi_articles`**   — NewsAPI.org から最新テックニュース取得
- **`get_hackernews_topstories`** — Hacker News トップストーリー取得
- **`get_all_tech_articles`**  — 上記すべてをまとめて取得
- **`summarize_url_article`**  — 任意の URL 記事を LLM で要約

> 詳細は `src/config/toolDefinitions.js` を参照ください。

---

## 🩹 Troubleshooting

- **Unsupported content type: json** — 全ツール共通で `type: 'text'` + `text: JSON.stringify(...)` に統一済み
- **401 Unauthorized** — `.env` に正しい `NEWSAPI_KEY` を設定してください
- **ツールが自動呼び出されない** — `descriptionForModel` を再確認し、クライアントを再起動

---

## 🗺 Roadmap

1. **Phase 1**: Ranking & Summary (✅)
2. **Phase 2**: Multi‑source ingest (✅)
3. **Phase 3**: Slack / Notion / Obsidian Integration
4. **Phase 4**: Personalization & Recommendation
5. **Phase 5**: Serverless Deployment

---

*開発・記事執筆はマイペースに進行中* 🐢
