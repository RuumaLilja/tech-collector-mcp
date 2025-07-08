// src/services/syncService.js
import { mapToNotionFields } from '../utils/fieldMapper.js';
import { computeArticleHash } from '../utils/simhash.js';
/**
 * Notion 連携用同期サービス
 * 外部データ(article)を Notion 用フィールド名にマッピングして upsert します
 */
export async function syncArticleToNotion(article, { storage }) {
  try {
    // 新：sourceId or URL 正規化＋MD5 で一意ハッシュ
    const hash = computeArticleHash(article);
    const sanitized = { ...article, hash };
    console.error('🔄 syncArticleToNotion が呼ばれました:', article);

    // 外部キー → Notion列名マッピング
    const notionArticle = mapToNotionFields(sanitized);
    console.error('➡️ mapToNotionFields 後のオブジェクト:', notionArticle);

    // Notion に upsert 実行
    await storage.upsert(notionArticle);

    console.error('✅ syncArticleToNotion 成功');
    return { synced: true };
  } catch (error) {
    console.error('🔴 syncArticleToNotion error:', error);
    return { synced: false, error: error.message };
  }
}
