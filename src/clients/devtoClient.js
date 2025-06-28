// File: src/clients/devtoClient.js
import axios from 'axios';
import { ITEMS_PER_PAGE } from '../config/environment.js';

const BASE_URL = 'https://dev.to/api';

/**
 * Dev.to から記事を取得する汎用関数
 * @param {Object} options
 * @param {string} [options.tag] - 単一タグで絞り込み
 * @param {string[]} [options.tags] - 複数タグで絞り込み
 * @param {'fresh'|'rising'|'all'} [options.state] - 記事の状態(fresh/rising/all)
 * @param {number} [options.top] - 過去 N 日内で人気の記事を取得
 * @param {number} [options.page=1] - ページ番号
 * @param {number} [options.perPage=ITEMS_PER_PAGE] - 1ページあたりの記事数
 * @returns {Promise<Object[]>} 記事配列
 */
export async function fetchArticles({
  tag,
  tags,
  state,
  top,
  page = 1,
  perPage = ITEMS_PER_PAGE,
} = {}) {
  const url = `${BASE_URL}/articles`;
  const params = {};
  if (tag) params.tag = tag;
  if (tags && tags.length) params.tags = tags.join(',');
  if (state) params.state = state;
  if (top) params.top = top;
  params.page = page;
  params.per_page = perPage;

  const response = await axios.get(url, { params });
  return response.data;
}

/**
 * Dev.to からタグ指定で記事を取得するユーティリティ
 * @param {string} tag - 取得対象のタグ名
 * @param {number} [count] - 取得する記事数
 * @returns {Promise<Object[]>}
 */
export async function fetchArticlesByTag(tag, count) {
  return fetchArticles({ tag, perPage: count, page: 1 });
}

/**
 * Dev.to から最新記事を取得するユーティリティ
 * @param {number} [count] - 取得する記事数
 * @returns {Promise<Object[]>}
 */
export async function fetchLatestArticles(count) {
  return fetchArticles({ perPage: count, page: 1 });
}
