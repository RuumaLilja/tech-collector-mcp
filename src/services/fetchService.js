import { getQiitaRankingObjects } from './qiitaRanking.js';
import { getDevtoArticles } from './devtoService.js';
import { getNewsApiArticles } from './newsApiService.js';
import { getHackerNewsTopStories } from './hackerNewsService.js';
import { computeSimHash } from '../utils/simhash.js';
import { subDays, subMonths } from 'date-fns';

/**
 * 各ソースから記事を取得し、汎用フォーマットで返します。
 * @param {Object}   options
 * @param {number}   [options.countPerSource=5] - 各ソースから取得する件数
 * @param {string}   [options.period='weekly']   - 取得期間: 'daily' | 'weekly' | 'monthly'
 * @param {string}   [options.category]          - Qiita/Dev.to のタグ絞り込み
 * @returns {Promise<Array<Object>>} 汎用記事オブジェクトの配列
 */
export async function fetchAllArticles({
  countPerSource = 5,
  period = 'weekly',
  category,
} = {}) {
  // 1. カットオフ日時を決定
  const cutoff =
    period === 'daily'
      ? subDays(new Date(), 1)
      : period === 'weekly'
      ? subDays(new Date(), 7)
      : subMonths(new Date(), 1);

  const articles = [];

  // 2. Qiita: 期間・タグ込みでランキング取得
  try {
    const qiitaItems = await getQiitaRankingObjects({
      period,
      category,
      count: countPerSource,
    });
    const genericQiita = qiitaItems.map((item) => ({
      title: item.Title,
      url: item.URL,
      summary: item.要約,
      tags: item.タグ,
      hash: computeSimHash(item.URL),
      source: item.ソース元,
      publishedAt: item.公開日,
      author: item.著者,
      _raw: item._raw,
    }));
    articles.push(...genericQiita);
  } catch (err) {
    console.error('fetchAllArticles: Qiita取得失敗', err);
  }

  // 3. Dev.to: タグ絞り込み + 期間フィルタ
  try {
    const devtoRaw = await getDevtoArticles({
      tag: category,
      count: countPerSource,
    });
    const genericDevto = devtoRaw
      .filter((item) => new Date(item.publishedAt) >= cutoff)
      .map((item) => ({
        title: item.title,
        url: item.url,
        summary: item.description,
        tags: item.tags || [],
        hash: computeSimHash(item.url),
        source: 'Dev.to',
        publishedAt: item.publishedAt,
        author: item.author || 'unknown',
        _raw: item,
      }));
    articles.push(...genericDevto);
  } catch (err) {
    console.error('fetchAllArticles: Dev.to取得失敗', err);
  }

  // 4. NewsAPI: 期間フィルタ
  try {
    const newsRaw = await getNewsApiArticles({ count: countPerSource });
    const genericNews = newsRaw
      .filter((item) => new Date(item.publishedAt) >= cutoff)
      .map((item) => ({
        title: item.title,
        url: item.url,
        summary: item.description,
        tags: [],
        hash: computeSimHash(item.url),
        source: item.source?.name || 'NewsAPI',
        publishedAt: item.publishedAt,
        author: item.author || 'unknown',
        _raw: item,
      }));
    articles.push(...genericNews);
  } catch (err) {
    console.error('fetchAllArticles: NewsAPI取得失敗', err);
  }

  // 5. Hacker News: 期間フィルタ
  try {
    const hnRaw = await getHackerNewsTopStories({ count: countPerSource });
    const genericHN = hnRaw
      .filter((item) => {
        const t = item.time ? new Date(item.time * 1000) : null;
        return t && t >= cutoff;
      })
      .map((item) => ({
        title: item.title,
        url: item.url,
        summary:
          item.score != null && item.comments != null
            ? `Score:${item.score}, Comments:${item.comments}`
            : '',
        tags: ['HN'],
        hash: computeSimHash(item.url),
        source: 'HackerNews',
        publishedAt: item.time
          ? new Date(item.time * 1000).toISOString()
          : null,
        author: item.by || item.author || 'unknown',
        _raw: item,
      }));
    articles.push(...genericHN);
  } catch (err) {
    console.error('fetchAllArticles: Hacker News取得失敗', err);
  }

  return articles;
}
