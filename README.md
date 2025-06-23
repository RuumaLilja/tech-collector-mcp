# 📰 tech-collector-mcp

> **Qiita × MCP × Gemini** — AI クライアントから呼び出せる“技術記事収集・要約”プロトタイプ

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE) ![Node](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)

---

## ✨ What’s this?

`tech-collector-mcp` は **MCP (Model Context Protocol)** を使い、**Qiita** から人気記事を取得 → **Gemini API** で要約 までをワンコマンドで行う実験リポジトリです。
Claude Desktop や他の ModelContext‐対応クライアントから **関数呼び出し感覚** で利用できます。

> **まだプロトタイプ段階** 🛠️ 仕様やツール定義(`config/toolDefinitions.js`)は頻繁に変わる可能性があります。

---

## 🚀 Features

* ⚡ **Zero‑Server**：JSON‑RPC over STDIO で動作。Web サーバー不要
* 📈 **Ranking**：Qiita API から期間・タグごとの人気記事ランキングを取得
* 🧠 **Summarize**：Gemini API による日本語要約 (`summarize_qiita_article`)
* 🧩 **Easy Integration**：Claude Desktop などのクライアント設定ファイルに数行で登録可能
* 📜 **descriptionForModel**：ツール定義に「いつ呼び出すか」を明示し、自動呼び出し精度を向上
* 📝 **MIT License**：商用／OSS プロジェクトへの流用も歓迎

---

## 🔧 Requirements

* Node.js **18.x** 以上
* npm または yarn
* (任意) **Qiita Personal Access Token** — 未認証は 60 リクエスト/時 制限
* (必須) **Gemini API キー** を `.env` に設定

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
#  Qiita & Gemini の API キーを .env に記述
```

### 🔧 Claude Desktop で使う場合 (推奨)

1. `settings.json` に MCP サーバーを登録（絶対パス推奨）

   ```json
   {
     "mcpServers": {
       "qiita-mcp": {
         "command": "node",
         "args": ["/absolute/path/to/tech-collector-mcp/src/index.js"]
       }
     }
   }
   ```
2. Claude Desktop を**再起動** — 設定変更が反映されます
3. チャットで以下を入力

   ```text
   JavaScript タグの人気記事を 5 件教えて
   ```

   すると自動的に `get_qiita_ranking` が呼ばれ、結果が返ってきます。

> **Tips**
>
> * 初回ツール追加後は必ず **再起動** してください。
> * ツール一覧や `descriptionForModel` を更新したら再度再起動が必要です。

---

## 🛠️ Manual / Dev Mode

```bash
# 開発中に STDIO で直接動作確認
$ npm run dev
```

* 任意の JSON-RPC クライアントからリクエストを投げてテストできます。
* ログは標準 error (stderr) に出力されます。

---

## 📂 Project Structure

```plaintext
tech-collector-mcp/
├── .env.example           # Qiita & Gemini API キー例
├── src/
│   ├── clients/           # 外部 API クライアント
│   │   ├── fetchItemsByTag.js
│   │   ├── geminiClient.js
│   │   └── qiitaClient.js
│   ├── config/            # 設定・定数
│   │   ├── constants.js
│   │   ├── environment.js
│   │   ├── prompts.js
│   │   └── toolDefinitions.js
│   ├── services/          # ドメインロジック
│   │   ├── articleSummarizer.js
│   │   └── qiitaRanking.js
│   ├── utils/             # 汎用ヘルパ
│   │   ├── errors.js
│   │   └── rpcHelpers.js
│   └── index.js           # エントリーポイント (STDIO ↔ JSON-RPC)
└── README.md
```

---

## 🛠️ API Reference (JSON‑RPC)

| Method       | Description    | Params                                    | Returns                                             |
| ------------ | -------------- | ----------------------------------------- | --------------------------------------------------- |
| `initialize` | MCP 初期化ハンドシェイク | —                                         | `capabilities.tools`: 登録ツール一覧                       |
| `tools/list` | 利用可能なツール一覧を返す  | —                                         | 各ツールの `name`, `descriptionForHumans`, `inputSchema` |
| `tools/call` | 指定ツールを呼び出し     | `name` (*string*), `arguments` (*object*) | Chat completion‑style content array                 |

> 詳細は `config/toolDefinitions.js` を参照してください。

---

## 🩹 Troubleshooting

| Issue          | Solution                                              |
| -------------- | ----------------------------------------------------- |
| サーバーが認識されない    | `args` を **絶対パス** にし、実行権限を確認; Claude Desktop を再起動     |
| ツールが自動呼び出されない  | `descriptionForModel` を見直し; System Prompt で自動呼び出しを有効化 |
| JSON 以外の入力で落ちる | `index.js` にチャットフォールバック実装を追加                          |

---

## 🗺 Roadmap

1. **Phase 1**: Ranking & Summary (✅)
2. **Phase 2**: Multi‑source ingest (Zenn / Hatena / RSS)
3. **Phase 3**: Slack / Notion / Obsidian Integration
4. **Phase 4**: Personalization & Recommend Engine
5. **Phase 5**: Serverless Deploy (Cloud Run / AWS Lambda)

> 開発・記事執筆はマイペースに進行中です 🐢
