// ── services/articleSummarizer.js ──
import { fetchArticle } from '../clients/qiitaClient.js';
import { generateSummary } from '../clients/geminiClient.js';
import { ServiceError } from '../utils/errors.js';

/**
 * Qiita 記事を要約
 * @param {{url: string, title?: string}} options
 * @returns {Promise<string>} 要約テキスト
 */
export async function summarizeQiitaArticle({ url, title }) {
  try {
    const id = url.split('/').pop();
    const data = await fetchArticle(id);
    const prompt = `以下のQiita記事を3〜5行で要約してください。\nタイトル: ${
      title || '(タイトルなし)'
    }\n\n${data.body}`;
    return await generateSummary(prompt);
  } catch (err) {
    throw new ServiceError(`要約取得エラー: ${err.message}`);
  }
}
