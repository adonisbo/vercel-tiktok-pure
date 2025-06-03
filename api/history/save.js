// api/history/save.js
import { saveQueryToSupabase } from '../services/supabaseService.js'; // 注意路径调整
import { createApiKeyIdentifier } from '../utils/helpers.js';   // 注意路径调整

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        try {
            const { 
                jinaApiKey, // 需要Jina API Key来生成标识符
                tiktokUserId, 
                followingCount, 
                followersCount, 
                likesCount,
                // id 和 queriedAt 可以由后端生成或直接使用前端传来的
                // 我们在 supabaseService 中是后端生成的 queriedAt
            } = req.body;

            console.log('[API History Save] Received request with body:', req.body);

            if (!jinaApiKey || !tiktokUserId || followingCount === undefined || followersCount === undefined || likesCount === undefined) {
                console.log('[API History Save] Missing required parameters.');
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_HISTORY_SAVE_PARAMETERS',
                        message: '保存历史记录所需参数不完整 (需要jinaApiKey, tiktokUserId, followingCount, followersCount, likesCount)。'
                    }
                });
            }

            const jinaApiKeyIdentifier = createApiKeyIdentifier(jinaApiKey);

            const savedItem = await saveQueryToSupabase(
                jinaApiKeyIdentifier,
                tiktokUserId,
                String(followingCount), // 确保是字符串
                String(followersCount),
                String(likesCount)
            );

            if (savedItem) {
                console.log('[API History Save] History item saved successfully:', savedItem);
                return res.status(201).json({ success: true, data: savedItem }); // 201 Created
            } else {
                throw new Error('Supabase服务未能成功保存历史记录。');
            }

        } catch (error) {
            console.error('[API History Save] Error saving history:', error.message);
            console.error(error.stack);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'SUPABASE_SAVE_ERROR',
                    message: error.message || '保存历史记录到云端时发生服务器内部错误。'
                }
            });
        }
    } else {
        console.log(`[API History Save] Method Not Allowed: ${req.method}`);
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