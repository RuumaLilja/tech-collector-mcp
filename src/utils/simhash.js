// src/utils/simhash.js
import { createHash } from 'crypto';

/**
 * URL 正規化: クエリ・ハッシュ除去
 * @param {string} urlStr
 * @returns {string}
 */
function normalizeUrl(urlStr) {
  try {
    const url = new URL(urlStr);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    // URL パース失敗時は元文字列を返す
    return urlStr;
  }
}

/**
 * 記事オブジェクトから重複判定用ハッシュを生成
 * - sourceId（API固有ID）があればそれを優先
 * - なければ URL 正規化 + MD5 ハッシュ
 * @param {object} article
 * @param {string} [article.id] - ソース固有ID
 * @param {string} [article.articleId] - 別名ID
 * @param {string} [article.url] - 記事URL
 * @param {string} [article.URL] - 記事URL別名
 * @returns {string}
 */
export function computeArticleHash(article) {
  if (article.id) {
    return article.id;
  }
  if (article.articleId) {
    return article.articleId;
  }
  const urlStr = article.url || article.URL || '';
  const normalized = normalizeUrl(urlStr);
  return createHash('md5').update(normalized).digest('hex');
}
