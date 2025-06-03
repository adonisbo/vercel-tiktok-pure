// public/script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Script.js] DOMContentLoaded - Script loaded and DOM ready.');

    // DOM Elements
    const queryForm = document.getElementById('tiktok-query-form');
    const tiktokUserIdInput = document.getElementById('tiktokUserId');
    const jinaApiKeyInput = document.getElementById('jinaApiKey');
    const queryButton = document.getElementById('queryButton');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessageDiv = document.getElementById('error-message');
    const resultsSection = document.getElementById('results-section');
    const userProfileIdDiv = document.getElementById('user-profile-id');
    const followingCountSpan = document.getElementById('followingCount');
    const followersCountSpan = document.getElementById('followersCount');
    const likesCountSpan = document.getElementById('likesCount');

    // History Elements
    const localHistoryList = document.getElementById('local-history-list');
    const clearLocalHistoryButton = document.getElementById('clearLocalHistoryButton');

    const LOCAL_STORAGE_KEY = 'tiktokQueryHistoryLocal';
    const MAX_HISTORY_ITEMS = 20;

    // --- 检查所有期望的元素是否存在 ---
    if (!queryForm || !tiktokUserIdInput || !jinaApiKeyInput || !queryButton || 
        !loadingIndicator || !errorMessageDiv || !resultsSection || !userProfileIdDiv ||
        !followingCountSpan || !followersCountSpan || !likesCountSpan ||
        !localHistoryList || !clearLocalHistoryButton) {
        console.error('[Script.js] 一个或多个必要的HTML元素未在DOM中找到。请检查index.html的ID是否正确。');
        const body = document.querySelector('body');
        if (body) {
            const errorMsgElement = document.createElement('p');
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

    // --- 历史记录函数 ---
    function getLocalHistory() { /* ... (保持您原有的 getLocalHistory 函数不变) ... */ 
        const historyJson = localStorage.getItem(LOCAL_STORAGE_KEY);
        return historyJson ? JSON.parse(historyJson) : [];
    }

    function saveToLocalHistory(item) { /* ... (保持您原有的 saveToLocalHistory 函数不变) ... */ 
        console.log('[Script.js] Attempting to save to local history:', item);
        let history = getLocalHistory();
        history.unshift(item); 
        if (history.length > MAX_HISTORY_ITEMS) {
            history = history.slice(0, MAX_HISTORY_ITEMS);
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
        console.log('[Script.js] Saved to local history. Current history:', history);
        renderLocalHistory();
    }

    function renderLocalHistory() { /* ... (保持您原有的 renderLocalHistory 函数不变) ... */ 
        console.log('[Script.js] Rendering local history...');
        const history = getLocalHistory();
        localHistoryList.innerHTML = ''; 

        if (history.length === 0) {
            const li = document.createElement('li');
            li.textContent = '暂无本地历史记录';
            localHistoryList.appendChild(li);
            clearLocalHistoryButton.style.display = 'none';
        } else {
            history.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>@${item.tiktokUserId}</strong> (查询于: ${new Date(item.queriedAt).toLocaleString()})<br>
                    关注: ${item.followingCount}, 粉丝: ${item.followersCount}, 获赞: ${item.likesCount}
                `;
                li.addEventListener('click', () => {
                    tiktokUserIdInput.value = item.tiktokUserId;
                });
                localHistoryList.appendChild(li);
            });
            clearLocalHistoryButton.style.display = 'block';
        }
        console.log('[Script.js] Local history rendered.');
    }

    clearLocalHistoryButton.addEventListener('click', () => { /* ... (保持您原有的 clearLocalHistoryButton 事件监听器不变) ... */ 
        console.log('[Script.js] Clear local history button clicked.');
        if (confirm('确定要清空所有本地查询历史吗？')) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            renderLocalHistory();
            console.log('[Script.js] Local history cleared.');
        }
    });

    // --- 表单提交事件监听器 ---
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
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({ tiktokUserId, jinaApiKey }),
            });
            console.log('[Script.js] Fetch response status:', response.status);
            console.log('[Script.js] Fetch response ok:', response.ok);
            
            const responseText = await response.text();
            console.log('[Script.js] Raw response text:', responseText);

            let result;
            try {
                result = JSON.parse(responseText); 
            } catch (parseError) {
                console.error('[Script.js] Failed to parse response as JSON:', parseError);
                console.error('[Script.js] Response was not valid JSON. Raw text was:', responseText);
                // --- MODIFICATION START: 抛出更具体的错误信息 ---
                throw new Error(`服务器响应格式错误，无法解析。`); 
                // --- MODIFICATION END ---
            }
            
            console.log('[Script.js] Parsed JSON result:', result);

            if (response.ok && result.success) {
                console.log('[Script.js] API call successful, displaying results.');
                displayResults(tiktokUserId, result.data);
                
                const historyItem = {
                    id: `${Date.now()}-${tiktokUserId}`, 
                    tiktokUserId,
                    followingCount: result.data.followingCount,
                    followersCount: result.data.followersCount,
                    likesCount: result.data.likesCount,
                    queriedAt: new Date().toISOString()
                };
                saveToLocalHistory(historyItem);

            } else {
                // --- MODIFICATION START: 从结构化错误中提取 message ---
                const errorMessageFromServer = result.error?.message || result.error || `请求失败，状态码: ${response.status}`;
                console.error('[Script.js] API call failed or result.success is false. Server error:', errorMessageFromServer);
                throw new Error(errorMessageFromServer);
                // --- MODIFICATION END ---
            }
        } catch (error) {
            // error.message 现在应该是后端返回的错误对象的 message 字符串，或者是我们自己抛出的字符串
            console.error('[Script.js] Catch block: Query error:', error.message); 
            displayError(`查询出错: ${error.message}`); // error.message 应该是可读的了
        } finally {
            loadingIndicator.style.display = 'none';
            queryButton.disabled = false;
            queryButton.textContent = '查询';
            console.log('[Script.js] UI restored from loading state.');
        }
    });

    // --- UI更新函数 (displayResults, displayError) ---
    function displayResults(userId, stats) { /* ... (保持您原有的 displayResults 函数不变) ... */ 
        console.log('[Script.js] displayResults called with:', userId, stats);
        resultsSection.style.display = 'block';
        userProfileIdDiv.textContent = `@${userId} 的用户信息`;
        followingCountSpan.textContent = stats.followingCount || '-';
        followersCountSpan.textContent = stats.followersCount || '-';
        likesCountSpan.textContent = stats.likesCount || '-';
    }

    function displayError(message) { /* ... (保持您原有的 displayError 函数不变) ... */ 
        console.log('[Script.js] displayError called with message:', message);
        if (errorMessageDiv) {
            errorMessageDiv.textContent = message;
            errorMessageDiv.style.display = 'block';
        }
        if (resultsSection) {
            resultsSection.style.display = 'none'; 
        }
    }

    // --- 页面加载时初始化 ---
    renderLocalHistory(); 
    console.log('[Script.js] Initial local history rendered on page load.');

});