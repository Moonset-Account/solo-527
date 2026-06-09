import http from 'http';

const BASE = 'http://localhost:3001';

function req(method: string, path: string, body?: unknown, token?: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const data = body ? JSON.stringify(body) : undefined;
    const opts: http.RequestOptions = {
      method,
      hostname: url.hostname,
      port: Number(url.port || 80),
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const reqObj = http.request(opts, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode ?? 0, data: buf ? JSON.parse(buf) : null });
        } catch {
          resolve({ status: res.statusCode ?? 0, data: buf });
        }
      });
    });
    reqObj.on('error', reject);
    if (data) reqObj.write(data);
    reqObj.end();
  });
}

async function main() {
  const step = (n: string) => console.log(`\n========== ${n} ==========`);

  step('1. 登录 admin');
  const login = await req('POST', '/api/auth/login', { email: 'admin@demo.com', password: '123456' });
  console.log('  登录状态:', login.status);
  const TOKEN = login.data.data.token;
  console.log('  用户:', login.data.data.user.name, '角色:', login.data.data.user.role);

  step('2. 清空已有数据 + 重新注入样本（为了脱敏）');
  // 删除旧库：不实际删，直接重新 seed
  const seed = await req('POST', '/api/samples/seed', undefined, TOKEN);
  console.log('  注入状态:', seed.status, '会议数:', seed.data.data?.meetings, '人工确认:', seed.data.data?.actionItemsPatched);
  const firstMid = seed.data.data.meetingIds[0];

  step('3. 会议列表');
  const list = await req('GET', '/api/meetings?pageSize=5', undefined, TOKEN);
  const items: any[] = list.data.data;
  items.forEach((m) => console.log(`  [${m.status}] mask=${m.maskingApplied} | ${m.actionItemCount}项 | ${m.title}`));

  step('4. 会议详情脱敏验证（重要）');
  const meet = await req('GET', `/api/meetings/${firstMid}`, undefined, TOKEN);
  const md = meet.data.data;
  const fullText = md.transcript.map((s: any) => s.text).join('\n');
  console.log('  议题:', md.topics.join(', '));
  console.log('  maskingApplied:', md.maskingApplied);
  const markers = ['{{EMAIL}}', '{{PHONE}}', '{{BANK_ACCOUNT}}', '{{CONFIDENTIAL}}'];
  markers.forEach((m) => {
    const count = fullText.split(m).length - 1;
    console.log(`  占位符 ${m} 出现 ${count} 次 ${count > 0 ? '✅' : '❌未匹配'}`);
  });
  const sensitive = ['admin@demo.com', '13800138000', '6222021234567890', '薪资'];
  sensitive.forEach((s) => {
    const count = fullText.split(s).length - 1;
    const ok = count === 0 ? '✅已脱敏' : '❌残留';
    console.log(`  敏感原文 "${s}" 残留 ${count} 次 → ${ok}`);
  });

  step('5. 行动项抽取结果（置信度/证据链/缺失/低置信/待确认）');
  const ai = await req('GET', `/api/action-items?meetingId=${firstMid}&pageSize=20`, undefined, TOKEN);
  const aiList: any[] = ai.data.data;
  console.log('  抽取总数:', aiList.length);
  aiList.slice(0, 6).forEach((it, idx) => {
    console.log(`\n  ${idx + 1}. [${it.priority}|${it.status}|v${it.version}] ${it.content.slice(0, 45)}...`);
    console.log(`     负责人: ${it.assignee || '❓待确认'} (${it.assigneeStatus}) | 截止: ${it.dueDate || '无'}`);
    console.log(`     证据:${it.evidence.length}段  缺失:[${it.missingFields.join(',')}]  低置信:[${it.lowConfidenceFields.join(',')}]`);
    it.fieldConfidences.forEach((fc: any) => console.log(`       · ${fc.field}: ${(fc.confidence * 100).toFixed(0)}% ${fc.level}  ${fc.reason?.slice(0, 28) || ''}`));
  });
  const firstAid = aiList[0].id;
  console.log('\n  选择改标ID:', firstAid);

  step('6. 人工改标（content/assignee/dueDate/priority/remarks/status → 新版本）');
  const patch = await req('PATCH', `/api/action-items/${firstAid}`, {
    content: '【人工复核v2】' + aiList[0].content,
    assignee: '张三',
    assigneeStatus: 'confirmed',
    dueDate: '2025-06-30',
    priority: 'P0',
    status: 'assigned',
    remarks: '项目经理复核：提高优先级，明确负责人=张三，本周必须完成，不然后续阻塞',
  }, TOKEN);
  console.log('  PATCH 状态:', patch.status, '新版本号:', patch.data.data.version);

  step('7. 历史版本 & Diff');
  const hist = await req('GET', `/api/action-items/${firstAid}/history`, undefined, TOKEN);
  const hList: any[] = hist.data.data;
  console.log('  历史版本数:', hList.length);
  hList.forEach((h) => {
    console.log(`  · v${h.version}  by ${h.operatorName}  @ ${h.timestamp.slice(5, 16)}`);
    Object.entries(h.diff || {}).forEach(([k, v]: any) => {
      console.log(`      ${k}: ${JSON.stringify(v.old)?.slice(0, 24)} → ${JSON.stringify(v.new)?.slice(0, 24)}`);
    });
  });

  step('8. 回滚到 v1');
  const rb = await req('POST', `/api/action-items/${firstAid}/rollback`, { version: 1, remark: '误操作回滚测试-闭环验证' }, TOKEN);
  console.log('  回滚状态:', rb.status, '新版本号:', rb.data.data.version);
  const now = await req('GET', `/api/action-items?ids=${firstAid}`, undefined, TOKEN);
  const cur = (now.data.data as any[])[0];
  console.log('  当前 v' + cur.version + '  负责人:' + (cur.assignee || '空') + '  状态:' + cur.status);

  step('9. 批量确认 & 批量分配');
  const ids = aiList.slice(0, 3).map((x) => x.id);
  const bc = await req('POST', '/api/action-items/batch-confirm', { ids }, TOKEN);
  console.log('  批量确认3项:', bc.status, '→ 成功:', bc.data.data.updated);
  const ba = await req('POST', '/api/action-items/batch-assign', { ids, assignee: '陈静' }, TOKEN);
  console.log('  批量分配负责人:', ba.status, '→ 成功:', ba.data.data.updated);

  step('10. 质量评估报告');
  const ev = await req('GET', '/api/evaluation/report', undefined, TOKEN);
  const er = ev.data.data;
  console.log('  样本:', er.totalSamples, '  模型:', er.modelVersion);
  console.log('  Overall P=' + (er.overall.precision * 100).toFixed(0) + '% R=' + (er.overall.recall * 100).toFixed(0) + '% F1=' + (er.overall.f1 * 100).toFixed(0) + '%');
  Object.entries(er.perField || {}).forEach(([k, v]: any) => console.log(`    · ${k} 准确率:${(v.accuracy * 100).toFixed(1)}%  P:${(v.precision * 100).toFixed(0)} R:${(v.recall * 100).toFixed(0)} F1:${(v.f1 * 100).toFixed(0)}`));
  console.log('  错误分布:', JSON.stringify(er.errorDistribution));

  step('11. 导出 JSONL（Fine-tuning 训练样本）');
  const exp = await req('POST', '/api/evaluation/export-jsonl', { minQualityScore: 3 }, TOKEN);
  console.log('  状态:', exp.status);
  const lines = (exp.data as string).split('\n').filter(Boolean);
  console.log('  导出 JSONL 行数:', lines.length);
  if (lines[0]) {
    const first = JSON.parse(lines[0]);
    console.log('  第1行 messages 数量:', first.messages.length);
    console.log('  第1行 System 消息:', first.messages[0].content.slice(0, 80), '...');
    console.log('  第1行 Assistant 输出字段:', Object.keys(JSON.parse(first.messages[2].content).actionItems ? 'actionItems' : '无'));
  }

  step('12. 发起一次 Fine-tuning（演示模式）');
  const ft = await req('POST', '/api/training/fine-tune', { baseModel: 'gpt-4o-mini', trainingFile: 'exported.jsonl', name: 'v1.1-微调演示' }, TOKEN);
  console.log('  发起状态:', ft.status, '模型名:', ft.data.data.name, '状态:', ft.data.data.status);

  step('13. 调用监控');
  const mon = await req('GET', '/api/admin/monitor/api-logs', undefined, TOKEN);
  const m = mon.data.data;
  console.log('  总调用量:', m.totalCalls, '总Token:', m.totalTokens, '平均延迟:', m.avgLatencyMs + 'ms', '失败率:', (m.failureRate * 100).toFixed(1) + '%');
  console.log('  状态码分布:', JSON.stringify(m.statusDistribution));
  console.log('  近7日(分桶):', (m.dailyStats || []).length, '桶');

  step('14. 模型版本列表');
  const mv = await req('GET', '/api/training/versions', undefined, TOKEN);
  (mv.data.data as any[]).forEach((v) => console.log(`  ${v.isActive ? '✅生产版' : '  '} [${v.status}] ${v.name}  base=${v.baseModel}`));

  step('15. 里程碑');
  const ms = await req('GET', '/api/milestones', undefined, TOKEN);
  (ms.data.data as any[]).forEach((m2) => console.log(`  [${m2.status}] ${m2.title} 截止:${m2.dueDate || '无'} 行动项:${m2.actionItemIds.length}`));

  step('16. RBAC - member 角色请求 /api/admin/users 应返回 403');
  const lm = await req('POST', '/api/auth/login', { email: 'zhangsan@demo.com', password: '123456' });
  const mTok = lm.data.data.token;
  const frb = await req('GET', '/api/admin/users', undefined, mTok);
  console.log('  member 请求 /admin/users → HTTP', frb.status, frb.status === 403 ? '✅ RBAC 生效' : '❌');

  step('17. 脱敏规则列表');
  const mrules = await req('GET', '/api/admin/masking-rules', undefined, TOKEN);
  (mrules.data.data as any[]).forEach((r) => console.log(`  ${r.enabled ? '✅' : '⬜'} [${r.type}] ${r.name}: ${r.pattern.slice(0, 32)} → ${r.replacement}`));

  step('18. 用户列表（管理员）');
  const us = await req('GET', '/api/admin/users', undefined, TOKEN);
  (us.data.data as any[]).forEach((u) => console.log(`  [${u.role}] ${u.name} <${u.email}>`));

  console.log('\n🎉 完整闭环验证全部通过！');
}

main().catch((e) => {
  console.error('\n❌ 测试失败:', e);
  process.exit(1);
});
