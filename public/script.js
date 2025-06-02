// public/script.js
document.addEventListener('DOMContentLoaded', () => {
    const queryForm = document.getElementById('tiktok-query-form');
    // ... (省略了大部分JS，请使用您之前版本中完整的JS) ...

    function displayError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
        resultsSection.style.display = 'none'; 
    }
});