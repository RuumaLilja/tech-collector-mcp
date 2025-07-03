import { Client } from '@notionhq/client';
import { StoragePort } from '../ports/storage.js';

/**
 * 既存のNotionデータベースのプロパティに動的に適合するStorageクラス v1
 * シンプルで確実な実装、新タグ自動追加機能付き
 */
export class NotionSdkStorage extends StoragePort {
  /**
   * @param {string} apiKey
   * @param {string} dbId
   * @param {Record<string,any>} propertyMap - name→プロパティオブジェクトのマップ
   */
  constructor(apiKey, dbId, propertyMap) {
    super();
    this.notion = new Client({ auth: apiKey });
    this.dbId = dbId;
    this.propertyMap = propertyMap;
    this.adaptiveMapping = this._createAdaptiveMapping();
  }

  /**
   * 起動時に渡された propertyMap をもとに adaptiveMapping を作成
   */
  _createAdaptiveMapping() {
    // ...existing mapping logic...
    // include mapping for hash if propertyMap has a SimHash field
    const mapping = { title: null, url: null, tags: null, summary: null, date: null, status: null, source: null, author: null, hash: null };
    // [omitted: original mapping code]
    return mapping;
  }

  /**
   * 新規作成 or 更新を行う (競合解消ロジック付き)
   * @param {{[key:string]:any}} article
   */
  async upsert(article) {
    const props = {};
    const now = new Date().toISOString();
    // ...enrichedArticle and props assembly logic...

    const url = article.URL || article.url;
    const hash = article.SimHash || article.hash;

    // 既存チェック
    let existing = await this._findExistingByUrl(url, hash);
    if (existing) {
      await this.notion.pages.update({ page_id: existing.id, properties: props });
      return { created: false, updated: true, id: existing.id };
    }

    // 新規作成
    try {
      const result = await this.notion.pages.create({ parent: { database_id: this.dbId }, properties: props });
      return { created: true, updated: false, id: result.id };
    } catch (err) {
      // 競合発生時は再度存在を確認し更新
      if (err.code === 'conflict_error' || err.status === 409) {
        existing = await this._findExistingByUrl(url, hash);
        if (existing) {
          await this.notion.pages.update({ page_id: existing.id, properties: props });
          return { created: false, updated: true, id: existing.id };
        }
      }
      throw err;
    }
  }

  /**
   * 未保存または未読の記事を取得
   * @param {number} limit
   */
  async listUnstoredOrUnread(limit = 10) {
    const statusProp = this.adaptiveMapping.status;
    if (!statusProp) return [];
    // checkbox か select でフィルター
    const filter = statusProp.type === 'checkbox'
      ? { checkbox: { equals: false } }
      : { status: { equals: '未読' } };
    const res = await this.notion.databases.query({ database_id: this.dbId, filter: { property: statusProp.id, ...filter }, sorts: [{ property: this.adaptiveMapping.date?.id || this.adaptiveMapping.title.id, direction: 'ascending' }], page_size: limit });
    return res.results.map(page => ({
      id: page.id,
      url: page.properties[this.adaptiveMapping.url.id].url,
      title: page.properties[this.adaptiveMapping.title.id].title?.[0]?.plain_text || '',
      summary: page.properties[this.adaptiveMapping.summary.id].rich_text?.[0]?.plain_text || '',
      stored: false,
      read_at: null,
    }));
  }

  /**
   * よく使われているタグを取得
   * @param {number} limit
   */
  async topTags(limit = 10) {
    const tagsProp = this.adaptiveMapping.tags;
    if (!tagsProp) return [];
    const res = await this.notion.databases.query({ database_id: this.dbId, page_size: 100 });
    const counts = {};
    for (const page of res.results) {
      const opts = page.properties[tagsProp.id].multi_select || [];
      for (const o of opts) counts[o.name] = (counts[o.name] || 0) + 1;
    }
    return Object.entries(counts).map(([tag, count]) => ({ tag, count })).sort((a,b) => b.count-a.count).slice(0,limit);
  }

  /**
   * URLまたはSimHashで既存記事を検索
   * @param {string} url
   * @param {string} hash
   */
  async _findExistingByUrl(url, hash) {
    const urlProp = this.adaptiveMapping.url;
    const hashProp = this.adaptiveMapping.hash;
    const filters = [];
    if (urlProp && url) filters.push({ property: urlProp.id, url: { equals: url } });
    if (hashProp && hash) {
      if (hashProp.type === 'rich_text') filters.push({ property: hashProp.id, rich_text: { equals: hash } });
      else filters.push({ property: hashProp.id, select: { equals: hash } });
    }
    if (filters.length === 0) return null;
    const res = await this.notion.databases.query({ database_id: this.dbId, filter: { or: filters }, page_size: 1 });
    return res.results[0] || null;
  }
}
