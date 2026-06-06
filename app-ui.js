/**
 * app-ui.js
 * 负责 DOM 操作和界面更新
 */
const AppUI = {
    // 更新主页荣誉数据
	updateGlobalStats() {
		// 1. 核心数据计算
		const allItemsCount = db.reduce((a, b) => a + (b.items ? b.items.length : 0), 0);
		const masteredCount = progress.mastered.length;
		const coverage = ((masteredCount / allItemsCount) * 100).toFixed(1); // 保留一位小数，更专业

		// 2. 更新页头：不再使用称号，直接显示“复习摘要”
		const statsHtml = `
			<div style="font-size: 0.8rem; color: var(--text-sub); display: flex; gap: 15px; margin-top: 5px;">
				<span>考纲覆盖: <strong class="stat-highlight">${coverage}%</strong></span>
				<span>已入考点库: <strong class="stat-highlight">${masteredCount}</strong></span>
				<span>遗忘/错题: <strong class="stat-highlight">${progress.wrong.length}</strong></span>
			</div>
		`;
		
		// 更新主界面统计区
		document.getElementById('global-stats').innerHTML = statsHtml;
		document.getElementById('global-progress-bar').style.width = coverage + '%';
		
		// 3. 更新面板数值
		document.getElementById('stat-time').innerText = AppUtils.formatTime(progress.totalSeconds);
		document.getElementById('stat-chars').innerText = `${progress.totalChars} 字`;
		document.getElementById('stat-sessions').innerText = `${progress.totalSessions} 次`;

		// 移除页面上可能残留的任何标签（如果有的话）
		const tag = document.querySelector('.status-tag, .badge');
		if (tag) tag.remove();
	},

    // 渲染专题列表
    renderTopics() {
        const list = document.getElementById('topic-list');
        list.innerHTML = db.map(t => `
            <div style="margin:5px 0">
                <label><input type="checkbox" class="t-chk" value="${t.topic_index}" checked> 专题${t.topic_index}: ${t.topic_name}</label>
            </div>
        `).join('');
    },

    // 核心渲染当前题目
    renderCurrent() {
        keywordIdx = 0; // 切换模式重置提示
        document.getElementById('keywords-container').innerHTML = '';
        if(window.hideComparison) window.hideComparison(); // 隐藏 features.js 的对比框

        const item = queue[currentIndex];
        const modeTag = document.getElementById('mode-indicator');
        const content = document.getElementById('content-area');
        
		const keywordArea = document.querySelector('.keyword-area');
		if (isRecallMode) {
			keywordArea.style.visibility = 'hidden'; // 默写时彻底隐藏提示区域
		} else {
			keywordArea.style.visibility = 'visible'; // 学习时正常显示
		}
        
        document.getElementById('quiz-progress-text').innerText = `题目: ${currentIndex + 1} / ${queue.length}`;
        document.getElementById('quiz-progress-bar').style.width = Math.round(((currentIndex + 1) / queue.length) * 100) + '%';
        document.getElementById('q-title').innerText = item.question;
        document.getElementById('btn-prev').disabled = (currentIndex === 0 && !isRecallMode);

        if (!isRecallMode) {
            modeTag.innerText = "【学习阶段】";
            modeTag.className = "mode-tag mode-learn";
            document.getElementById('btn-next').innerText = "记住了，下一步";
            content.innerHTML = item.points.map(p => `<div class="ans-item"><span class="ans-content">${p}</span></div>`).join('');
        } else {
            modeTag.innerText = "【复写阶段】";
            modeTag.className = "mode-tag mode-recall";
            document.getElementById('btn-next').innerText = "提交核对";
            content.innerHTML = item.points.map((p, i) => `
                <div class="ans-item">
                    <input type="text" class="recall-input" placeholder="输入要点 ${i+1}..." autocomplete="off">
                    <div class="ans-content hidden" style="margin-top:8px; border-top:1px dashed #ddd; padding-top:8px;">${p}</div>
                </div>
            `).join('');
        }
    }
};