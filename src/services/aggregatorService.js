// src/services/aggregatorService.js

import { fetchAllArticles } from './fetchService.js';
import { batchsyncArticleToNotion } from './syncBatchService.js';
import { summarizeSyncResults } from './reportService.js';

/**
 * 各ソースから記事を取得し、Notionに同期した結果を集計して返します。
 * 実用的な固定設定で最適化済み
 * @param {Object} options - オプション
 * @param {number} options.countPerSource - 各ソースからの取得記事数（デフォルト: 3）
 * @param {string} options.period - 取得期間（デフォルト: 'weekly'）
 * @param {string} options.category - カテゴリ
 * @param {Object} context - コンテキスト
 * @param {Object} context.storage - ストレージポート
 * @returns {Promise<{ summary: { total:number, success:number, failed:number, details:Array, errors:Array }, errors:Array }>} 同期結果サマリとエラー一覧
 */
export async function syncAllArticles(
  { 
    countPerSource = 3, 
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

  if (articles.length === 0) {
    return { 
      summary: { 
        total: 0, 
        success: 0, 
        failed: 0, 
        details: [], 
        errors: [] 
      }, 
      errors: [] 
    };
  }

  // 2) 最適化された設定で記事をNotionに同期
  const results = await batchsyncArticleToNotion(articles, { storage });

  // 3) 同期結果を集計
  const summary = summarizeSyncResults(results);

  // 失敗した記事のエラー情報も返却
  return { summary, errors: summary.errors };
}