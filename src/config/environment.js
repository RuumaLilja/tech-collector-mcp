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

// 必須：Gemini API キー
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// 任意：Qiita のアクセストークン（次のステップで使います）
export const QIITA_TOKEN = process.env.QIITA_TOKEN;
// 任意：ログレベル
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
