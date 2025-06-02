// api/utils/parser.js
export const extractUserStats = (markdown) => {
  try {
    console.log('[parser.js] Parsing markdown:', markdown ? markdown.substring(0, 500) + '...' : 'Markdown is null/undefined'); 
    
    if (!markdown || typeof markdown !== 'string') {
        console.warn('[parser.js] Markdown content is invalid or empty. Returning default stats.');
        return { followingCount: '-', followersCount: '-', likesCount: '-' };
    }

    let followingCount = '-'; 
    let followersCount = '-'; 
    let likesCount = '-';     
    
    const followingPattern1 = /([\d.,]+\s*[KkMmBbTt]?)\s*[*\s]*(?:Following|关注)/i;
    const followingPattern2 = /(?:Following|关注)[*\s]*([\d.,]+\s*[KkMmBbTt]?)/i;
    let followingMatch = markdown.match(followingPattern1) || markdown.match(followingPattern2);
    if (followingMatch && followingMatch[1]) {
      followingCount = followingMatch[1].trim().replace(/,/g, '');
    }
    
    const followersPattern1 = /([\d.,]+\s*[KkMmBbTt]?)\s*[*\s]*(?:Followers|粉丝)/i;
    const followersPattern2 = /(?:Followers|粉丝)[*\s]*([\d.,]+\s*[KkMmBbTt]?)/i;
    let followersMatch = markdown.match(followersPattern1) || markdown.match(followersPattern2);
    if (followersMatch && followersMatch[1]) {
      followersCount = followersMatch[1].trim().replace(/,/g, '');
    }
    
    const likesPattern1 = /([\d.,]+\s*[KkMmBbTt]?)\s*[*\s]*(?:Likes|获赞|喜欢)/i;
    const likesPattern2 = /(?:Likes|获赞|喜欢)[*\s]*([\d.,]+\s*[KkMmBbTt]?)/i;
    let likesMatch = markdown.match(likesPattern1) || markdown.match(likesPattern2);
    if (likesMatch && likesMatch[1]) {
      likesCount = likesMatch[1].trim().replace(/,/g, '');
    }
    
    const extractedStats = {
      followingCount,
      followersCount,
      likesCount
    };

    console.log('[parser.js] Extracted stats with new regex:', extractedStats);
    return extractedStats;

  } catch (error) {
    console.error('[parser.js] Error parsing markdown:', error);
    return { followingCount: '-', followersCount: '-', likesCount: '-' };
  }
};