import type {
  Campus, Staff, Lead, FollowUp, Trial, Student, Class, Lesson,
  Attendance, Consumption, Revision, Work, WorkFeedback,
  QuestionBankVersion, ParentFeedback, OperationLog, ExportTask, SettingRule,
} from "@/types";

function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function daysAgo(n: number, h = 10, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return d;
}

function daysLater(n: number, h = 10, m = 0) {
  return daysAgo(-n, h, m);
}

// ============ Seed data ============

export const campus: Campus = {
  id: "cmp_main",
  name: "星辰艺术培训 · 海淀校区",
  address: "北京市海淀区中关村大街 28 号艺术大厦 6 层",
  phone: "010-8888-6666",
  logoUrl: "https://images.unsplash.com/photo-1579389083078-4e7018379f7e?w=160&auto=format&fit=crop",
  createdAt: daysAgo(365),
};

export const staff: Staff[] = [
  { id: "st_principal", clerkUserId: "user_principal", campusId: campus.id, name: "李砚秋", email: "liyanqiu@artstars.cn", role: "PRINCIPAL", status: "ACTIVE", createdAt: daysAgo(300) },
  { id: "st_jiaowu_1", clerkUserId: "user_jiaowu1", campusId: campus.id, name: "王慧琳", email: "wanghuilin@artstars.cn", role: "ACADEMIC_AFFAIRS", status: "ACTIVE", createdAt: daysAgo(200) },
  { id: "st_jiaowu_2", clerkUserId: "user_jiaowu2", campusId: campus.id, name: "赵文博", email: "zhaowenbo@artstars.cn", role: "ACADEMIC_AFFAIRS", status: "ACTIVE", createdAt: daysAgo(150) },
  { id: "st_teach_1", clerkUserId: "user_teach1", campusId: campus.id, name: "陈梦芸", email: "chenmengyun@artstars.cn", role: "TEACHING_LEAD", status: "ACTIVE", createdAt: daysAgo(260) },
  { id: "st_teach_2", clerkUserId: "user_teach2", campusId: campus.id, name: "刘子墨", email: "liuzimo@artstars.cn", role: "TEACHING_LEAD", status: "ACTIVE", createdAt: daysAgo(210) },
  { id: "st_finance", clerkUserId: "user_finance", campusId: campus.id, name: "周雅琴", email: "zhouyaqin@artstars.cn", role: "FINANCE", status: "ACTIVE", createdAt: daysAgo(180) },
];

export const settingRules: SettingRule = {
  id: "rule_1", campusId: campus.id,
  trialFollowUpHours: 24, renewalHighRiskHours: 10,
  renewalMidRiskHours: 20, feedbackTimeoutHours: 48,
  createdAt: daysAgo(300),
};

