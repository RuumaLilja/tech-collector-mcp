#!/usr/bin/env node
import './config/environment.js';
import { toolList } from './config/toolDefinitions.js';
import { getQiitaRankingText } from './services/qiitaRanking.js';
import { summarizeArticle } from './services/summarizeService.js';
import { getDevtoArticles } from './services/devtoService.js';
import { getNewsApiArticles } from './services/newsApiService.js';
import { getHackerNewsTopStories } from './services/hackerNewsService.js';
import { getAllTechArticles } from './services/aggregatorService.js';
import {
  sendResponse,
  sendErrorResponse,
  makeResult,
} from './utils/rpcHelpers.js';
import { NotionSdkStorage } from './adapters/notionSdkStorage.js';
import { syncToNotion } from './services/syncService.js';
import { getSimpleRecommendations } from './services/recommenderService.js';
import { injectNotionSyncTool } from './config/dynamicToolDefs.js';

await injectNotionSyncTool();

class QiitaMCPServer {
  constructor() {
    this.storage = new NotionSdkStorage(
      process.env.NOTION_API_KEY,
      process.env.NOTION_DATABASE_ID
    );
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
        sendResponse(makeResult(id, toolList.initialize.result));
        return;
      }

      if (method === 'tools/list') {
        sendResponse(makeResult(id, toolList['tools/list'].result));
        return;
      }

      if (method === 'tools/call') {
        const { name, arguments: args } = params || {};
        const storage = this.storage;

        if (!name) {
          sendErrorResponse(id, -32600, 'Tool name not provided');
          return;
        }

        let result;
        switch (name) {
          case 'get_qiita_ranking':
            result = await getQiitaRankingText(args);
            break;

          case 'summarize_url_article': {
            // 汎用URL要約
            const {
              url,
              title = '',
              user_request = '',
              targetLanguage = 'ja',
              level: requestedLevel,
            } = args;
            // ユーザーが 'detailed' を明示的に要求しない限り short
            const level = requestedLevel === 'detailed' ? 'detailed' : 'short';
            result = await summarizeArticle({
              url,
              title,
              level,
              user_request,
              targetLanguage,
            });
            break;
          }

          case 'get_devto_articles':
            result = await getDevtoArticles(args);
            break;

          case 'get_newsapi_articles':
            result = await getNewsApiArticles(args);
            break;

          case 'get_hackernews_topstories':
            result = await getHackerNewsTopStories(args);
            break;

          case 'get_all_tech_articles':
            result = await getAllTechArticles(args);
            break;

          case 'syncToNotion':
            // args は {url,hash,title,summary,collectedAt?}
            result = await syncToNotion(args, { storage });
            break;

          case 'getSimpleRecommendations':
            // args は { limit?: number }
            result = await getSimpleRecommendations(args, { storage });
            break;

          default:
            sendErrorResponse(id, -32000, `Unknown tool: ${name}`);
            return;
        }

        // レスポンスは文字列化して返却
        sendResponse(
          makeResult(id, {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result),
              },
            ],
          })
        );
        return;
      }

      sendErrorResponse(id, -32601, `Method not found: ${method}`);
    } catch (err) {
      console.error(err);
      sendErrorResponse(id, -32000, err.message);
    }
  }
}

new QiitaMCPServer();

// テスト用ハンドラエクスポート
export { QiitaMCPServer };
export async function handleRequest(method, params) {
  switch (method) {
    case 'get_qiita_ranking':
      return getQiitaRankingText(params);

    case 'summarize_url_article':
      return summarizeArticle(params);

    case 'get_devto_articles':
      return getDevtoArticles(params);

    case 'get_newsapi_articles':
      return getNewsApiArticles(params);

    case 'get_hackernews_topstories':
      return getHackerNewsTopStories(params);

    case 'get_all_tech_articles':
      return getAllTechArticles(params);

    case 'get_smart_recommendations':
      return getSmartRecommendations(params);

    default:
      throw new Error(`Unknown method: ${method}`);
  }
}
