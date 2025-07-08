import { Client } from '@notionhq/client';
import { toolList } from './toolDefinitions.static.js';

/**
 * 起動時に Notion データベースのプロパティから
 * syncArticleToNotion ツールの inputSchema を動的生成して注入し、
 * さらに Notion API が返すプロパティオブジェクトをそのまま返します。
 * @returns {Promise<Record<string, import('@notionhq/client').DatabasesRetrieveResponseProperties>>} プロパティ名→プロパティオブジェクトのマップ
 */
export async function injectNotionSyncTool() {
  const notion = new Client({ auth: process.env.NOTION_API_KEY });
  const db = await notion.databases.retrieve({
    database_id: process.env.NOTION_DATABASE_ID,
  });

  // inputSchema を動的に生成
  const schemaProps = {};
  const required = [];
  for (const [name, prop] of Object.entries(db.properties)) {
    switch (prop.type) {
      case 'title':
        schemaProps[name] = {
          type: 'string',
          description: `記事タイトル (${prop.type})`,
        };
        break;
      case 'rich_text':
        schemaProps[name] = {
          type: 'string',
          description: `テキスト内容 (${prop.type})`,
        };
        break;
      case 'url':
        schemaProps[name] = {
          type: 'string',
          format: 'uri',
          description: `URL (${prop.type})`,
        };
        break;
      case 'select':
        schemaProps[name] = {
          type: 'string',
          enum: prop.select.options.map((o) => o.name),
          description: `選択項目 (${prop.type})`,
        };
        break;
      case 'multi_select':
        schemaProps[name] = {
          type: 'array',
          items: { type: 'string' },
          description: `複数選択 (${prop.type})`,
        };
        break;
      case 'checkbox':
        schemaProps[name] = {
          type: 'boolean',
          description: `チェックボックス (${prop.type})`,
        };
        break;
      case 'date':
        schemaProps[name] = {
          type: 'string',
          format: 'date-time',
          description: `日付 (${prop.type})`,
        };
        break;
      case 'number':
        schemaProps[name] = {
          type: 'number',
          description: `数値 (${prop.type})`,
        };
        break;
      // relation, people, files などは string array
      case 'people':
      case 'files':
      case 'relation':
        schemaProps[name] = {
          type: 'array',
          items: { type: 'string' },
          description: `${prop.type} (${prop.type})`,
        };
        break;
      // 読み取り専用はスキップ
      case 'formula':
      case 'rollup':
        continue;
      default:
        schemaProps[name] = {
          type: 'string',
          description: `その他 (${prop.type})`,
        };
    }
    if (isRequiredProperty(name, prop.type)) {
      required.push(name);
    }
  }

  // ツール定義を注入
  const toolDef = {
    name: 'syncArticleToNotion',
    descriptionForHumans: `指定の Notion データベース (${
      db.title[0]?.plain_text || db.id
    }) のスキーマに合わせて記事を同期します。`,
    description: `ユーザーが「この記事を保存」などと言ったときに、DB のスキーマに従って作成または更新を行うツールです。必須フィールド: ${required.join(
      ', '
    )}`,
    inputSchema: {
      type: 'object',
      properties: schemaProps,
      required,
      additionalProperties: false,
    },
  };
  toolList.initialize.result.capabilities.tools.syncArticleToNotion = toolDef;
  // tools/list の定義も更新
  const list = toolList['tools/list'].result.tools;
  const idx = list.findIndex((t) => t.name === 'syncArticleToNotion');
  if (idx !== -1) list.splice(idx, 1);
  list.push({
    name: toolDef.name,
    description: toolDef.descriptionForHumans,
    inputSchema: toolDef.inputSchema,
  });

  // プロパティオブジェクトをそのまま返却
  return db.properties;
}

/**
 * デバッグ用: Notion データベース情報を取得
 */
export async function getNotionDatabaseInfo() {
  try {
    const notion = new Client({ auth: process.env.NOTION_API_KEY });
    const db = await notion.databases.retrieve({
      database_id: process.env.NOTION_DATABASE_ID,
    });
    return {
      success: true,
      database: {
        title: db.title[0]?.plain_text,
        id: db.id,
        createdTime: db.created_time,
        properties: db.properties,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: { message: error.message, status: error.status, code: error.code },
    };
  }
}

/**
 * フィールドを必須にするか判定
 */
function isRequiredProperty(name, type) {
  const must = ['title', 'url', 'タグ', '要約'];
  if (must.some((m) => name.toLowerCase().includes(m.toLowerCase())))
    return true;
  return type === 'title';
}