export const leads: Lead[] = [
  { id: "ld_001", campusId: campus.id, name: "张亦晨", phone: "138****1122", parentName: "张建军", source: "抖音广告", intendedMajor: "FINE_ARTS", status: "FOLLOWING", level: "HOT", assigneeId: "st_jiaowu_1", tags: ["高三", "目标央美"], createdAt: daysAgo(5) },
  { id: "ld_002", campusId: campus.id, name: "林语菲", phone: "139****3344", parentName: "林振华", source: "转介绍", intendedMajor: "DESIGN", status: "TRIAL_SCHEDULED", level: "HOT", assigneeId: "st_jiaowu_1", tags: ["高二", "视觉传达"], createdAt: daysAgo(3) },
  { id: "ld_003", campusId: campus.id, name: "王昱衡", phone: "137****5566", parentName: "王建国", source: "线下活动", intendedMajor: "MEDIA", status: "NEW", level: "WARM", tags: ["升高二"], createdAt: daysAgo(1, 16, 20) },
  { id: "ld_004", campusId: campus.id, name: "宋诗琪", phone: "136****7788", parentName: "宋晓东", source: "百度SEM", intendedMajor: "FINE_ARTS", status: "TRIAL_DONE", level: "HOT", assigneeId: "st_jiaowu_2", tags: ["高三", "需二次跟进"], remark: "试听后家长反馈良好，对央美定向班有兴趣", createdAt: daysAgo(4) },
  { id: "ld_005", campusId: campus.id, name: "周子涵", phone: "135****9900", parentName: "周敏", source: "小红书", intendedMajor: "DANCE", status: "FOLLOWING", level: "WARM", assigneeId: "st_jiaowu_2", tags: ["高一"], createdAt: daysAgo(7) },
  { id: "ld_006", campusId: campus.id, name: "吴天烁", phone: "134****1133", parentName: "吴昊", source: "转介绍", intendedMajor: "DESIGN", status: "CONVERTED", level: "HOT", assigneeId: "st_jiaowu_1", tags: ["高三"], createdAt: daysAgo(20) },
  { id: "ld_007", campusId: campus.id, name: "郑予希", phone: "133****2244", parentName: "郑凯", source: "抖音广告", intendedMajor: "MUSIC", status: "LOST", level: "COLD", tags: [], remark: "距离太远，选择其他机构", createdAt: daysAgo(10) },
  { id: "ld_008", campusId: campus.id, name: "何嘉豪", phone: "132****3355", parentName: "何伟", source: "线下活动", intendedMajor: "FINE_ARTS", status: "NEW", level: "COLD", tags: [], createdAt: daysAgo(0, 9, 30) },
  { id: "ld_009", campusId: campus.id, name: "谢思远", phone: "131****4466", parentName: "谢琳", source: "小红书", intendedMajor: "DESIGN", status: "FOLLOWING", level: "WARM", assigneeId: "st_jiaowu_2", tags: ["升高三"], createdAt: daysAgo(6) },
  { id: "ld_010", campusId: campus.id, name: "冯悦然", phone: "130****5577", parentName: "冯丽", source: "百度SEM", intendedMajor: "MEDIA", status: "TRIAL_SCHEDULED", level: "HOT", assigneeId: "st_jiaowu_1", tags: [], createdAt: daysAgo(2) },
];

export const followUps: FollowUp[] = [
  { id: uid("fu_"), leadId: "ld_001", staffId: "st_jiaowu_1", type: "PHONE", content: "首次电话沟通，孩子目前在高二，暑期想加强素描基础，下周预约到访", nextFollowAt: daysLater(2), createdAt: daysAgo(5) },
  { id: uid("fu_"), leadId: "ld_001", staffId: "st_jiaowu_1", type: "WECHAT", content: "微信发送课程介绍及校区环境照片，家长回复感谢", createdAt: daysAgo(4) },
  { id: uid("fu_"), leadId: "ld_002", staffId: "st_jiaowu_1", type: "PHONE", content: "电话邀约试听成功，安排本周六上午10点设计体验课", createdAt: daysAgo(2) },
  { id: uid("fu_"), leadId: "ld_004", staffId: "st_jiaowu_2", type: "VISIT", content: "到访面谈，家长询问央美定向班升学数据，已详细解答", nextFollowAt: daysLater(1), createdAt: daysAgo(2) },
  { id: uid("fu_"), leadId: "ld_005", staffId: "st_jiaowu_2", type: "WECHAT", content: "发送舞蹈课课表及收费标准", createdAt: daysAgo(6) },
  { id: uid("fu_"), leadId: "ld_009", staffId: "st_jiaowu_2", type: "PHONE", content: "已接通，孩子升高三，文化课成绩约450分，考虑参加暑期集训营", nextFollowAt: daysLater(3), createdAt: daysAgo(1) },
];

