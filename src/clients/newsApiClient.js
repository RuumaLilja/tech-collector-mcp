// File: src/clients/newsApiClient.js
import axios from 'axios';
import { NEWSAPI_KEY, ITEMS_PER_PAGE } from '../config/environment.js';

const BASE_URL = 'https://newsapi.org/v2';

/**
 * NewsAPI.org からテクノロジーヘッドラインを取得する
 * @param {Object} options
 * @param {string} [options.country='us'] - 国コード
 * @param {number} [options.page=1] - ページ番号
 * @param {number} [options.pageSize=ITEMS_PER_PAGE] - 1ページあたりの記事数
 * @returns {Promise<Object[]>} 記事配列
 */
export async function fetchTechHeadlines({ country = 'us', page = 1, pageSize = ITEMS_PER_PAGE } = {}) {
  const response = await axios.get(`${BASE_URL}/top-headlines`, {
    params: {
      category: 'technology',
      country,
      page,
      pageSize,
    },
    headers: {
      'X-Api-Key': NEWSAPI_KEY,
    },
  });
  return response.data.articles;
}

/**
 * NewsAPI.org からキーワード検索で記事を取得する
 * @param {Object} options
 * @param {string} options.query - 検索キーワード
 * @param {number} [options.page=1] - ページ番号
 * @param {number} [options.pageSize=ITEMS_PER_PAGE] - 1ページあたりの記事数
 * @returns {Promise<Object[]>} 記事配列
 */
export async function searchNews({ query, page = 1, pageSize = ITEMS_PER_PAGE } = {}) {
  const response = await axios.get(`${BASE_URL}/everything`, {
    params: {
      q: query,
      page,
      pageSize,
    },
    headers: {
      'X-Api-Key': NEWSAPI_KEY,
    },
  });
  return response.data.articles;
}
