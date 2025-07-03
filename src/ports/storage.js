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
 * @typedef {Object} StoragePort
 * @property {(params: {url:string,hash:string}) => Promise<Article|null>} findByUrlOrHash
 * @property {(article: Partial<Article>) => Promise<void>} upsert
 * @property {(limit:number) => Promise<Article[]>} listUnstoredOrUnread
 * @property {(limit:number) => Promise<TagCount[]>} topTags
 * @property {(id:string, readAt:Date) => Promise<void>} markRead
 */

/** @type {StoragePort} */
export const StoragePort = {
  findByUrlOrHash: async () => { throw new Error('not implemented'); },
  upsert:           async () => { throw new Error('not implemented'); },
  listUnstoredOrUnread: async () => { throw new Error('not implemented'); },
  topTags:          async () => { throw new Error('not implemented'); },
  markRead:         async () => { throw new Error('not implemented'); },
};
