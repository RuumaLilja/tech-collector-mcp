// ── config/environment.js ──
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname 相当の生成
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env をロード
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/** @type {string} */
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;