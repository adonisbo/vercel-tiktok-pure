// api/hello.js
export default function handler(req, res) {
  // 设置CORS头部，允许所有来源（在简单测试中可以，生产环境应更严格）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  res.status(200).json({ message: '你好，来自 /api/hello 的问候!' });
}