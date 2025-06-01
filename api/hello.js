// api/hello.js
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  console.log(`[API hello.js] Request to ${req.url}`);
  res.status(200).json({ message: '你好，来自 /api/hello 的问候!' });
}