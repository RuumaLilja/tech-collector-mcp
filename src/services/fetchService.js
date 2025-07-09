// fetchService.js
import { getQiitaRankingObjects } from './qiitaRanking.js';
import { getDevtoArticles } from './devtoService.js';
import { getNewsApiArticles } from './newsApiService.js';
import { getHackerNewsTopStories } from './hackerNewsService.js';
import { computeArticleHash } from '../utils/simhash.js';
import { subDays, subMonths } from 'date-fns';

/**
 * 期間を段階的に広げるための設定
 */
const FALLBACK_PERIODS = [
  { period: 'weekly', cutoff: (now) => subDays(now, 7) },
  { period: 'monthly', cutoff: (now) => subMonths(now, 1) },
  { period: 'quarterly', cutoff: (now) => subMonths(now, 3) },
  { period: 'yearly', cutoff: (now) => subMonths(now, 12) },
];

/**
 * 安全にデータを処理する関数
 */
function validateData(data, sourceName) {
  try {
    if (!data) {
      return null;
    }
    
    if (typeof data === 'object' && data !== null) {
      return data;
    }
    
    return null;
  } catch (error) {
    console.error(`[${sourceName}] データ検証エラー: ${error.message}`);
    return null;
  }
}

/**
 * 指定された期間で記事を取得し、足りない場合は期間を広げて再取得
 */
async function fetchWithFallback(fetchFunction, targetCount, sourceName) {
  for (const { period, cutoff } of FALLBACK_PERIODS) {
    try {
      const now = new Date();
      const articles = await fetchFunction(cutoff(now));
      
      if (!Array.isArray(articles)) {
        continue;
      }
      
      if (articles.length >= targetCount) {
        return articles.slice(0, targetCount);
      }
    } catch (error) {
      console.error(`[${sourceName}] ${period}期間での取得エラー: ${error.message}`);
    }
  }
  
  return [];
}

/**
 * 各ソースから記事を取得し、汎用フォーマットで返します。
 * @param {Object} options
 * @param {number} [options.countPerSource=3]
 * @param {string} [options.period='weekly']
 * @param {string} [options.category]
 * @returns {Promise<Array<Object>>}
 */
export async function fetchAllArticles({
  countPerSource = 3,
  period = 'weekly',
  category,
} = {}) {
  const articles = [];

  // 1. Qiita (期間フィルタリングなし、そのまま)
  try {
    const qiitaItems = await getQiitaRankingObjects({
      period,
      category,
      count: countPerSource,
    });
    
    const validatedItems = validateData(qiitaItems, 'Qiita');
    if (validatedItems && Array.isArray(validatedItems)) {
      const genericQiita = validatedItems.map((item) => ({
        url: item.URL,
        title: item.Title,
        tags: item.タグ || [],
        hash: item.SimHash,
        publishedAt: item.公開日,
        savedAt: new Date().toISOString(),
        source: 'Qiita',
        author: item.著者 || 'unknown',
        _raw: item._raw,
      }));
      
      articles.push(...genericQiita);
    }
  } catch (err) {
    console.error(`[Qiita] 取得失敗: ${err.message}`);
  }

  // 2. Dev.to (フォールバック機能付き)
  const devtoFetcher = async (cutoff) => {
    try {
      const devtoItems = await getDevtoArticles({
        tag: category,
        count: countPerSource * 3,
      });
      
      const validatedItems = validateData(devtoItems, 'Dev.to');
      if (!Array.isArray(validatedItems)) {
        return [];
      }
      
      const filtered = validatedItems.filter((item) => {
        const pubDate = new Date(item.publishedAt);
        return pubDate >= cutoff;
      });
      
      return filtered.map((item) => ({
        url: item.url,
        title: item.title,
        tags: item.tags || [],
        hash: computeArticleHash({
          url: item.url,
        }),
        publishedAt: item.publishedAt,
        savedAt: new Date().toISOString(),
        source: 'Dev.to',
        author: item.author || 'unknown',
        _raw: item,
      }));
    } catch (error) {
      console.error(`[Dev.to] 取得エラー: ${error.message}`);
      return [];
    }
  };

  try {
    const devtoArticles = await fetchWithFallback(devtoFetcher, countPerSource, 'Dev.to');
    articles.push(...devtoArticles);
  } catch (err) {
    console.error(`[Dev.to] フォールバック失敗: ${err.message}`);
  }

  // 3. NewsAPI (フォールバック機能付き)
  const newsApiFetcher = async (cutoff) => {
    try {
      const newsItems = await getNewsApiArticles({ count: countPerSource * 3 });
      
      const validatedItems = validateData(newsItems, 'NewsAPI');
      if (!Array.isArray(validatedItems)) {
        return [];
      }
      
      const filtered = validatedItems.filter((item) => {
        const pubDate = new Date(item.publishedAt);
        return pubDate >= cutoff;
      });
      
      return filtered.map((item) => ({
        url: item.url,
        title: item.title,
        tags: ['News'],
        hash: computeArticleHash({
          url: item.url,
        }),
        publishedAt: item.publishedAt,
        savedAt: new Date().toISOString(),
        source: item.source?.name || 'NewsAPI',
        author: item.author || 'unknown',
        _raw: item,
      }));
    } catch (error) {
      console.error(`[NewsAPI] 取得エラー: ${error.message}`);
      return [];
    }
  };

  try {
    const newsArticles = await fetchWithFallback(newsApiFetcher, countPerSource, 'NewsAPI');
    articles.push(...newsArticles);
  } catch (err) {
    console.error(`[NewsAPI] フォールバック失敗: ${err.message}`);
  }

  // 4. Hacker News (フォールバック機能付き)
  const hackerNewsFetcher = async (cutoff) => {
    try {
      const hnItems = await getHackerNewsTopStories({ count: countPerSource * 3 });
      
      const validatedItems = validateData(hnItems, 'HackerNews');
      if (!Array.isArray(validatedItems)) {
        return [];
      }
      
      const filtered = validatedItems.filter((item) => {
        // item.time は既に ISO 文字列として返される
        const t = item.time ? new Date(item.time) : null;
        return t && t >= cutoff;
      });
      
      return filtered.map((item) => ({
        url: item.url,
        title: item.title,
        tags: ['HackerNews'],
        hash: computeArticleHash({
          id: item.id?.toString(),
          url: item.url
        }),
        publishedAt: item.time || undefined,
        savedAt: new Date().toISOString(),
        source: 'HackerNews',
        author: item.author || item.by || 'unknown',
        _raw: item,
      }));
    } catch (error) {
      console.error(`[HackerNews] 取得エラー: ${error.message}`);
      return [];
    }
  };

  try {
    const hnArticles = await fetchWithFallback(hackerNewsFetcher, countPerSource, 'HackerNews');
    articles.push(...hnArticles);
  } catch (err) {
    console.error(`[HackerNews] フォールバック失敗: ${err.message}`);
  }

  return articles;
}