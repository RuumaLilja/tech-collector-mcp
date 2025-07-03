import { Client } from '@notionhq/client';

/**
 * 既存のNotionデータベースのプロパティに動的に適合するStorageクラス v1
 * シンプルで確実な実装、新タグ自動追加機能付き
 */
export class NotionSdkStorage {
  constructor(apiKey, dbId) {
    this.notion = new Client({ auth: apiKey });
    this.dbId = dbId;
    this.propertyMap = null;
    this.adaptiveMapping = null;
  }

  /**
   * データベースプロパティを解析し、適応的マッピングを作成
   */
  async _ensurePropertyMap() {
    if (this.propertyMap && this.adaptiveMapping) return;

    const db = await this.notion.databases.retrieve({ database_id: this.dbId });

    // データベース情報をデバッグ用に保存
    this.dbInfo = {
      id: db.id,
      title: db.title,
      created_time: db.created_time,
      last_edited_time: db.last_edited_time,
    };

    // プロパティIDマップを作成
    this.propertyMap = Object.entries(db.properties).reduce(
      (m, [name, prop]) => {
        m[name] = {
          id: prop.id,
          type: prop.type,
          config: prop,
          options:
            prop.type === 'select'
              ? prop.select?.options
              : prop.type === 'multi_select'
              ? prop.multi_select?.options
              : prop.type === 'status'
              ? prop.status?.options
              : null,
        };
        return m;
      },
      {}
    );

    // 適応的マッピングを作成
    this.adaptiveMapping = this._createAdaptiveMapping();
  }

