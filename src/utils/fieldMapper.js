// src/utils/fieldMapper.js

import { computeSimHash } from '../utils/simhash.js'; // もし使っていれば

/**
 * 外部データ（Qiitaオブジェクトなど）のキーを
 * Notion のプロパティ名（列名）にマッピングする
 * @param {Object} input
 */
export function mapToNotionFields(input) {
  const now = new Date().toISOString();

  return {
    // Qiita/Dev.to/NewsAPI で統一して持っているキーを Notion 列名に合わせる
    Title: input.title || input.Title, // 英語 or そのまま
    URL: input.url || input.URL,
    要約: input.summary || input.description || input.要約,
    タグ: input.tags || input.categories || input.タグ,
    SimHash: input.hash    || computeSimHash(input.url || input.URL),
    ソース元: input.source || input['ソース元'],
    ステータス: input.status || input['ステータス'] || '未読',
    公開日: input.publishedAt || input['公開日'] || now,
    保存日: input.savedAt || input['保存日'] || now,
    著者: input.author || input['著者'] || 'unknown',
    // （必要なら _raw は JSON.stringify して別カラムに入れる）
  };
}
