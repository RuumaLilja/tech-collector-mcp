// src/utils/fieldMapper.js

/**
 * 外部データ（Qiitaオブジェクトなど）のキーを
 * Notion のプロパティ名（列名）にマッピングする
 * @param {Object} input
 */
export function mapToNotionFields(input) {
  const now = new Date().toISOString();

  // --- 入力キーの抽出・フォールバック順 ---
  // 記事固有ID → 重複検知用ハッシュに含める
  const sourceId = input.id || input.articleId;
  // ハッシュ: sourceId優先 → computeArticleHashで生成したinput.hash → 旧SimHashキー
  const hash = sourceId || input.hash || input.SimHash;
  // その他フィールド
  const title = input.title || input.Title;
  const url = input.url || input.URL;
  const tags = input.tags || input['タグ'];
  const source = input.source || input['ソース元'];
  const status = input.status || input['ステータス'];
  const publishedAt = input.publishedAt || input['公開日'];
  const savedAt = input.savedAt || input['保存日'];
  const author = input.author || input['著者'];
  const rating = input.rating ?? input.評価 ?? 0;
  const readTime = input.readTime ?? input['所要時間（分）'] ?? null;

  // --- デバッグログ ---
  console.error('[mapToNotionFields] mapped values:', {
    title,
    url,
    tags,
    hash,
    source,
    status,
    publishedAt,
    savedAt,
    author,
    rating,
    readTime,
  });

  // --- 必須キーのチェック ---
  if (!title || !url || !hash) {
    console.error('[mapToNotionFields] missing required field:', {
      title,
      url,
      hash,
    });
  }

  return {
    Title: title,
    URL: url,
    タグ: tags,
    SimHash: hash,
    ソース元: source,
    ステータス: status ?? '未読',
    公開日: publishedAt ?? now,
    保存日: savedAt ?? now,
    著者: author ?? 'unknown',
    評価: rating,
    '所要時間（分）': readTime,
  };
}
