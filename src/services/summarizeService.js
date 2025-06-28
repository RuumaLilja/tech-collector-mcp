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
    // 記事本文を取得
    const { data: html } = await axios.get(url);
    // HTMLタグを除去してプレーンテキスト化
    const text = html.replace(/<[^>]+>/g, ' ');

    // プロンプト選択
    const langLabel = targetLanguage === 'ja' ? 'Japanese' : 'English';
    const basePrompt = `${prompts.generic[level]} in ${langLabel}:`;

    // プロンプト組み立て
    const meta = [];
    if (title) meta.push(`Title: ${title}`);
    meta.push(`URL: ${url}`);

    const prompt = [basePrompt, user_request, ...meta, text]
      .filter(Boolean)
      .join('\n\n');

    // Gemini API で要約生成
    return await generateSummary(prompt);
  } catch (err) {
    throw new ServiceError(`要約生成に失敗しました: ${err.message}`);
  }
}
