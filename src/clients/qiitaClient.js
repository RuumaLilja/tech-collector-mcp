// File: src/clients/qiitaClient.js
import axios from 'axios';
import axiosRetry from 'axios-retry';
import Bottleneck from 'bottleneck';
import { QIITA_TOKEN } from '../config/environment.js';
import { ITEMS_PER_PAGE } from '../config/constants.js';

// Rate limiter: max 10 requests per second
const limiter = new Bottleneck({ maxConcurrent: 1, minTime: 100 });

// Axios instance configuration
const axiosInstance = axios.create({
  baseURL: 'https://qiita.com/api/v2',
  headers: {
    Accept: 'application/json',
    'User-Agent': 'QiitaMCPServer/1.0.0',
    ...(QIITA_TOKEN ? { Authorization: `Bearer ${QIITA_TOKEN}` } : {}),
  },
});

// Retry on network errors or 5xx responses
axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: error => axiosRetry.isNetworkError(error) || error.response?.status >= 500,
});

/**
 * Search Qiita items with a query.
 * @param {string} query  Search query (e.g., 'tag:javascript created:>2025-06-01')
 * @param {number} page   Page number (1-indexed)
 * @returns {Promise<any[]>}
 */
export async function fetchItems(query, page = 1) {
  return limiter.schedule(() =>
    axiosInstance
      .get('/items', { params: { query, per_page: ITEMS_PER_PAGE, page } })
      .then(res => res.data)
  );
}

/**
 * Fetch Qiita items by a specific tag.
 * @param {string} tag   Tag name
 * @param {number} page  Page number (1-indexed)
 * @returns {Promise<any[]>}
 */
export async function fetchItemsByTag(tag, page = 1) {
  return limiter.schedule(() =>
    axiosInstance
      .get(`/tags/${encodeURIComponent(tag)}/items`, { params: { per_page: ITEMS_PER_PAGE, page } })
      .then(res => res.data)
  );
}

/**
 * Fetch a single Qiita article by its ID.
 * @param {string} itemId  Article ID
 * @returns {Promise<any>}
 */
export async function fetchArticle(itemId) {
  return limiter.schedule(() =>
    axiosInstance
      .get(`/items/${encodeURIComponent(itemId)}`)
      .then(res => res.data)
  );
}