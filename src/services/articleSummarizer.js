// File: src/services/articleSummarizer.js
import { generateSummary } from '../clients/geminiClient.js';
import { ServiceError } from '../utils/errors.js';

/**
 * Qiita 記事をローカル LLM で要約する
 *
 * @param {object} article      Qiita API で取得した記事オブジェクト
 * @param {string} user_request ユーザーからの要望（例:「実装中心に」「ポイント3つで」）
 * @param {string} level        'short' or 'detailed'（要約の粒度）
 * @returns {Promise<string>}   要約テキスト（日本語）
 */
export async function summarizeArticle(
  article,
  user_request = '',
  level = 'short'
) {
  try {
    // タグ配列の正しい展開
    const tags = Array.isArray(article.tags)
      ? article.tags.map((tag) => tag.name).join(', ')
      : '';

    // Build prompt in English, instruct response in Japanese
    const parts = [
      `Please summarize the following Qiita article in Japanese with a ${level} level of detail.`,
      user_request && `Focus on: ${user_request}.`,
      `Title: ${article.title}`,
      `URL: ${article.url}`,
      tags && `Tags: ${tags}`,
      `Content:\n${article.body}`,
      `Please respond in Japanese.`,
    ]
      .filter(Boolean)
      .join('\n\n');

    // 生成クライアント経由で要約を取得
    const summary = await generateSummary(parts);
    return summary;
  } catch (err) {
    console.error('summarizeArticle error:', err);
    if (err instanceof ServiceError) throw err;
    throw new ServiceError(`要約生成に失敗しました: ${err.message}`);
  }
}
