// File: src/clients/qiitaClient.js

/**
 * 指定タグの記事一覧を取得（作成日時降順）
 * @param {string} tag   タグ名
 * @param {number} page  ページ番号（1-indexed）
 * @returns {Promise<any[]>}
 */
export async function fetchItemsByTag(tag, page = 1) {
  return limiter.schedule(() =>
    axiosInstance
      .get(`/tags/${encodeURIComponent(tag)}/items`, {
        params: { per_page: ITEMS_PER_PAGE, page },
      })
      .then(res => res.data)
  );
}
