// api/services/supabaseService.js
import { createClient } from '@supabase/supabase-js';

// Supabase 连接信息将从环境变量中读取
// 这些环境变量需要在Vercel平台上手动配置
// 在本地 vercel dev 环境中，它们可以来自项目根目录下的 .env 文件
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // 使用 Service Role Key 以便在后端有完全权限

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Service Key is missing. Please check environment variables.');
    // 在实际应用中，这里可能应该抛出错误或导致服务无法正常初始化
    // 但为了模块能被导入，我们暂时只打印错误
}

// 只有在URL和Key都存在时才创建客户端实例
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const HISTORY_TABLE_NAME = 'query_history'; // 我们将在Supabase中创建的表名

/**
 * 保存查询历史到Supabase
 * @param {string} jinaApiKeyIdentifier - Jina API Key的标识符 (例如哈希值或部分字符串)
 * @param {string} tiktokUserId - TikTok用户ID
 * @param {string} followingCount - 关注数
 * @param {string} followersCount - 粉丝数
 * @param {string} likesCount - 获赞数
 * @returns {Promise<object|null>} - 保存的记录或在出错时返回null
 */
export const saveQueryToSupabase = async (jinaApiKeyIdentifier, tiktokUserId, followingCount, followersCount, likesCount) => {
    if (!supabase) {
        console.error('[SupabaseService] Supabase client is not initialized. Cannot save history.');
        return null;
    }
    console.log(`[SupabaseService] Attempting to save history for ${tiktokUserId} under key ID: ${jinaApiKeyIdentifier}`);
    try {
        const { data, error } = await supabase
            .from(HISTORY_TABLE_NAME)
            .insert([
                { 
                    jina_api_key_identifier: jinaApiKeyIdentifier,
                    tiktok_user_id: tiktokUserId,
                    following_count: followingCount,
                    followers_count: followersCount,
                    likes_count: likesCount,
                    queried_at: new Date().toISOString() // Supabase会自动处理时间戳，但我们也可以手动插入
                }
            ])
            .select(); // .select() 会返回插入的记录

        if (error) {
            console.error('[SupabaseService] Error saving history to Supabase:', error);
            throw error; // 向上抛出错误，让调用者处理
        }
        console.log('[SupabaseService] History saved successfully to Supabase:', data);
        return data ? data[0] : null; // insert().select() 返回一个数组
    } catch (err) {
        console.error('[SupabaseService] Exception when saving history:', err.message);
        return null; // 或向上抛出更通用的错误
    }
};

/**
 * 从Supabase获取指定Jina API Key标识符的查询历史
 * @param {string} jinaApiKeyIdentifier - Jina API Key的标识符
 * @returns {Promise<Array<object>|null>} - 查询历史记录数组或在出错时返回null
 */
export const getQueryHistoryFromSupabase = async (jinaApiKeyIdentifier) => {
    if (!supabase) {
        console.error('[SupabaseService] Supabase client is not initialized. Cannot get history.');
        return null;
    }
    console.log(`[SupabaseService] Attempting to fetch history for key ID: ${jinaApiKeyIdentifier}`);
    try {
        const { data, error } = await supabase
            .from(HISTORY_TABLE_NAME)
            .select('*')
            .eq('jina_api_key_identifier', jinaApiKeyIdentifier)
            .order('queried_at', { ascending: false }) // 按查询时间降序排列
            .limit(20); // 最多获取最近20条

        if (error) {
            console.error('[SupabaseService] Error fetching history from Supabase:', error);
            throw error;
        }
        console.log('[SupabaseService] History fetched successfully from Supabase:', data);
        return data;
    } catch (err) {
        console.error('[SupabaseService] Exception when fetching history:', err.message);
        return null;
    }
};