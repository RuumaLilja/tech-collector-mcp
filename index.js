#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM で __dirname 相当を作る
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// スクリプト直下の .env を確実に読む
dotenv.config({ path: path.resolve(__dirname, '.env') });

// 以下、既存の import axios など…
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

// APIキーの確認
const apiKey = process.env.GEMINI_API_KEY;

// Gemini API クライアント初期化
const genAI = new GoogleGenerativeAI(apiKey);

// Qiitaランキングを返すMCPサーバークラス
class QiitaMCPServer {
  constructor() {
    this.setupStdio();
  }

  setupStdio() {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (data) => {
      const lines = data.trim().split('\n');
      for (const line of lines) {
        if (line.trim()) this.handleMessage(line.trim());
      }
    });
  }

  async handleMessage(messageStr) {
    try {
      const message = JSON.parse(messageStr);
      console.error('Received message:', message);
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
      const response = await this.processMessage(message);
      console.error('Sending response:', response);
      this.sendResponse(response);
    } catch (err) {
      console.error('Parse error:', err);
      this.sendErrorResponse('unknown', -32700, 'Parse error');
    }
  }

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
                    period: {
                      type: 'string',
                      enum: ['daily', 'weekly', 'monthly'],
                      default: 'weekly',
                    },
                    category: { type: 'string' },
                    count: {
                      type: 'number',
                      default: 10,
                      minimum: 1,
                      maximum: 100,
                    },
                  },
                  additionalProperties: false,
                },
              },
              {
                name: 'summarize_qiita_article',
                description: 'Summarize a specific Qiita article via local LLM',
                inputSchema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string' },
                    title: { type: 'string' },
                  },
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
        if (params.name === 'get_qiita_ranking') {
          return this.getQiitaRanking(id, params.arguments || {});
        }
        if (params.name === 'summarize_qiita_article') {
          const { url, title } = params.arguments || {};
          if (!url)
            return this.createErrorResponse(id, -32602, 'url is required');
          return this.summarizeArticle(id, { url, title });
        }
        return this.createErrorResponse(
          id,
          -32601,
          `Method not found: ${params.name}`
        );
      default:
        return this.createErrorResponse(
          id,
          -32601,
          `Method not found: ${method}`
        );
    }
  }

  // Qiita APIからランキングを取得し、JSON-RPCレスポンスを作成
  async getQiitaRanking(id, args) {
    try {
      const { period = 'weekly', category, count = 10 } = args;

      // 引数バリデーション
      if (typeof count !== 'number' || count < 1 || count > 100) {
        return this.createErrorResponse(
          id,
          -32602,
          'Invalid count: must be 1–100'
        );
      }
      if (category !== undefined && typeof category !== 'string') {
        return this.createErrorResponse(
          id,
          -32602,
          'Invalid category: must be a string'
        );
      }
      if (!['daily', 'weekly', 'monthly'].includes(period)) {
        return this.createErrorResponse(
          id,
          -32602,
          'Invalid period: must be daily, weekly, or monthly'
        );
      }

      // 期間に応じた日付フィルタを設定
      let dateFilter;
      let cutoffDate;
      const now = new Date();

      switch (period) {
        case 'daily':
          // 24時間前
          cutoffDate = new Date(now);
          cutoffDate.setDate(cutoffDate.getDate() - 1);
          dateFilter = cutoffDate.toISOString().split('T')[0];
          break;

        case 'weekly':
          // 7日前
          cutoffDate = new Date(now);
          cutoffDate.setDate(cutoffDate.getDate() - 7);
          dateFilter = cutoffDate.toISOString().split('T')[0];
          break;

        case 'monthly':
          // 1ヶ月前（正確な月計算）
          cutoffDate = new Date(now);
          cutoffDate.setMonth(cutoffDate.getMonth() - 1);
          // 月末日の処理を考慮（例：3/31 → 2/28）
          if (cutoffDate.getDate() !== now.getDate()) {
            cutoffDate.setDate(0); // 前月の最終日
          }
          dateFilter = cutoffDate.toISOString().split('T')[0];
          break;

        default:
          // デフォルトは1週間
          cutoffDate = new Date(now);
          cutoffDate.setDate(cutoffDate.getDate() - 7);
          dateFilter = cutoffDate.toISOString().split('T')[0];
      }

      // 検索クエリを構築（人気記事に絞り込み）
      let searchQuery = `created:>${dateFilter}`;

      // 期間に応じてストック数の閾値を調整
      switch (period) {
        case 'daily':
          searchQuery += ` stocks:>0`; // 24時間以内なら1ストック以上
          break;
        case 'weekly':
          searchQuery += ` stocks:>5`; // 1週間以内なら6ストック以上
          break;
        case 'monthly':
          searchQuery += ` stocks:>10`; // 1ヶ月以内なら11ストック以上
          break;
      }

      // カテゴリフィルタを追加
      if (category) searchQuery += ` tag:${category}`;

      console.error(`Search query: ${searchQuery}`);

      // 複数ページを取得してより多くの候補を確保
      const allItems = [];
      for (let page = 1; page <= 3; page++) {
        const apiUrl = `https://qiita.com/api/v2/items?per_page=100&page=${page}&query=${encodeURIComponent(
          searchQuery
        )}`;
        console.error(`Fetching from Qiita API (page ${page}): ${apiUrl}`);

        try {
          const resp = await axios.get(apiUrl, {
            headers: {
              Accept: 'application/json',
              'User-Agent': 'QiitaMCPServer/1.0.0',
            },
            timeout: 10000,
          });

          if (Array.isArray(resp.data)) {
            allItems.push(...resp.data);
          }
        } catch (pageError) {
          console.error(`Error fetching page ${page}:`, pageError.message);
          // 1ページでもエラーが起きても続行
          if (page === 1) {
            // 1ページ目がエラーの場合は全体のエラーとして扱う
            throw pageError;
          }
        }
      }

      console.error(`Total items fetched: ${allItems.length}`);

      if (allItems.length === 0) {
        const periodMap = {
          daily: '24時間',
          weekly: '1週間',
          monthly: '1ヶ月',
        };
        return this.createErrorResponse(
          id,
          -32603,
          `${periodMap[period]}以内の人気記事が見つかりませんでした`
        );
      }

      // 指定期間内の記事のみフィルタ（API検索の補完として）
      const recentItems = allItems.filter((item) => {
        const createdAt = new Date(item.created_at);
        return createdAt >= cutoffDate;
      });

      console.error(
        `Found ${recentItems.length} articles in the last ${period}`
      );

      // 重複を除去（同じIDの記事が複数ページに含まれる可能性）
      const uniqueItems = recentItems.filter(
        (item, index, self) => index === self.findIndex((t) => t.id === item.id)
      );

      // いいね数とストック数の合計でソートして上位count件を抽出
      const topItems = uniqueItems
        .sort((a, b) => {
          const scoreA = (a.likes_count || 0) + (a.stocks_count || 0) * 2; // ストックに重み付け
          const scoreB = (b.likes_count || 0) + (b.stocks_count || 0) * 2;
          return scoreB - scoreA;
        })
        .slice(0, count)
        .map((item, idx) => ({
          rank: idx + 1,
          title: item.title,
          url: item.url,
          likes: item.likes_count || 0,
          stocks: item.stocks_count || 0,
          score: (item.likes_count || 0) + (item.stocks_count || 0) * 2,
          created_at: item.created_at,
        }));

      if (topItems.length === 0) {
        const periodMap = {
          daily: '24時間',
          weekly: '1週間',
          monthly: '1ヶ月',
        };
        return this.createErrorResponse(
          id,
          -32603,
          `${periodMap[period]}以内の人気記事が見つかりませんでした`
        );
      }

      // ヘッダーテキストを生成
      const periodMap = { daily: '24時間', weekly: '1週間', monthly: '1ヶ月' };
      const headerText = `📈 ${periodMap[period]}以内の人気記事 TOP${topItems.length}`;

      // レスポンステキスト生成（期間情報と作成日時も含める）
      const resultText = topItems
        .map(
          (it) =>
            `${it.rank}. ${it.title}\n` +
            `   👍 ${it.likes}いいね 📚 ${it.stocks}ストック (スコア: ${it.score})\n` +
            `   📅 ${new Date(it.created_at).toLocaleString('ja-JP')}\n` +
            `   ${it.url}`
        )
        .join('\n\n');

      // JSON-RPCレスポンスとして返却
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: `${headerText}\n\n${resultText}`,
            },
          ],
        },
      };
    } catch (err) {
      console.error('Qiita API error:', err);
      // タイムアウトや認証エラーなどを分岐
      let msg = `APIエラー: ${err.message}`;
      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        msg = 'APIタイムアウトエラーが発生しました';
      } else if (err.response?.status === 401) {
        msg = 'API認証エラーです';
      } else if (err.response?.status === 429) {
        msg = 'APIレート制限に達しました。しばらく待ってから再試行してください';
      }
      return this.createErrorResponse(id, -32603, msg);
    }
  }

  // Gemini APIで要約
  async summarizeArticle(id, { url, title }) {
    try {
      // Qiita記事本文取得
      const itemId = url.split('/').pop();
      const { data } = await axios.get(
        `https://qiita.com/api/v2/items/${itemId}`
      );
      const bodyMd = data.body;

      // 要約プロンプト
      const prompt = `以下のQiita記事を3〜5行で要約してください。\nタイトル: ${
        title || '（タイトルなし）'
      }\n\n${bodyMd}`;

      // モデル取得
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });


      // 要約生成呼び出し（オプション付き）
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text().trim() || '要約取得に失敗しました';

      return {
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: summary }] },
      };
    } catch (err) {
      console.error('Gemini API full error:', err);
      console.error('Response data:', err.response?.data);
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: `要約APIエラー: ${err.message}` },
      };
    }
  }

  createErrorResponse(id, code, message) {
    return { jsonrpc: '2.0', id, error: { code, message } };
  }

  // 不足していたメソッドを追加
  sendErrorResponse(id, code, message) {
    const errorResponse = this.createErrorResponse(id, code, message);
    this.sendResponse(errorResponse);
  }

  sendResponse(response) {
    if (!response.jsonrpc) response.jsonrpc = '2.0';
    if (response.id === undefined) response.id = 'unknown';
    if (!response.error && !response.result)
      response.error = { code: -32603, message: 'Internal error' };
    console.log(JSON.stringify(response));
  }
}

// サーバー起動
new QiitaMCPServer();
console.error('Qiita MCP Server started');
