// File: src/services/qiitaRanking.js

import { fetchItems, fetchItemsByTag } from '../clients/qiitaClient.js';
import { ValidationError, ServiceError } from '../utils/errors.js';
import { PAGE_LIMIT, SCORE_WEIGHT } from '../config/constants.js';
import { subDays, subMonths } from 'date-fns';

export async function getQiitaRankingText({
  period = 'weekly',
  category,
  count = 10,
}) {
  if (typeof count !== 'number' || count < 1 || count > 100) {
    throw new ValidationError('count must be 1–100');
  }
  if (!['daily', 'weekly', 'monthly'].includes(period)) {
    throw new ValidationError('period must be daily, weekly, or monthly');
  }

  // カットオフ日時
  let cutoff;
  if (period === 'daily') cutoff = subDays(new Date(), 1);
  else if (period === 'weekly') cutoff = subDays(new Date(), 7);
  else cutoff = subMonths(new Date(), 1);

  const dateFilter = cutoff.toISOString().split('T')[0];
  let query = `created:>${dateFilter}`;
  if (period === 'daily') query += ' stocks:>0';
  if (period === 'weekly') query += ' stocks:>5';
  if (period === 'monthly') query += ' stocks:>10';
  if (category) query += ` tag:${category}`;

  try {
    const seen = new Set();
    const itemsAcc = [];

    // 1ページずつ取得（カテゴリー指定がある場合はタグ専用 API を使う）
    const fetchFn = category ? fetchItemsByTag : fetchItems;
    // 検索クエリは search と統一。タグ版は query 引数を無視するので OK
    const queryOrTag = category || query;

    outer: for (let page = 1; page <= PAGE_LIMIT; page++) {
      const items = category
        ? await fetchFn(queryOrTag, page) // tag API: queryOrTag がタグ名
        : await fetchFn(queryOrTag, page); // search API: queryOrTag が検索文字列

      for (const item of items) {
        const created = new Date(item.created_at);
        if (created < cutoff) continue; // 期間外はスキップ
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        itemsAcc.push(item);
        if (itemsAcc.length >= count) break outer;
      }
    }

    // ソートとフォーマットは従来通り
    const sorted = itemsAcc
      .sort((a, b) => {
        const aScore =
          a.likes_count * SCORE_WEIGHT.like +
          a.stocks_count * SCORE_WEIGHT.stock;
        const bScore =
          b.likes_count * SCORE_WEIGHT.like +
          b.stocks_count * SCORE_WEIGHT.stock;
        return bScore - aScore;
      })
      .slice(0, count);

    const lines = [`📈 人気記事 TOP${sorted.length}`];
    sorted.forEach((it, idx) => {
      const score =
        it.likes_count * SCORE_WEIGHT.like +
        it.stocks_count * SCORE_WEIGHT.stock;
      lines.push(
        `${idx + 1}. ${it.title}\n` +
          `   👍 ${it.likes_count}  📚 ${it.stocks_count} (score: ${score})\n` +
          `   ${new Date(it.created_at).toLocaleString('ja-JP')}\n` +
          `   ${it.url}`
      );
    });

    return lines.join('\n\n');
  } catch (err) {
    if (err.response) throw new ServiceError(`Qiita API error: ${err.message}`);
    throw new ServiceError(err.message);
  }
}