export const trials: Trial[] = [
  { id: "tr_001", leadId: "ld_002", scheduledById: "st_jiaowu_1", trialAt: daysLater(2, 10), durationMinutes: 90, className: "设计体验课", teacherName: "陈梦芸", status: "SCHEDULED", followedUp: false, createdAt: daysAgo(2) },
  { id: "tr_002", leadId: "ld_004", scheduledById: "st_jiaowu_2", trialAt: daysAgo(1, 14), durationMinutes: 120, className: "素描基础体验", teacherName: "刘子墨", status: "COMPLETED", followedUp: false, satisfaction: 5, parentFeedback: "老师讲得很详细，孩子很有收获", intentionLevel: "HIGH", teacherRemark: "造型基础较好，理解速度快", createdAt: daysAgo(5) },
  { id: "tr_003", leadId: "ld_010", scheduledById: "st_jiaowu_1", trialAt: daysLater(1, 15, 30), durationMinutes: 90, className: "数字媒体介绍课", teacherName: "陈梦芸", status: "SCHEDULED", followedUp: false, createdAt: daysAgo(1) },
  { id: "tr_004", leadId: "ld_005", scheduledById: "st_jiaowu_2", trialAt: daysAgo(3, 9), durationMinutes: 60, className: "形体体验课", status: "COMPLETED", followedUp: true, satisfaction: 4, intentionLevel: "MEDIUM", teacherRemark: "柔韧性需加强", createdAt: daysAgo(4) },
  { id: "tr_005", leadId: "ld_003", scheduledById: "st_jiaowu_1", trialAt: daysAgo(2, 10), durationMinutes: 90, className: "影视编导体验", status: "NO_SHOW", followedUp: false, createdAt: daysAgo(3) },
];

export const students: Student[] = [
  { id: "sd_001", campusId: campus.id, leadId: "ld_006", name: "吴天烁", gender: "男", grade: "高三", phone: "134****1133", totalHours: 240, remainingHours: 8, status: "ACTIVE", createdAt: daysAgo(80) },
  { id: "sd_002", campusId: campus.id, name: "苏梓涵", gender: "女", grade: "高二", phone: "138****2211", totalHours: 180, remainingHours: 42, status: "ACTIVE", createdAt: daysAgo(120) },
  { id: "sd_003", campusId: campus.id, name: "徐浩宇", gender: "男", grade: "高三", phone: "139****3311", totalHours: 300, remainingHours: 65, status: "ACTIVE", createdAt: daysAgo(150) },
  { id: "sd_004", campusId: campus.id, name: "杨若曦", gender: "女", grade: "高二", phone: "136****4411", totalHours: 160, remainingHours: 96, status: "ACTIVE", createdAt: daysAgo(90) },
  { id: "sd_005", campusId: campus.id, name: "高俊杰", gender: "男", grade: "升高三", phone: "137****5511", totalHours: 200, remainingHours: 140, status: "ACTIVE", createdAt: daysAgo(45) },
  { id: "sd_006", campusId: campus.id, name: "黄思颖", gender: "女", grade: "高三", phone: "135****6611", totalHours: 220, remainingHours: 12, status: "ACTIVE", createdAt: daysAgo(160) },
  { id: "sd_007", campusId: campus.id, name: "郭奕辰", gender: "男", grade: "高一", phone: "134****7711", totalHours: 120, remainingHours: 88, status: "ACTIVE", createdAt: daysAgo(60) },
  { id: "sd_008", campusId: campus.id, name: "林嘉欣", gender: "女", grade: "高二", phone: "133****8811", totalHours: 150, remainingHours: 17, status: "ACTIVE", createdAt: daysAgo(130) },
  { id: "sd_009", campusId: campus.id, name: "邓文博", gender: "男", grade: "高三", totalHours: 180, remainingHours: 120, status: "ACTIVE", createdAt: daysAgo(35) },
  { id: "sd_010", campusId: campus.id, name: "赖妤薇", gender: "女", grade: "升高二", totalHours: 100, remainingHours: 95, status: "ACTIVE", createdAt: daysAgo(20) },
  { id: "sd_011", campusId: campus.id, name: "姚俊豪", gender: "男", grade: "高三", totalHours: 200, remainingHours: 3, status: "ACTIVE", createdAt: daysAgo(170) },
  { id: "sd_012", campusId: campus.id, name: "韩思雨", gender: "女", grade: "高二", totalHours: 160, remainingHours: 6, status: "ACTIVE", createdAt: daysAgo(110) },
];

