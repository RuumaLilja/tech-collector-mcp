// src/services/aggregatorService.js

import { fetchAllArticles } from './fetchService.js';
import { batchsyncArticleToNotion } from './syncBatchService.js';
import { summarizeSyncResults } from './reportService.js';

/**
 * 各ソースから記事を取得し、Notionに同期した結果を集計して返します。
 * @param {{ 
 *   countPerSource?: number, 
 *   period?: string, 
 *   category?: string,
 * }} options
 * @param {{ storage: import('../ports/storage.js').StoragePort }} context
 * @returns {Promise<{ summary: { total:number, success:number, failed:number, details:Array, errors:Array }, errors:Array }>} 同期結果サマリとエラー一覧
 */
export async function syncAllArticles(
  { 
    countPerSource = 5, 
    period = 'weekly',
    category,
  } = {},
  { storage }
) {
  console.error('syncAllArticles called with:', {
    countPerSource,
    period,
    category,
  });

  // 1) 各ソースから汎用フォーマットの記事を取得
  const articles = await fetchAllArticles({
    countPerSource,
    period,
    category,
  });

  console.error(`Articles fetched: ${articles.length}`);

  // 2) 取得した記事を並列でNotionに同期し、結果を取得
  const results = await batchsyncArticleToNotion(articles, { storage });

  // 3) 同期結果を集計
  const summary = summarizeSyncResults(results);

  // 失敗した記事のエラー情報も返却
  return { summary, errors: summary.errors };
}