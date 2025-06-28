// File: src/services/devtoService.js
import { fetchArticles } from '../clients/devtoClient.js';
import { PAGE_LIMIT } from '../config/environment.js';

/**
 * Dev.to から記事を取得し、標準フォーマットに整形して返す
 * タグまたはクエリが未指定の場合は注目（rising）記事を取得
 * @param {Object} options
 * @param {string} [options.tag] - 絞り込み用タグ名
 * @param {string} [options.query] - 総合検索キーワード（タグと併用はなし）
 * @param {number} [options.count=PAGE_LIMIT] - 取得する記事数
 * @returns {Promise<Object[]>} 整形済み記事リスト
 */
export async function getDevtoArticles({ tag, query, count = PAGE_LIMIT } = {}) {
  // Dev.to API オプション設定
  const apiOptions = { page: 1, perPage: count };

  if (tag || query) {
    // タグまたは検索キーワード指定時
    apiOptions.tag = tag || query;
  } else {
    // 未指定時は注目記事を取得
    apiOptions.state = 'rising';
  }

  // API 呼び出し
  const items = await fetchArticles(apiOptions);

  // 必要なフィールドのみ抽出し、フォーマットを統一
  return items.slice(0, count).map(item => ({
    title: item.title,
    url: item.url,
    description: item.description,
    publishedAt: item.published_at,
    tags: item.tag_list,
    reactions: item.public_reactions_count,
    comments: item.comments_count,
    readingTime: item.reading_time_minutes,
    source: 'Dev.to',
  }));
}
