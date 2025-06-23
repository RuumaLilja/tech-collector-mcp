// File: src/services/articleSummarizer.js

import { generateSummary } from '../clients/geminiClient.js';
import { ServiceError } from '../utils/errors.js';
import { prompts } from '../config/prompts.js';

/**
 * Qiita 記事をローカル LLM で要約する
 *
 * @param {object} article      Qiita API で取得した記事オブジェクト
 * @param {string} user_request ユーザーからの要望（例: 'implementation' や 'troubleshooting'）
 * @param {string} level        'short' or 'detailed'（要約の粒度）
 * @returns {Promise<string>}   要約テキスト（日本語）
 */
export async function summarizeArticle(
  article,
  user_request = '',
  level = 'short'
) {
  try {
    // タグの展開
    const tags = Array.isArray(article.tags)
      ? article.tags.map((t) => t.name).join(', ')
      : '';

    // １）技術記事用の基本プロンプトを選択
    const basePrompt = prompts.technical[level]; // prompts.technical.short or detailed

    // ２）user_request に対応するフォーカスプロンプトを取得
    const focusPrompt =
      (user_request && prompts.optimized.components.focuses[user_request]) ||
      '';

    // ３）全体のプロンプトを組み立て
    const prompt = [
      basePrompt,
      focusPrompt,
      `Title: ${article.title}`,
      `URL: ${article.url}`,
      tags && `Tags: ${tags}`,
      `Content:\n${article.body}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    // 生成クライアント経由で要約を取得
    const summary = await generateSummary(prompt);
    return summary;
  } catch (err) {
    console.error('summarizeArticle error:', err);
    if (err instanceof ServiceError) throw err;
    throw new ServiceError(`要約生成に失敗しました: ${err.message}`);
  }
}
