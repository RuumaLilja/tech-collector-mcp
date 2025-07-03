// File: src/config/environment.js

import dotenvFlow from 'dotenv-flow';
import path from 'path';
import { fileURLToPath } from 'url';

// import.meta.url から __dirname 相当を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// プロジェクトルートを常に src/../.. として解決
const projectRoot = path.resolve(__dirname, '..', '..');

// .env, .env.development, .env.production… を projectRoot から自動ロード
dotenvFlow.config({
  path: projectRoot,
  // defaultNodeEnv: 'development',  // 必要に応じてデフォルト環境を指定
});

// ==== API キー / トークン =====
// 必須：Gemini API キー
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// 任意：Qiita のアクセストークン
export const QIITA_TOKEN = process.env.QIITA_TOKEN || '';
// 任意：Dev.to のAPI キー
export const DEVTO_API_KEY = process.env.DEVTO_API_KEY || '';
// 任意：NewsAPI.org の API キー
export const NEWSAPI_KEY = process.env.NEWSAPI_KEY || '';

// Notion連携用（任意設定）
export const NOTION_API_KEY = process.env.NOTION_API_KEY || '';
export const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || '';

// 任意：ログレベル
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// ==== ページネーション設定 =====
// デフォルト取得件数
export const PAGE_LIMIT = parseInt(process.env.PAGE_LIMIT || '3', 10);
// 1ページあたりアイテム数
export const ITEMS_PER_PAGE = parseInt(process.env.ITEMS_PER_PAGE || '100', 10);

