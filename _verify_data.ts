import { mockTasks, mockUsers, mockAttachments, mockComments, mockAuditLogs } from './lib/mock-data';

const taskId = 'task-001';
const task = mockTasks.find(t => t.id === taskId);
const attachments = mockAttachments.filter(a => a.task_id === taskId);
const comments = mockComments.filter(c => c.task_id === taskId);
const auditLogs = mockAuditLogs.filter(l => l.task_id === taskId);

console.log('===== task-001 数据完整性检查 =====\n');

console.log('[事项基本信息]');
console.log(`  标题: ${task?.title || '❌ 未找到'}`);
console.log(`  状态: ${task?.status}`);
console.log(`  进度: ${task?.progress}%`);
console.log(`  需要附件: ${task?.requires_attachment}`);
const assignee = mockUsers.find(u => u.id === task?.assignee_id);
console.log(`  责任人: ${assignee?.name || '未认领'}`);

console.log('\n[附件版本记录]');
if (attachments.length === 0) console.log('  ❌ 无附件');
else attachments.forEach(a => console.log(`  ✓ v${a.version} - ${a.file_name} (${Math.round(a.file_size/1024)} KB)`));

console.log('\n[评论记录]');
if (comments.length === 0) console.log('  ❌ 无评论');
else comments.forEach(c => {
  const user = mockUsers.find(u => u.id === c.user_id);
  console.log(`  ✓ ${user?.name}: ${c.content.substring(0, 50)}`);
});

console.log('\n[操作日志]');
const actions = ['claim', 'update_progress', 'upload_attachment', 'comment', 'missing_attachment'] as const;
for (const action of actions) {
  const logs = auditLogs.filter(l => l.action === action);
  const icon = logs.length > 0 ? '✓' : '❌';
  console.log(`  ${icon} ${action}: ${logs.length} 条`);
}

console.log('\n[全局附件缺失审计]');
const allMissing = mockAuditLogs.filter(l => l.action === 'missing_attachment');
allMissing.forEach(l => {
  const t = mockTasks.find(tk => tk.id === l.task_id);
  console.log(`  ⚠️ ${t?.title} - ${l.metadata?.warning}`);
});

console.log('\n===== 检查完成 =====');
