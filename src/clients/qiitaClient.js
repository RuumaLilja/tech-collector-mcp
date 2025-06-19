// ── clients/qiitaClient.js ──
import axios from 'axios';

const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'QiitaMCPServer/1.0.0',
};

/**
 * Qiita API からアイテム一覧を取得
 * @param {string} query
 * @param {number} page
 * @returns {Promise<any[]>}
 */
export async function fetchItems(query, page = 1) {
  const url = `https://qiita.com/api/v2/items?per_page=${page}&page=${page}&query=${encodeURIComponent(query)}`;
  const resp = await axios.get(url, { headers: DEFAULT_HEADERS, timeout: 10000 });
  return Array.isArray(resp.data) ? resp.data : [];
}

/**
 * Qiita API から単一記事を取得
 * @param {string} itemId
 * @returns {Promise<any>}
 */
export async function fetchArticle(itemId) {
  const url = `https://qiita.com/api/v2/items/${itemId}`;
  const resp = await axios.get(url, { headers: DEFAULT_HEADERS, timeout: 10000 });
  return resp.data;
}
