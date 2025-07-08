// src/services/recommenderService.js
import { EPSILON, DECAY_RATE } from "../config/constants.js";

/** 指数関数的減衰 */
function decay(publishedAt) {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  return Math.exp(-DECAY_RATE * ageMs);
}

export async function getRecommendations (
  { limit = 10 } = {},
  { storage }
) {
  // ① 既読記事取得 → タグ×評価で重み付け
  const readArticles = await storage.listByStatus('既読', 100);
  const tagWeights = {};
  let totalReadTime = 0;
  for (const a of readArticles) {
    totalReadTime += a.readTime || 0;
    for (const t of a.tags) {
      tagWeights[t] = (tagWeights[t] || 0) + (a.rating || 0);
    }
  }
  const avgReadTime = readArticles.length
    ? totalReadTime / readArticles.length
    : 0;

  // ② 未読記事取得 → スコア算出
  const unread = await storage.listUnstoredOrUnread(100);
  const scored = unread.map((a) => {
    const tagScore = a.tags.reduce((sum, t) => sum + (tagWeights[t] || 0), 0);
    return {
      ...a,
      score: tagScore * decay(a.publishedAt),
      isQuick: a.readTime <= avgReadTime,
    };
  });

  // ③ ソート＋先頭から limit*(1-ε) 件を採用
  scored.sort((a, b) => b.score - a.score);
  const takeCnt = Math.floor(limit * (1 - EPSILON));
  const topCandidates = scored.slice(0, takeCnt);

  // ④ 残り ε*limit 件は「タグ未検出×評価なし」の中からランダム探索
  const explorePool = unread.filter(
    (a) => a.rating === 0 && a.tags.every((t) => !(t in tagWeights))
  );
  const exploreCount = limit - takeCnt;
  const explore = [];
  for (let i = 0; i < exploreCount && explorePool.length; i++) {
    const idx = Math.floor(Math.random() * explorePool.length);
    explore.push(explorePool.splice(idx, 1)[0]);
  }

  // ⑤ マージして返却
  return [...topCandidates, ...explore].slice(0, limit).map((a) => ({
    ...a,
    reason: a.isQuick
      ? `所要時間${Math.round(a.readTime)}分以内`
      : `タグ適合度${a.score.toFixed(1)}`,
  }));
}
