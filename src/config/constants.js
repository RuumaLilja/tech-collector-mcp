// ── config/constants.js ──
export const PAGE_LIMIT = 3;
export const ITEMS_PER_PAGE = 100;
export const SCORE_WEIGHT = { like: 1, stock: 2 };

// 時間減衰パラメータ（指数関数的に decayed = e^{-λ·経過時間} とする場合の λ）
export const DECAY_RATE = 0.0001;
// ε-greedy の ε 値（0〜1 で探索割合を定義）
export const EPSILON = 0.2;