// api/history/get.js
import { getQueryHistoryFromSupabase } from '../services/supabaseService.js'; // 注意路径调整
import { createApiKeyIdentifier } from '../utils/helpers.js';   // 注意路径调整

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // 通常获取历史也用POST以传递body中的API Key
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') { // 改为POST以接收jinaApiKey
        try {
            const { jinaApiKey } = req.body; // 从请求体中获取jinaApiKey

            console.log('[API History Get] Received request with body:', req.body);

            if (!jinaApiKey) {
                console.log('[API History Get] Missing jinaApiKey parameter.');
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_JINA_API_KEY',
                        message: '获取云端历史记录需要提供Jina AI API Key。'
                    }
                });
            }

            const jinaApiKeyIdentifier = createApiKeyIdentifier(jinaApiKey);

            const historyItems = await getQueryHistoryFromSupabase(jinaApiKeyIdentifier);

            if (historyItems !== null) { // getQueryHistoryFromSupabase 在出错时返回 null
                console.log('[API History Get] History items fetched successfully:', historyItems);
                return res.status(200).json({ success: true, data: historyItems });
            } else {
                throw new Error('Supabase服务未能成功获取历史记录。');
            }

        } catch (error) {
            console.error('[API History Get] Error fetching history:', error.message);
            console.error(error.stack);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'SUPABASE_GET_ERROR',
                    message: error.message || '获取云端历史记录时发生服务器内部错误。'
                }
            });
        }
    } else {
        console.log(`[API History Get] Method Not Allowed: ${req.method}`);
        res.setHeader('Allow', ['POST', 'OPTIONS']);
        return res.status(405).json({
            success: false,
            error: {
                code: 'METHOD_NOT_ALLOWED',
                message: `方法 ${req.method} 不被允许，请使用POST请求。`
            }
        });
    }
}