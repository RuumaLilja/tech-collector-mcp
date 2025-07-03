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

    // 1ページずつ取得
    const fetchFn = category ? fetchItemsByTag : fetchItems;
    const queryOrTag = category || query;

    outer: for (let page = 1; page <= PAGE_LIMIT; page++) {
      const items = await fetchFn(queryOrTag, page, count);
      for (const item of items) {
        const created = new Date(item.created_at);
        if (created < cutoff) continue;
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        itemsAcc.push(item);
        if (itemsAcc.length >= count) break outer;
      }
    }

    // スコア順にソート＆フォーマット
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

/**
 * Qiita記事を構造化されたオブジェクトとして取得（syncToNotion用）
 * @param {Object} params - パラメータ
 * @returns {Promise<Array>} 記事オブジェクトの配列
 */
export async function getQiitaRankingObjects({
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

    // 1ページずつ取得
    const fetchFn = category ? fetchItemsByTag : fetchItems;
    const queryOrTag = category || query;

    outer: for (let page = 1; page <= PAGE_LIMIT; page++) {
      const items = await fetchFn(queryOrTag, page, count);
      for (const item of items) {
        const created = new Date(item.created_at);
        if (created < cutoff) continue;
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        itemsAcc.push(item);
        if (itemsAcc.length >= count) break outer;
      }
    }

    // スコア順にソート
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

    // syncToNotion用の統一フォーマットに変換
    return sorted.map((item, index) => {
      const score = item.likes_count * SCORE_WEIGHT.like + item.stocks_count * SCORE_WEIGHT.stock;
      
      return {
        // 基本情報
        Title: item.title,
        URL: item.url,
        要約: `Qiita人気記事（${period}）第${index + 1}位。👍 ${item.likes_count}件、📚 ${item.stocks_count}件 (score: ${score})`,
        
        // メタデータ
        ソース元: 'Qiita',
        ステータス: '未読',
        公開日: item.created_at, // ISO 8601形式
        保存日: new Date().toISOString(),
        
        // タグ情報（技術的なタグ）
        タグ: item.tags ? item.tags.map(tag => tag.name) : ['Programming'],
        
        // 追加情報
        著者: item.user?.id || 'unknown',
        
        // 元データも保持（デバッグ用）
        _raw: {
          likes_count: item.likes_count,
          stocks_count: item.stocks_count,
          score: score,
          ranking: index + 1
        }
      };
    });

  } catch (err) {
    if (err.response) throw new ServiceError(`Qiita API error: ${err.message}`);
    throw new ServiceError(err.message);
  }
}