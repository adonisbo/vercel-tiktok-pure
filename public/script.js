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
    const MAX_HISTORY_ITEMS = 20; // 最多保存20条历史记录

    // --- 检查所有期望的元素是否存在 ---
    if (!queryForm || !tiktokUserIdInput || !jinaApiKeyInput || !queryButton || 
        !loadingIndicator || !errorMessageDiv || !resultsSection || !userProfileIdDiv ||
        !followingCountSpan || !followersCountSpan || !likesCountSpan ||
        !localHistoryList || !clearLocalHistoryButton) { // 添加了历史相关元素的检查
        console.error('[Script.js] 一个或多个必要的HTML元素未在DOM中找到。请检查index.html的ID是否正确。');
        // ... (之前的页面错误提示逻辑不变) ...
        return; 
    } else {
        console.log('[Script.js] All essential HTML elements found.');
    }

    // --- 历史记录函数 ---
    function getLocalHistory() {
        const historyJson = localStorage.getItem(LOCAL_STORAGE_KEY);
        return historyJson ? JSON.parse(historyJson) : [];
    }

    function saveToLocalHistory(item) {
        console.log('[Script.js] Attempting to save to local history:', item);
        let history = getLocalHistory();
        // 避免重复记录完全相同的查询 (基于用户ID和时间戳过于接近来判断可能不准确，先简单地不查重或只基于ID)
        // 为了简单，我们先直接添加，新的在最前面
        history.unshift(item); 
        if (history.length > MAX_HISTORY_ITEMS) {
            history = history.slice(0, MAX_HISTORY_ITEMS); // 只保留最新的N条
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
        console.log('[Script.js] Saved to local history. Current history:', history);
        renderLocalHistory(); // 保存后立即重新渲染列表
    }

    function renderLocalHistory() {
        console.log('[Script.js] Rendering local history...');
        const history = getLocalHistory();
        localHistoryList.innerHTML = ''; // 清空现有列表

        if (history.length === 0) {
            const li = document.createElement('li');
            li.textContent = '暂无本地历史记录';
            localHistoryList.appendChild(li);
            clearLocalHistoryButton.style.display = 'none';
        } else {
            history.forEach(item => {
                const li = document.createElement('li');
                // 创建一个更易读的历史条目显示格式
                li.innerHTML = `
                    <strong>@${item.tiktokUserId}</strong> (查询于: ${new Date(item.queriedAt).toLocaleString()})<br>
                    关注: ${item.followingCount}, 粉丝: ${item.followersCount}, 获赞: ${item.likesCount}
                `;
                // 点击历史条目可以重新填充查询框 (可选功能)
                li.addEventListener('click', () => {
                    tiktokUserIdInput.value = item.tiktokUserId;
                    // jinaApiKeyInput.value = ''; // 通常不重新填充API Key
                    // queryForm.dispatchEvent(new Event('submit')); // 自动提交查询
                });
                localHistoryList.appendChild(li);
            });
            clearLocalHistoryButton.style.display = 'block';
        }
        console.log('[Script.js] Local history rendered.');
    }

    clearLocalHistoryButton.addEventListener('click', () => {
        console.log('[Script.js] Clear local history button clicked.');
        if (confirm('确定要清空所有本地查询历史吗？')) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            renderLocalHistory();
            console.log('[Script.js] Local history cleared.');
        }
    });

    // --- 表单提交事件监听器 ---
    queryForm.addEventListener('submit', async (event) => {
        // ... (之前的表单提交逻辑，从 console.log 到 try...catch...finally 块之前的部分保持不变) ...
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
                throw new Error(`服务器返回的响应不是有效的JSON格式。响应内容: ${responseText.substring(0,100)}...`);
            }
            
            console.log('[Script.js] Parsed JSON result:', result);

            if (response.ok && result.success) {
                console.log('[Script.js] API call successful, displaying results.');
                displayResults(tiktokUserId, result.data);
                
                // --- 新增：保存到本地历史记录 ---
                const historyItem = {
                    id: `${Date.now()}-${tiktokUserId}`, // 简单唯一ID
                    tiktokUserId,
                    followingCount: result.data.followingCount,
                    followersCount: result.data.followersCount,
                    likesCount: result.data.likesCount,
                    queriedAt: new Date().toISOString()
                };
                saveToLocalHistory(historyItem);
                // --- 新增结束 ---

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

    // --- UI更新函数 (displayResults, displayError) ---
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
        if (errorMessageDiv) {
            errorMessageDiv.textContent = message;
            errorMessageDiv.style.display = 'block';
        }
        if (resultsSection) {
            resultsSection.style.display = 'none'; 
        }
    }

    // --- 页面加载时初始化 ---
    renderLocalHistory(); // 页面加载时渲染一次本地历史记录
    console.log('[Script.js] Initial local history rendered on page load.');

});