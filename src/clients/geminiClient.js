// ── clients/geminiClient.js ──
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../config/environment.js';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * 指定のプロンプトで Gemini Model を呼び出し要約を取得
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export async function generateSummary(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim() || '要約取得に失敗しました';
}