export const classes: Class[] = [
  { id: "cl_001", campusId: campus.id, name: "央美定向强化班", major: "FINE_ARTS", totalHours: 320, maxStudents: 15, status: "ONGOING", questionBankVersionId: "qb_v3", startDate: daysAgo(150), endDate: daysLater(60), teacherIds: ["st_teach_1", "st_teach_2"], studentIds: ["sd_001", "sd_003", "sd_006", "sd_011"], createdAt: daysAgo(160) },
  { id: "cl_002", campusId: campus.id, name: "视觉传达设计班", major: "DESIGN", totalHours: 240, maxStudents: 20, status: "ONGOING", questionBankVersionId: "qb_v2", startDate: daysAgo(120), endDate: daysLater(90), teacherIds: ["st_teach_1"], studentIds: ["sd_002", "sd_004", "sd_007", "sd_008", "sd_012"], createdAt: daysAgo(130) },
  { id: "cl_003", campusId: campus.id, name: "暑期基础集训营", major: "FINE_ARTS", totalHours: 160, maxStudents: 25, status: "PENDING", questionBankVersionId: "qb_v4", startDate: daysLater(10), endDate: daysLater(50), teacherIds: ["st_teach_2"], studentIds: ["sd_005", "sd_009", "sd_010"], createdAt: daysAgo(20) },
  { id: "cl_004", campusId: campus.id, name: "数字媒体创作班", major: "MEDIA", totalHours: 200, maxStudents: 18, status: "ONGOING", questionBankVersionId: "qb_v1", startDate: daysAgo(90), endDate: daysLater(120), teacherIds: ["st_teach_1", "st_teach_2"], studentIds: ["sd_004", "sd_007"], createdAt: daysAgo(100) },
];

export const lessons: Lesson[] = (() => {
  const arr: Lesson[] = [];
  // Generate 12 past lessons for cl_001 (MWF 9:00 2h)
  for (let i = 11; i >= 0; i--) {
    const offset = i * 3;
    arr.push({
      id: `ls_001_${12 - i}`, classId: "cl_001", title: `素描静物 · 第${12 - i}讲`,
      startAt: daysAgo(offset, 9), durationHours: 2, status: "COMPLETED",
      room: "A601", teacherRemark: i < 3 ? "整体造型感进步明显" : undefined,
      createdAt: daysAgo(offset + 1),
    });
  }
  // 4 upcoming for cl_001
  for (let i = 0; i < 4; i++) {
    const offset = i * 3 + 3;
    arr.push({
      id: `ls_001_fut_${i + 1}`, classId: "cl_001", title: `真人头像 · 第${i + 1}讲`,
      startAt: daysLater(offset, 9), durationHours: 2, status: "PLANNED",
      room: "A601", createdAt: daysAgo(0),
    });
  }
  // 8 past for cl_002
  for (let i = 7; i >= 0; i--) {
    const offset = i * 4 + 1;
    arr.push({
      id: `ls_002_${8 - i}`, classId: "cl_002", title: `版式设计原理 · 第${8 - i}讲`,
      startAt: daysAgo(offset, 14), durationHours: 2, status: "COMPLETED",
      room: "A603", createdAt: daysAgo(offset + 1),
    });
  }
  // cl_003 future
  for (let i = 0; i < 6; i++) {
    arr.push({
      id: `ls_003_${i + 1}`, classId: "cl_003", title: `基础结构素描 · 第${i + 1}讲`,
      startAt: daysLater(10 + i * 2, 9), durationHours: 3, status: "PLANNED",
      room: "A602", createdAt: daysAgo(0),
    });
  }
  return arr;
})();

