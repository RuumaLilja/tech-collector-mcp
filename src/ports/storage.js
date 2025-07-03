// src/ports/storage.js

/**
 * @typedef {Object} Article
 * @property {string} id
 * @property {string} url
 * @property {string} title
 * @property {string} summary
 * @property {boolean} stored
 * @property {?string} read_at
 */

/**
 * @typedef {Object} TagCount
 * @property {string} tag
 * @property {number} count
 */

/**
 * 抽象ストレージポート定義
 * 各メソッドはサブクラスで実装してください。
 */
export class StoragePort {
  /**
   * URLまたはハッシュで既存記事を検索
   * @param {{url:string, hash:string}} params
   * @returns {Promise<Article|null>}
   */
  async findByUrlOrHash(params) {
    throw new Error('StoragePort.findByUrlOrHash() must be implemented');
  }

  /**
   * 記事を新規作成または更新
   * @param {Partial<Article>} article
   * @returns {Promise<void>}
   */
  async upsert(article) {
    throw new Error('StoragePort.upsert() must be implemented');
  }

  /**
   * 未保存または未読の記事を一覧取得
   * @param {number} limit
   * @returns {Promise<Article[]>}
   */
  async listUnstoredOrUnread(limit) {
    throw new Error('StoragePort.listUnstoredOrUnread() must be implemented');
  }

  /**
   * よく使われているタグを取得
   * @param {number} limit
   * @returns {Promise<TagCount[]>}
   */
  async topTags(limit) {
    throw new Error('StoragePort.topTags() must be implemented');
  }

  /**
   * 記事を既読マーク
   * @param {string} id
   * @param {Date} readAt
   * @returns {Promise<void>}
   */
  async markRead(id, readAt) {
    throw new Error('StoragePort.markRead() must be implemented');
  }
}
