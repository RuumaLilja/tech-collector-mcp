// File: src/services/aggregatorService.js
import { getQiitaRankingText } from './qiitaRanking.js';
import { getDevtoArticles } from './devtoService.js';
import { getNewsApiArticles } from './newsApiService.js';
import { getHackerNewsTopStories } from './hackerNewsService.js';

/**
 * 各ソースから技術記事をまとめて取得する
 * @param {Object} options
 * @param {number} [options.countPerSource=5] - 各ソースから取得する件数
 * @returns {Promise<Object>} 各ソースごとの記事リストまたはランキングテキスト
 */
export async function getAllTechArticles({ countPerSource = 5 } = {}) {
  // 1. 並列取得（Promise.allSettled で部分的失敗を許容）
  const results = await Promise.allSettled([
    // Qiita はランキングテキストとして取得（ツール get_qiita_ranking と同様の形式）
    getQiitaRankingText({ period: 'weekly', count: countPerSource }),
    // Dev.to は記事オブジェクト配列
    getDevtoArticles({ count: countPerSource }),
    // NewsAPI は記事オブジェクト配列
    getNewsApiArticles({ count: countPerSource }),
    // Hacker News は記事オブジェクト配列
    getHackerNewsTopStories({ count: countPerSource }),
  ]);

  // 2. 結果を分解
  const [qiitaResult, devtoResult, newsapiResult, hackernewsResult] = results;

  // 3. 成功したもののみ取得、失敗時はデフォルト値
  return {
    qiitaRanking:
      qiitaResult.status === 'fulfilled' ? qiitaResult.value : '取得失敗',
    devto: devtoResult.status === 'fulfilled' ? devtoResult.value : [],
    newsapi: newsapiResult.status === 'fulfilled' ? newsapiResult.value : [],
    hackernews:
      hackernewsResult.status === 'fulfilled' ? hackernewsResult.value : [],
    // オプション: エラー情報も返す場合
    errors: results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason?.message || 'Unknown error'),
  };
}
