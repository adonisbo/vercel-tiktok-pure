// api/handler.js
import { fetchTikTokUserProfile } from './services/jinaService.js';
import { extractUserStats } from './utils/parser.js';
// import { createApiKeyIdentifier } from './utils/helpers.js'; // 暂时不用，因为我们还没做历史记录

export default async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // 我们只处理POST和OPTIONS
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      // Vercel Serverless Functions 的 req.body 会自动解析JSON
      const { tiktokUserId, jinaApiKey } = req.body; 
      console.log('[API Handler] Received POST request with body:', req.body);

      if (!tiktokUserId || !jinaApiKey) {
        console.log('[API Handler] Missing tiktokUserId or jinaApiKey');
        return res.status(400).json({ success: false, error: 'TikTok用户ID和Jina AI API Key是必填项' });
      }

      console.log(`[API Handler] Calling Jina AI service for ${tiktokUserId} with key ending in ...${jinaApiKey.slice(-4)}`);
      
      const markdownContentFromJina = await fetchTikTokUserProfile(tiktokUserId, jinaApiKey);
      console.log('[API Handler] Markdown content received from Jina:', markdownContentFromJina ? markdownContentFromJina.substring(0, 200) + '...' : 'No markdown content from Jina');
      
      const stats = extractUserStats(markdownContentFromJina);
      
      console.log('[API Handler] Stats processed/parsed:', stats);

      return res.status(200).json({ success: true, data: stats });

    } catch (error) {
      console.error('[API Handler] Error processing POST request:', error.message);
      console.error(error.stack); 
      // 确保返回的错误也是JSON格式
      return res.status(500).json({ success: false, error: error.message || '服务器内部错误处理请求失败' });
    }
  } else {
    console.log(`[API Handler] Method Not Allowed: ${req.method}`);
    res.setHeader('Allow', ['POST', 'OPTIONS']); // 明确告知允许的方法
    return res.status(405).json({ success: false, error: `方法 ${req.method} 不被允许` });
  }
}