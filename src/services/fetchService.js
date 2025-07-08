// fetchService.js
import { getQiitaRankingObjects } from './qiitaRanking.js';
import { getDevtoArticles } from './devtoService.js';
import { getNewsApiArticles } from './newsApiService.js';
import { getHackerNewsTopStories } from './hackerNewsService.js';
import { computeArticleHash } from '../utils/simhash.js';
import { subDays, subMonths } from 'date-fns';

/**
 * 各ソースから記事を取得し、汎用フォーマットで返します。
 * @param {Object} options
 * @param {number} [options.countPerSource=5]
 * @param {string} [options.period='weekly']
 * @param {string} [options.category]
 * @returns {Promise<Array<Object>>}
 */
export async function fetchAllArticles({
  countPerSource = 5,
  period = 'weekly',
  category,
} = {}) {
  const cutoff =
    period === 'daily'
      ? subDays(new Date(), 1)
      : period === 'weekly'
      ? subDays(new Date(), 7)
      : subMonths(new Date(), 1);

  const articles = [];

  // 1. Qiita
  try {
    const qiitaItems = await getQiitaRankingObjects({
      period,
      category,
      count: countPerSource,
    });
    
    const genericQiita = qiitaItems.map((item) => ({
      url: item.URL,
      title: item.Title,
      tags: item.タグ || [],
      hash: computeArticleHash({ 
        id: item._raw?.id,
        url: item.URL,
      }),
      publishedAt: item.公開日,
      savedAt: new Date().toISOString(),
      source: 'Qiita',
      author: item.著者 || 'unknown',
      _raw: item._raw,
    }));
    
    articles.push(...genericQiita);
  } catch (err) {
    console.error('fetchAllArticles: Qiita取得失敗', err);
  }

  // 2. Dev.to
  try {
    const devtoRaw = await getDevtoArticles({
      tag: category,
      count: countPerSource,
    });
    
    const genericDevto = devtoRaw
      .filter((item) => new Date(item.publishedAt) >= cutoff)
      .map((item) => ({
        url: item.url,
        title: item.title,
        tags: item.tags || [],
        hash: computeArticleHash({
          id: item.id,
          url: item.url,
        }),
        publishedAt: item.publishedAt,
        savedAt: new Date().toISOString(),
        source: 'Dev.to',
        author: item.author || 'unknown',
        _raw: item,
      }));
    
    articles.push(...genericDevto);
  } catch (err) {
    console.error('fetchAllArticles: Dev.to取得失敗', err);
  }

  // 3. NewsAPI
  try {
    const newsRaw = await getNewsApiArticles({ count: countPerSource });
    
    const genericNews = newsRaw
      .filter((item) => new Date(item.publishedAt) >= cutoff)
      .map((item) => ({
        url: item.url,
        title: item.title,
        // summary: 完全除去
        tags: ['News'],
        hash : computeArticleHash({
          url: item.url,
        }),
        publishedAt: item.publishedAt,
        savedAt: new Date().toISOString(),
        source: item.source?.name || 'NewsAPI',
        author: item.author || 'unknown',
        _raw: item,
      }));
    
    articles.push(...genericNews);
  } catch (err) {
    console.error('fetchAllArticles: NewsAPI取得失敗', err);
  }

  // 4. Hacker News
  try {
    const hnRaw = await getHackerNewsTopStories({ count: countPerSource });
    
    const genericHN = hnRaw
      .filter((item) => {
        const t = item.time ? new Date(item.time * 1000) : null;
        return t && t >= cutoff;
      })
      .map((item) => ({
        url: item.url,
        title: item.title,
        tags: ['HackerNews'],
        hash: computeArticleHash({
          id: item.id?.toString(),
          url: item.url
        }),
        publishedAt: item.time
          ? new Date(item.time * 1000).toISOString()
          : undefined,
        savedAt: new Date().toISOString(),
        source: 'HackerNews',
        author: item.by || item.author || 'unknown',
        _raw: item,
      }));
    
    articles.push(...genericHN);
  } catch (err) {
    console.error('fetchAllArticles: HackerNews取得失敗', err);
  }

  return articles;
}