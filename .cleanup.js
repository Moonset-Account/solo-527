const { execSync } = require('child_process');
const targets = ['question-272', 'question-275', 'question-277'];
const ourProject = 'question-281';

function run(cmd) {
  try { return execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch { return ''; }
}

console.log('Scanning for foreign vite processes...');
const ps = run('ps aux');
const lines = ps.split('\n').filter(l => l.includes('vite') && !l.includes('grep'));

const toKill = [];
for (const l of lines) {
  const parts = l.split(/\s+/);
  const pid = parts[1];
  const isForeign = targets.some(t => l.includes(t));
  const isOurs = l.includes(ourProject);
  if (isForeign && !isOurs) {
    console.log(`  -> Found foreign PID ${pid}: ${l.slice(0, 100)}`);
    toKill.push(pid);
  } else if (isOurs) {
    console.log(`  -> (keep) ours PID ${pid}`);
  }
}

console.log(`\nKilling ${toKill.length} foreign processes...`);
for (const pid of toKill) {
  try {
    process.kill(parseInt(pid), 'SIGKILL');
    console.log(`  Killed ${pid}`);
  } catch (e) {
    console.log(`  Failed ${pid}: ${e.message}`);
  }
}

// Also kill npm wrapper processes for foreign projects
const npmLines = ps.split('\n').filter(l => l.includes('npm') && targets.some(t => l.includes(t)));
for (const l of npmLines) {
  const parts = l.split(/\s+/);
  const pid = parts[1];
  try { process.kill(parseInt(pid), 'SIGKILL'); console.log(`  Killed npm wrapper ${pid}`); }
  catch {}
}

console.log('\nSleeping 2s...');
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);

console.log('\nPort 5173 status:');
console.log(run("lsof -i :5173 2>/dev/null || echo '✅ Port 5173 is FREE'"));