export const attendances: Attendance[] = (() => {
  const arr: Attendance[] = [];
  // For cl_001 completed lessons, generate attendance
  classes.find(c => c.id === "cl_001")!.studentIds.forEach((sid) => {
    lessons.filter(l => l.classId === "cl_001" && l.status === "COMPLETED").forEach((l, idx) => {
      arr.push({
        id: uid("att_"), lessonId: l.id, studentId: sid,
        status: sid === "sd_006" && idx === 10 ? "LEAVE" : (sid === "sd_011" && idx === 9 ? "LATE" : "PRESENT"),
        signedAt: l.startAt, createdAt: l.startAt,
      });
    });
  });
  classes.find(c => c.id === "cl_002")!.studentIds.forEach((sid) => {
    lessons.filter(l => l.classId === "cl_002").forEach((l, idx) => {
      arr.push({
        id: uid("att_"), lessonId: l.id, studentId: sid,
        status: sid === "sd_012" && idx === 5 ? "ABSENT" : "PRESENT",
        signedAt: l.startAt, createdAt: l.startAt,
      });
    });
  });
  return arr;
})();

export const consumptions: Consumption[] = (() => {
  const arr: Consumption[] = [];
  attendances.forEach(a => {
    if (a.status === "ABSENT") return;
    const lesson = lessons.find(l => l.id === a.lessonId)!;
    arr.push({
      id: uid("cons_"), lessonId: a.lessonId, studentId: a.studentId, classId: lesson.classId,
      operatorId: "st_teach_1", hours: a.status === "LATE" ? lesson.durationHours : lesson.durationHours,
      status: a.lessonId === "ls_001_8" && a.studentId === "sd_001" ? "EXCEPTION" : "NORMAL",
      remark: a.status === "LATE" ? "学员迟到15分钟，仍全额消课" : undefined,
      createdAt: new Date(lesson.startAt.getTime() + lesson.durationHours * 3600000 + 600000),
    });
  });
  return arr;
})();

export const revisions: Revision[] = [
  { id: uid("rev_"), consumptionId: consumptions[consumptions.findIndex(c => c.status === "EXCEPTION")]?.id || "none",
    beforeData: { hours: 2 }, afterData: { hours: 1, remark: "家长申诉，同意减半消课" }, operatorId: "st_principal", createdAt: daysAgo(1, 15) },
];

