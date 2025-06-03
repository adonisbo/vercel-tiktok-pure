// api/handler.js
import { fetchTikTokUserProfile } from './services/jinaService.js';
import { extractUserStats } from './utils/parser.js';
// import { createApiKeyIdentifier } from './utils/helpers.js'; // 暂时不用

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { tiktokUserId, jinaApiKey } = req.body; 
    console.log('[API Handler] Received POST request with body:', req.body);

    // --- MODIFICATION START: Structured error for missing parameters ---
    if (!tiktokUserId || !jinaApiKey) {
      console.log('[API Handler] Missing tiktokUserId or jinaApiKey');
      return res.status(400).json({ 
        success: false, 
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'TikTok用户ID和Jina AI API Key是必填项' 
        }
      });
    }
    // --- MODIFICATION END ---

    try {
      console.log(`[API Handler] Calling Jina AI service for ${tiktokUserId} with key ending in ...${jinaApiKey.slice(-4)}`);
      
      const markdownContentFromJina = await fetchTikTokUserProfile(tiktokUserId, jinaApiKey);
      console.log('[API Handler] Markdown content received from Jina:', markdownContentFromJina ? markdownContentFromJina.substring(0, 200) + '...' : 'No markdown content from Jina');
      
      // --- MODIFICATION START: Check for empty markdown from Jina ---
      if (!markdownContentFromJina) {
        console.warn('[API Handler] Jina AI returned empty or null markdown content.');
        return res.status(502).json({ 
            success: false,
            error: {
                code: 'JINA_EMPTY_RESPONSE',
                message: '无法从目标用户页面获取有效内容，请稍后再试或检查用户ID是否正确。'
            }
        });
      }
      // --- MODIFICATION END ---
      
      const stats = extractUserStats(markdownContentFromJina);
      console.log('[API Handler] Stats processed/parsed:', stats);

      // --- MODIFICATION START: Check for parsing failure ---
      if (stats.followingCount === '-' && stats.followersCount === '-' && stats.likesCount === '-') {
        console.warn('[API Handler] Failed to parse key stats from markdown. Markdown might have an unexpected format or be incomplete.');
        return res.status(200).json({ 
            success: false, 
            error: { 
                code: 'PARSING_FAILED',
                message: '成功获取页面内容，但未能解析出关注、粉丝或获赞数据。页面结构可能已更改或内容不完整。'
            },
            data: stats 
        });
      }
      // --- MODIFICATION END ---

      return res.status(200).json({ success: true, data: stats });

    } catch (error) {
      console.error('[API Handler] Error processing POST request:', error.message);
      console.error(error.stack); 
      
      // --- MODIFICATION START: Structured error in catch block ---
      let errorCode = 'INTERNAL_SERVER_ERROR';
      let errorMessage = error.message || '服务器内部错误处理请求失败';

      if (error.message.includes('Jina API 错误: 401')) {
        errorCode = 'JINA_UNAUTHORIZED';
      } else if (error.message.includes('Jina API 错误: 403')) {
        errorCode = 'JINA_FORBIDDEN';
      } else if (error.message.includes('Jina API 错误: 429')) {
        errorCode = 'JINA_RATE_LIMITED';
      } else if (error.message.includes('连接超时')) {
        errorCode = 'JINA_TIMEOUT';
      } else if (error.message.includes('Markdown内容为空或无效')) { 
        errorCode = 'JINA_INVALID_RESPONSE_CONTENT';
      } else if (error.message.includes('无法从目标用户页面获取有效内容')) { // Corresponds to JINA_EMPTY_RESPONSE
        errorCode = 'JINA_EMPTY_RESPONSE';
      }


      return res.status(500).json({ 
        success: false, 
        error: {
          code: errorCode,
          message: errorMessage
        }
      });
      // --- MODIFICATION END ---
    }
  } else {
    console.log(`[API Handler] Method Not Allowed: ${req.method}`);
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    // --- MODIFICATION START: Structured error for method not allowed ---
    return res.status(405).json({ 
      success: false, 
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `方法 ${req.method} 不被允许` 
      }
    });
    // --- MODIFICATION END ---
  }
}