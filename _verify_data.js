const { mockTasks, mockUsers, mockAttachments, mockComments, mockAuditLogs } = require('./lib/mock-data');

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
console.log(`  责任人ID: ${task?.assignee_id}`);
const assignee = mockUsers.find(u => u.id === task?.assignee_id);
console.log(`  责任人: ${assignee?.name || '未认领'}`);

console.log('\n[附件版本记录]');
if (attachments.length === 0) {
  console.log('  ❌ 无附件记录');
} else {
  attachments.forEach(a => {
    console.log(`  ✓ v${a.version} - ${a.file_name} (${Math.round(a.file_size/1024)} KB)`);
  });
}

console.log('\n[评论记录]');
if (comments.length === 0) {
  console.log('  ❌ 无评论记录');
} else {
  comments.forEach(c => {
    const user = mockUsers.find(u => u.id === c.user_id);
    console.log(`  ✓ ${user?.name}: ${c.content.substring(0, 50)}...`);
  });
}

console.log('\n[操作日志 - 含附件缺失审计]');
const claimLogs = auditLogs.filter(l => l.action === 'claim');
const progressLogs = auditLogs.filter(l => l.action === 'update_progress');
const uploadLogs = auditLogs.filter(l => l.action === 'upload_attachment');
const commentLogs = auditLogs.filter(l => l.action === 'comment');
const missingLogs = auditLogs.filter(l => l.action === 'missing_attachment');

console.log(`  认领记录: ${claimLogs.length > 0 ? '✓' : '❌'} (${claimLogs.length} 条)`);
console.log(`  进度更新: ${progressLogs.length > 0 ? '✓' : '❌'} (${progressLogs.length} 条)`);
console.log(`  附件上传: ${uploadLogs.length > 0 ? '✓' : '❌'} (${uploadLogs.length} 条)`);
console.log(`  评论日志: ${commentLogs.length > 0 ? '✓' : '❌'} (${commentLogs.length} 条)`);
console.log(`  附件缺失: ${missingLogs.length > 0 ? '✓' : '❌'} (${missingLogs.length} 条)`);

console.log('\n[全局审计日志 - 附件缺失警告]');
const allMissingLogs = mockAuditLogs.filter(l => l.action === 'missing_attachment');
allMissingLogs.forEach(l => {
  const t = mockTasks.find(tk => tk.id === l.task_id);
  const u = mockUsers.find(u => u.id === l.user_id);
  console.log(`  ⚠️ ${t?.title} - ${l.metadata?.warning} (操作人: ${u?.name})`);
});

console.log('\n===== 检查完成 =====');
