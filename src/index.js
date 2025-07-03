#!/usr/bin/env node
import './config/environment.js';
import { toolList } from './config/toolDefinitions.static.js';
import { getQiitaRankingText } from './services/qiitaRanking.js';
import { getDevtoArticles } from './services/devtoService.js';
import { getNewsApiArticles } from './services/newsApiService.js';
import { getHackerNewsTopStories } from './services/hackerNewsService.js';
import { summarizeArticle } from './services/summarizeService.js';
import { fetchAllArticles } from './services/fetchService.js';
import { getSimpleRecommendations } from './services/recommenderService.js';
import { syncArticleToNotion } from './services/syncService.js';
import { syncAllArticles } from './services/aggregatorService.js';
import {
  sendResponse,
  sendErrorResponse,
  makeResult,
} from './utils/rpcHelpers.js';
import { NotionSdkStorage } from './adapters/notionSdkStorage.js';
import { injectNotionSyncTool } from './config/toolDefinitions.dynamic.js';

// 起動時に一度だけ propertyMap を取得
const propertyMap = await injectNotionSyncTool();

class QiitaMCPServer {
  constructor() {
    this.storage = new NotionSdkStorage(
      process.env.NOTION_API_KEY,
      process.env.NOTION_DATABASE_ID,
      propertyMap
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
          // — Qiita 関連
          case 'getQiitaRanking':
            result = await getQiitaRankingText(args);
            break;
          // — Dev.to 関連
          case 'getDevtoArticles':
            result = await getDevtoArticles(args);
            break;
          // — NewsAPI 関連
          case 'getNewsApiArticles':
            result = await getNewsApiArticles(args);
            break;
          // — Hacker News 関連
          case 'getHackerNewsTopStories':
            result = await getHackerNewsTopStories(args);
            break;

          // — 任意 URL 要約
          case 'summarizeUrlArticle': {
            const {
              url,
              title = '',
              user_request = '',
              targetLanguage = 'ja',
              level: requestedLevel,
            } = args;
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
          // — 全ソースまとめ取得
          case 'fetchAllArticles': {
            const { countPerSource = 1 } = args || {};
            // fetchService.js の関数を直呼び
            const articles = await fetchAllArticles(countPerSource);
            result = articles;
            break;
          }

          // — おすすめ記事
          case 'recommendArticles':
            result = await getSimpleRecommendations(args, { storage });
            break;

          // — Notion 同期
          case 'syncArticleToNotion':
            result = await syncArticleToNotion(args, { storage });
            break;

          // — 各ソースをまとめて同期（バッチ）
          case 'aggregateArticles':
            // 一括取得＋Notion同期
            result = await syncAllArticles(args, { storage });
            break;

          default:
            sendErrorResponse(id, -32000, `Unknown tool: ${name}`);
            return;
        }

        sendResponse(
          makeResult(id, {
            content: [{ type: 'text', text: JSON.stringify(result) }],
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

export { QiitaMCPServer };
export async function handleRequest(method, params) {
  switch (method) {
    case 'getQiitaRanking':
      return getQiitaRankingText(params);
    case 'summarizeUrlArticle':
      return summarizeArticle(params);
    case 'getDevtoArticles':
      return getDevtoArticles(params);
    case 'getNewsApiArticles':
      return getNewsApiArticles(params);
    case 'getHackernewsTopStories':
      return getHackerNewsTopStories(params);
    case 'aggregateArticles':
      // テスト時はモック storage を渡す
      return syncAllArticles(params, {
        storage: new NotionSdkStorage(
          process.env.NOTION_API_KEY,
          process.env.NOTION_DATABASE_ID,
          {}
        ),
      });
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}
