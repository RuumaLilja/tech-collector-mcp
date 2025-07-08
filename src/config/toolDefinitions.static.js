// File: src/config/toolDefinitions.static.js

export const toolsMap = {
  // — 全ソースまとめ取得 ----------------------------------------------
  fetchAllArticles: {
    name: 'fetchAllArticles',
    descriptionForHumans:
      'Qiita, Dev.to, NewsAPI, Hacker News から最新の技術記事をまとめて取得します。',
    description:
      'ユーザーが記事の推薦を求めたときに**最優先で使用**するデフォルトツールです。以下のようなリクエストで呼び出してください：\n' +
      '- 「おすすめの記事教えて」「最新の記事を教えて」\n' +
      '- 「今日/週間/月間のおすすめは？」\n' +
      '- 「全ソースから記事を取得して」\n' +
      '- 「技術記事を見せて」「何かいい記事ない？」\n' +
      '- 「人気記事を教えて」「トレンドを知りたい」\n' +
      '- 期間指定がある場合（日間/週間/月間）も含む\n' +
      '特定のサイト（QiitaのみやDev.toのみ）や特定タグでの絞り込みが明示されていない限り、このツールを使用してください。複数の個別ツールを順次呼び出すよりも効率的です。',
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
      'ユーザーが「Qiitaの」記事を**明示的に指定**した場合や、「Qiitaでjavascriptタグの記事を」など**Qiitaに限定した条件**を求めたときのみ呼び出します。一般的な記事推薦では fetchAllArticles を優先してください。',
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
      'ユーザーが「Dev.toの」記事を**明示的に指定**した場合や、「Dev.toでreactタグの記事を」など**Dev.toに限定した条件**を求めたときのみ呼び出します。一般的な記事推薦では fetchAllArticles を優先してください。',
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
      'ユーザーが「ニュース」「最新ニュース」を**明示的に指定**した場合や、国別のニュースを求めたときのみ呼び出します。一般的な記事推薦では fetchAllArticles を優先してください。',
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
      'ユーザーが「Hacker News」「HN」を**明示的に指定**した場合のみ呼び出します。一般的な記事推薦では fetchAllArticles を優先してください。',
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
      'ユーザーが「私の興味に合わせて」「未読記事から」「パーソナライズされた記事を」「私向けの記事を」など、**明示的に個人の履歴や興味に基づいた推薦**を求めたときにのみ呼び出すツールです。単純な「おすすめ記事」のリクエストでは使用しないでください。',
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
      'ユーザーが「全ソースから取得・ストックして」と言ったときに呼び出すツールです。',
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
