// src/services/syncBatchService.js

import { syncArticleToNotion } from './syncService.js';

/**
 * 複数記事を並列で Notion に同期し、エラー内容も拾う
 */
export async function batchsyncArticleToNotion(articles, { storage }) {
  return Promise.all(
    articles.map(async (article) => {
      // URL キーは小文字 or 大文字かもしれないので両方チェック
      const id = article.URL || article.url;
      try {
        const res = await syncArticleToNotion(article, { storage });
        console.error(`🔄 [${id}] → ${res.synced ? 'OK' : 'NG'}`);
        return {
          id,
          ok: res.synced,
          error: res.error || null,
          created: res.created,
          updated: res.updated,
        };
      } catch (e) {
        console.error(`🔴 [${id}] syncBatch error:`, e);
        return { id, ok: false, error: e.message };
      }
    })
  );
}
