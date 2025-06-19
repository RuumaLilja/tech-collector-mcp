#!/usr/bin/env node

/**
 * @fileoverview
 * Entry point for the Qiita MCP Server. This script initializes environment variables,
 * sets up a JSON-RPC 2.0 compliant MCP (Model Context Protocol) server over STDIO,
 * and provides two tools:
 *   - get_qiita_ranking: Fetches Qiita article rankings for a given period/category.
 *   - summarize_qiita_article: Summarizes a specific Qiita article using Google's Gemini API.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ESM で __dirname 相当を作成
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// スクリプト直下の .env を確実に読み込む
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * @const {string|undefined} GEMINI API Key from environment
 */
const apiKey = process.env.GEMINI_API_KEY;

// Gemini API クライアント初期化
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * QiitaMCPServer
 * @class
 * @description
 *   JSON-RPC 2.0 over STDIO に対応した MCP (Model Context Protocol) サーバー。
 *   Qiita API と Gemini API を用いてランキング取得・記事要約機能を提供します。
 */
class QiitaMCPServer {
  /**
   * Constructor: サーバーの STDIO をセットアップし、リクエスト待機を開始します。
   */
  constructor() {
    this.setupStdio();
  }

  /**
   * 標準入力からの JSON-RPC リクエストを受け取り、処理を開始します。
   * @private
   */
  setupStdio() {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (data) => {
      const lines = data.trim().split('\n');
      for (const line of lines) {
        if (line.trim()) this.handleMessage(line.trim());
      }
    });
  }

  /**
   * 受け取った JSON-RPC 文字列をパースし、メッセージを処理して応答を送信します。
   * @param {string} messageStr - JSON-RPC リクエスト文字列
   * @private
   */
  async handleMessage(messageStr) {
    try {
      const message = JSON.parse(messageStr);
      console.error('Received message:', message);

      // 基本的な JSON-RPC フォーマットチェック
      if (message.jsonrpc !== '2.0') {
        this.sendErrorResponse(
          message.id || 'unknown',
          -32600,
          'Invalid Request'
        );
        return;
      }
      if (message.id === undefined) {
        this.sendErrorResponse('unknown', -32600, 'Missing id');
        return;
      }
      if (!message.method || typeof message.method !== 'string') {
        this.sendErrorResponse(message.id, -32600, 'Invalid method');
        return;
      }

      // 正常リクエストの処理
      const response = await this.processMessage(message);
      console.error('Sending response:', response);
      this.sendResponse(response);

    } catch (err) {
      console.error('Parse error:', err);
      this.sendErrorResponse('unknown', -32700, 'Parse error');
    }
  }

  /**
   * JSON-RPC メソッド名に応じてツールを呼び出します。
   * @param {{id: string|number, method: string, params?: object}} request
   * @returns {Promise<object>} JSON-RPC レスポンスオブジェクト
   * @private
   */
  async processMessage({ id, method, params }) {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'qiita-mcp-server', version: '1.0.0' },
          },
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: [
              {
                name: 'get_qiita_ranking',
                description: 'Get Qiita article ranking',
                inputSchema: {
                  type: 'object',
                  properties: {
                    period: { type: 'string', enum: ['daily','weekly','monthly'], default: 'weekly' },
                    category: { type: 'string' },
                    count: { type: 'number', default: 10, minimum: 1, maximum: 100 },
                  },
                  additionalProperties: false,
                },
              },
              {
                name: 'summarize_qiita_article',
                description: 'Summarize a specific Qiita article via local LLM',
                inputSchema: {
                  type: 'object',
                  properties: { url: { type: 'string' }, title: { type: 'string' } },
                  required: ['url'],
                  additionalProperties: false,
                },
              },
            ],
          },
        };

      case 'tools/call':
        if (!params || typeof params !== 'object' || !params.name) {
          return this.createErrorResponse(id, -32602, 'Invalid params');
        }

        switch (params.name) {
          case 'get_qiita_ranking':
            return this.getQiitaRanking(id, params.arguments || {});
          case 'summarize_qiita_article':
            const { url, title } = params.arguments || {};
            if (!url) return this.createErrorResponse(id, -32602, 'url is required');
            return this.summarizeArticle(id, { url, title });
          default:
            return this.createErrorResponse(id, -32601, `Method not found: ${params.name}`);
        }

      default:
        return this.createErrorResponse(id, -32601, `Method not found: ${method}`);
    }
  }

  /**
   * Qiita API を呼び出して、記事ランキングを取得し結果を JSON-RPC 形式で返します。
   * @param {string|number} id - JSON-RPC リクエスト ID
   * @param {{period?: string, category?: string, count?: number}} args - パラメータ
   * @returns {Promise<object>} JSON-RPC レスポンス
   * @private
   */
  async getQiitaRanking(id, args) {
    try {
      const { period = 'weekly', category, count = 10 } = args;

      // バリデーション
      if (typeof count !== 'number' || count < 1 || count > 100) {
        return this.createErrorResponse(id, -32602, 'Invalid count: must be 1–100');
      }
      if (category !== undefined && typeof category !== 'string') {
        return this.createErrorResponse(id, -32602, 'Invalid category: must be a string');
      }
      if (!['daily','weekly','monthly'].includes(period)) {
        return this.createErrorResponse(id, -32602, 'Invalid period: must be daily, weekly, or monthly');
      }

      // 期間フィルタ日付計算
      let cutoffDate;
      const now = new Date();
      switch (period) {
        case 'daily':
          cutoffDate = new Date(now);
          cutoffDate.setDate(now.getDate() - 1);
          break;
        case 'weekly':
          cutoffDate = new Date(now);
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          cutoffDate = new Date(now);
          cutoffDate.setMonth(now.getMonth() - 1);
          if (cutoffDate.getDate() !== now.getDate()) cutoffDate.setDate(0);
          break;
      }
      const dateFilter = cutoffDate.toISOString().split('T')[0];

      // クエリ構築
      let searchQuery = `created:>${dateFilter}`;
      if (period==='daily') searchQuery += ` stocks:>0`;
      if (period==='weekly') searchQuery += ` stocks:>5`;
      if (period==='monthly') searchQuery += ` stocks:>10`;
      if (category) searchQuery += ` tag:${category}`;

      // 複数ページ取得
      const allItems = [];
      for (let page=1; page<=3; page++) {
        const apiUrl = `https://qiita.com/api/v2/items?per_page=100&page=${page}&query=${encodeURIComponent(searchQuery)}`;
        const resp = await axios.get(apiUrl, { headers:{Accept:'application/json','User-Agent':'QiitaMCPServer/1.0.0'}, timeout:10000 });
        if (Array.isArray(resp.data)) allItems.push(...resp.data);
      }

      // フィルタ・重複除去・ソート
      const recentItems = allItems.filter(item => new Date(item.created_at) >= cutoffDate);
      const uniqueItems = recentItems.filter((item,i,self) => self.findIndex(t=>t.id===item.id)===i);
      const topItems = uniqueItems.sort((a,b) => ((b.likes_count||0)+(b.stocks_count||0)*2) - ((a.likes_count||0)+(a.stocks_count||0)*2))
                             .slice(0,count)
                             .map((it,idx) => ({ rank:idx+1, title:it.title, url:it.url, likes:it.likes_count||0, stocks:it.stocks_count||0, score:(it.likes_count||0)+(it.stocks_count||0)*2, created_at:it.created_at }));

      // レスポンス生成
      const periodMap = { daily:'24時間', weekly:'1週間', monthly:'1ヶ月' };
      const headerText = `📈 ${periodMap[period]}以内の人気記事 TOP${topItems.length}`;
      const resultText = topItems.map(it =>
        `${it.rank}. ${it.title}\n   👍 ${it.likes}いいね 📚 ${it.stocks}ストック (スコア: ${it.score})\n   📅 ${new Date(it.created_at).toLocaleString('ja-JP')}\n   ${it.url}`
      ).join('\n\n');

      return { jsonrpc:'2.0', id, result:{ content:[{ type:'text', text:`${headerText}\n\n${resultText}` }] } };
    } catch (err) {
      console.error('Qiita API error:', err);
      let msg = `APIエラー: ${err.message}`;
      if (err.code==='ECONNABORTED'||err.code==='ETIMEDOUT') msg='APIタイムアウトエラーが発生しました';
      else if (err.response?.status===401) msg='API認証エラーです';
      else if (err.response?.status===429) msg='APIレート制限に達しました。しばらく待ってから再試行してください';
      return this.createErrorResponse(id, -32603, msg);
    }
  }

  /**
   * Gemini API を用いて指定 Qiita 記事を 3-5 行で要約します。
   * @param {string|number} id - JSON-RPC リクエスト ID
   * @param {{url: string, title?: string}} options - 要約対象記事の URL とオプションのタイトル
   * @returns {Promise<object>} JSON-RPC レスポンス
   * @private
   */
  async summarizeArticle(id, { url, title }) {
    try {
      // 記事取得
      const itemId = url.split('/').pop();
      const { data } = await axios.get(`https://qiita.com/api/v2/items/${itemId}`);
      const bodyMd = data.body;

      // 要約プロンプト
      const prompt = `以下のQiita記事を3〜5行で要約してください。\nタイトル: ${title||'（タイトルなし）'}\n\n${bodyMd}`;

      // モデル呼び出し
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text().trim() || '要約取得に失敗しました';

      return { jsonrpc:'2.0', id, result:{ content:[{ type:'text', text: summary }] } };
    } catch (err) {
      console.error('Gemini API full error:', err);
      return { jsonrpc:'2.0', id, error:{ code: -32000, message: `要約APIエラー: ${err.message}` } };
    }
  }

  /**
   * JSON-RPC エラー形式のレスポンスを生成します。
   * @param {string|number} id - リクエスト ID
   * @param {number} code - エラーコード
   * @param {string} message - エラーメッセージ
   * @returns {{jsonrpc: string, id: string|number, error: {code: number, message: string}}}
   * @private
   */
  createErrorResponse(id, code, message) {
    return { jsonrpc: '2.0', id, error: { code, message } };
  }

  /**
   * sendErrorResponse のラッパー。createErrorResponse の結果を送信します。
   * @param {string|number} id
   * @param {number} code
   * @param {string} message
   * @private
   */
  sendErrorResponse(id, code, message) {
    const errorResponse = this.createErrorResponse(id, code, message);
    this.sendResponse(errorResponse);
  }

  /**
   * JSON-RPC レスポンスを標準出力に出力します。
   * @param {{jsonrpc?: string, id?: string|number, result?: any, error?: any}} response
   * @private
   */
  sendResponse(response) {
    if (!response.jsonrpc) response.jsonrpc = '2.0';
    if (response.id === undefined) response.id = 'unknown';
    if (!response.error && !response.result) response.error = { code: -32603, message: 'Internal error' };
    console.log(JSON.stringify(response));
  }
}

// サーバー起動
new QiitaMCPServer();
console.error('Qiita MCP Server started');
