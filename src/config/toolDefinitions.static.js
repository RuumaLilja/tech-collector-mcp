// File: src/config/toolDefinitions.static.js

export const toolsMap = {
  // — 全ソースまとめ取得 ----------------------------------------------
  fetchAllArticles: {
    name: 'fetchAllArticles',
    descriptionForHumans:
      'Qiita, Dev.to, NewsAPI, Hacker News から最新の技術記事をまとめて取得します。',
    description:
      '複数のソースから記事を取得したい場合に使用します。以下のようなリクエストで呼び出してください：\n' +
      '- 「全ソースから記事を取得して」「各サイトから記事を見せて」\n' +
      '- 「幅広く記事を探して」「色々なソースから」\n' +
      '- 特定のサイトやストック指定がない一般的な記事推薦でも使用可能です。',
    inputSchema: {
      type: 'object',
      properties: {
        countPerSource: {
          type: 'number',
          default: 3,
          minimum: 1,
          maximum: 100,
          description: '各ソースから取得する記事数',
        },
      },
      additionalProperties: false,
    },
  },
  // — Qiita ------------------------------------------------------------
  getQiitaRanking: {
    name: 'getQiitaRanking',
    descriptionForHumans:
      '指定された期間・カテゴリでQiitaの人気記事を取得します。',
    description:
      'Qiitaの記事を取得したい場合に使用します：\n' +
      '- 「Qiitaの記事を教えて」「Qiita人気記事は？」\n' +
      '- 「Qiitaでjavascriptタグの記事を」など特定タグでの絞り込み\n' +
      '- 「Qiita週間ランキング」など期間指定',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly'],
          default: 'weekly',
          description: '取得対象の期間を daily/weekly/monthly から選択',
        },
        category: {
          type: 'string',
          description: 'Qiita タグ名で絞り込む（例: javascript）',
        },
        count: {
          type: 'number',
          default: 10,
          minimum: 1,
          maximum: 100,
          description: '取得する記事数',
        },
      },
      additionalProperties: false,
    },
  },

  // — Dev.to -----------------------------------------------------------
  getDevtoArticles: {
    name: 'getDevtoArticles',
    descriptionForHumans: '指定のタグやキーワードでDev.toの記事を取得します。',
    description:
      'Dev.toの記事を取得したい場合に使用します：\n' +
      '- 「Dev.toの記事を教えて」「Dev.toで何かいい記事ある？」\n' +
      '- 「Dev.toでreactタグの記事を」など特定タグでの絞り込み\n' +
      '- 「Dev.toで検索して」などキーワード検索',
    inputSchema: {
      type: 'object',
      properties: {
        tag: {
          type: 'string',
          description: '取得対象のタグ名',
        },
        query: {
          type: 'string',
          description: '検索キーワード',
        },
        count: {
          type: 'number',
          default: 10,
          minimum: 1,
          maximum: 100,
          description: '取得する記事数',
        },
      },
      additionalProperties: false,
    },
  },

  // — NewsAPI ----------------------------------------------------------
  getNewsApiArticles: {
    name: 'getNewsApiArticles',
    descriptionForHumans: 'NewsAPI.orgからテクノロジー関連記事を取得します。',
    description:
      'ニュース記事を取得したい場合に使用します：\n' +
      '- 「最新ニュース」「テックニュース」「技術ニュース」\n' +
      '- 「日本のニュース」「アメリカのニュース」など国別指定\n' +
      '- 「ニュースサイトから」',
    inputSchema: {
      type: 'object',
      properties: {
        country: {
          type: 'string',
          description: 'ニュースの国コード（例: jp, us）',
        },
        count: {
          type: 'number',
          default: 10,
          minimum: 1,
          maximum: 100,
          description: '取得する記事数',
        },
      },
      additionalProperties: false,
    },
  },

  // — Hacker News ------------------------------------------------------
  getHackerNewsTopStories: {
    name: 'getHackerNewsTopStories',
    descriptionForHumans: 'Hacker Newsのトップストーリーを取得します。',
    description:
      'Hacker Newsの記事を取得したい場合に使用します：\n' +
      '- 「Hacker Newsの記事」「HNのトップストーリー」\n' +
      '- 「Hacker Newsで人気の記事」',
    inputSchema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          default: 10,
          minimum: 1,
          maximum: 100,
          description: '取得する記事数',
        },
      },
      additionalProperties: false,
    },
  },

  // — 任意 URL 要約 ----------------------------------------------------
  summarizeUrlArticle: {
    name: 'summarizeUrlArticle',
    descriptionForHumans:
      '指定した任意の URL 記事を取得し、要望に合わせて要約を返します。',
    description:
      'ユーザーが「この記事を要約して」「重要ポイントを教えて」など、任意の記事を要約してほしいときに呼び出すツールです。',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: '要約対象の記事 URL',
        },
        title: {
          type: 'string',
          description: '記事タイトル（プロンプト用。省略可）',
        },
        level: {
          type: 'string',
          enum: ['short', 'detailed'],
          default: 'short',
          description: '要約の長さ(short: 短く要約 / detailed: 詳細に要約)',
        },
        user_request: {
          type: 'string',
          description: '「実装中心に」など具体的な要望',
        },
        targetLanguage: {
          type: 'string',
          enum: ['ja', 'en'],
          default: 'ja',
          description: '要約の出力言語 (ja: 日本語, en: 英語)',
        },
      },
      required: ['url', 'user_request'],
      additionalProperties: false,
    },
  },

  // — パーソナライズ推薦 ----------------------------------------------
  recommendArticles: {
    name: 'recommendArticles',
    descriptionForHumans:
      '未ストック／未読記事とタグ頻度ベースで簡易推薦一覧を返します。',
    description:
      'ユーザーの過去の履歴に基づいた推薦を行いたい場合に使用します：\n' +
      '- 「私の興味に合わせて」「未読記事から推薦」\n' +
      '- 「パーソナライズされた記事を」「私向けの記事を」\n' +
      '- 「履歴から判断して」「過去の行動から」',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          default: 10,
          minimum: 1,
          description: '返却する記事数',
        },
      },
      additionalProperties: false,
    },
  },

  // — Notion 同期 ------------------------------------------------------
  syncArticleToNotion: {
    name: 'syncArticleToNotion',
    descriptionForHumans:
      '記事データ（URL, SimHash, タイトル, 要約, collectedAt）を Notion に同期します。',
    description:
      'ユーザーが「この記事を Notion に保存して」「ストックしてください」など、**明示的に記事保存を指示した場合にのみ**呼び出すツールです。',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '記事の URL' },
        hash: { type: 'string', description: '記事の SimHash' },
        title: { type: 'string', description: '記事タイトル' },
        summary: { type: 'string', description: '記事要約' },
        source: {
          type: 'string',
          description: '記事のソース元（例: Qiita, Dev.to）',
        },
        collectedAt: {
          type: 'string',
          format: 'date-time',
          description: '収集日時 (省略可)',
        },
      },
      required: ['url', 'hash', 'title', 'summary', 'source'],
      additionalProperties: false,
    },
  },

  // — バッチ同期 --------------------------------------------------------
  aggregateArticles: {
    name: 'aggregateArticles',
    descriptionForHumans:
      '各ソースから記事を取得し、Notionに一括で同期します。',
    description:
      '記事を取得してNotionに保存したい場合に使用します：\n' +
      '- 「おすすめ記事をストックして」「記事を保存して」\n' +
      '- 「全ソースから取得してNotionに」「一括で同期して」\n' +
      '- 「記事を集めて保存」「まとめて取得・保存」',
    inputSchema: {
      type: 'object',
      properties: {
        countPerSource: {
          type: 'number',
          default: 1,
          minimum: 1,
          maximum: 100,
        },
      },
      additionalProperties: false,
    },
  },
};

// -----------------------------------------------------------------------------
// 2) JSON‑RPC レスポンステンプレート（MCPプロトコル準拠・循環参照なし）
// -----------------------------------------------------------------------------
export const toolList = {
  initialize: {
    jsonrpc: '2.0',
    result: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: 'tech-collector-mcp',
        version: '1.0.0',
      },
    },
  },

  'tools/list': {
    jsonrpc: '2.0',
    result: {
      tools: Object.values(toolsMap).map(
        ({ name, descriptionForHumans, inputSchema }) => ({
          name,
          description: descriptionForHumans,
          inputSchema,
        })
      ),
    },
  },
};
