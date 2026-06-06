/**
 * app-config.js
 * 负责全局变量定义与存档初始化
 */
const STORAGE_KEY = 'politics_study_v1';
const SNIPER_ID = 'Sniper276';

let db = [];             // 完整数据库
let queue = [];          // 当前练习队列
let currentIndex = 0;      // 屏幕显示的题目索引
let lastLearnedIndex = 0;  // 学习模式达到的最大索引
let isRecallMode = false;  // 是否为默写模式
let keywordIdx = 0;        // 提示索引
let isWrongMode = false;   // 是否为错题强化模式
let timerInterval = null;  // 计时器

// 初始化进度对象
let progress = { 
    mastered: [], 
    wrong: [],
    totalSeconds: 0, 
    totalChars: 0,   
    totalSessions: 0 
};