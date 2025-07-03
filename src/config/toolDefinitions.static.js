// File: src/config/toolDefinitions.js
export const toolList = {
  initialize: {
    jsonrpc: '2.0',
    result: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {
          // — Qiita 関連
          getQiitaRanking: {
            name: 'getQiitaRanking',
            descriptionForHumans:
              '指定された期間・カテゴリでQiitaの人気記事を取得します。',
            descriptionForModel:
              'ユーザーが「Qiitaの人気記事」や「Qiitaのランキング」を求めたときに呼び出すツールです。',
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
          // — Dev.to 関連
          getDevtoArticles: {
            name: 'getDevtoArticles',
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
          // — NewsAPI 関連
          getNewsApiArticles: {
            name: 'getNewsApiArticles',
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
          // — Hacker News 関連
          getHackernewsTopStories: {
            name: 'getHackernewsTopStories',
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

          // — 任意 URL 要約
          summarizeUrlArticle: {
            name: 'summarizeUrlArticle',
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

          // — 全ソースまとめ取得
          fetchAllArticles: {
            name: 'fetchAllArticles',
            descriptionForHumans:
              'Qiita, Dev.to, NewsAPI, Hacker News から最新の技術記事をまとめて取得します。',
            descriptionForModel:
              'ユーザーが「おすすめの記事教えて」「最新の記事を教えて」「今日のおすすめは？」「技術記事を見せて」「何かいい記事ない？」など、特定の条件を指定せずに一般的な記事推薦を求めたときに**最優先で**呼び出すツールです。デフォルトの記事取得ツールとして使用してください。',
            inputSchema: {
              type: 'object',
              properties: {
                countPerSource: {
                  type: 'number',
                  default: 5,
                  minimum: 1,
                  maximum: 100,
                  description: '各ソースから取得する記事数',
                },
              },
              additionalProperties: false,
            },
          },

          // — おすすめ記事
          recommendArticles: {
            name: 'recommendArticles',
            descriptionForHumans:
              '未ストック／未読記事とタグ頻度ベースで簡易推薦一覧を返します。',
            descriptionForModel:
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

            // — Notion 同期
            syncArticleToNotion: {
              name: 'syncArticleToNotion',
              descriptionForHumans:
                '記事データ（URL, SimHash, タイトル, 要約, collectedAt）を Notion に同期します。',
              descriptionForModel:
                'ユーザーが「この記事を Notion に保存して」「ストックしてください」など、**明示的に記事保存を指示した場合にのみ**呼び出すツールです。',
              inputSchema: {
                type: 'object',
                properties: {
                  url: { type: 'string', description: '記事の URL' },
                  hash: { type: 'string', description: '記事の SimHash' },
                  title: { type: 'string', description: '記事タイトル' },
                  summary: { type: 'string', description: '記事要約' },
                  collectedAt: {
                    type: 'string',
                    format: 'date-time',
                    description: '収集日時 (省略可)',
                  },
                },
                required: ['url', 'hash', 'title', 'summary'],
                additionalProperties: false,
              },
            },

            // — 各ソースをまとめて同期（バッチ）
            aggregateArticles: {
              name: 'aggregateArticles',
              descriptionForHumans:
                '各ソースから記事を取得し、Notionに一括で同期します。',
              descriptionForModel:
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
          name: 'getQiitaRanking',
          description:
            'ユーザーが「Qiitaの人気記事」や「Qiitaのランキング」を求めたときに呼び出すツールです。',
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
          name: 'getDevtoArticles',
          description:
            'ユーザーが「Dev.toでjavascriptタグの最新記事を5件教えて」などを求めたときに自動的に呼び出すツールです。',
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
          name: 'getNewsApiArticles',
          description:
            'ユーザーが「最新のテックニュースを取得して」などを求めたときに呼び出すツールです。',
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
          name: 'getHackernewsTopStories',
          description:
            'ユーザーが「HackerNewsで盛り上がっている技術ネタを教えて」などを求めたときに呼び出すツールです。',
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
          name: 'summarizeUrlArticle',
          description: 'Summarize any article by URL via local LLM',
          description:
            'ユーザーが「この記事を要約して」「重要ポイントを教えて」など、任意のURL記事を要約してほしいときに呼び出すツールです。',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: '要約対象の記事URL' },
              title: { type: 'string', description: '記事タイトル（省略可）' },
              level: {
                type: 'string',
                enum: ['short', 'detailed'],
                default: 'short',
                description:
                  '要約の長さ。デフォルト short（ユーザー未指定時）。詳細指定時のみ detailed を使う',
              },
              user_request: {
                type: 'string',
                description: '「重要ポイントを教えて」などの具体的な要望',
              },
              targetLanguage: {
                type: 'string',
                enum: ['ja', 'en'],
                default: 'ja',
                description: '要約の出力言語',
              },
            },
            required: ['url', 'user_request'],
            additionalProperties: false,
          },
        },
        {
          name: 'aggregateArticles',
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
        {
          name: 'syncArticleToNotion',
          description:
            'ユーザーが「この記事をNotionに保存して」「ストックしてください」など、**明示的に記事保存を指示した場合にのみ**呼び出すツールです。',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              hash: { type: 'string' },
              title: { type: 'string' },
              summary: { type: 'string' },
              collectedAt: { type: 'string', format: 'date-time' },
            },
            required: ['url', 'hash', 'title', 'summary'],
            additionalProperties: false,
          },
        },
        {
          name: 'recommendArticles',
          description:
            'ユーザーが「私の興味に合わせて」「未読記事から」「パーソナライズされた記事を」「私向けの記事を」など、**明示的に個人の履歴や興味に基づいた推薦**を求めたときにのみ呼び出すツールです。単純な「おすすめ記事」のリクエストでは使用しないでください。',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', default: 10, minimum: 1 },
            },
            additionalProperties: false,
          },
        },
        {
          name: 'fetchAllArticles',
          description:
            'ユーザーが「おすすめの記事教えて」「最新の記事を教えて」「今日のおすすめは？」「技術記事を見せて」「何かいい記事ない？」「全ソースからおすすめ記事教えて」など、特定の条件を指定せずに一般的な記事推薦を求めたときに**最優先で**呼び出すツールです。全ソースから記事を取得します。',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', default: 10, minimum: 1 },
              period: {
                type: 'string',
                enum: ['daily', 'weekly', 'monthly'],
                default: 'weekly',
                description:
                  'Qiita/Dev.to の取得期間（daily, weekly, monthly）',
              },
              category: {
                type: 'string',
                description: 'Qiita/Dev.to のタグ絞り込み',
              },
            },
            additionalProperties: false,
          },
        },
      ],
    },
  },
};
