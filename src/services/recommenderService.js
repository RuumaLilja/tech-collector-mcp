// src/services/recommenderService.js
import { DECAY_RATE } from '../config/constants.js';
import { fetchAllArticles } from './fetchService.js'; // 新規記事取得

/**
 * 指数関数的減衰（単位：日）
 * - DECAY_RATE は「1日あたりの減衰率」を想定
 */
function decay(publishedAt) {
  if (!publishedAt) return 0.5;

  let publishedDate;
  if (typeof publishedAt === 'string' && publishedAt.includes('年')) {
    const normalized = publishedAt
      .replace(/年/g, '-')
      .replace(/月/g, '-')
      .replace(/日/g, '');
    publishedDate = new Date(normalized);
  } else {
    publishedDate = new Date(publishedAt);
  }
  if (isNaN(publishedDate.getTime())) {
    console.warn('Invalid date format:', publishedAt);
    return 0.5;
  }

  const ageDays =
    (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-DECAY_RATE * ageDays);
}

/**
 * 読了×評価×タグ だけで重みマップを作成
 */
async function buildTagWeights(storage) {
  const readArticles = await storage.listByStatus('読了', 100);
  const weights = {};

  for (const a of readArticles) {
    // rating が 0 または undefined の場合はスキップ
    if (!a.rating) continue;

    for (const t of a.tags) {
      weights[t] = (weights[t] || 0) + a.rating;
    }
  }

  return weights;
}

/**
 * 新規記事をタグ重み×減衰 または 新着度 でスコア化して推薦
 * - 未読/ストック済記事は対象外
 */
export async function getRecommendations({ limit = 10 } = {}, { storage }) {
  // ① 読了×評価×タグ で重みマップを構築
  const tagWeights = await buildTagWeights(storage);

  // ② 外部ソースから新規記事を取得
  const allArticles = await fetchAllArticles();
  const existsChecks = await Promise.all(
    allArticles.map((art) =>
      storage.findByUrlOrHash({ url: art.url, hash: art.hash })
    )
  );
  const newArticles = allArticles.filter((_, i) => !existsChecks[i]);

  // ③ 新規記事にスコアを付与
  const scored = newArticles.map((a) => {
    const tagScore = a.tags.reduce((sum, t) => sum + (tagWeights[t] || 0), 0);
    const decayValue = decay(a.publishedAt);

    // タグ適合度があればそれに減衰を掛け、なければ純粋な新着度をスコアに
    const score = tagScore > 0 ? tagScore * decayValue : decayValue;
    const reason =
      tagScore > 0
        ? `タグ適合度 ${score.toFixed(1)}`
        : `新着度 ${score.toFixed(2)}`;

    return {
      ...a,
      score: isNaN(score) ? 0 : score,
      reason,
    };
  });

  // ④ スコア順ソート＋上位 limit 件を返却
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
