// File: src/config/toolDefinitions.js
export const toolList = {
  initialize: {
    jsonrpc: '2.0',
    result: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {
          get_qiita_ranking: {
            name: 'get_qiita_ranking',
            descriptionForHumans:
              '指定された期間・カテゴリでQiitaの人気記事を取得します。',
            descriptionForModel:
              'ユーザーが「人気記事」や「ランキング」を求めたときに自動的に呼び出すツールです。例：「javascriptタグの人気記事を5件教えて」',
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
          summarize_url_article: {
            name: 'summarize_url_article',
            descriptionForHumans:
              '指定した任意の URL 記事を取得し、要望に合わせて要約を返します。',
            descriptionForModel:
              'ユーザーが「この記事を要約して」「重要ポイントを教えて」など、任意の URL 記事を要約してほしいときに呼び出すツールです。',
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
                  description:
                    '要約の長さ(short: 短く要約 / detailed: 詳細に要約)',
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
          get_devto_articles: {
            name: 'get_devto_articles',
            descriptionForHumans:
              '指定のタグやキーワードでDev.toの記事を取得します。',
            descriptionForModel:
              'ユーザーが「Dev.toでjavascriptタグの最新記事を5件教えて」などを求めたときに自動的に呼び出すツールです。',
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
          get_newsapi_articles: {
            name: 'get_newsapi_articles',
            descriptionForHumans:
              'NewsAPI.orgからテクノロジー関連記事を取得します。',
            descriptionForModel:
              'ユーザーが「最新のテックニュースを取得して」などを求めたときに呼び出すツールです。',
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
          get_hackernews_topstories: {
            name: 'get_hackernews_topstories',
            descriptionForHumans: 'Hacker Newsのトップストーリーを取得します。',
            descriptionForModel:
              'ユーザーが「HackerNewsで盛り上がっている技術ネタを教えて」などを求めたときに呼び出すツールです。',
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
          get_all_tech_articles: {
            name: 'get_all_tech_articles',
            descriptionForHumans:
              'Qiita, Dev.to, NewsAPI, Hacker Newsから技術記事をまとめて取得します。',
            descriptionForModel:
              'ユーザーが「全部まとめて最新の技術記事を教えて」などを求めたときに呼び出すツールです。',
            inputSchema: {
              type: 'object',
              properties: {
                countPerSource: {
                  type: 'number',
                  default: 5,
                  minimum: 1,
                  maximum: 100,
                  description: '各ソースから取得する記事件数',
                },
              },
              additionalProperties: false,
            },
          },
        },
      },
      serverInfo: {
        name: 'qiita-mcp-server',
        version: '1.0.0',
      },
    },
  },

  'tools/list': {
    jsonrpc: '2.0',
    result: {
      tools: [
        {
          name: 'get_qiita_ranking',
          description: 'Get Qiita article ranking',
          inputSchema: {
            type: 'object',
            properties: {
              period: {
                type: 'string',
                enum: ['daily', 'weekly', 'monthly'],
                default: 'weekly',
              },
              category: { type: 'string' },
              count: {
                type: 'number',
                default: 10,
                minimum: 1,
                maximum: 100,
              },
            },
            additionalProperties: false,
          },
        },
        {
          name: 'summarize_url_article',
          description: 'Summarize any article by URL via local LLM',
          descriptionForModel: 
            'ユーザーが「この記事を要約して」と言ったときに呼び出すツールです。' +
            'もしユーザーが詳細指定（detailed）をしなければ、必ず short まとめを返してください。' +
            '詳細指定があれば detailed を使います。',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: '要約対象の記事URL' },
              title: { type: 'string', description: '記事タイトル（省略可）' },
              level: {
                type: 'string',
                enum: ['short','detailed'],
                default: 'short',
                description: '要約の長さ。デフォルト short（ユーザー未指定時）。詳細指定時のみ detailed を使う',
              },
              user_request: {
                type: 'string',
                description: '「重要ポイントを教えて」などの具体的な要望',
              },
              targetLanguage: {
                type: 'string',
                enum: ['ja','en'],
                default: 'ja',
                description: '要約の出力言語',
              },
            },
            required: ['url','user_request'],
            additionalProperties: false,
          },
        },
        {
          name: 'get_devto_articles',
          description: 'Get articles from Dev.to',
          inputSchema: {
            type: 'object',
            properties: {
              tag: { type: 'string' },
              query: { type: 'string' },
              count: {
                type: 'number',
                default: 10,
                minimum: 1,
                maximum: 100,
              },
            },
            additionalProperties: false,
          },
        },
        {
          name: 'get_newsapi_articles',
          description: 'Get technology news via NewsAPI.org',
          inputSchema: {
            type: 'object',
            properties: {
              country: { type: 'string' },
              count: {
                type: 'number',
                default: 10,
                minimum: 1,
                maximum: 100,
              },
            },
            additionalProperties: false,
          },
        },
        {
          name: 'get_hackernews_topstories',
          description: 'Get top stories from Hacker News',
          inputSchema: {
            type: 'object',
            properties: {
              count: {
                type: 'number',
                default: 10,
                minimum: 1,
                maximum: 100,
              },
            },
            additionalProperties: false,
          },
        },
        {
          name: 'get_all_tech_articles',
          description: 'Aggregate Qiita, Dev.to, NewsAPI, Hacker News',
          inputSchema: {
            type: 'object',
            properties: {
              countPerSource: {
                type: 'number',
                default: 5,
                minimum: 1,
                maximum: 100,
              },
            },
            additionalProperties: false,
          },
        },
      ],
    },
  },
};
