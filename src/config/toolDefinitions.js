// File: src/config/toolDefinitions.js
export const toolList = {
  initialize: {
    jsonrpc: '2.0',
    result: {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'qiita-mcp-server', version: '1.0.0' },
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
              count: { type: 'number', default: 10, minimum: 1, maximum: 100 },
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
              url: { type: 'string' },
              title: { type: 'string' },
              level: {
                type: 'string',
                enum: ['short', 'detailed'],
                default: 'short',
                description: '要約の長さを short／detailed で指定',
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
