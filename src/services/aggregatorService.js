// File: src/services/aggregatorService.js
// 修正後のインポート
import { getQiitaRankingText, getQiitaRankingObjects } from './qiitaRanking.js';
import { getDevtoArticles } from './devtoService.js';
import { getNewsApiArticles } from './newsApiService.js';
import { getHackerNewsTopStories } from './hackerNewsService.js';
/**
 * 各ソースから技術記事をまとめて取得する
 * @param {Object} options
 * @param {number} [options.countPerSource=5] - 各ソースから取得する件数
 * @returns {Promise<Object>} 各ソースごとの記事リストまたはランキングテキスト
 */
export async function getAllTechArticles({ countPerSource = 1 } = {}) {
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
export async function getAllTechArticlesForSync({ countPerSource = 5 }) {
  const results = {
    qiita: [],
    devto: [],
    newsapi: [],
    hackernews: [],
    errors: []
  };

  try {
    // Qiita記事を構造化オブジェクトとして取得
    const qiitaObjects = await getQiitaRankingObjects({ 
      period: 'weekly', 
      count: countPerSource 
    });
    results.qiita = qiitaObjects;
  } catch (error) {
    results.errors.push(`Qiita: ${error.message}`);
  }

  try {
    // Dev.to記事を統一フォーマットに変換
    const devtoRaw = await getDevtoArticles({ count: countPerSource });
    results.devto = devtoRaw.map((item, index) => ({
      Title: item.title,
      URL: item.url,
      要約: item.description || `Dev.to人気記事。リアクション: ${item.reactions}件、コメント: ${item.comments}件`,
      
      ソース元: 'Dev.to',
      ステータス: '未読',
      公開日: item.publishedAt,
      保存日: new Date().toISOString(),
      
      タグ: item.tags || ['Programming'],
      著者: item.author || 'unknown',
      
      _raw: {
        reactions: item.reactions,
        comments: item.comments,
        readingTime: item.readingTime
      }
    }));
  } catch (error) {
    results.errors.push(`Dev.to: ${error.message}`);
  }

  try {
    // NewsAPI記事を統一フォーマットに変換
    const newsapiRaw = await getNewsApiArticles({ count: countPerSource });
    results.newsapi = newsapiRaw.map((item, index) => ({
      Title: item.title,
      URL: item.url,
      要約: item.description || 'テクノロジーニュース記事',
      
      ソース元: 'NewsAPI',
      ステータス: '未読',
      公開日: item.publishedAt,
      保存日: new Date().toISOString(),
      
      タグ: ['Technology'],
      著者: item.source || 'unknown',
      
      _raw: {
        source: item.source
      }
    }));
  } catch (error) {
    results.errors.push(`NewsAPI: ${error.message}`);
  }

  try {
    // Hacker News記事を統一フォーマットに変換
    const hackernewsRaw = await getHackerNewsTopStories({ count: countPerSource });
    results.hackernews = hackernewsRaw.map((item, index) => ({
      Title: item.title,
      URL: item.url,
      要約: `Hacker News人気記事。スコア: ${item.score}点、コメント: ${item.comments}件`,
      
      ソース元: 'HackerNews',
      ステータス: '未読',
      公開日: item.time ? new Date(item.time).toISOString() : new Date().toISOString(),
      保存日: new Date().toISOString(),
      
      タグ: ['Technology'],
      著者: item.author || 'unknown',
      
      _raw: {
        score: item.score,
        comments: item.comments
      }
    }));
  } catch (error) {
    results.errors.push(`HackerNews: ${error.message}`);
  }

  return results;
}

/**
 * 記事を自動的にNotionに同期する関数
 */
export async function syncAllArticlesToNotion({ countPerSource = 5 }) {
  const articles = await getAllTechArticlesForSync({ countPerSource });
  const syncResults = [];

  // 各ソースの記事を順番に同期
  for (const source of ['qiita', 'devto', 'newsapi', 'hackernews']) {
    for (const article of articles[source]) {
      try {
        const result = await syncToNotion(article);
        syncResults.push({
          source,
          title: article.Title,
          success: result.synced,
          created: result.created,
          updated: result.updated
        });
      } catch (error) {
        syncResults.push({
          source,
          title: article.Title,
          success: false,
          error: error.message
        });
      }
    }
  }

  return {
    totalAttempted: syncResults.length,
    successful: syncResults.filter(r => r.success).length,
    failed: syncResults.filter(r => !r.success).length,
    results: syncResults,
    errors: articles.errors
  };
}