// src/services/syncBatchService.js

import { syncArticleToNotion } from './syncService.js';

/**
 * 指定された並行数で配列を分割して処理する
 * @param {Array} items - 処理する項目の配列
 * @param {number} concurrency - 並行処理数
 * @param {Function} processor - 各項目を処理する関数
 * @returns {Promise<Array>} 処理結果の配列
 */
async function processConcurrently(items, concurrency, processor) {
  const results = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(processor)
    );
    results.push(...chunkResults);
    
    // 各バッチ間に遅延を追加（API制限対策）
    if (i + concurrency < items.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return results;
}

/**
 * 複数記事を制限された並列数で Notion に同期し、エラー内容も拾う
 * 実用的な固定設定で最適化済み
 * @param {Array} articles - 同期する記事の配列
 * @param {Object} context - コンテキスト
 * @param {Object} context.storage - ストレージポート
 * @returns {Promise<Array>} 同期結果の配列
 */
export async function batchsyncArticleToNotion(articles, { storage }) {
  // 固定設定（実用的な最適値）
  const CONCURRENCY = 2;  // Notion API制限を考慮した安全な並行数
  const RETRY_COUNT = 2;   // 適度なリトライ回数
  const RETRY_DELAY = 800; // リトライ間隔（ミリ秒）
  
  console.error(`🔄 Starting batch sync: ${articles.length} articles, concurrency: ${CONCURRENCY}`);
  
  const processArticle = async (article) => {
    const id = article.URL || article.url;
    let lastError = null;
    
    // リトライ処理
    for (let attempt = 0; attempt <= RETRY_COUNT; attempt++) {
      try {
        const res = await syncArticleToNotion(article, { storage });
        
        if (res.synced) {
          console.error(`✅ [${id}] → OK ${attempt > 0 ? `(retry ${attempt})` : ''}`);
          return {
            id,
            ok: true,
            error: null,
            created: res.created,
            updated: res.updated,
            attempts: attempt + 1
          };
        } else {
          lastError = res.error || 'Unknown sync error';
          if (attempt < RETRY_COUNT) {
            console.error(`⚠️ [${id}] → Failed: ${lastError} (will retry)`);
          }
        }
      } catch (e) {
        lastError = e.message;
        if (attempt < RETRY_COUNT) {
          console.error(`🔴 [${id}] → Error: ${lastError} (will retry)`);
        }
      }
      
      // 最後の試行でない場合は遅延
      if (attempt < RETRY_COUNT) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
    
    console.error(`❌ [${id}] → Final failure: ${lastError}`);
    return { 
      id, 
      ok: false, 
      error: lastError,
      attempts: RETRY_COUNT + 1
    };
  };

  const startTime = Date.now();
  const results = await processConcurrently(articles, CONCURRENCY, processArticle);
  const duration = Date.now() - startTime;
  
  const successCount = results.filter(r => r.ok).length;
  console.error(`✨ Batch sync completed: ${successCount}/${articles.length} success in ${duration}ms`);
  
  return results;
}