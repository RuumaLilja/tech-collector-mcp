// File: src/clients/hackerNewsClient.js
import axios from 'axios';

const BASE_URL = 'https://hacker-news.firebaseio.com/v0';

/**
 * Hacker News からトップストーリーの ID リストを取得する
 * @returns {Promise<number[]>} トップストーリーの ID 配列
 */
export async function fetchTopStoryIds() {
  const response = await axios.get(`${BASE_URL}/topstories.json`);
  return response.data;
}

/**
 * 指定 ID のアイテム詳細を取得する
 * @param {number} id - 取得対象のアイテム ID
 * @returns {Promise<Object>} アイテムオブジェクト
 */
export async function fetchItem(id) {
  const response = await axios.get(`${BASE_URL}/item/${id}.json`);
  return response.data;
}
