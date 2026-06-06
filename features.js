/**
 * features.js - 增强插件
 * 功能：搜索、比对高亮、快捷键
 * 开发者: Sniper276
 */

// --- 1. 全局搜索逻辑 ---
const SearchModule = {
    init() {
        const input = document.getElementById('global-search');
        const resultsBox = document.getElementById('search-results');
        if (!input) return;

        input.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            if (query.length < 1) {
                resultsBox.classList.add('hidden');
                return;
            }

            let matches = [];
            db.forEach(topic => {
                topic.items.forEach(item => {
                    if (item.question.toLowerCase().includes(query) || 
                        item.keywords.some(k => k.toLowerCase().includes(query))) {
                        matches.push({ ...item, topicName: topic.topic_name });
                    }
                });
            });

            if (matches.length > 0) {
                resultsBox.innerHTML = matches.slice(0, 8).map(item => `
                    <div class="search-item" onclick="SearchModule.jump('${item.id}')" 
                         style="padding: 12px; border-bottom: 1px solid #f1f5f9; cursor: pointer;">
                        <div style="font-weight:bold; font-size:0.9rem;">${item.question}</div>
                        <div style="font-size:0.7rem; color:#94a3b8;">${item.topicName}</div>
                    </div>
                `).join('');
                resultsBox.classList.remove('hidden');
            } else {
                resultsBox.innerHTML = '<div style="padding:10px; color:#94a3b8; font-size:0.8rem;">未找到匹配题目</div>';
                resultsBox.classList.remove('hidden');
            }
        });

        // 点击空白处关闭搜索结果
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target)) resultsBox.classList.add('hidden');
        });
    },

    jump(id) {
        let target = null;
        db.forEach(t => t.items.forEach(i => { if(i.id === id) target = i; }));
        if (target) {
            queue = [JSON.parse(JSON.stringify(target))]; // 设为单题模式
            currentIndex = 0;
            lastLearnedIndex = 0;
            isRecallMode = false;
            
            document.getElementById('global-search').value = "";
            document.getElementById('search-results').classList.add('hidden');
            document.getElementById('setup-screen').classList.add('hidden');
            document.getElementById('quiz-screen').classList.remove('hidden');
            
            AppUI.renderCurrent();
        }
    }
};

// --- 2. 关键词比对高亮 ---
window.showVisualComparison = (input, keywords) => {
    const container = document.getElementById('comparison-result');
    const tagsBox = document.getElementById('comparison-tags');
    if (!container || !tagsBox) return;

    const cleanInput = input.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "");
    let perfectCount = 0;

    const html = keywords.map(kw => {
        const cleanKw = kw.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "");
        let hit = 0;
        const kwChars = cleanKw.split('');
        kwChars.forEach(c => { if(cleanInput.includes(c)) hit++; });

        const isMatched = (hit / cleanKw.length >= 0.7) || cleanInput.includes(cleanKw);
        const isPerfect = (hit === cleanKw.length);

        if (isPerfect) perfectCount++;

        let className = "keyword-tag ";
        let style = "";
        
        if (isPerfect) {
            className += "kw-perfect";
        } else if (isMatched) {
            style = "background: #dcfce7; color: #166534; border-color: #22c55e;";
        } else {
            style = "background: #fee2e2; color: #991b1b; border-color: #ef4444;";
        }

        return `<span class="${className}" style="${style}">${isPerfect ? '⭐' : (isMatched ? '✓' : '✗')} ${kw}</span>`;
    }).join('');

    tagsBox.innerHTML = html;
    if (perfectCount === keywords.length && keywords.length > 0) {
        tagsBox.innerHTML += `<div class="perfect-banner">✨ 绝了！全员完美命中！</div>`;
    }
    container.classList.remove('hidden');
};

// 配合 AppUI 使用的辅助函数
window.hideComparison = () => {
    const res = document.getElementById('comparison-result');
    if (res) res.classList.add('hidden');
};

// --- 3. 键盘快捷键 ---
window.addEventListener('keydown', (e) => {
    // 过滤输入框，防止打字时触发快捷键
    if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) {
        if (e.key === 'Escape') {
            document.getElementById('search-results').classList.add('hidden');
            e.target.blur();
        }
        return;
    }

    if (document.getElementById('quiz-screen').classList.contains('hidden')) return;

    switch(e.key.toLowerCase()) {
        case 'enter':
            handleMainAction();
            break;
        case ' ': // 空格提示
            e.preventDefault();
            if (!isRecallMode) {
                showNextKeyword();
            }
            break;
        case 'w': // 记不住
            markWrong();
            break;
        case 'arrowleft': // 上一题
            goPrev();
            break;
    }
});

// 初始化搜索
SearchModule.init();