  /**
   * プロパティ名とtypeから用途を推測してマッピングを作成
   */
  _createAdaptiveMapping() {
    const mapping = {
      title: null,
      url: null,
      tags: null,
      summary: null,
      content: null,
      date: null,
      status: null,
      source: null,
      author: null,
    };

    // 完全一致での直接マッピング
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
      }
    }

    // フォールバック: typeベースのマッピング
    for (const [propName, propInfo] of Object.entries(this.propertyMap)) {
      switch (propInfo.type) {
        case 'title':
          if (!mapping.title) {
            mapping.title = { name: propName, ...propInfo };
          }
          break;
        case 'url':
          if (!mapping.url) {
            mapping.url = { name: propName, ...propInfo };
          }
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
          break;
        case 'date':
          if (!mapping.date && /公開|publish|created|日付/i.test(propName)) {
            mapping.date = { name: propName, ...propInfo };
          }
          break;
        case 'status':
          if (!mapping.status) {
            mapping.status = { name: propName, ...propInfo };
          }
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
   * 入力データを既存のプロパティ構造に適合させて保存
   */
  async upsert(article) {
    await this._ensurePropertyMap();

    const props = {};
    const now = new Date().toISOString();

    // デフォルト値を設定
    const enrichedArticle = {
      ...article,
      // ステータスがない場合はデフォルトで「未読」
      ...(!article.ステータス &&
        !article.status &&
        this.adaptiveMapping.status && { ステータス: '未読' }),
      // 公開日がない場合は現在日時
      ...(!article.公開日 &&
        !article.publishedAt &&
        !article.date &&
        this.adaptiveMapping.date && { 公開日: now }),
      // 保存日を追加
      ...(this.adaptiveMapping.date && { 保存日: now }),
    };

    // 適応的フィールドマッピング
    const fieldMappings = [
      { input: ['Title', 'title', 'タイトル'], target: 'title' },
      { input: ['URL', 'url', 'link', 'リンク'], target: 'url' },
      { input: ['タグ', 'tags', 'categories', 'カテゴリ'], target: 'tags' },
      { input: ['要約', 'summary', 'description', '概要'], target: 'summary' },
      { input: ['content', '本文', '内容'], target: 'content' },
      { input: ['公開日', 'publishedAt', 'date', '日付'], target: 'date' },
      { input: ['ステータス', 'status', '状態'], target: 'status' },
      { input: ['ソース元', 'source', 'ソース'], target: 'source' },
      { input: ['author', '著者', 'writer'], target: 'author' },
    ];

    // 入力データを適応的にマッピング
    const processedKeys = new Set();

    for (const mapping of fieldMappings) {
      for (const inputKey of mapping.input) {
        if (
          enrichedArticle[inputKey] !== undefined &&
          !processedKeys.has(inputKey)
        ) {
          const targetProp = this.adaptiveMapping[mapping.target];
          if (targetProp) {
            const value = enrichedArticle[inputKey];
            const formatted = await this._formatValueForProperty(
              value,
              targetProp,
              now
            );
            if (formatted) {
              props[targetProp.id] = formatted;
              processedKeys.add(inputKey);
            }
          }
          break;
        }
      }
    }

    // 残りのプロパティを直接名前でマッピング（後方互換性）
    for (const [key, value] of Object.entries(enrichedArticle)) {
      if (processedKeys.has(key)) continue;

      const propInfo = this.propertyMap[key];
      if (propInfo && !props[propInfo.id]) {
        const formatted = await this._formatValueForProperty(
          value,
          propInfo,
          now
        );
        if (formatted) {
          props[propInfo.id] = formatted;
        }
      }
    }

    // 重複チェック（URLベース）
    const existing = await this._findExistingByUrl(
      enrichedArticle.URL || enrichedArticle.url
    );

    if (existing) {
      const result = await this.notion.pages.update({
        page_id: existing.id,
        properties: props,
      });
      return { created: false, updated: true, id: existing.id };
    } else {
      const result = await this.notion.pages.create({
        parent: { database_id: this.dbId },
        properties: props,
      });
      return { created: true, updated: false, id: result.id };
    }
  }

  /**
   * 値をプロパティタイプに応じてフォーマット（新タグ自動追加機能付き）
   */
  async _formatValueForProperty(value, propInfo, defaultDate) {
    if (value === null || value === undefined) return null;

    switch (propInfo.type) {
      case 'title':
        return { title: [{ text: { content: String(value) } }] };

      case 'rich_text':
        return { rich_text: [{ text: { content: String(value) } }] };

      case 'url':
        if (typeof value === 'string' && /^https?:/.test(value)) {
          return { url: value };
        }
        return null;

      case 'select':
        if (typeof value === 'string') {
          return await this._ensureSelectOption(value, propInfo);
        }
        return null;

      case 'multi_select':
        if (Array.isArray(value)) {
          return await this._ensureMultiSelectOptions(value, propInfo);
        }
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              return await this._ensureMultiSelectOptions(parsed, propInfo);
            }
          } catch {
            return await this._ensureMultiSelectOptions([value], propInfo);
          }
        }
        return null;

      case 'status':
        if (typeof value === 'string') {
          return { status: { name: value } };
        }
        return null;

      case 'checkbox':
        return { checkbox: Boolean(value) };

      case 'date':
        let dateStr;
        if (value instanceof Date) {
          dateStr = value.toISOString();
        } else if (typeof value === 'string') {
          dateStr = isNaN(Date.parse(value))
            ? defaultDate
            : new Date(value).toISOString();
        } else {
          dateStr = defaultDate;
        }
        return { date: { start: dateStr } };

      case 'number':
        const num = Number(value);
        return isNaN(num) ? null : { number: num };

      default:
        return { rich_text: [{ text: { content: String(value) } }] };
    }
  }

  /**
   * multi_selectプロパティに新しいオプションを自動追加
   */
  async _ensureMultiSelectOptions(values, propInfo) {
    const stringValues = values.map((v) => String(v));
    const existingOptions = propInfo.options?.map((opt) => opt.name) || [];
    const newOptions = stringValues.filter(
      (value) => !existingOptions.includes(value)
    );

    // 新しいオプションがある場合はデータベースを更新
    if (newOptions.length > 0) {
      try {
        await this._addMultiSelectOptions(propInfo.name, newOptions);
        // プロパティマップを再取得して最新状態に更新
        this.propertyMap = null;
        this.adaptiveMapping = null;
        await this._ensurePropertyMap();
      } catch (error) {
        // エラーが発生しても処理を続行
      }
    }

    return { multi_select: stringValues.map((v) => ({ name: v })) };
  }

  /**
   * selectプロパティに新しいオプションを自動追加
   */
  async _ensureSelectOption(value, propInfo) {
    const stringValue = String(value);
    const existingOptions = propInfo.options?.map((opt) => opt.name) || [];

    // 新しいオプションの場合はデータベースを更新
    if (!existingOptions.includes(stringValue)) {
      try {
        await this._addSelectOption(propInfo.name, stringValue);
        // プロパティマップを再取得して最新状態に更新
        this.propertyMap = null;
        this.adaptiveMapping = null;
        await this._ensurePropertyMap();
      } catch (error) {
        // エラーが発生しても処理を続行
      }
    }

    return { select: { name: stringValue } };
  }

  /**
   * データベースのmulti_selectプロパティに新しいオプションを追加
   */
  async _addMultiSelectOptions(propertyName, newOptions) {
    const db = await this.notion.databases.retrieve({ database_id: this.dbId });
    const currentProperty = db.properties[propertyName];

    if (!currentProperty || currentProperty.type !== 'multi_select') {
      return;
    }

    const existingOptions = currentProperty.multi_select.options || [];
    const colors = [
      'default',
      'gray',
      'brown',
      'orange',
      'yellow',
      'green',
      'blue',
      'purple',
      'pink',
      'red',
    ];

    const updatedOptions = [
      ...existingOptions,
      ...newOptions.map((option, index) => ({
        name: option,
        color: colors[index % colors.length],
      })),
    ];

    const updatePayload = {
      database_id: this.dbId,
      properties: {
        [propertyName]: {
          multi_select: {
            options: updatedOptions,
          },
        },
      },
    };

    await this.notion.databases.update(updatePayload);
  }

  /**
   * データベースのselectプロパティに新しいオプションを追加
   */
  async _addSelectOption(propertyName, newOption) {
    const db = await this.notion.databases.retrieve({ database_id: this.dbId });
    const currentProperty = db.properties[propertyName];

    if (!currentProperty || currentProperty.type !== 'select') {
      return;
    }

    const existingOptions = currentProperty.select.options || [];
    const colors = [
      'default',
      'gray',
      'brown',
      'orange',
      'yellow',
      'green',
      'blue',
      'purple',
      'pink',
      'red',
    ];

    const updatedOptions = [
      ...existingOptions,
      {
        name: newOption,
        color: colors[existingOptions.length % colors.length],
      },
    ];

    const updatePayload = {
      database_id: this.dbId,
      properties: {
        [propertyName]: {
          select: {
            options: updatedOptions,
          },
        },
      },
    };

    await this.notion.databases.update(updatePayload);
  }

  /**
   * URLで既存記事を検索
   */
  async _findExistingByUrl(url) {
    if (!url) return null;

    const urlProp = this.adaptiveMapping.url;
    if (!urlProp) return null;

    try {
      const res = await this.notion.databases.query({
        database_id: this.dbId,
        filter: {
          property: urlProp.id,
          url: { equals: url },
        },
        page_size: 1,
      });
      return res.results[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * データベース構造とマッピング情報を取得（デバッグ用）
   */
  async getAdaptiveInfo() {
    await this._ensurePropertyMap();

    return {
      databaseInfo: this.dbInfo,
      properties: Object.entries(this.propertyMap).map(([name, info]) => ({
        name,
        type: info.type,
        id: info.id,
      })),
      adaptiveMapping: Object.entries(this.adaptiveMapping).map(
        ([field, prop]) => ({
          field,
          mappedTo: prop ? prop.name : 'NOT_MAPPED',
          type: prop ? prop.type : 'N/A',
          id: prop ? prop.id : 'N/A',
        })
      ),
      unmappedProperties: Object.entries(this.propertyMap)
        .filter(([name, info]) => {
          const isMapped = Object.values(this.adaptiveMapping).some(
            (mapping) => mapping && mapping.name === name
          );
          return !isMapped;
        })
        .map(([name, info]) => ({ name, type: info.type, id: info.id })),
    };
  }
}
