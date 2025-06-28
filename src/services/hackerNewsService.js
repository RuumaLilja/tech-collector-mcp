// File: src/services/hackerNewsService.js
import { fetchTopStoryIds, fetchItem } from '../clients/hackerNewsClient.js';
import { PAGE_LIMIT } from '../config/environment.js';

/**
 * Hacker News のトップストーリーを取得し、標準フォーマットに整形して返す
 * @param {Object} options
 * @param {number} [options.count=PAGE_LIMIT] - 取得する記事数
 * @returns {Promise<Object[]>} 整形済み記事リスト
 */
export async function getHackerNewsTopStories({ count = PAGE_LIMIT } = {}) {
  // トップストーリー ID を取得
  const ids = await fetchTopStoryIds();
  const topIds = ids.slice(0, count);

  // 各アイテムを並列取得
  const items = await Promise.all(topIds.map((id) => fetchItem(id)));

  // 整形して返却
  return items.map((item) => ({
    title: item.title,
    url: item.url,
    author: item.by,
    score: item.score,
    comments: item.descendants,
    time: new Date(item.time * 1000).toISOString(),
    source: 'Hacker News',
  }));
}
