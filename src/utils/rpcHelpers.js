// ── utils/rpcHelpers.js ──
/**
 * JSON-RPC エラーレスポンス生成
 * @param {string|number} id
 * @param {number} code
 * @param {string} message
 * @returns {{jsonrpc: string, id: string|number, error: {code: number, message: string}}}
 */
export function makeError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

/**
 * JSON-RPC 成功レスポンス生成
 * @param {string|number} id
 * @param {any} result
 * @returns {{jsonrpc: string, id: string|number, result: any}}
 */
export function makeResult(id, result) {
  return { jsonrpc: '2.0', id, result };
}

/**
 * JSON-RPC レスポンスを STDIO に出力
 * @param {object} response
 */
export function sendResponse(response) {
  console.log(JSON.stringify(response));
}

/**
 * JSON-RPC エラーレスポンスを STDIO に出力
 * @param {string|number} id
 * @param {number} code
 * @param {string} message
 */
export function sendErrorResponse(id, code, message) {
  sendResponse(makeError(id, code, message));
}