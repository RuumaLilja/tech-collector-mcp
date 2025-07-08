// notionSdkStorage.js
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
   * StoragePort の findByUrlOrHash を実装
   * @param {{url:string,hash:string}} params
   * @returns {Promise<import('../ports/storage.js').Article|null>}
   */
  async findByUrlOrHash({ url, hash }) {
    return this._findExistingByUrl(url, hash);
  }

  /**
   * 起動時に渡された propertyMap をもとに adaptiveMapping を作成
   */
  _createAdaptiveMapping() {
    const mapping = {
      title: null,
      url: null,
      tags: null,
      summary: null,
      date: null,
      status: null,
      source: null,
      author: null,
      hash: null, // SimHash 用 internal key
    };

    // 完全一致マッピング
    for (const [propName, propInfo] of Object.entries(this.propertyMap)) {
      switch (propName) {
        case 'Title':
          mapping.title = { name: propName, ...propInfo };
          break;
        case 'URL':
          mapping.url = { name: propName, ...propInfo };
          break;
        case 'タグ':
          mapping.tags = { name: propName, ...propInfo };
          break;
        case '要約':
          mapping.summary = { name: propName, ...propInfo };
          break;
        case '公開日':
          mapping.date = { name: propName, ...propInfo };
          break;
        case 'ステータス':
          mapping.status = { name: propName, ...propInfo };
          break;
        case 'ソース元':
          mapping.source = { name: propName, ...propInfo };
          break;
        case '評価':
          mapping.rating = { name: propName, ...propInfo };
          break;
        case '所要時間（分）':
          mapping.readTime = { name: propName, ...propInfo };
          break;
        case 'SimHash':
          mapping.hash = { name: propName, ...propInfo };
          break;
      }
    }

    // フォールバック: typeベース
    for (const [propName, propInfo] of Object.entries(this.propertyMap)) {
      switch (propInfo.type) {
        case 'title':
          if (!mapping.title) mapping.title = { name: propName, ...propInfo };
          break;
        case 'url':
          if (!mapping.url) mapping.url = { name: propName, ...propInfo };
          break;
        case 'multi_select':
          if (
            !mapping.tags &&
            /tag|タグ|category|カテゴリ|label|ラベル/i.test(propName)
          ) {
            mapping.tags = { name: propName, ...propInfo };
          }
          break;
        case 'rich_text':
          if (
            !mapping.summary &&
            /summary|要約|概要|description/i.test(propName)
          ) {
            mapping.summary = { name: propName, ...propInfo };
          }
          if (!mapping.hash && /hash/i.test(propName)) {
            mapping.hash = { name: propName, ...propInfo };
          }
          break;
        case 'date':
          if (!mapping.date && /公開|publish|created|日付/i.test(propName)) {
            mapping.date = { name: propName, ...propInfo };
          }
          break;
        case 'status':
          if (!mapping.status) mapping.status = { name: propName, ...propInfo };
          break;
        case 'select':
          if (
            !mapping.source &&
            /source|ソース|from|site|サイト|platform|元/i.test(propName)
          ) {
            mapping.source = { name: propName, ...propInfo };
          }
          break;
      }
    }

    return mapping;
  }

  /**
   * 新規作成 or 更新を行う (競合解消ロジック付き)
   * @param {{[key:string]:any}} article
   */
  async upsert(article) {
    const props = {};
    const now = new Date().toISOString();

    // フィールドマッピング定義
    const fieldMappings = [
      { input: ['title', 'Title'], target: 'title' },
      { input: ['url', 'URL'], target: 'url' },
      { input: ['tags', 'タグ', 'categories'], target: 'tags' },
      { input: ['summary', '要約', 'description'], target: 'summary' },
      { input: ['hash', 'SimHash'], target: 'hash' },
      { input: ['publishedAt', '公開日'], target: 'date' },
      { input: ['status', 'ステータス'], target: 'status' },
      { input: ['source', 'ソース元'], target: 'source' },
      { input: ['author', '著者'], target: 'author' },
      { input: ['rating', '評価'], target: 'rating' },
      { input: ['readTime', '所要時間（分）'], target: 'readTime' },
    ];

    // デフォルト値を付与
    const enriched = {
      ...article,
      // 未指定ならステータス
      ...(article.status === undefined &&
        this.adaptiveMapping.status && { status: '未読' }),
      // 未指定なら公開日
      ...(article.publishedAt === undefined &&
        this.adaptiveMapping.date && { publishedAt: now }),
      // 保存日
      ...(this.adaptiveMapping.date && { savedAt: now }),
    };

    const processed = new Set();
    // adaptive mapping
    for (const mapping of fieldMappings) {
      for (const key of mapping.input) {
        if (enriched[key] !== undefined && !processed.has(key)) {
          const prop = this.adaptiveMapping[mapping.target];
          if (prop) {
            const formatted = await this._formatValueForProperty(
              enriched[key],
              prop,
              now
            );
            if (formatted) props[prop.id] = formatted;
          }
          processed.add(key);
          break;
        }
      }
    }

    // 既存チェック (URL/SimHash)
    const url = article.url || article.URL;
    const hash = article.hash || article.SimHash;
    const existing = await this._findExistingByUrl(url, hash);

    if (existing) {
      await this.notion.pages.update({
        page_id: existing.id,
        properties: props,
      });
      return { created: false, updated: true, id: existing.id };
    }
    // 新規作成
    const result = await this.notion.pages.create({
      parent: { database_id: this.dbId },
      properties: props,
    });
    return { created: true, updated: false, id: result.id };
  }

  /**
   * 指定のプロパティタイプに応じて値をフォーマット
   */
  async _formatValueForProperty(value, propInfo, defaultDate) {
    if (value === null || value === undefined) return null;
    switch (propInfo.type) {
      case 'title':
        return { title: [{ text: { content: String(value) } }] };
      case 'rich_text':
        return { rich_text: [{ text: { content: String(value) } }] };
      case 'url':
        return typeof value === 'string' && /^https?:/.test(value)
          ? { url: value }
          : null;
      case 'select':
        return typeof value === 'string'
          ? { select: { name: String(value) } }
          : null;
      case 'multi_select':
        if (Array.isArray(value)) {
          return { multi_select: value.map((v) => ({ name: String(v) })) };
        }
        return null;
      case 'status':
        return typeof value === 'string'
          ? { status: { name: String(value) } }
          : null;
      case 'date': {
        let dateStr;
        if (value instanceof Date) dateStr = value.toISOString();
        else if (typeof value === 'string' && !isNaN(Date.parse(value)))
          dateStr = new Date(value).toISOString();
        else dateStr = defaultDate;
        return { date: { start: dateStr } };
      }
      case 'checkbox':
        return { checkbox: Boolean(value) };
      case 'number': {
        const num = Number(value);
        return isNaN(num) ? null : { number: num };
      }
      default:
        return { rich_text: [{ text: { content: String(value) } }] };
    }
  }

  /**
   * URLまたはSimHashで既存記事を検索
   */
  async _findExistingByUrl(url, hash) {
    const urlProp = this.adaptiveMapping.url;
    const hashProp = this.adaptiveMapping.hash;
    const filters = [];
    if (urlProp && url)
      filters.push({ property: urlProp.id, url: { equals: url } });
    if (hashProp && hash) {
      if (hashProp.type === 'rich_text')
        filters.push({ property: hashProp.id, rich_text: { equals: hash } });
      else filters.push({ property: hashProp.id, select: { equals: hash } });
    }
    if (filters.length === 0) return null;
    const res = await this.notion.databases.query({
      database_id: this.dbId,
      filter: { or: filters },
      page_size: 1,
    });
    return res.results[0] || null;
  }

  /**
   * 未保存または未読の記事を取得（tags, rating を含める）
   * @param {number} limit
   */
  async listUnstoredOrUnread(limit = 10) {
    const statusProp = this.adaptiveMapping.status;
    if (!statusProp) return [];

    const filter =
      statusProp.type === 'checkbox'
        ? { checkbox: { equals: false } }
        : { status: { equals: '未読' } };

    const res = await this.notion.databases.query({
      database_id: this.dbId,
      filter: { property: statusProp.id, ...filter },
      sorts: [
        { property: this.adaptiveMapping.date.id, direction: 'descending' },
      ],
      page_size: limit,
    });

    return res.results.map((p) => {
      const readTime = this.adaptiveMapping.readTime
        ? p[this.adaptiveMapping.readTime.id]?.number || 0
        : 0;
      return {
        id: p.id,
        url: p[this.adaptiveMapping.url.id]?.url || '',
        title: p[this.adaptiveMapping.title.id]?.title?.[0]?.plain_text || '',
        summary:
          p[this.adaptiveMapping.summary.id]?.rich_text?.[0]?.plain_text || '',
        tags:
          p[this.adaptiveMapping.tags.id]?.multi_select.map((o) => o.name) ||
          [],
        rating: p[this.adaptiveMapping.rating?.id]?.number || 0,
        publishedAt: p[this.adaptiveMapping.date.id]?.date?.start || null,
        readTime,
        stored: false,
        read_at: null,
      };
    });
  }

  /**
   * 指定ステータス(例: '既読' or '未読')の記事を取得
   * @param {string} statusValue
   * @param {number} limit
   */
  async listByStatus(statusValue, limit = 100) {
    const statusProp = this.adaptiveMapping.status;
    if (!statusProp) return [];

    const filter =
      statusProp.type === 'checkbox'
        ? { checkbox: { equals: statusValue !== '未読' } } // checkboxなら false=未読, true=既読
        : { status: { equals: statusValue } };

    const res = await this.notion.databases.query({
      database_id: this.dbId,
      filter: { property: statusProp.id, ...filter },
      sorts: [
        { property: this.adaptiveMapping.date.id, direction: 'descending' },
      ],
      page_size: limit,
    });

    return res.results.map((page) => {
      const p = page.properties;
      return {
        id: page.id,
        url: p[this.adaptiveMapping.url.id]?.url || '',
        title: p[this.adaptiveMapping.title.id]?.title?.[0]?.plain_text || '',
        summary:
          p[this.adaptiveMapping.summary.id]?.rich_text?.[0]?.plain_text || '',
        tags:
          p[this.adaptiveMapping.tags.id]?.multi_select.map((o) => o.name) ||
          [],
        rating: p[this.adaptiveMapping.rating?.id]?.number || 0,
        publishedAt: p[this.adaptiveMapping.date.id]?.date?.start || null,
        // stored/read_atなど不要なら省略
      };
    });
  }

  /**
   * よく使われているタグを取得
   */
  async topTags(limit = 10) {
    const tagsProp = this.adaptiveMapping.tags;
    if (!tagsProp) return [];
    const res = await this.notion.databases.query({
      database_id: this.dbId,
      page_size: 100,
    });
    const counts = {};
    for (const page of res.results) {
      const opts = page.properties[tagsProp.id].multi_select || [];
      for (const o of opts) counts[o.name] = (counts[o.name] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}
