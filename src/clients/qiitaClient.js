import axios from 'axios';
import Bottleneck from 'bottleneck';

// Bottleneck で QoS を維持しつつ最大同時実行数を 5 に設定
const limiter = new Bottleneck({ maxConcurrent: 5, minTime: 100 });

export const axiosInstance = axios.create({
  baseURL: 'https://qiita.com',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * 記事一覧取得: 検索 API 用
 * @param {string} query Qiita API の query パラメータ（例: 'stocks:>5 created:>2025-06-01'）
 * @param {number} page ページ番号
 * @param {number} perPage 1ページあたり取得件数
 * @returns {Promise<Array>} 記事オブジェクトの配列
 */
export async function fetchItems(query, page = 1, perPage = 20) {
  const response = await limiter.schedule(() =>
    axiosInstance.get(`/api/v2/items`, {
      params: { page, per_page: perPage, query },
    })
  );
  return response.data;
}

/**
 * 記事一覧取得: タグ API 用
 * @param {string} tag Qiita のタグ名
 * @param {number} page ページ番号
 * @param {number} perPage 1ページあたり取得件数
 * @returns {Promise<Array>} 記事オブジェクトの配列
 */
export async function fetchItemsByTag(tag, page = 1, perPage = 20) {
  const response = await limiter.schedule(() =>
    axiosInstance.get(`/api/v2/tags/${encodeURIComponent(tag)}/items`, {
      params: { page, per_page: perPage },
    })
  );
  return response.data;
}

/**
 * 記事 ID から本文を取得
 * @param {string} id Qiita 投稿 ID
 * @returns {Promise<string>} Markdown 本文
 */
export async function fetchArticle(id) {
  const response = await limiter.schedule(() =>
    axiosInstance.get(`/api/v2/items/${id}`)
  );
  return response.data.body;
}

/**
 * Qiita 記事 URL から投稿 ID 部分を抽出
 * @param {string} url 記事 URL
 * @returns {string} 投稿 ID
 */
export function extractId(url) {
  const match = url.match(/\/items\/([-\w]+)/);
  if (!match) throw new Error(`Invalid Qiita URL: ${url}`);
  return match[1];
}
