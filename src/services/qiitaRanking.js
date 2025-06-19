// ── services/qiitaRanking.js ──
import { fetchItems } from '../clients/qiitaClient.js';
import { ValidationError, ServiceError } from '../utils/errors.js';
import { PAGE_LIMIT, SCORE_WEIGHT } from '../config/constants.js';
import { subDays, subMonths } from 'date-fns';

/**
 * メインロジック: Qiita ランキング取得と整形
 * @param {{period?: string, category?: string, count?: number}} args
 * @returns {Promise<string>} フォーマット済みランキング文字列
 */
export async function getQiitaRankingText({ period = 'weekly', category, count = 10 }) {
  if (typeof count !== 'number' || count < 1 || count > 100) {
    throw new ValidationError('count must be 1–100');
  }
  if (!['daily', 'weekly', 'monthly'].includes(period)) {
    throw new ValidationError('period must be daily, weekly, or monthly');
  }

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
    const allItems = [];
    for (let page = 1; page <= PAGE_LIMIT; page++) {
      const items = await fetchItems(query, page);
      allItems.push(...items);
    }

    const filtered = Array.from(
      new Map(
        allItems
          .filter(item => new Date(item.created_at) >= cutoff)
          .map(item => [item.id, item])
      ).values()
    );

    const sorted = filtered
      .sort(
        (a, b) =>
          a.likes_count * SCORE_WEIGHT.like + a.stocks_count * SCORE_WEIGHT.stock <
          b.likes_count * SCORE_WEIGHT.like + b.stocks_count * SCORE_WEIGHT.stock
            ? 1
            : -1
      )
      .slice(0, count);

    const lines = [`📈 人気記事 TOP${sorted.length}`];
    sorted.forEach((it, idx) => {
      const score = it.likes_count * SCORE_WEIGHT.like + it.stocks_count * SCORE_WEIGHT.stock;
      lines.push(
        `${idx + 1}. ${it.title}\n` +
          `   👍 ${it.likes_count}  📚 ${it.stocks_count} (score: ${score})\n` +
          `   ${new Date(it.created_at).toLocaleString('ja-JP')}\n` +
          `   ${it.url}`
      );
    });

    return lines.join('\n\n');
  } catch (err) {
    if (err.response) {
      throw new ServiceError(`Qiita API error: ${err.message}`);
    }
    throw new ServiceError(err.message);
  }
}
