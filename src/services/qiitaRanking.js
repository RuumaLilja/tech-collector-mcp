// ── services/qiitaRanking.js ──
import { fetchItems } from '../clients/qiitaClient.js';

/**
 * 期間フィルタ日付を計算
 * @param {'daily'|'weekly'|'monthly'} period
 * @returns {Date}
 */
function calcCutoff(period) {
  const now = new Date();
  switch(period) {
    case 'daily':  now.setDate(now.getDate() - 1); break;
    case 'weekly': now.setDate(now.getDate() - 7); break;
    case 'monthly': now.setMonth(now.getMonth() - 1); break;
  }
  return now;
}

/**
 * メインロジック: Qiita ランキング取得
 * @param {{period?: string, category?: string, count?: number}} args
 * @returns {Promise<object[]>}
 */
export async function getQiitaRankingData({ period = 'weekly', category, count = 10 }) {
  const cutoff = calcCutoff(period);
  const dateFilter = cutoff.toISOString().split('T')[0];
  let query = `created:>${dateFilter}`;
  if (period==='daily')   query += ' stocks:>0';
  if (period==='weekly')  query += ' stocks:>5';
  if (period==='monthly') query += ' stocks:>10';
  if (category)           query += ` tag:${category}`;

  const all = [];
  for (let p = 1; p <= 3; p++) {
    all.push(...await fetchItems(query, p));
  }

  const unique = Array.from(
    new Map(all.filter(i=>new Date(i.created_at)>=cutoff).map(i=>[i.id, i])).values()
  );
  const sorted = unique
    .sort((a,b)=>(b.likes_count + 2*b.stocks_count) - (a.likes_count + 2*a.stocks_count))
    .slice(0, count)
    .map((it,i) => ({
      rank: i+1,
      title: it.title,
      url: it.url,
      likes: it.likes_count,
      stocks: it.stocks_count,
      score: it.likes_count + 2*it.stocks_count,
      created_at: it.created_at,
    }));
  return sorted;
}
