import { SaveManager } from './src/core/SaveManager.js';

const sm = new SaveManager();
sm.load();
sm.resetAll();
sm.load();

const SESS_ID = 'sess_test_12345';
let passCount = 0;
let totalTests = 0;

console.log('=== Test 1: 连续 5 次 completeLevel（同 session） ===');
for (let i = 0; i < 5; i++) {
  const ok = sm.completeLevel(1, 3, 5000, SESS_ID);
  console.log('  attempt ' + (i + 1) + ' -> returned: ' + ok);
}
const prog = sm.getProgress();
console.log('  levelsCompleted.length = ' + prog.levelsCompleted.length + ' (期望 1)');
const t1 = prog.levelsCompleted.length === 1;
totalTests++; if (t1) passCount++;
console.log('  ' + (t1 ? 'PASS' : 'FAIL'));

console.log('');
console.log('=== Test 2: 连续 5 次 updateStats（同 session 同 keys） ===');
for (let i = 0; i < 5; i++) {
  const ok = sm.updateStats({ levelsCompleted: 1, totalEventsHandled: 10 }, SESS_ID);
  console.log('  attempt ' + (i + 1) + ' -> returned: ' + ok);
}
const stats = sm.getStats();
console.log('  totalEventsHandled = ' + stats.totalEventsHandled + ' (期望 10)');
const t2 = stats.totalEventsHandled === 10;
totalTests++; if (t2) passCount++;
console.log('  ' + (t2 ? 'PASS' : 'FAIL'));

console.log('');
console.log('=== Test 3: 连续 5 次 addToLeaderboard（同 session） ===');
let lastLen = -1;
for (let i = 0; i < 5; i++) {
  const board = sm.addToLeaderboard('TestPlayer', 5000, 1, SESS_ID);
  console.log('  attempt ' + (i + 1) + ' -> leaderboard length = ' + board.length);
  lastLen = board.length;
}
console.log('  final leaderboard length = ' + lastLen + ' (期望 1)');
const t3 = lastLen === 1;
totalTests++; if (t3) passCount++;
console.log('  ' + (t3 ? 'PASS' : 'FAIL'));

console.log('');
console.log('=== Test 4: 不同 session 可以正确写入 ===');
const NEW_SESS = 'sess_NEW_777';
const r1 = sm.completeLevel(2, 2, 3000, NEW_SESS);
const r2 = sm.updateStats({ totalEventsHandled: 5 }, NEW_SESS);
const r3 = sm.addToLeaderboard('NewPlayer', 3000, 2, NEW_SESS).length;
const prog2 = sm.getProgress();
const stats2 = sm.getStats();
console.log('  completeLevel(2): ' + r1 + '; levelsCompleted: ' + prog2.levelsCompleted.length);
console.log('  updateStats(+5): ' + r2 + '; totalEventsHandled: ' + stats2.totalEventsHandled);
console.log('  addToLeaderboard: len = ' + r3);
const t4 = prog2.levelsCompleted.length === 2 && stats2.totalEventsHandled === 15 && r3 === 2;
totalTests++; if (t4) passCount++;
console.log('  ' + (t4 ? 'PASS' : 'FAIL'));

console.log('');
console.log('====== RESULT: ' + passCount + '/' + totalTests + ' tests passed ======');
process.exit(passCount === totalTests ? 0 : 1);
