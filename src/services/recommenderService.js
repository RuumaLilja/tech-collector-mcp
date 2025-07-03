// src/services/recommenderService.js

/**
 * 簡易レコメンダーサービス
 * @param {{limit?: number}} args
 * @param {{storage: import("../ports/storage.js").StoragePort}} context
 * @returns {Promise<Array<Object>>} 理由付き推薦記事リスト
 */
export async function getSimpleRecommendations(
  { limit = 10 } = {},
  { storage }
) {
  // ① 未ストック／未読記事を取得
  const unread = await storage.listUnstoredOrUnread(limit);

  // ② タグ頻度 Top5 を取得
  const hotTags = await storage.topTags(5);

  // ③ タグベースの記事取得（要 storage.findByTag 実装）
  const tagBasedArrays = await Promise.all(
    hotTags.map(({ tag }) => storage.findByTag(tag, limit))
  );
  const tagBased = tagBasedArrays.flat();

  // ④ Unread と TagBased をマージし、重複除去
  const uniq = new Map();
  unread.forEach((article) => {
    uniq.set(article.id, { ...article, reason: 'unread' });
  });
  tagBased.forEach((article) => {
    if (!uniq.has(article.id)) {
      uniq.set(article.id, { ...article, reason: 'hotTag' });
    }
  });

  // ⑤ Limit に合わせて切り出す
  return Array.from(uniq.values()).slice(0, limit);
}
