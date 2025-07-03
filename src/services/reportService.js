// src/services/reportService.js

/**
 * 同期結果を集計
 * @param {Array<{ok:boolean, id:string}>} results
 * @param {Array<{ok:boolean, id:string, error?:string}>} results
 */
export function summarizeSyncResults(results) {
  const total = results.length;
  const success = results.filter((r) => r.ok).length;
  const failed = total - success;
  const errors = results
    .filter((r) => !r.ok)
    .map((r) => ({ id: r.id, error: r.error }));
  return { total, success, failed, details: results, errors };
}
