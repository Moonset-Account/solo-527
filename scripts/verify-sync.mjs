import {
  getPermissionExceptions,
  handlePermissionException,
  getAppointmentReports,
} from "./src/lib/services";

async function main() {
  console.log("=== 验证：权限异常处理 → 号源报表同步 ===\n");

  // 1. 初始状态
  const initialExceptions = await getPermissionExceptions();
  const initialPending = initialExceptions.filter(
    (e) => e.status === "pending"
  ).length;
  console.log(`初始待处理异常数: ${initialPending}`);

  const initialReports = await getAppointmentReports();
  const initialWithImpact = initialReports.filter(
    (r) => Object.keys(r.exception_impact || {}).length > 0
  ).length;
  console.log(`初始有异常影响的报表数: ${initialWithImpact}`);
  console.log("初始报表条数:", initialReports.length, "\n");

  // 2. 找到一个待处理的异常
  const pendingException = initialExceptions.find(
    (e) => e.status === "pending"
  );
  if (!pendingException) {
    console.log("❌ 没有待处理的异常可测试");
    process.exit(1);
  }
  console.log(
    `测试异常: ${pendingException.exception_type} (${pendingException.id})`
  );
  console.log(`严重程度: ${pendingException.severity}`);
  console.log(`关联病历: ${pendingException.record_id}\n`);

  // 3. 提交处理结论 - 标记为已解决
  const testConclusion =
    "经审核确认，处方剂量在安全范围内，属合理用药。已补充相关病历说明，同意归档。";
  const result = await handlePermissionException(
    pendingException.id,
    "resolved",
    testConclusion,
    "u-001"
  );

  console.log("=== 处理结果 ===");
  console.log("状态:", result?.status);
  console.log("结论:", result?.handling_conclusion);
  console.log("处理时间:", result?.handled_at, "\n");

  // 4. 验证号源报表同步
  const updatedReports = await getAppointmentReports();
  const updatedWithImpact = updatedReports.filter(
    (r) => Object.keys(r.exception_impact || {}).length > 0
  );
  console.log("=== 号源报表验证 ===");
  console.log("有异常影响的报表数:", updatedWithImpact.length);

  // 找到刚刚同步的那一条
  const impactedReport = updatedReports.find((r) => {
    const impact = r.exception_impact as Record<string, unknown>;
    return impact.exception_id === pendingException.id;
  });

  if (impactedReport) {
    console.log("✅ 找到刚同步的报表记录！");
    console.log("  科室:", impactedReport.department);
    console.log("  日期:", impactedReport.report_date);
    const impact = impactedReport.exception_impact as Record<string, unknown>;
    console.log("  exception_id:", impact.exception_id);
    console.log("  severity:", impact.severity);
    console.log("  conclusion:", impact.conclusion);
    console.log("  synced_at:", impact.synced_at);
    console.log("  patient_name:", impact.patient_name || "(未包含)");

    if (impact.conclusion === testConclusion) {
      console.log("\n✅ 结论完全匹配！同步成功！");
    } else {
      console.log("\n❌ 结论不匹配！");
      console.log("  期望:", testConclusion);
      console.log("  实际:", impact.conclusion);
    }
  } else {
    console.log("❌ 未找到刚同步的报表记录！");
    console.log("所有报表的 exception_impact:");
    updatedReports.forEach((r) => {
      console.log(`  ${r.report_date} ${r.department}:`, r.exception_impact);
    });
  }

  // 5. 验证异常状态已更新
  const updatedExceptions = await getPermissionExceptions();
  const afterPending = updatedExceptions.filter(
    (e) => e.status === "pending"
  ).length;
  console.log("\n=== 异常状态验证 ===");
  console.log(`处理后待处理异常数: ${afterPending} (之前: ${initialPending})`);
  if (afterPending < initialPending) {
    console.log("✅ 待处理数量减少，状态更新成功！");
  } else {
    console.log("❌ 待处理数量未减少！");
  }

  console.log("\n=== 验证完成 ===");
}

main().catch(console.error);
