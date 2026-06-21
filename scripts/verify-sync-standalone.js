// 完全自包含的同步逻辑验证脚本
// 复刻 services.ts + data.ts 中的核心逻辑

const mockPermissionExceptions = [
  {
    id: "pe-001",
    record_id: "mr-001",
    exception_type: "处方剂量异常",
    severity: "high",
    status: "pending",
    reported_by: "u-003",
    reported_at: "2026-06-18T10:30:00Z",
    description: "麻黄用量达15g，超出常规剂量范围，需审核确认",
    handling_conclusion: null,
    handler_id: null,
    handled_at: null,
  },
  {
    id: "pe-002",
    record_id: "mr-003",
    exception_type: "诊断权限不符",
    severity: "medium",
    status: "pending",
    reported_by: "u-004",
    reported_at: "2026-06-19T09:15:00Z",
    description: "实习医师独立开具诊断证明，需上级医师复核",
    handling_conclusion: null,
    handler_id: null,
    handled_at: null,
  },
];

const mockAppointmentReports = [
  {
    id: "report-001",
    report_date: "2026-06-20",
    department: "内科",
    total_slots: 50,
    booked_slots: 42,
    attended_slots: 38,
    utilization_rate: "76.0",
    exception_impact: {},
    created_at: "2026-06-20T23:00:00Z",
  },
  {
    id: "report-002",
    report_date: "2026-06-20",
    department: "针灸科",
    total_slots: 30,
    booked_slots: 28,
    attended_slots: 26,
    utilization_rate: "86.7",
    exception_impact: {
      exception_id: "pe-old",
      severity: "low",
      conclusion: "历史异常记录",
    },
    created_at: "2026-06-20T23:00:00Z",
  },
];

const mockMedicalRecords = [
  {
    id: "mr-001",
    patient_id: "p-001",
    department: "内科",
    chief_complaint: "咳嗽反复发作3月余",
  },
  {
    id: "mr-003",
    patient_id: "p-003",
    department: "针灸科",
    chief_complaint: "颈项强痛伴右侧上肢麻木1周",
  },
];

const mockPatients = [
  { id: "p-001", name: "张某某", gender: "female", age: 45 },
  { id: "p-003", name: "李某某", gender: "male", age: 52 },
];

// 复刻 handlePermissionException 的核心同步逻辑
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
console.log(`初始报表总条数: ${mockAppointmentReports.length}\n`);

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

// 提交处理 - 标记为已解决
const testConclusion =
  "经审核确认，处方剂量在安全范围内，属合理用药。已补充相关病历说明，同意归档。";
const result = handlePermissionException(
  pendingException.id,
  "resolved",
  testConclusion,
  "u-001"
);

console.log("=== 处理结果 ===");
console.log("新状态:", result?.status);
console.log("处理结论:", result?.handling_conclusion);
console.log("处理时间:", result?.handled_at ? "已设置" : "未设置");
console.log("处理人:", result?.handler_id, "\n");

// 验证号源报表同步
const allWithImpact = mockAppointmentReports.filter(
  (r) => Object.keys(r.exception_impact || {}).length > 0
);
console.log("=== 号源报表验证 ===");
console.log("有异常影响的报表数:", allWithImpact.length);
console.log("总报表条数:", mockAppointmentReports.length);

// 找到刚刚同步的那一条
const impactedReport = mockAppointmentReports.find((r) => {
  const impact = r.exception_impact;
  return impact && impact.exception_id === pendingException.id;
});

let allPassed = true;

if (impactedReport) {
  console.log("\n✅ 找到刚同步的报表记录！");
  console.log("  科室:", impactedReport.department);
  console.log("  日期:", impactedReport.report_date);
  const impact = impactedReport.exception_impact;
  console.log("  exception_id:", impact.exception_id);
  console.log("  severity:", impact.severity);
  console.log("  conclusion (前30字):", String(impact.conclusion).slice(0, 30) + "...");
  console.log("  synced_at:", impact.synced_at ? "已设置" : "未设置");
  console.log("  patient_name:", impact.patient_name);

  if (impact.conclusion === testConclusion) {
    console.log("\n✅ 结论完全匹配！同步成功！");
  } else {
    console.log("\n❌ 结论不匹配！");
    allPassed = false;
  }

  if (impact.severity === pendingException.severity) {
    console.log("✅ 严重程度正确同步！");
  } else {
    console.log("❌ 严重程度不匹配！");
    allPassed = false;
  }
} else {
  console.log("\n❌ 未找到刚同步的报表记录！");
  allPassed = false;
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
  allPassed = false;
}

// 测试 closed 状态也会同步
console.log("\n=== 额外测试：closed 状态也同步 ===");
const pending2 = mockPermissionExceptions.find((e) => e.status === "pending");
if (pending2) {
  const closedConclusion = "病例权限不足，已关闭并转交上级处理。";
  handlePermissionException(pending2.id, "closed", closedConclusion, "u-002");
  const closedReport = mockAppointmentReports.find(
    (r) => r.exception_impact && r.exception_impact.exception_id === pending2.id
  );
  if (closedReport && closedReport.exception_impact.conclusion === closedConclusion) {
    console.log("✅ closed 状态也能正确同步至号源报表！");
  } else {
    console.log("❌ closed 状态同步失败！");
    allPassed = false;
  }
} else {
  console.log("⚠️  没有更多待处理异常可测试 closed 状态");
}

console.log("\n=== 总结 ===");
if (allPassed) {
  console.log("✅ 所有测试通过！权限异常 → 号源报表同步逻辑正确。");
  process.exit(0);
} else {
  console.log("❌ 部分测试失败，请检查代码。");
  process.exit(1);
}
