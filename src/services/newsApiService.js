// File: src/services/newsApiService.js
import { fetchTechHeadlines } from '../clients/newsApiClient.js';
import { PAGE_LIMIT } from '../config/environment.js';

/**
 * NewsAPI.org からテクノロジーヘッドラインを取得し、標準フォーマットに整形して返す
 * @param {Object} options
 * @param {string} [options.country='us'] - ニュースの国コード
 * @param {number} [options.count=PAGE_LIMIT] - 取得する記事数
 * @returns {Promise<Object[]>} 整形済み記事リスト
 */
export async function getNewsApiArticles({ country = 'us', count = PAGE_LIMIT } = {}) {
  const items = await fetchTechHeadlines({ country, page: 1, pageSize: count });

  return items.map(item => ({
    title: item.title,
    url: item.url,
    description: item.description,
    publishedAt: item.publishedAt,
    source: item.source.name,
  }));
}
