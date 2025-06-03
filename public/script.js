// public/script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Script.js] DOMContentLoaded - Script loaded and DOM ready.');

    // DOM Elements - Query & Results
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

    // DOM Elements - History Options & Local History
    const storageOptionRadios = document.querySelectorAll('input[name="storageOption"]'); 
    const localHistorySection = document.getElementById('local-history-section'); 
    const localHistoryList = document.getElementById('local-history-list');
    const clearLocalHistoryButton = document.getElementById('clearLocalHistoryButton');

    // DOM Elements - Cloud History
    const cloudHistorySection = document.getElementById('cloud-history-section'); 
    const loadCloudHistoryButton = document.getElementById('loadCloudHistoryButton');
    const cloudHistoryList = document.getElementById('cloud-history-list');

    const LOCAL_STORAGE_KEY = 'tiktokQueryHistoryLocal';
    const MAX_HISTORY_ITEMS = 20;

    // --- 检查所有期望的元素是否存在 ---
    let allElementsFound = true;
    const elementsToCheck = {
        queryForm, tiktokUserIdInput, jinaApiKeyInput, queryButton, loadingIndicator,
        errorMessageDiv, resultsSection, userProfileIdDiv, followingCountSpan,
        followersCountSpan, likesCountSpan, localHistorySection, localHistoryList, 
        clearLocalHistoryButton, cloudHistorySection, loadCloudHistoryButton, cloudHistoryList
    };
    for (const key in elementsToCheck) {
        if (!elementsToCheck[key]) {
            console.error(`[Script.js] HTML Element not found: ${key}`);
            allElementsFound = false;
        }
    }
    if (storageOptionRadios.length !== 2) {
        console.error('[Script.js] storageOptionRadios not found correctly (expected 2).');
        allElementsFound = false;
    }

    if (!allElementsFound) {
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

    // --- Helper function to get selected storage option ---
    function getSelectedStorageOption() {
        for (const radio of storageOptionRadios) {
            if (radio.checked) {
                return radio.value; // 'local' or 'cloud'
            }
        }
        return 'local'; // Default
    }
    
    // --- 控制历史记录区域的显示 ---
    function toggleHistorySections() {
        const selectedOption = getSelectedStorageOption();
        console.log('[Script.js] Storage option changed to:', selectedOption);
        if (selectedOption === 'local') {
            localHistorySection.style.display = 'block';
            cloudHistorySection.style.display = 'none';
            renderLocalHistory(); 
        } else if (selectedOption === 'cloud') {
            localHistorySection.style.display = 'none';
            cloudHistorySection.style.display = 'block';
            // 当切换到云端时，可以不清空列表，等待用户点击加载
            // 或者如果希望每次切换都清空并提示，则调用 renderCloudHistory([])
            if (cloudHistoryList.children.length === 0 || 
                (cloudHistoryList.children.length === 1 && cloudHistoryList.firstElementChild.textContent.includes('暂无'))) {
                renderCloudHistory([]); // 如果是空的或者只有提示，则渲染提示
            }
        }
    }

    storageOptionRadios.forEach(radio => {
        radio.addEventListener('change', toggleHistorySections);
    });

    // --- 本地历史记录函数 ---
    function getLocalHistory() {
        const historyJson = localStorage.getItem(LOCAL_STORAGE_KEY);
        return historyJson ? JSON.parse(historyJson) : [];
    }

    function saveToLocalHistory(item) {
        console.log('[Script.js] Attempting to save to local history:', item);
        let history = getLocalHistory();
        history.unshift(item); 
        if (history.length > MAX_HISTORY_ITEMS) {
            history = history.slice(0, MAX_HISTORY_ITEMS);
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
        console.log('[Script.js] Saved to local history. Current history:', history);
        if (getSelectedStorageOption() === 'local') {
            renderLocalHistory();
        }
    }

    function renderLocalHistory() {
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

    clearLocalHistoryButton.addEventListener('click', () => {
        console.log('[Script.js] Clear local history button clicked.');
        if (confirm('确定要清空所有本地查询历史吗？')) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            renderLocalHistory();
            console.log('[Script.js] Local history cleared.');
        }
    });

    // --- 云端历史记录函数 ---
    function renderCloudHistory(historyItems = []) {
        console.log('[Script.js] Rendering cloud history with items:', historyItems);
        cloudHistoryList.innerHTML = ''; 

        if (historyItems.length === 0) {
            const li = document.createElement('li');
            li.textContent = '暂无云端历史记录或未加载。请输入Jina AI API Key并点击上方“加载云端历史”按钮。';
            cloudHistoryList.appendChild(li);
        } else {
            historyItems.forEach(item => {
                const li = document.createElement('li');
                // 使用后端返回的下划线命名的字段
                li.innerHTML = `
                    <strong>@${item.tiktok_user_id}</strong> 
                    (查询于: ${new Date(item.queried_at).toLocaleString()})<br>
                    关注: ${item.following_count || '-'}, 
                    粉丝: ${item.followers_count || '-'}, 
                    获赞: ${item.likes_count || '-'}
                `;
                li.addEventListener('click', () => {
                    tiktokUserIdInput.value = item.tiktok_user_id;
                });
                cloudHistoryList.appendChild(li);
            });
        }
        console.log('[Script.js] Cloud history rendered.');
    }

    loadCloudHistoryButton.addEventListener('click', async () => {
        console.log('[Script.js] Load cloud history button clicked.');
        const jinaApiKey = jinaApiKeyInput.value.trim();
        if (!jinaApiKey) {
            displayError('请输入Jina AI API Key以加载云端历史。');
            renderCloudHistory([]); 
            return;
        }

        loadCloudHistoryButton.disabled = true;
        loadCloudHistoryButton.textContent = '加载中...';
        errorMessageDiv.style.display = 'none'; 

        try {
            const response = await fetch('/api/history/get', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jinaApiKey }) 
            });
            const result = await response.json(); 

            if (response.ok && result.success) {
                console.log('[Script.js] Successfully fetched cloud history:', result.data);
                renderCloudHistory(result.data || []); 
            } else {
                const errorMsg = result.error?.message || result.error || `加载云端历史失败，状态码: ${response.status}`;
                console.error('[Script.js] Failed to fetch cloud history:', errorMsg);
                displayError(`加载云端历史失败: ${errorMsg}`);
                renderCloudHistory([]); 
            }
        } catch (error) {
            console.error('[Script.js] Error calling get cloud history API:', error);
            displayError(`调用云端历史API时出错: ${error.message}`);
            renderCloudHistory([]);
        } finally {
            loadCloudHistoryButton.disabled = false;
            loadCloudHistoryButton.textContent = '加载云端历史';
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
                throw new Error(`服务器响应格式错误，无法解析。`); 
            }
            
            console.log('[Script.js] Parsed JSON result:', result);

            if (response.ok && result.success) {
                console.log('[Script.js] API call successful, displaying results.');
                displayResults(tiktokUserId, result.data);
                
                const historyItem = {
                    tiktokUserId,
                    followingCount: result.data.followingCount,
                    followersCount: result.data.followersCount,
                    likesCount: result.data.likesCount,
                    queriedAt: new Date().toISOString() 
                };

                const storageOption = getSelectedStorageOption();
                console.log('[Script.js] Selected storage option:', storageOption);

                if (storageOption === 'local') {
                    saveToLocalHistory(historyItem);
                } else if (storageOption === 'cloud') {
                    console.log('[Script.js] Attempting to save to cloud (Supabase)...');
                    try {
                        const saveCloudResponse = await fetch('/api/history/save', { 
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                ...historyItem, 
                                jinaApiKey 
                            })
                        });
                        const saveCloudResult = await saveCloudResponse.json(); 

                        if (!saveCloudResponse.ok || !saveCloudResult.success) {
                            const errorMsg = saveCloudResult.error?.message || saveCloudResult.error || '保存到云端失败';
                            console.error('[Script.js] Failed to save to cloud:', errorMsg);
                            displayError(`保存到云端失败: ${errorMsg}`);
                        } else {
                            console.log('[Script.js] Successfully saved to cloud:', saveCloudResult.data);
                            if (getSelectedStorageOption() === 'cloud') {
                                loadCloudHistoryButton.click(); 
                            }
                        }
                    } catch (cloudError) {
                        console.error('[Script.js] Error calling save to cloud API:', cloudError);
                        displayError(`调用云端保存API时出错: ${cloudError.message}`);
                    }
                }

            } else {
                const errorMessageFromServer = result.error?.message || result.error || `请求失败，状态码: ${response.status}`;
                console.error('[Script.js] API call failed or result.success is false. Server error:', errorMessageFromServer);
                throw new Error(errorMessageFromServer);
            }
        } catch (error) {
            console.error('[Script.js] Catch block: Query error:', error.message); 
            displayError(`查询出错: ${error.message}`);
        } finally {
            loadingIndicator.style.display = 'none';
            queryButton.disabled = false;
            queryButton.textContent = '查询';
            console.log('[Script.js] UI restored from loading state.');
        }
    });

    // --- UI更新函数 ---
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
    toggleHistorySections(); 
    console.log('[Script.js] Initial history section displayed on page load.');
});