# 📰 tech-collector-mcp

> **Qiita × MCP × Gemini** —  AI クライアントから呼び出せる“技術記事収集・要約”プロトタイプ

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE) ![Node](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)

---

## ✨ What’s this?

`tech-collector-mcp` は **MCP (Model Context Protocol)** を使い、**Qiita** から人気記事を取得 → **Gemini API** で要約 までをワンコマンドで行う実験リポジトリです。Claude Desktop などの AI クライアントから **関数呼び出し感覚** で利用できます。

> **まだプロトタイプ段階** 🛠️ 更新は不定期ですが、アイデア拡張と実践ノウハウを随時まとめていきます。

---

## 🚀 Features

* ⚡ **Zero‑Server**：JSON‑RPC over STDIO で動作。Web サーバー不要
* 📈 **Ranking**：Qiita API から過去30日間のストック数ランキングを取得
* 🧠 **Summarize**：Gemini API による日本語要約 (`summarize_qiita_article`)
* 🧩 **Easy Integration**：Claude Desktop 設定ファイルに数行で登録可
* 📝 **MIT License**：商用／OSS プロジェクトへの流用も歓迎

---

## 🔧 Requirements

* Node.js **18.x** 以上
* npm または yarn
* (任意) **Qiita Personal Access Token** — 未認証は 60 リクエスト/時 制限

---

## 📦 Installation / Quick Start

```bash
# 1) Clone
$ git clone https://github.com/RuumaLilja/tech-collector-mcp.git
$ cd tech-collector-mcp

# 2) Install dependencies
$ npm install   # または yarn install
```

### Claude Desktop で使う場合 (推奨)

1. `settings.json` に MCP サーバーを登録

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
2. Claude Desktop を**再起動** — 変更が即反映されます
3. チャットで

   ```text
   Qiita のおすすめ記事を 3 件教えて
   ```

   と入力するとランキングが返るはずです

> **Tips**
> 編集後にツールが反映されない場合は *必ず Claude Desktop を再起動* してください。

### デバッグ用：手動起動

```bash
$ npm run dev
```

STDIO モードで MCP サーバーが起動し、任意の JSON-RPC クライアントからテストできます。

---

## 📂 Project Structure

```plaintext
tech-collector-mcp/
├── .env.example           # Qiita & Gemini API キー例 (コピーして .env にリネーム)
├── clients/               # 外部 API クライアント
│   ├── geminiClient.js    # Gemini API 用ラッパ
│   └── qiitaClient.js     # Qiita API 用ラッパ
├── config/                # 設定・定数
│   ├── constants.js
│   ├── environment.js
│   └── toolDefinitions.js # MCP ツール仕様 (method schema)
├── services/              # ドメインロジック
│   ├── articleSummarizer.js
│   └── qiitaRanking.js
├── utils/                 # 汎用ヘルパ
│   ├── errors.js
│   └── rpcHelpers.js
├── index.js               # エントリーポイント (STDIO ↔ JSON-RPC)
└── README.md
```

`.env.example` をコピーして `.env` を作成するとローカル環境変数が反映されます。

---

## 🛠️ API Reference (JSON‑RPC)

| Method                    | Description                        | Params                                                         | Returns                             |
| ------------------------- | ---------------------------------- | -------------------------------------------------------------- | ----------------------------------- |
| `get_qiita_ranking`       | Get Qiita ranking (by stock count) | `period?` (`daily`\|`weekly`\|`monthly`), `count?` (default 3) | Chat completion‑style content array |
| `summarize_qiita_article` | Summarize article via Gemini       | `url` (*string*)                                               | Chat completion‑style content array |

> 各メソッドの詳細スキーマは `config/toolDefinitions.js` を参照してください。

---

## 🩹 Troubleshooting

| Issue           | Solution                            |
| --------------- | ----------------------------------- |
| MCP サーバーが認識されない | `args` を **絶対パス** にし、ファイル実行権限があるか確認 |
| 変更後ツールが更新されない   | Claude Desktop を再起動してツールリストを再読み込み   |

---

## 🗺 Roadmap

* **Phase 1** : Ranking & Summary (✅)
* **Phase 2** : Multi‑source ingest (Zenn / Hatena / RSS)
* **Phase 3** : Slack / Notion / Obsidian Integration
* **Phase 4** : Personalization & Recommend Engine
* **Phase 5** : Serverless Deploy (Cloud Run / AWS Lambda)

> 開発・記事執筆はマイペースに進行中です 🐢
