// File: src/services/summarizeService.js
import axios from 'axios';
import { generateSummary } from '../clients/geminiClient.js';
import { prompts } from '../config/prompts.js';
import { ServiceError } from '../utils/errors.js';

/**
 * 任意の URL 記事を要約する汎用サービス
 * @param {object} params
 * @param {string} params.url - 要約対象の記事 URL
 * @param {string} [params.title] - 記事タイトル（省略可）
 * @param {'short'|'detailed'} [params.level='short'] - 要約の粒度
 * @param {string} [params.user_request] - 具体的な要望
 * @param {'ja'|'en'} [params.targetLanguage='ja'] - 要約の出力言語
 * @returns {Promise<string>} 要約テキスト
 */
export async function summarizeArticle({
  url,
  title = '',
  level = 'short',
  user_request = '',
  targetLanguage = 'ja',
}) {
  try {
    // 1. 記事本文を取得
    const { data: html } = await axios.get(url);
    // 2. HTML タグを除去してプレーンテキスト化
    const text = html.replace(/<[^>]+>/g, ' ');

    // 3. プロンプト選択
    let basePrompt;
    const optKey = `${level}_${user_request}`;
    if (user_request && prompts.optimized?.components?.focuses[user_request]) {
      basePrompt = prompts.optimized.components.focuses[user_request];
    } else {
      const langLabel = targetLanguage === 'ja' ? 'Japanese' : 'English';
      basePrompt = `${prompts.generic[level]} in ${langLabel}:`;
    }

    // 4. メタ情報の付加
    const meta = [];
    if (title) meta.push(`Title: ${title}`);
    meta.push(`URL: ${url}`);

    // 5. プロンプト組み立て
    const prompt = [basePrompt, user_request, ...meta, text]
      .filter(Boolean)
      .join('\n\n');

    // 6. Gemini モデル実行
    const summary = await generateSummary(prompt);
    return summary;
  } catch (err) {
    console.error('summarizeService error:', err);
    throw new ServiceError(`要約生成に失敗しました: ${err.message}`);
  }
}
