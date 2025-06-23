#!/usr/bin/env node
import './config/environment.js';
import { toolList } from './config/toolDefinitions.js';
import { getQiitaRankingText } from './services/qiitaRanking.js';
import { summarizeArticle } from './services/articleSummarizer.js';
import {
  sendResponse,
  sendErrorResponse,
  makeResult,
} from './utils/rpcHelpers.js';

class QiitaMCPServer {
  constructor() {
    this.init();
  }

  init() {
    process.stdin.setEncoding('utf8');
    let buffer = '';
    process.stdin.on('data', async (chunk) => {
      buffer += chunk;
      let nl;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        await this.handleLine(line);
      }
    });
    console.error('Qiita MCP Server started');
  }

  async handleLine(line) {
    let msg;
    try {
      msg = JSON.parse(line);
    } catch (err) {
      console.error(err);
      sendErrorResponse('unknown', -32700, 'Parse error');
      return;
    }

    const { id, method, params } = msg;
    if (id === undefined || !method) {
      sendErrorResponse(id ?? 'unknown', -32600, 'Invalid JSON-RPC request');
      return;
    }

    try {
      if (method === 'initialize') {
        // JSON-RPC 2.0 の形で返す
        sendResponse(makeResult(id, toolList.initialize.result));
      } else if (method === 'tools/list') {
        sendResponse(makeResult(id, toolList['tools/list'].result));
      } else if (method === 'tools/call') {
        const { name, arguments: args } = params || {};
        if (!name) {
          sendErrorResponse(id, -32600, 'Tool name not provided');
          return;
        }
        let output;
        if (name === 'get_qiita_ranking') {
          output = await getQiitaRankingText(args);
        } else if (name === 'summarize_qiita_article') {
          const { url, title, body, user_request, level } = args;
          const safeBody =
            body ??
            (await import('./clients/qiitaClient.js').then((m) =>
              m.fetchArticle(m.extractId(url))
            ));
          output = await summarizeArticle(
            { url, title, body: safeBody },
            user_request || '',
            level
          );
        } else {
          throw new Error(`Method not found: ${name}`);
        }
        sendResponse(
          makeResult(id, { content: [{ type: 'text', text: output }] })
        );
      } else {
        sendErrorResponse(id, -32601, `Method not found: ${method}`);
      }
    } catch (err) {
      console.error(err);
      sendErrorResponse(id, -32000, err.message);
    }
  }
}

new QiitaMCPServer();

// テスト用のエクスポート
export { QiitaMCPServer };
export async function handleRequest(method, params) {
  switch (method) {
    case 'get_qiita_ranking':
      return getQiitaRankingText(params);
    case 'summarize_qiita_article': {
      const { url, title, body, user_request, level } = params;
      const safeBody =
        body ??
        (await import('./clients/qiitaClient.js').then((m) =>
          m.fetchArticle(m.extractId(url))
        ));
      return summarizeArticle(
        { url, title, body: safeBody },
        user_request || '',
        level
      );
    }
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}
