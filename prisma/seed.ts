import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const patient1Id = crypto.randomUUID();
  const patient2Id = crypto.randomUUID();
  const patient3Id = crypto.randomUUID();
  const patient4Id = crypto.randomUUID();
  const patient5Id = crypto.randomUUID();

  const patients = [
    {
      id: patient1Id,
      name: "张伟",
      gender: "MALE" as const,
      birthDate: new Date("1985-03-15"),
      phone: "13800138001",
      allergies: "青霉素过敏",
    },
    {
      id: patient2Id,
      name: "李芳",
      gender: "FEMALE" as const,
      birthDate: new Date("1992-07-22"),
      phone: "13900139002",
      allergies: "",
    },
    {
      id: patient3Id,
      name: "王建国",
      gender: "MALE" as const,
      birthDate: new Date("1978-11-08"),
      phone: "13700137003",
      allergies: "花粉过敏",
    },
    {
      id: patient4Id,
      name: "赵雪梅",
      gender: "FEMALE" as const,
      birthDate: new Date("1990-01-30"),
      phone: "13600136004",
      allergies: "",
    },
    {
      id: patient5Id,
      name: "陈大明",
      gender: "MALE" as const,
      birthDate: new Date("1965-09-12"),
      phone: "13500135005",
      allergies: "磺胺类药物过敏",
    },
  ];

  await prisma.patient.createMany({ data: patients });

  const doctor1Id = "user_2aBcDeFgHiJkLmNoPqRsT";
  const doctor2Id = "user_3bCdEfGhIjKlMnOpQrStU";

  const record1Id = crypto.randomUUID();
  const record2Id = crypto.randomUUID();
  const record3Id = crypto.randomUUID();
  const record4Id = crypto.randomUUID();
  const record5Id = crypto.randomUUID();
  const record6Id = crypto.randomUUID();
  const record7Id = crypto.randomUUID();
  const record8Id = crypto.randomUUID();

  const medicalRecords = [
    {
      id: record1Id,
      patientId: patient1Id,
      doctorId: doctor1Id,
      chiefComplaint: "颈项强痛一月余，活动受限",
      diagnosis: "风寒阻络型项痹",
      prescription: "桂枝加葛根汤加减：桂枝10g、葛根30g、白芍15g、生姜3片、大枣6枚、甘草6g",
      summary: "患者长期伏案工作，风寒侵袭太阳经，经气不利，治以解肌祛风、升津舒筋",
      visitDate: new Date("2026-05-10"),
      nextVisitDate: new Date("2026-05-24"),
    },
    {
      id: record2Id,
      patientId: patient2Id,
      doctorId: doctor1Id,
      chiefComplaint: "失眠多梦两月，心烦易怒",
      diagnosis: "肝郁化火型不寐",
      prescription: "丹栀逍遥散合酸枣仁汤：柴胡10g、栀子10g、当归12g、白芍15g、酸枣仁30g、知母10g、茯苓15g、甘草6g",
      summary: "情志不畅，肝气郁结化火，上扰心神，治以疏肝泻火、养心安神",
      visitDate: new Date("2026-05-12"),
      nextVisitDate: new Date("2026-05-26"),
    },
    {
      id: record3Id,
      patientId: patient3Id,
      doctorId: doctor2Id,
      chiefComplaint: "胃脘胀痛半月，食后加重，嗳气频作",
      diagnosis: "脾胃气虚型胃痞",
      prescription: "香砂六君子汤加减：党参15g、白术15g、茯苓15g、陈皮10g、半夏10g、木香6g、砂仁6g、甘草6g",
      summary: "饮食不节损伤脾胃，中焦气机不畅，治以健脾益气、行气消痞",
      visitDate: new Date("2026-05-15"),
      nextVisitDate: new Date("2026-05-29"),
    },
    {
      id: record4Id,
      patientId: patient4Id,
      doctorId: doctor1Id,
      chiefComplaint: "腰膝酸软半年，手足心热，盗汗",
      diagnosis: "肾阴亏虚型腰痛",
      prescription: "六味地黄丸加减：熟地黄24g、山茱萸12g、山药12g、泽泻9g、牡丹皮9g、茯苓9g、杜仲15g、牛膝12g",
      summary: "先天不足兼久病伤阴，肾精亏虚，治以滋阴补肾、强腰健骨",
      visitDate: new Date("2026-05-18"),
      nextVisitDate: new Date("2026-06-01"),
    },
    {
      id: record5Id,
      patientId: patient5Id,
      doctorId: doctor2Id,
      chiefComplaint: "头晕目眩反复发作，伴耳鸣",
      diagnosis: "肝阳上亢型眩晕",
      prescription: "天麻钩藤饮加减：天麻10g、钩藤15g、石决明30g、栀子10g、黄芩10g、牛膝12g、杜仲15g、益母草15g",
      summary: "年老体虚，水不涵木，肝阳偏亢上扰清窍，治以平肝潜阳、滋水涵木",
      visitDate: new Date("2026-05-20"),
      nextVisitDate: new Date("2026-06-03"),
    },
    {
      id: record6Id,
      patientId: patient1Id,
      doctorId: doctor2Id,
      chiefComplaint: "颈痛复诊，活动度改善，仍有僵硬感",
      diagnosis: "风寒阻络型项痹（好转期）",
      prescription: "桂枝加葛根汤合羌活胜湿汤：桂枝10g、葛根30g、羌活10g、独活10g、防风10g、川芎10g、甘草6g",
      summary: "前方有效，风邪渐祛但湿邪未尽，加祛湿之品以善其后",
      visitDate: new Date("2026-05-24"),
      nextVisitDate: new Date("2026-06-07"),
    },
    {
      id: record7Id,
      patientId: patient2Id,
      doctorId: doctor1Id,
      chiefComplaint: "失眠好转，但仍有早醒，伴口干",
      diagnosis: "肝郁化火型不寐（好转期，阴伤显现）",
      prescription: "酸枣仁汤合天王补心丹：酸枣仁30g、柏子仁15g、麦冬15g、生地黄15g、当归12g、五味子6g、甘草6g",
      summary: "肝火已平，阴伤渐显，转以滋阴养血、安神定志为法",
      visitDate: new Date("2026-05-26"),
      nextVisitDate: new Date("2026-06-09"),
    },
    {
      id: record8Id,
      patientId: patient3Id,
      doctorId: doctor2Id,
      chiefComplaint: "胃脘胀痛减轻，但纳差便溏",
      diagnosis: "脾胃气虚型胃痞（脾虚明显）",
      prescription: "参苓白术散加减：党参15g、白术15g、茯苓15g、山药15g、莲子肉10g、薏苡仁30g、砂仁6g、桔梗6g、甘草6g",
      summary: "气机渐畅但脾虚运化无力，加重健脾渗湿之力",
      visitDate: new Date("2026-05-29"),
      nextVisitDate: new Date("2026-06-12"),
    },
  ];

  await prisma.medicalRecord.createMany({ data: medicalRecords });

  const task1Id = crypto.randomUUID();
  const task2Id = crypto.randomUUID();
  const task3Id = crypto.randomUUID();
  const task4Id = crypto.randomUUID();
  const task5Id = crypto.randomUUID();
  const task6Id = crypto.randomUUID();
  const task7Id = crypto.randomUUID();
  const task8Id = crypto.randomUUID();
  const task9Id = crypto.randomUUID();
  const task10Id = crypto.randomUUID();

  const followUpTasks = [
    {
      id: task1Id,
      patientId: patient1Id,
      medicalRecordId: record1Id,
      assigneeId: doctor1Id,
      status: "COMPLETED" as const,
      dueDate: new Date("2026-05-17"),
      completedAt: new Date("2026-05-16T10:30:00"),
      qualityScore: 90,
    },
    {
      id: task2Id,
      patientId: patient2Id,
      medicalRecordId: record2Id,
      assigneeId: doctor1Id,
      status: "COMPLETED" as const,
      dueDate: new Date("2026-05-19"),
      completedAt: new Date("2026-05-19T14:20:00"),
      qualityScore: 85,
    },
    {
      id: task3Id,
      patientId: patient3Id,
      medicalRecordId: record3Id,
      assigneeId: doctor2Id,
      status: "COMPLETED" as const,
      dueDate: new Date("2026-05-22"),
      completedAt: new Date("2026-05-22T09:15:00"),
      qualityScore: 88,
    },
    {
      id: task4Id,
      patientId: patient4Id,
      medicalRecordId: record4Id,
      assigneeId: doctor1Id,
      status: "IN_PROGRESS" as const,
      dueDate: new Date("2026-06-08"),
    },
    {
      id: task5Id,
      patientId: patient5Id,
      medicalRecordId: record5Id,
      assigneeId: doctor2Id,
      status: "PENDING" as const,
      dueDate: new Date("2026-06-10"),
    },
    {
      id: task6Id,
      patientId: patient1Id,
      medicalRecordId: record6Id,
      assigneeId: doctor2Id,
      status: "PENDING" as const,
      dueDate: new Date("2026-06-14"),
    },
    {
      id: task7Id,
      patientId: patient2Id,
      medicalRecordId: record7Id,
      assigneeId: doctor1Id,
      status: "PENDING" as const,
      dueDate: new Date("2026-06-16"),
    },
    {
      id: task8Id,
      patientId: patient3Id,
      medicalRecordId: record8Id,
      assigneeId: doctor2Id,
      status: "IN_PROGRESS" as const,
      dueDate: new Date("2026-06-19"),
    },
    {
      id: task9Id,
      patientId: patient4Id,
      medicalRecordId: record4Id,
      assigneeId: doctor1Id,
      status: "LOST" as const,
      dueDate: new Date("2026-05-25"),
    },
    {
      id: task10Id,
      patientId: patient5Id,
      medicalRecordId: record5Id,
      status: "PENDING" as const,
      dueDate: new Date("2026-06-17"),
    },
  ];

  await prisma.followUpTask.createMany({ data: followUpTasks });

  const followUpRecords = [
    {
      id: crypto.randomUUID(),
      followUpTaskId: task1Id,
      operatorId: doctor1Id,
      content: "电话回访：患者颈部疼痛明显缓解，活动度改善约七成，僵硬感仍存。已嘱继续服药并配合颈部功能锻炼，两周后复诊。",
      patientFeedback: "感觉好多了，脖子没以前那么痛了，就是早上起来还是有点僵",
    },
    {
      id: crypto.randomUUID(),
      followUpTaskId: task2Id,
      operatorId: doctor1Id,
      content: "电话回访：患者睡眠较前改善，入睡时间缩短，但仍有早醒情况。口干明显。已告知下次就诊调整方药，加强滋阴之力。",
      patientFeedback: "现在大概半小时能睡着了，比之前好，但四五点就醒了，嘴里干",
    },
    {
      id: crypto.randomUUID(),
      followUpTaskId: task3Id,
      operatorId: doctor2Id,
      content: "微信回访：患者胃脘胀痛减轻，嗳气减少，但仍纳差、大便偏稀。建议饮食清淡忌生冷，下次复诊调整方药加强健脾渗湿。",
      patientFeedback: "胃不怎么胀了，但吃饭还是没胃口，大便有点稀",
    },
    {
      id: crypto.randomUUID(),
      followUpTaskId: task4Id,
      operatorId: doctor1Id,
      content: "短信提醒已发送，等待患者回复确认复诊时间。患者已回复确认6月1日来诊。",
      patientFeedback: "好的，我6月1号来",
    },
    {
      id: crypto.randomUUID(),
      followUpTaskId: task8Id,
      operatorId: doctor2Id,
      content: "电话回访：患者胃脘胀痛基本缓解，食欲有所恢复，大便仍偏软。嘱其继续服药，注意饮食调理。",
      patientFeedback: "胃基本不痛了，能吃点东西了，大便还是有点软",
    },
  ];

  await prisma.followUpRecord.createMany({ data: followUpRecords });

  const auditLogs = [
    {
      id: crypto.randomUUID(),
      entityType: "MedicalRecord",
      entityId: record1Id,
      fieldName: "prescription",
      oldValue: "桂枝加葛根汤：桂枝10g、葛根30g、白芍15g、甘草6g",
      newValue: "桂枝加葛根汤加减：桂枝10g、葛根30g、白芍15g、生姜3片、大枣6枚、甘草6g",
      operatorId: doctor1Id,
    },
    {
      id: crypto.randomUUID(),
      entityType: "MedicalRecord",
      entityId: record2Id,
      fieldName: "diagnosis",
      oldValue: "不寐",
      newValue: "肝郁化火型不寐",
      operatorId: doctor1Id,
    },
    {
      id: crypto.randomUUID(),
      entityType: "FollowUpTask",
      entityId: task1Id,
      fieldName: "status",
      oldValue: "PENDING",
      newValue: "COMPLETED",
      operatorId: doctor1Id,
    },
    {
      id: crypto.randomUUID(),
      entityType: "Appointment",
      entityId: crypto.randomUUID(),
      fieldName: "status",
      oldValue: "SCHEDULED",
      newValue: "CONFLICT",
      operatorId: doctor2Id,
    },
  ];

  await prisma.auditLog.createMany({ data: auditLogs });

  const conflictApptId = crypto.randomUUID();

  const appointments = [
    {
      id: conflictApptId,
      patientId: patient1Id,
      doctorId: doctor1Id,
      appointmentDate: new Date("2026-06-07"),
      timeSlot: "09:00-09:30",
      status: "CONFLICT" as const,
      conflictId: crypto.randomUUID(),
    },
    {
      id: crypto.randomUUID(),
      patientId: patient2Id,
      doctorId: doctor1Id,
      appointmentDate: new Date("2026-06-09"),
      timeSlot: "10:00-10:30",
      status: "SCHEDULED" as const,
    },
    {
      id: crypto.randomUUID(),
      patientId: patient3Id,
      doctorId: doctor2Id,
      appointmentDate: new Date("2026-06-12"),
      timeSlot: "14:00-14:30",
      status: "SCHEDULED" as const,
    },
    {
      id: crypto.randomUUID(),
      patientId: patient4Id,
      doctorId: doctor1Id,
      appointmentDate: new Date("2026-06-01"),
      timeSlot: "09:00-09:30",
      status: "CONFLICT" as const,
      conflictId: conflictApptId,
    },
    {
      id: crypto.randomUUID(),
      patientId: patient5Id,
      doctorId: doctor2Id,
      appointmentDate: new Date("2026-06-03"),
      timeSlot: "15:00-15:30",
      status: "CANCELLED" as const,
    },
  ];

  await prisma.appointment.createMany({ data: appointments });

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
