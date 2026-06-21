const {
  mockPermissionExceptions,
  mockAppointmentReports,
  mockMedicalRecords,
  mockPatients,
} = require("./src/lib/mock/data.js");

function handlePermissionException(exceptionId, status, conclusion, handlerId) {
  const exception = mockPermissionExceptions.find((e) => e.id === exceptionId);
  if (!exception) return null;

  exception.status = status;
  exception.handling_conclusion = conclusion;
  exception.handler_id = handlerId;
  exception.handled_at = new Date().toISOString();

  if (status === "resolved" || status === "closed") {
    const record = mockMedicalRecords.find((r) => r.id === exception.record_id);
    const patient = record
      ? mockPatients.find((p) => p.id === record.patient_id)
      : null;

    const impact = {
      exception_id: exception.id,
      record_id: exception.record_id,
      conclusion: conclusion,
      severity: exception.severity,
      synced_at: new Date().toISOString(),
      patient_name: patient ? patient.name : null,
    };

    const today = new Date().toISOString().split("T")[0];
    const department = record?.department || "内科";

    const existingReport = mockAppointmentReports.find(
      (r) => r.report_date === today && r.department === department
    );

    if (existingReport) {
      existingReport.exception_impact = {
        ...(existingReport.exception_impact || {}),
        ...impact,
      };
    } else {
      const newReport = {
        id: `report-${Date.now()}`,
        report_date: today,
        department: department,
        total_slots: 40,
        booked_slots: 28,
        attended_slots: 25,
        utilization_rate: "62.5",
        exception_impact: impact,
        created_at: new Date().toISOString(),
      };
      mockAppointmentReports.unshift(newReport);
    }
  }

  return exception;
}

// ============= 测试 =============

console.log("=== 验证：权限异常处理 → 号源报表同步 ===\n");

// 初始状态
const initialPending = mockPermissionExceptions.filter(
  (e) => e.status === "pending"
).length;
console.log(`初始待处理异常数: ${initialPending}`);

const initialWithImpact = mockAppointmentReports.filter(
  (r) => Object.keys(r.exception_impact || {}).length > 0
).length;
console.log(`初始有异常影响的报表数: ${initialWithImpact}`);
console.log(`初始报表条数: ${mockAppointmentReports.length}\n`);

// 找到一个待处理的异常
const pendingException = mockPermissionExceptions.find(
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

// 提交处理
const testConclusion =
  "经审核确认，处方剂量在安全范围内，属合理用药。已补充相关病历说明，同意归档。";
const result = handlePermissionException(
  pendingException.id,
  "resolved",
  testConclusion,
  "u-001"
);

console.log("=== 处理结果 ===");
console.log("状态:", result?.status);
console.log("结论:", result?.handling_conclusion);
console.log("处理时间:", result?.handled_at, "\n");

// 验证号源报表同步
const updatedWithImpact = mockAppointmentReports.filter(
  (r) => Object.keys(r.exception_impact || {}).length > 0
);
console.log("=== 号源报表验证 ===");
console.log("有异常影响的报表数:", updatedWithImpact.length);
console.log("总报表条数:", mockAppointmentReports.length);

// 找到刚刚同步的那一条
const impactedReport = mockAppointmentReports.find((r) => {
  const impact = r.exception_impact;
  return impact && impact.exception_id === pendingException.id;
});

if (impactedReport) {
  console.log("\n✅ 找到刚同步的报表记录！");
  console.log("  科室:", impactedReport.department);
  console.log("  日期:", impactedReport.report_date);
  const impact = impactedReport.exception_impact;
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
  console.log("\n❌ 未找到刚同步的报表记录！");
  console.log("所有报表的 exception_impact:");
  mockAppointmentReports.forEach((r) => {
    if (r.exception_impact && Object.keys(r.exception_impact).length > 0) {
      console.log(`  ${r.report_date} ${r.department}:`, r.exception_impact);
    }
  });
}

// 验证异常状态已更新
const afterPending = mockPermissionExceptions.filter(
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
