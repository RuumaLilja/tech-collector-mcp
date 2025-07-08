// =========================================
// Article 型定義
// -----------------------------------------
/**
 * @typedef {Object} Article
 * @property {string}        id           - 記事の一意ID (ソース固有ID)
 * @property {string}        url          - 記事URL
 * @property {string}        title        - 記事タイトル
 * @property {string}        summary      - 記事要約
 * @property {string[]}      tags         - 記事のタグ一覧
 * @property {number}        rating       - ユーザー評価 (数値)
 * @property {string}        publishedAt  - 公開日時 (ISO文字列)
 * @property {number}        readTime     - 推定読了時間 (分単位)
 * @property {boolean}       stored       - ストック済みフラグ
 * @property {?string}       read_at      - 読了日時 (ISO文字列 または null)
 * @property {string} [hash]                - 重複検知用ハッシュ (computeArticleHashで生成)
 */

// =========================================
// TagCount 型定義
// -----------------------------------------
/**
 * @typedef {Object} TagCount
 * @property {string} tag    - タグ名
 * @property {number} count  - 記事中に出現した回数
 */

// =========================================
// StoragePort 抽象クラス定義
// -----------------------------------------
/**
 * @abstract
 * 抽象ストレージポート。Notion などの永続ストレージへの CRUD を定義。
 * 各メソッドは具体的なアダプタでオーバーライドしてください。
 */
export class StoragePort {
  /**
   * URL またはハッシュで既存記事を検索
   * @param {{url:string, hash:string}} params
   * @returns {Promise<Article|null>}
   */
  async findByUrlOrHash(_params) {
    throw new Error('StoragePort.findByUrlOrHash() must be implemented');
  }

  /**
   * 記事を新規作成または更新(Upsert)
   * @param {Partial<Article>} article
   * @returns {Promise<void>}
   */
  async upsert(_article) {
    throw new Error('StoragePort.upsert() must be implemented');
  }

  /**
   * 未保存または未読の記事を一覧取得
   * @param {number} limit  - 最大取得件数
   * @returns {Promise<Article[]>}
   */
  async listUnstoredOrUnread(_limit) {
    throw new Error('StoragePort.listUnstoredOrUnread() must be implemented');
  }

  /**
   * よく使われているタグを取得
   * @param {number} limit  - トップ何件分のタグを返すか
   * @returns {Promise<TagCount[]>}
   */
  async topTags(_limit) {
    throw new Error('StoragePort.topTags() must be implemented');
  }

  /**
   * 記事を既読マーク
   * @param {string} id      - 記事ID
   * @param {Date} readAt    - 読了日時
   * @returns {Promise<void>}
   */
  async markRead(_id, _readAt) {
    throw new Error('StoragePort.markRead() must be implemented');
  }
}
