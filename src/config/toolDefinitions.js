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
          summarize_qiita_article: {
            name: 'summarize_qiita_article',
            descriptionForHumans:
              '指定したQiita記事URLを受け取り、要約を返します。',
            descriptionForModel:
              'ユーザーが記事の「要約」や「重要ポイント」を求めたときに自動的に呼び出すツールです。例：「この記事の重要ポイントを教えて」',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: '要約対象のQiita記事URL',
                },
                title: {
                  type: 'string',
                  description: '記事タイトル（プロンプト表示用）',
                },
                level: {
                  type: 'string',
                  enum: ['short', 'detailed'],
                  default: 'short',
                  description:
                    '要約の長さ(short: 短く要約/detailed: 詳細に要約)',
                },
                user_request: {
                  type: 'string',
                  description: '「実装中心に」などユーザーの具体的な要望',
                },
              },
              required: ['url', 'user_request'],
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
              category: {
                type: 'string',
              },
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
          name: 'summarize_qiita_article',
          description: 'Summarize a specific Qiita article via local LLM',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
              },
              title: {
                type: 'string',
              },
              level: {
                type: 'string',
                enum: ['short', 'detailed'],
                default: 'short',
                description: '要約の長さを short/detailed で指定',
              },
              user_request: {
                type: 'string',
                description:
                  '「実装中心に」「問題解決を簡潔に」などユーザーの要望',
              },
            },
            required: ['url', 'user_request'],
            additionalProperties: false,
          },
        },
      ],
    },
  },
};
