// public/script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Script.js] DOMContentLoaded - Script loaded and DOM ready.');

    const queryForm = document.getElementById('tiktok-query-form');
    const tiktokUserIdInput = document.getElementById('tiktokUserId');
    const jinaApiKeyInput = document.getElementById('jinaApiKey');
    const queryButton = document.getElementById('queryButton');
    
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessageDiv = document.getElementById('error-message'); // 现在已定义
    
    const resultsSection = document.getElementById('results-section'); // 现在已定义
    const userProfileIdDiv = document.getElementById('user-profile-id');
    const followingCountSpan = document.getElementById('followingCount');
    const followersCountSpan = document.getElementById('followersCount');
    const likesCountSpan = document.getElementById('likesCount');

    // --- 检查所有期望的元素是否存在 ---
    if (!queryForm) console.error('[Script.js] queryForm not found!');
    if (!tiktokUserIdInput) console.error('[Script.js] tiktokUserIdInput not found!');
    if (!jinaApiKeyInput) console.error('[Script.js] jinaApiKeyInput not found!');
    if (!queryButton) console.error('[Script.js] queryButton not found!');
    if (!loadingIndicator) console.error('[Script.js] loadingIndicator not found!');
    if (!errorMessageDiv) console.error('[Script.js] errorMessageDiv not found!');
    if (!resultsSection) console.error('[Script.js] resultsSection not found!');
    if (!userProfileIdDiv) console.error('[Script.js] userProfileIdDiv not found!');
    if (!followingCountSpan) console.error('[Script.js] followingCountSpan not found!');
    if (!followersCountSpan) console.error('[Script.js] followersCountSpan not found!');
    if (!likesCountSpan) console.error('[Script.js] likesCountSpan not found!');


    if (!queryForm || !tiktokUserIdInput || !jinaApiKeyInput || !queryButton || 
        !loadingIndicator || !errorMessageDiv || !resultsSection || !userProfileIdDiv ||
        !followingCountSpan || !followersCountSpan || !likesCountSpan) {
        console.error('[Script.js] 一个或多个必要的HTML元素未在DOM中找到。请检查index.html的ID是否正确。');
        const body = document.querySelector('body');
        if (body) {
            const errorMsgElement = document.createElement('p'); // 使用不同的变量名避免冲突
            errorMsgElement.textContent = '页面初始化错误，部分元素丢失，请联系管理员。';
            errorMsgElement.style.color = 'red';
            errorMsgElement.style.textAlign = 'center';
            errorMsgElement.style.padding = '20px';
            body.prepend(errorMsgElement);
        }
        return; 
    } else {
        console.log('[Script.js] All essential HTML elements found.');
    }

    queryForm.addEventListener('submit', async (event) => {
        console.log('[Script.js] Query form submitted.');
        event.preventDefault(); 

        const tiktokUserId = tiktokUserIdInput.value.trim();
        const jinaApiKey = jinaApiKeyInput.value.trim();
        console.log('[Script.js] TikTok User ID:', tiktokUserId);
        console.log('[Script.js] Jina API Key (length):', jinaApiKey.length);

        if (!tiktokUserId || !jinaApiKey) {
            console.log('[Script.js] Validation failed: tiktokUserId or jinaApiKey is empty.');
            displayError('TikTok用户ID和Jina AI API Key均不能为空！');
            return;
        }

        loadingIndicator.style.display = 'block';
        errorMessageDiv.style.display = 'none';
        resultsSection.style.display = 'none';
        queryButton.disabled = true;
        queryButton.textContent = '查询中...';
        console.log('[Script.js] UI updated to loading state. Attempting fetch...');

        try {
            const response = await fetch('/api/handler', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tiktokUserId, jinaApiKey }),
            });
            console.log('[Script.js] Fetch response status:', response.status);
            console.log('[Script.js] Fetch response ok:', response.ok);

            // 尝试读取响应体，即使它不是JSON，以帮助调试
            const responseText = await response.text();
            console.log('[Script.js] Raw response text:', responseText);

            let result;
            try {
                result = JSON.parse(responseText); // 尝试解析为JSON
            } catch (parseError) {
                console.error('[Script.js] Failed to parse response as JSON:', parseError);
                console.error('[Script.js] Response was not valid JSON. Raw text was:', responseText);
                throw new Error(`服务器返回的响应不是有效的JSON格式。响应内容: ${responseText.substring(0,100)}...`);
            }
            
            console.log('[Script.js] Parsed JSON result:', result);

            if (response.ok && result.success) {
                console.log('[Script.js] API call successful, displaying results.');
                displayResults(tiktokUserId, result.data);
            } else {
                console.error('[Script.js] API call failed or result.success is false. Result error:', result.error || '未知错误，但响应状态非OK或success非true');
                throw new Error(result.error || `请求失败，状态码: ${response.status}`);
            }
        } catch (error) {
            console.error('[Script.js] Catch block: Query error:', error);
            displayError(`查询出错: ${error.message}`);
        } finally {
            loadingIndicator.style.display = 'none';
            queryButton.disabled = false;
            queryButton.textContent = '查询';
            console.log('[Script.js] UI restored from loading state.');
        }
    });

    function displayResults(userId, stats) {
        console.log('[Script.js] displayResults called with:', userId, stats);
        resultsSection.style.display = 'block';
        userProfileIdDiv.textContent = `@${userId} 的用户信息`;
        followingCountSpan.textContent = stats.followingCount || '-';
        followersCountSpan.textContent = stats.followersCount || '-';
        likesCountSpan.textContent = stats.likesCount || '-';
    }

    function displayError(message) {
        console.log('[Script.js] displayError called with message:', message);
        // 确保 errorMessageDiv 和 resultsSection 在这个作用域内是可访问的
        // （它们是在外部定义的，所以这里应该没问题）
        if (errorMessageDiv) {
            errorMessageDiv.textContent = message;
            errorMessageDiv.style.display = 'block';
        }
        if (resultsSection) {
            resultsSection.style.display = 'none'; 
        }
    }
});