// ── utils/rpcHelpers.js ──
/**
 * Claude Desktop 向け content ラッパー
 * @param {any} data - ツールの戻り値（文字列／オブジェクト）
 * @returns {{content: [{type: string, text: string}]}}
 */
export function wrapContent(data) {
  // 既に content 配列形式ならそのまま返す
  if (data && typeof data === 'object' && Array.isArray(data.content)) {
    return data;
  }
  
  // 文字列ならそのまま、オブジェクトは整形して文字列化
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  
  return {
    content: [
      {
        type: 'text',
        text: text,
      },
    ],
  };
}

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
 * @returns {{jsonrpc: string, id: string|number, result: object}}
 */
export function makeResult(id, result) {
  const safeResult =
    result !== null && typeof result === 'object' ? result : { value: result };
  return { jsonrpc: '2.0', id, result: safeResult };
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