export const works: Work[] = [
  { id: "wk_001", studentId: "sd_001", title: "静物素描 · 陶罐组合", imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop", submittedAt: daysAgo(12), createdAt: daysAgo(12) },
  { id: "wk_002", studentId: "sd_002", title: "品牌VI延展练习", imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b8?w=500&auto=format&fit=crop", submittedAt: daysAgo(10), createdAt: daysAgo(10) },
  { id: "wk_003", studentId: "sd_003", title: "石膏像素描", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&auto=format&fit=crop", submittedAt: daysAgo(8), createdAt: daysAgo(8) },
  { id: "wk_004", studentId: "sd_004", title: "海报设计 · 环保主题", imageUrl: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=500&auto=format&fit=crop", submittedAt: daysAgo(6), createdAt: daysAgo(6) },
  { id: "wk_005", studentId: "sd_006", title: "色彩构成练习", imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500&auto=format&fit=crop", submittedAt: daysAgo(5), createdAt: daysAgo(5) },
  { id: "wk_006", studentId: "sd_001", title: "色彩静物", imageUrl: "https://images.unsplash.com/photo-1549289524-06cf8837ace5?w=500&auto=format&fit=crop", submittedAt: daysAgo(4), createdAt: daysAgo(4) },
  { id: "wk_007", studentId: "sd_003", title: "半身像素描", imageUrl: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=500&auto=format&fit=crop", submittedAt: daysAgo(3), createdAt: daysAgo(3) },
  { id: "wk_008", studentId: "sd_007", title: "插画风格探索", imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop", submittedAt: daysAgo(2), createdAt: daysAgo(2) },
];

export const workFeedbacks: WorkFeedback[] = [
  { id: uid("wf_"), workId: "wk_001", teacherId: "st_teach_1", compositionScore: 85, colorScore: 82, creativityScore: 78, techniqueScore: 86, overallScore: 83, comment: "构图完整，明暗交界线过渡自然，陶罐反光质感处理优秀，背景建议再虚化。", createdAt: daysAgo(11), updatedAt: daysAgo(11) },
  { id: uid("wf_"), workId: "wk_002", teacherId: "st_teach_1", compositionScore: 90, colorScore: 88, creativityScore: 92, techniqueScore: 84, overallScore: 89, comment: "品牌调性把握准确，延展应用场景丰富，字体搭配有巧思。", createdAt: daysAgo(9), updatedAt: daysAgo(9) },
  { id: uid("wf_"), workId: "wk_003", teacherId: "st_teach_2", compositionScore: 80, colorScore: 0, creativityScore: 82, techniqueScore: 79, overallScore: 80, comment: "石膏结构准确，明暗五调子层次清晰，五官比例可再精细。", createdAt: daysAgo(7), updatedAt: daysAgo(7) },
  { id: uid("wf_"), workId: "wk_005", teacherId: "st_teach_2", compositionScore: 83, colorScore: 86, creativityScore: 79, techniqueScore: 81, overallScore: 82, comment: "色彩饱和度控制得当，互补色运用和谐。", createdAt: daysAgo(4), updatedAt: daysAgo(4) },
  { id: uid("wf_"), workId: "wk_006", teacherId: "st_teach_1", compositionScore: 88, colorScore: 84, creativityScore: 86, techniqueScore: 87, overallScore: 86, comment: "进步明显！整体画面节奏好，衬布褶皱处理再耐心些。", createdAt: daysAgo(2), updatedAt: daysAgo(2) },
];

export const questionBankVersions: QuestionBankVersion[] = [
  { id: "qb_v1", questionBankId: "qb_media", versionNo: "v1.2.0", enabledAt: daysAgo(180), changelog: "新增 Pr 基础剪辑案例 5 个", major: "MEDIA", createdAt: daysAgo(180) },
  { id: "qb_v2", questionBankId: "qb_design", versionNo: "v2.1.0", enabledAt: daysAgo(120), changelog: "新增 2024 央美设计真题解析 · 版式专项", major: "DESIGN", createdAt: daysAgo(120) },
  { id: "qb_v3", questionBankId: "qb_fine", versionNo: "v3.4.1", enabledAt: daysAgo(90), changelog: "修订素描静物步骤范画 · 补充 2024 联考考题", major: "FINE_ARTS", createdAt: daysAgo(90) },
  { id: "qb_v4", questionBankId: "qb_fine", versionNo: "v3.5.0", enabledAt: daysLater(10), changelog: "新增暑期基础集训营配套训练手册 v1", major: "FINE_ARTS", createdAt: daysAgo(3) },
];

export const parentFeedbacks: ParentFeedback[] = [
  { id: "pf_001", studentId: "sd_001", title: "关于本周作业量的咨询", content: "老师好，想问下本周的素描作业预计需要多久完成？孩子还有学校作业，时间较紧张。", status: "READ", reply: "家长您好，本周作业为一张长期素描，建议用时 4-5 小时，可分两天完成。具体我再和孩子沟通下节奏。", repliedBy: "陈梦芸", repliedAt: daysAgo(3, 10), createdAt: daysAgo(3, 9) },
  { id: "pf_002", studentId: "sd_006", title: "课堂状态反馈", content: "最近感觉孩子画画积极性没以前高，请问老师他课堂表现怎么样？", status: "UNREAD", createdAt: daysAgo(0, 10, 15) },
  { id: "pf_003", studentId: "sd_002", title: "模考成绩出来了吗", content: "上周的设计摸底考试，请问分数可以查了吗？", status: "READ", reply: "已出，已私信发给您，孩子整体表现不错，版式部分还需加强。", repliedBy: "陈梦芸", repliedAt: daysAgo(5, 17), createdAt: daysAgo(5, 15) },
  { id: "pf_004", studentId: "sd_011", title: "续费事宜咨询", content: "我们家天烁剩余课时不多了，想了解下续报有没有优惠政策？", status: "UNREAD", createdAt: daysAgo(0, 8, 40) },
  { id: "pf_005", studentId: "sd_004", title: "请假申请", content: "本周六孩子要参加学校英语模考，需要请假一次课，后续补课怎么安排？", status: "READ", reply: "已记录，稍后教务老师会联系您确认补课时间。", repliedBy: "王慧琳", repliedAt: daysAgo(2, 11), createdAt: daysAgo(2, 10) },
];

export const operationLogs: OperationLog[] = [
  { id: uid("ol_"), staffId: "st_jiaowu_1", module: "LEAD", action: "CREATE", targetId: "ld_001", afterData: { name: "张亦晨" }, ip: "127.0.0.1", createdAt: daysAgo(5) },
  { id: uid("ol_"), staffId: "st_jiaowu_1", module: "LEAD", action: "UPDATE", targetId: "ld_001", beforeData: { status: "NEW" }, afterData: { status: "FOLLOWING" }, ip: "127.0.0.1", createdAt: daysAgo(5, 15) },
  { id: uid("ol_"), staffId: "st_teach_1", module: "CONSUMPTION", action: "CREATE", targetId: "cons_1", afterData: { studentId: "sd_001", hours: 2 }, ip: "127.0.0.1", createdAt: daysAgo(10, 12) },
  { id: uid("ol_"), staffId: "st_principal", module: "CONSUMPTION", action: "REVISE", beforeData: { hours: 2 }, afterData: { hours: 1 }, ip: "127.0.0.1", createdAt: daysAgo(1, 15) },
  { id: uid("ol_"), staffId: "st_jiaowu_1", module: "TRIAL", action: "CREATE", targetId: "tr_001", afterData: { leadId: "ld_002" }, ip: "127.0.0.1", createdAt: daysAgo(2) },
  { id: uid("ol_"), staffId: "st_finance", module: "REPORT", action: "EXPORT", afterData: { fileName: "2026年6月消课明细.xlsx", rows: 186 }, ip: "127.0.0.1", createdAt: daysAgo(1, 18) },
];

export const exportTasks: ExportTask[] = [
  { id: "ex_001", operatorId: "st_finance", fileName: "2026年6月消课明细.xlsx", module: "CONSUMPTION", format: "XLSX", status: "DONE", downloadUrl: "#", doneAt: daysAgo(1, 18, 10), createdAt: daysAgo(1, 18) },
  { id: "ex_002", operatorId: "st_jiaowu_1", fileName: "本月待跟进线索清单.csv", module: "LEAD", format: "CSV", status: "DONE", downloadUrl: "#", doneAt: daysAgo(2, 14, 5), createdAt: daysAgo(2, 14) },
  { id: "ex_003", operatorId: "st_principal", fileName: "续费风险学员名单_202606.xlsx", module: "REPORT", format: "XLSX", status: "PROCESSING", createdAt: daysAgo(0, 9, 0) },
  { id: "ex_004", operatorId: "st_teach_2", fileName: "央美班作品评分汇总.xlsx", module: "WORKS", format: "XLSX", status: "DONE", downloadUrl: "#", doneAt: daysAgo(3, 16, 20), createdAt: daysAgo(3, 16) },
  { id: "ex_005", operatorId: "st_finance", fileName: "5月对账差异记录.csv", module: "AUDIT", format: "CSV", status: "FAILED", createdAt: daysAgo(6, 10) },
];
