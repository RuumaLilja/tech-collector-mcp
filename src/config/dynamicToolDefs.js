// src/config/dynamicToolDefs.js
import { Client } from '@notionhq/client';
import { toolList } from './toolDefinitions.js';

/**
 * 起動時に Notion データベースのプロパティから
 * syncToNotion ツールの inputSchema を動的生成して注入する
 */
export async function injectNotionSyncTool() {
  try {
    const notion = new Client({ auth: process.env.NOTION_API_KEY });
    const db = await notion.databases.retrieve({
      database_id: process.env.NOTION_DATABASE_ID
    });

    const schemaProps = {};
    const required = [];

    for (const [name, prop] of Object.entries(db.properties)) {
      switch (prop.type) {
        case 'title':
          schemaProps[name] = { 
            type: 'string',
            description: `記事タイトル (${prop.type})`
          };
          break;
        case 'rich_text':
          schemaProps[name] = { 
            type: 'string',
            description: `テキスト内容 (${prop.type})`
          };
          break;
        case 'url':
          schemaProps[name] = { 
            type: 'string', 
            format: 'uri',
            description: `URL (${prop.type})`
          };
          break;
        case 'select':
          const selectOptions = prop.select.options.map(opt => opt.name);
          schemaProps[name] = {
            type: 'string',
            enum: selectOptions,
            description: `選択項目 (${prop.type}): ${selectOptions.join(', ')}`
          };
          break;
        case 'multi_select':
          const multiSelectOptions = prop.multi_select.options.map(opt => opt.name);
          schemaProps[name] = { 
            type: 'array', 
            items: { type: 'string' },
            description: `複数選択 (${prop.type}): 利用可能なオプション: ${multiSelectOptions.join(', ')}`
          };
          break;
        case 'checkbox':
          schemaProps[name] = { 
            type: 'boolean',
            description: `チェックボックス (${prop.type})`
          };
          break;
        case 'date':
          schemaProps[name] = { 
            type: 'string', 
            format: 'date-time',
            description: `日付 (${prop.type}): ISO 8601 形式`
          };
          break;
        case 'number':
          schemaProps[name] = { 
            type: 'number',
            description: `数値 (${prop.type})`
          };
          break;
        case 'people':
          schemaProps[name] = { 
            type: 'array',
            items: { type: 'string' },
            description: `担当者 (${prop.type}): ユーザーIDの配列`
          };
          break;
        case 'files':
          schemaProps[name] = { 
            type: 'array',
            items: { type: 'string' },
            description: `ファイル (${prop.type}): ファイルURLの配列`
          };
          break;
        case 'relation':
          schemaProps[name] = { 
            type: 'array',
            items: { type: 'string' },
            description: `関連 (${prop.type}): 関連ページIDの配列`
          };
          break;
        case 'formula':
        case 'rollup':
          // 読み取り専用のため除外
          continue;
        default:
          // 未対応型は string として扱う
          schemaProps[name] = { 
            type: 'string',
            description: `その他 (${prop.type})`
          };
      }

      // 設定可能な必須フィールドの判定
      if (isRequiredProperty(name, prop.type)) {
        required.push(name);
      }
    }

    const toolDef = {
      name: 'syncToNotion',
      descriptionForHumans: `指定の Notion データベース (${db.title[0]?.plain_text || 'Tech Articles'}) のプロパティに合わせて記事を同期します。`,
      descriptionForModel: `ユーザーが「この記事を保存」「ストックして」などと発言したときに、Notion データベースのスキーマに従って記事の新規作成または更新を行うツールです。必須フィールド: ${required.join(', ')}`,
      inputSchema: {
        type: 'object',
        properties: schemaProps,
        required,
        additionalProperties: false,
      },
    };

    // ツール定義を注入
    if (toolList.initialize?.result?.capabilities?.tools) {
      toolList.initialize.result.capabilities.tools.syncToNotion = toolDef;
    }
    
    if (toolList['tools/list']?.result?.tools) {
      // 既存のsyncToNotionがあれば削除
      const existingIndex = toolList['tools/list'].result.tools.findIndex(
        tool => tool.name === 'syncToNotion'
      );
      if (existingIndex !== -1) {
        toolList['tools/list'].result.tools.splice(existingIndex, 1);
      }
      
      // 新しい定義を追加
      toolList['tools/list'].result.tools.push({
        name: toolDef.name,
        description: toolDef.descriptionForHumans,
        inputSchema: toolDef.inputSchema,
      });
    }

  } catch (error) {
    throw error;
  }
}

/**
 * プロパティが必須かどうかを判定
 * @param {string} name - プロパティ名
 * @param {string} type - プロパティタイプ
 * @returns {boolean}
 */
function isRequiredProperty(name, type) {
  // プロパティ名による判定
  const requiredNames = ['Title', 'URL', 'タグ', '要約', 'title', 'url', 'tags', 'summary'];
  if (requiredNames.some(reqName => 
    name.toLowerCase().includes(reqName.toLowerCase()) || 
    reqName.toLowerCase().includes(name.toLowerCase())
  )) {
    return true;
  }

  // プロパティタイプによる判定
  if (type === 'title') {
    return true; // titleタイプは通常必須
  }

  return false;
}

/**
 * データベース情報を取得（デバッグ用）
 * @returns {Promise<Object>} データベース情報とエラー情報を含むオブジェクト
 */
export async function getNotionDatabaseInfo() {
  try {
    const notion = new Client({ auth: process.env.NOTION_API_KEY });
    const db = await notion.databases.retrieve({
      database_id: process.env.NOTION_DATABASE_ID
    });
    
    const info = {
      success: true,
      database: {
        title: db.title[0]?.plain_text || '未設定',
        id: db.id,
        created_time: db.created_time,
        properties: Object.entries(db.properties).map(([name, prop]) => ({
          name,
          type: prop.type,
          id: prop.id
        }))
      }
    };
    
    return info;
  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        status: error.status
      }
    };
  }
}