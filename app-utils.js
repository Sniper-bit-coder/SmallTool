/**
 * app-utils.js
 * 处理复杂的逻辑计算
 */
const AppUtils = {
    // Fisher-Yates 科学洗牌算法
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    // 模糊匹配评分逻辑
    analyzeMatching(input, item) {
        if (!input) return { score: 0, matched: [] };
        const cleanInput = input.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "");
        let matchedCount = 0;
        let matchedDetails = [];

        item.keywords.forEach(kw => {
            const cleanKw = kw.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "");
            // 检查字符重叠率
            let hit = 0;
            const kwChars = cleanKw.split('');
            kwChars.forEach(char => { if (cleanInput.includes(char)) hit++; });
            
            // 只要关键词中 70% 的字出现了，或者包含完整词，判定通过
            if (cleanInput.includes(cleanKw) || (hit / cleanKw.length >= 0.7)) {
                matchedCount++;
                matchedDetails.push(kw);
            }
        });

        const score = Math.round((matchedCount / item.keywords.length) * 100);
        return { score: Math.min(score, 100), matched: matchedDetails };
    },

    // 时间格式化
    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${hrs}:${mins}:${secs}`;
    }
};