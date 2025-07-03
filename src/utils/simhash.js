// src/utils/simhash.js
import { createHash } from 'crypto';

/**
 * シンプルな SimHash 代替関数として MD5 ハッシュを返します。
 * 本格的な SimHash が必要なら別ライブラリを導入してください。
 * @param {string} str
 * @returns {string}
 */
export function computeSimHash(str) {
  return createHash('md5').update(str).digest('hex');
}
