// ── utils/errors.js ──
/**
 * パラメータ不正を示すエラー
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.code = -32602;
  }
}

/**
 * サービス層のエラー
 */
export class ServiceError extends Error {
  constructor(message, code = -32000) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
  }
}
