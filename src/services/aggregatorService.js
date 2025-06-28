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
  // 1. 並列取得
  const [qiitaRanking, devto, newsapi, hackernews] = await Promise.all([
    // Qiita はランキングテキストとして取得（ツール get_qiita_ranking と同様の形式）
    getQiitaRankingText({ period: 'weekly', count: countPerSource }),
    // Dev.to は記事オブジェクト配列
    getDevtoArticles({ count: countPerSource }),
    // NewsAPI は記事オブジェクト配列
    getNewsApiArticles({ count: countPerSource }),
    // Hacker News は記事オブジェクト配列
    getHackerNewsTopStories({ count: countPerSource }),
  ]);

  // 2. 結果をまとめて返却
  return {
    qiitaRanking,  // テキストベースのランキング
    devto,         // JSON配列
    newsapi,       // JSON配列
    hackernews,    // JSON配列
  };
}
