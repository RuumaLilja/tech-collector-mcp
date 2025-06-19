#!/usr/bin/env node
import './config/environment.js';
import { toolList } from './config/toolDefinitions.js';
import { getQiitaRankingData } from './services/qiitaRanking.js';
import { summarizeQiitaArticle } from './services/articleSummarizer.js';
import { sendResponse, sendErrorResponse, makeResult } from './utils/rpcHelpers.js';

class QiitaMCPServer {
  constructor() {
    this.init();
  }

  init() {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async (chunk) => {
      for (const line of chunk.trim().split('\n')) {
        if (!line) continue;
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          sendErrorResponse('unknown', -32700, 'Parse error');
          continue;
        }

        const { id, method, params } = msg;
        if (id === undefined || !method) {
          sendErrorResponse(id ?? 'unknown', -32600, 'Invalid JSON-RPC request');
          continue;
        }

        try {
          if (method === 'initialize') {
            sendResponse({ ...toolList.initialize, id });

          } else if (method === 'tools/list') {
            sendResponse({ ...toolList['tools/list'], id });

          } else if (method === 'tools/call') {
            const { name, arguments: args } = params || {};

            if (name === 'get_qiita_ranking') {
              const data = await getQiitaRankingData(args);
              const text = formatOutput('get_qiita_ranking', data);
              sendResponse(makeResult(id, { content: [{ type: 'text', text }] }));

            } else if (name === 'summarize_qiita_article') {
              const summary = await summarizeQiitaArticle(args);
              sendResponse(makeResult(id, { content: [{ type: 'text', text: summary }] }));

            } else {
              sendErrorResponse(id, -32601, `Method not found: ${name}`);
            }

          } else {
            sendErrorResponse(id, -32601, `Method not found: ${method}`);
          }
        } catch (err) {
          sendErrorResponse(id, -32000, err.message);
        }
      }
    });
    console.error('Qiita MCP Server started');
  }
}

/**
 * 結果を文字列として整形
 * @param {string} toolName
 * @param {any} data
 * @returns {string}
 */
function formatOutput(toolName, data) {
  if (toolName === 'get_qiita_ranking') {
    const header = `📈 人気記事 TOP${data.length}`;
    const body = data
      .map(
        (it) =>
          `${it.rank}. ${it.title}\n   👍 ${it.likes}  📚 ${it.stocks} (score: ${it.score})\n   ${new Date(
            it.created_at
          ).toLocaleString('ja-JP')}\n   ${it.url}`
      )
      .join('\n\n');
    return `${header}\n\n${body}`;
  } else if (toolName === 'summarize_qiita_article') {
    return data;
  }
  return JSON.stringify(data);
}

new QiitaMCPServer();