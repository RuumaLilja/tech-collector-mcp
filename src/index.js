#!/usr/bin/env node

// -----------------------------
// 環境設定・ツール定義の読み込み
// -----------------------------
import './config/environment.js';
import { toolList } from './config/toolDefinitions.static.js';

// -----------------------------
// 各種サービスのインポート
// -----------------------------
import { getQiitaRankingText } from './services/qiitaRanking.js';
import { getDevtoArticles } from './services/devtoService.js';
import { getNewsApiArticles } from './services/newsApiService.js';
import { getHackerNewsTopStories } from './services/hackerNewsService.js';
import { summarizeArticle } from './services/summarizeService.js';
import { fetchAllArticles } from './services/fetchService.js';
import { getRecommendations } from './services/recommenderService.js';
import { syncArticleToNotion } from './services/syncService.js';
import { syncAllArticles } from './services/aggregatorService.js';
import {
  sendResponse,
  sendErrorResponse,
  makeResult,
  wrapContent,
} from './utils/rpcHelpers.js';
import { NotionSdkStorage } from './adapters/notionSdkStorage.js';
import { injectNotionSyncTool } from './config/toolDefinitions.dynamic.js';

// -----------------------------
// 起動時: Notion データベースの propertyMap を取得
// -----------------------------
const propertyMap = await injectNotionSyncTool();

class QiitaMCPServer {
  constructor() {
    // Notion SDK をラップした Storage を初期化
    this.storage = new NotionSdkStorage(
      process.env.NOTION_API_KEY,
      process.env.NOTION_DATABASE_ID,
      propertyMap
    );
    this.init();
  }

  // -----------------------------
  // 標準入力の JSON-RPC を読み取って処理
  // -----------------------------
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

  // -----------------------------
  // 1メッセージ分の処理
  // -----------------------------
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
      // --- initialize メソッド ---
      if (method === 'initialize') {
        sendResponse(makeResult(id, toolList.initialize.result));
        return;
      }

      // --- ツール一覧取得 ---
      if (method === 'tools/list') {
        sendResponse(makeResult(id, toolList['tools/list'].result));
        return;
      }

      // --- ツール呼び出し ---
      if (method === 'tools/call') {
        const { name, arguments: args } = params || {};
        const storage = this.storage;

        if (!name) {
          sendErrorResponse(id, -32600, 'Tool name not provided');
          return;
        }

        let result;
        switch (name) {
          // Qiitaランキング取得
          case 'getQiitaRanking':
            result = wrapContent(await getQiitaRankingText(args));
            break;

          // Dev.to関連記事取得
          case 'getDevtoArticles':
            result = wrapContent(await getDevtoArticles(args));
            break;

          // NewsAPI関連記事取得
          case 'getNewsApiArticles':
            result = wrapContent(await getNewsApiArticles(args));
            break;

          // Hacker News トップストーリー取得
          case 'getHackerNewsTopStories':
            result = wrapContent(await getHackerNewsTopStories(args));
            break;

          // 任意URL要約
          case 'summarizeUrlArticle': {
            const {
              url,
              title = '',
              user_request = '',
              targetLanguage = 'ja',
              level: requestedLevel,
            } = args;
            const level = requestedLevel === 'detailed' ? 'detailed' : 'short';
            result = wrapContent(
              await summarizeArticle({
                url,
                title,
                level,
                user_request,
                targetLanguage,
              })
            );
            break;
          }

          // 全ソース記事一括取得
          case 'fetchAllArticles': {
            const {
              countPerSource = 5,
              period = 'weekly',
              category,
              enableQiitaSummary = false,
            } = args || {};

            console.error('fetchAllArticles params:', {
              countPerSource,
              period,
              category,
              enableQiitaSummary,
            });

            const articlesArray = await fetchAllArticles({
              countPerSource,
              period,
              category,
              enableQiitaSummary,
            });
            result = wrapContent({ articles: articlesArray });
            break;
          }

          // おすすめ記事取得 (リコメンダー)
          case 'recommendArticles':
            result = wrapContent(await getRecommendations(args, { storage }));
            break;

          // Notion 同期
          case 'syncArticleToNotion':
            result = wrapContent(await syncArticleToNotion(args, { storage }));
            break;

          // 各ソース一括同期
          case 'aggregateArticles': {
            const {
              countPerSource = 1,
              period = 'weekly',
              category,
            } = args || {};

            console.error('aggregateArticles called with:', {
              countPerSource,
              period,
              category,
            });

            result = wrapContent(
              await syncAllArticles(
                {
                  countPerSource,
                  period,
                  category,
                },
                { storage }
              )
            );
            break;
          }

          default:
            sendErrorResponse(id, -32000, `Unknown tool: ${name}`);
            return;
        }

        // 結果を JSON-RPC レスポンスとして返却
        sendResponse(makeResult(id, result));
        return;
      }

      // メソッド未定義
      sendErrorResponse(id, -32601, `Method not found: ${method}`);
    } catch (err) {
      console.error(err);
      sendErrorResponse(id, -32000, err.message);
    }
  }
}

// インスタンス生成して起動
new QiitaMCPServer();

// テスト用の handleRequest エクスポート
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
    case 'getHackerNewsTopStories':
      return getHackerNewsTopStories(params);
    case 'aggregateArticles':
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
