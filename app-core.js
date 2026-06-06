/**
 * app-core.js
 * 负责核心流程控制
 */

// 启动初始化
// 修改后的初始化函数
async function init() {
    console.log(`%c ${SNIPER_ID} 静态离线版已就绪 `, "color: white; background: #2563eb; padding: 5px;");
    
    try {
        // 1. 直接引用静态变量，不再使用 fetch
        db = TIGANG_DATA; 

        // 2. 从 LocalStorage 读取进度
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            progress = { ...progress, ...parsed };
        }

        // 3. 渲染界面
        AppUI.updateGlobalStats();
        AppUI.renderTopics();
        
    } catch (e) {
        console.error("初始化失败", e);
        alert("数据加载异常，请检查 tigang_data.js 是否正确引入。");
    }
}

// 保存进度 - 完全依赖 LocalStorage
function saveProgress() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        AppUI.updateGlobalStats();
    } catch (e) {
        console.error("保存失败:", e);
        if (e.name === 'QuotaExceededError') {
            alert("存储空间已满！请尝试导出并清理存档。");
        }
    }
}

// 开始练习
function startSession(wrongOnly = false) {
    isWrongMode = wrongOnly;
    const selected = Array.from(document.querySelectorAll('.t-chk:checked')).map(el => parseInt(el.value));
    
    queue = [];
    db.forEach(topic => {
        if (selected.includes(topic.topic_index)) {
            let items = topic.items || [];
            if (isWrongMode) items = items.filter(i => progress.wrong.includes(i.id));
            queue.push(...JSON.parse(JSON.stringify(items)));
        }
    });

    if (queue.length === 0) return alert("没题练什么？");
    if (document.getElementById('chk-shuffle').checked) AppUtils.shuffle(queue);
    
    currentIndex = 0; lastLearnedIndex = 0; isRecallMode = false;
    progress.totalSessions++;
    saveProgress();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        progress.totalSeconds++;
        document.getElementById('stat-time').innerText = AppUtils.formatTime(progress.totalSeconds);
    }, 1000);

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    AppUI.renderCurrent();
}

// 核心交替记忆动作
async function handleMainAction() {
    const item = queue[currentIndex];
    
    if (!isRecallMode) {
        // 学习阶段结束 -> 决定去背下一题还是复习上一题
        if (currentIndex === 0 && queue.length > 1) {
            currentIndex = 1; lastLearnedIndex = 1;
        } else if (currentIndex === lastLearnedIndex) {
            isRecallMode = true;
            currentIndex = Math.max(0, lastLearnedIndex - 1);
        } else { isRecallMode = true; }
        AppUI.renderCurrent();
    } else {
        // 默写阶段核对
        const hiddens = document.querySelectorAll('.ans-content.hidden');
        if (hiddens.length > 0) {
            const allInput = Array.from(document.querySelectorAll('.recall-input')).map(i => i.value).join(' ');
            progress.totalChars += allInput.replace(/\s/g, "").length;
            
            const result = AppUtils.analyzeMatching(allInput, item);
            hiddens.forEach(h => h.classList.remove('hidden'));
            
            // 触发 features.js 的视觉对比
            if (window.showVisualComparison) window.showVisualComparison(allInput, item.keywords);
            
            const scoreClass = result.score >= 80 ? 'score-high' : (result.score >= 60 ? 'score-mid' : 'score-low');
            document.getElementById('mode-indicator').innerHTML += `<span class="score-tag ${scoreClass}">匹配: ${result.score}%</span>`;
            document.getElementById('btn-next').innerText = "确认，继续";
        } else {
            // 确认后跳转
            if (isWrongMode) progress.wrong = progress.wrong.filter(id => id !== item.id);
            if (!progress.mastered.includes(item.id)) progress.mastered.push(item.id);
            saveProgress();

            if (lastLearnedIndex + 1 < queue.length) {
                lastLearnedIndex++; currentIndex = lastLearnedIndex; isRecallMode = false;
                AppUI.renderCurrent();
            } else if (currentIndex < lastLearnedIndex) {
                currentIndex = lastLearnedIndex; isRecallMode = true;
                AppUI.renderCurrent();
            } else {
                alert("本轮通关！");
                location.reload();
            }
        }
    }
}

// 其他基础动作
function goPrev() { if (currentIndex > 0) { currentIndex--; isRecallMode = false; AppUI.renderCurrent(); } }
function showNextKeyword() {
    // 新增判定：如果是默写模式，直接拦截，不给提示
    if (isRecallMode) return; 

    const item = queue[currentIndex];
    if (keywordIdx < item.keywords.length) {
        const tag = document.createElement('span');
        tag.className = 'keyword-tag';
        tag.innerText = item.keywords[keywordIdx++];
        document.getElementById('keywords-container').appendChild(tag);
    }
}
function markWrong() {
    const item = queue[currentIndex];
    if (!progress.wrong.includes(item.id)) progress.wrong.push(item.id);
    saveProgress();
    if (lastLearnedIndex + 1 < queue.length) {
        lastLearnedIndex++; currentIndex = lastLearnedIndex; isRecallMode = false;
        AppUI.renderCurrent();
    } else { location.reload(); }
}
function toggleAll(chk) { document.querySelectorAll('.t-chk').forEach(c => c.checked = chk); }

// 存档管理弹窗逻辑
function openArchiveModal(m) {
    document.getElementById('archive-modal').style.display = 'flex';
    document.getElementById('archive-area').value = (m === 'export') ? JSON.stringify(progress, null, 2) : "";
    if(m === 'export') document.getElementById('archive-area').select();
}
function closeArchiveModal() { document.getElementById('archive-modal').style.display = 'none'; }
// 修改 applyImport 函数
function applyImport() {
    const rawData = document.getElementById('archive-area').value.trim();
    if (!rawData) return;
    
    try {
        const data = JSON.parse(rawData);
        // 简单的格式校验
        if (!data.mastered || !Array.from(data.mastered)) throw new Error("无效的存档格式");

        // 更新全局变量
        progress = {
            mastered: data.mastered || [],
            wrong: data.wrong || [],
            totalSeconds: data.totalSeconds || 0,
            totalChars: data.totalChars || 0,
            totalSessions: data.totalSessions || 0
        };

        // 强制写入持久化存储
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        
        alert("存档导入成功！页面即将刷新。");
        location.reload();
    } catch (e) {
        alert("导入失败：代码无效或格式不正确。\n错误信息: " + e.message);
    }
}

// 列表管理
function showListManager(type) {
    document.getElementById('list-manager').style.display = 'block';
    const ids = progress[type] || [];
    const items = [];
    db.forEach(t => t.items.forEach(i => { if(ids.includes(i.id)) items.push({...i, tName: t.topic_name}); }));
    document.getElementById('list-content').innerHTML = items.map(i => `
        <div class="list-item">
            <div class="list-item-info"><strong>${i.question}</strong><br><small>${i.tName}</small></div>
            <button onclick="removeFromList('${type}','${i.id}')" class="btn-delete">删除</button>
        </div>
    `).join('') || '<p style="text-align:center">空</p>';
}
function closeListManager() { document.getElementById('list-manager').style.display = 'none'; }
function removeFromList(t, id) {
    progress[t] = progress[t].filter(i => i !== id);
    saveProgress();
    showListManager(t);
}

function openAboutModal() {
    document.getElementById('about-modal').style.display = 'flex';
}

function closeAboutModal() {
    document.getElementById('about-modal').style.display = 'none';
}

// 点击背景关闭
document.getElementById('about-modal').addEventListener('click', function(e) {
    if (e.target === this) closeAboutModal();
});

// 启动
init();