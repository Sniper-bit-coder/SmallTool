/**
 * app-theme.js - 移动端增强版
 */

// --- 1. 深色模式切换 ---
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.innerText = '☀️';
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    themeToggle.innerText = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// --- 2. 移动端优化的一键复制 ---
function copyArchiveCode() {
    const area = document.getElementById('archive-area');
    const btn = event.currentTarget; // 获取当前点击的按钮
    
    if (!area.value) {
        showToast("没有存档可以复制", "error");
        return;
    }

    // 逻辑 A: 尝试现代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(area.value)
            .then(() => handleCopySuccess(btn))
            .catch(() => fallbackCopy(area, btn));
    } else {
        fallbackCopy(area, btn);
    }
}

// 逻辑 B: 备用强制复制方案 (兼容老手机)
function fallbackCopy(area, btn) {
    try {
        area.select();
        area.setSelectionRange(0, 99999); // 兼容 iOS
        const successful = document.execCommand('copy');
        if (successful) handleCopySuccess(btn);
        else showToast("复制失败，请手动长按全选", "error");
    } catch (err) {
        showToast("浏览器不支持自动复制", "error");
    }
}

function handleCopySuccess(btn) {
    const originalText = btn.innerText;
    const originalBg = btn.style.background;
    
    btn.innerText = "✅ 存档已复制到剪贴板";
    btn.style.background = "#10b981";
    
    showToast("存档已就绪，可去微信/备忘录粘贴");

    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.background = originalBg;
    }, 2500);
}

// 简单的提示框功能
function showToast(msg) {
    const toast = document.createElement('div');
    toast.style = `
        position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.8); color: white; padding: 10px 20px;
        border-radius: 20px; font-size: 0.8rem; z-index: 10000;
        animation: fadeUp 0.3s ease;
    `;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// --- 3. 辅助功能：一键清空导入框 ---
function clearImportArea() {
    document.getElementById('archive-area').value = "";
    document.getElementById('archive-area').focus();
}