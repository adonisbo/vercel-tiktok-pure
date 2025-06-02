// api/utils/helpers.js
// import crypto from 'crypto'; // Node.js 内置模块, 如果需要使用哈希则取消注释

export const createApiKeyIdentifier = (apiKey) => {
  // 简单标识符：取Key的前4位和后4位
  if (typeof apiKey === 'string' && apiKey.length > 8) {
    return `${apiKey.substring(0, 4)}...${apiKey.slice(-4)}`;
  }
  // 如果Key太短或不是字符串，返回一个固定标识或处理错误
  return 'invalid_or_short_api_key';

  // 如果确实需要哈希：
  // const hash = crypto.createHash('sha256');
  // hash.update(apiKey);
  // return hash.digest('hex').substring(0, 16); // 取哈希值的前16位
};