import bcrypt from "bcryptjs";
import { formatDate, formatDateTime, getWeekDates } from "@/shared/utils";

type AnyDoc = Record<string, any>;

class DemoStore {
  private data: Record<string, AnyDoc[]> = {};
  private counters: Record<string, number> = {};

  constructor() {
    this.init();
  }

  private id(prefix: string) {
    this.counters[prefix] = (this.counters[prefix] || 0) + 1;
    return `${prefix}_${Date.now().toString(36)}_${this.counters[prefix]}`;
  }

  private init() {
    const now = formatDateTime(new Date());
    const today = formatDate(new Date());

    const users = [
      { _id: "user_admin", username: "admin", name: "北桥教务长", role: "admin", passwordHash: bcrypt.hashSync("admin123", 10) },
      { _id: "user_teacher1", username: "teacher1", name: "小周老师", role: "teacher", passwordHash: bcrypt.hashSync("teacher123", 10) },
      { _id: "user_teacher2", username: "teacher2", name: "小林老师", role: "teacher", passwordHash: bcrypt.hashSync("teacher123", 10) },
      { _id: "user_operator", username: "operator", name: "运营小吴", role: "operator", passwordHash: bcrypt.hashSync("operator123", 10) },
    ];

    const classes = [
      { _id: "cls_scratch_a", name: "Scratch启蒙A班", level: "L1-启蒙", teacherIds: ["user_teacher1"] },
      { _id: "cls_scratch_b", name: "Scratch进阶B班", level: "L2-进阶", teacherIds: ["user_teacher1"] },
      { _id: "cls_python_c", name: "Python入门C班", level: "L3-Python", teacherIds: ["user_teacher2"] },
    ];

    const studentNames = ["张小明", "李华", "王芳", "赵天宇", "钱乐乐", "孙悦", "周子涵", "吴星辰", "郑雨桐", "冯浩然", "陈梓涵", "褚皓轩", "卫欣怡", "蒋雅琪", "沈博文", "韩欣悦"];
    const parents = ["13800138001", "13800138002", "13800138003", "13800138004", "13800138005", "13800138006", "13800138007", "13800138008", "13800138009", "13800138010", "13800138011", "13800138012", "13800138013", "13800138014", "13800138015", "13800138016"];
    const remainingHours = [24, 18, 2, 36, 15, 8, 48, 30, 1, 22, 12, 6, 40, 5, 28, 20];
    const students: AnyDoc[] = studentNames.map((name, i) => ({
      _id: `stu_${i + 1}`,
      name,
      parentPhone: parents[i],
      remainingHours: remainingHours[i],
      classId: classes[i % 3]._id,
      alertThreshold: 3,
      className: classes[i % 3].name,
    }));

    const questionBanks = [
      { _id: "qb_scratch", name: "Scratch图形化编程题库", subject: "Scratch" },
      { _id: "qb_algo", name: "算法思维训练题库", subject: "Algorithms" },
      { _id: "qb_python", name: "Python基础题库", subject: "Python" },
    ];

    const versions = [
      { _id: "qbv_1", bankId: "qb_scratch", bankName: "Scratch图形化编程题库", version: "v2026.03", isActive: true, publishedAt: "2026-03-01 09:00:00", classIds: ["cls_scratch_a"], difficulty: "初级", totalQuestions: 120 },
      { _id: "qbv_2", bankId: "qb_scratch", bankName: "Scratch图形化编程题库", version: "v2025.12", isActive: false, publishedAt: "2025-12-15 09:00:00", difficulty: "初级", totalQuestions: 98 },
      { _id: "qbv_3", bankId: "qb_algo", bankName: "算法思维训练题库", version: "v2026.05", isActive: true, publishedAt: "2026-05-01 09:00:00", classIds: ["cls_scratch_b"], difficulty: "中级", totalQuestions: 85 },
      { _id: "qbv_4", bankId: "qb_python", bankName: "Python基础题库", version: "v2026.04", isActive: true, publishedAt: "2026-04-10 09:00:00", classIds: ["cls_python_c"], difficulty: "中级", totalQuestions: 150 },
    ];

    const weekDates = getWeekDates(new Date());
    const timeSlots = [{ start: "09:00", end: "10:30" }, { start: "10:45", end: "12:15" }, { start: "14:00", end: "15:30" }, { start: "15:45", end: "17:15" }];
    const schedules: AnyDoc[] = [];
    for (let i = 0; i < weekDates.length; i++) {
      if (i === 0 || i === 6) continue;
      const dateStr = formatDate(weekDates[i]);
      classes.forEach((cls, ci) => {
        const slot = timeSlots[(i + ci) % timeSlots.length];
        const versionMap = [versions[0], versions[2], versions[3]];
        const studentsInClass = students.filter((s) => s.classId === cls._id);
        schedules.push({
          _id: `sch_${i}_${ci}`,
          classId: cls._id,
          className: cls.name,
          teacherId: classes[ci].teacherIds[0],
          teacherName: ci === 2 ? "小林老师" : "小周老师",
          date: dateStr,
          startTime: slot.start,
          endTime: slot.end,
          questionBankVersionId: versionMap[ci]._id,
          questionBankVersionName: `${versionMap[ci].version} - ${versionMap[ci].bankName}`,
          status: "pending",
          studentIds: studentsInClass.slice(0, 5).map((s) => s._id),
          createdAt: now,
          updatedAt: now,
        });
      });
    }

    const noticeId = "notice_1";
    const notices = [
      {
        _id: noticeId,
        title: "【重要】2026年暑假集训班报名通知",
        content: "各位家长好，2026年暑假编程集训班现已开放报名。集训班采用小班教学，每班限8人，开设Scratch精英营、Python算法营、信息学奥赛营三大方向。请于6月20日前完成回执确认。早鸟优惠立减500元！",
        senderId: "user_operator",
        senderName: "运营小吴",
        targetType: "all",
        targetIds: [],
        publishedAt: now,
        receiptDeadline: "2026-06-20 18:00:00",
      },
    ];

    const receipts: AnyDoc[] = students.slice(0, 8).map((s, i) => ({
      _id: `rcpt_${i}`,
      noticeId,
      studentId: s._id,
      studentName: s.name,
      parentPhone: s.parentPhone,
      isRead: i < 6,
      isConfirmed: i < 4,
      remindedAt: undefined,
      feedback: i === 0 ? "已确认报名Scratch精英营" : i === 2 ? "考虑中，周末前回复" : undefined,
      readAt: i < 6 ? now : undefined,
      confirmedAt: i < 4 ? now : undefined,
      createdAt: now,
    }));

    const feedbacks = [
      {
        _id: "fb_1",
        studentId: "stu_1",
        studentName: "张小明",
        consumptionId: undefined,
        source: "manual" as const,
        content: "孩子这周对循环结构的理解进步很大，小周老师的讲解特别耐心！",
        rating: 5,
        createdAt: now,
        writerRole: "parent" as const,
      },
      {
        _id: "fb_2",
        studentId: "stu_3",
        studentName: "王芳",
        consumptionId: undefined,
        source: "manual" as const,
        content: "课时即将用完，麻烦老师联系沟通续费方案。",
        rating: 4,
        createdAt: now,
        writerRole: "parent" as const,
      },
    ];

    const consumptions: AnyDoc[] = [];
    for (let i = 0; i < 5; i++) {
      const s = students[i];
      const v = versions[i % versions.length];
      const hours = 1.5;
      const isInsufficient = s.remainingHours <= s.alertThreshold;
      consumptions.push({
        _id: `cons_${i}`,
        studentId: s._id,
        studentName: s.name,
        classId: s.classId,
        className: s.className,
        hours,
        questionBankVersionId: v._id,
        questionBankVersionName: `${v.version} - ${v.bankName}`,
        operatorId: "user_teacher1",
        operatorName: "小周老师",
        isInsufficient,
        insufficientHours: isInsufficient ? Math.max(0, hours - s.remainingHours) : 0,
        remark: "",
        createdAt: formatDateTime(new Date(Date.now() - i * 86400000)),
        auditLogs: [
          {
            id: `audit_cons_${i}`,
            userId: "user_teacher1",
            userName: "小周老师",
            action: "create_consumption",
            targetType: "consumption",
            targetId: `cons_${i}`,
            detail: { studentName: s.name, hours, version: v.version, isInsufficient, shortage: isInsufficient ? Math.max(0, hours - s.remainingHours) : 0 },
            ip: "127.0.0.1",
            createdAt: formatDateTime(new Date(Date.now() - i * 86400000)),
          },
        ],
        feedback: i === 0 ? feedbacks[0] : null,
      });
    }

    const auditLogs: AnyDoc[] = consumptions.flatMap((c) => c.auditLogs);
    auditLogs.push({
      id: "audit_login_admin",
      userId: "user_admin",
      userName: "北桥教务长",
      action: "login",
      targetType: "user",
      targetId: "user_admin",
      detail: {},
      ip: "127.0.0.1",
      createdAt: now,
    });

    this.data = {
      users,
      classes,
      students,
      questionBanks,
      questionBankVersions: versions,
      classSchedules: schedules,
      notices,
      noticeReceipts: receipts,
      feedbacks,
      consumptionRecords: consumptions,
      auditLogs,
    };
    this.data.users.forEach((u) => (u.id = u._id));
    this.data.classes.forEach((c) => (c.id = c._id));
    this.data.students.forEach((s) => (s.id = s._id));
    this.data.questionBankVersions.forEach((v) => (v.id = v._id));
    this.data.classSchedules.forEach((s) => (s.id = s._id));
    this.data.notices.forEach((n) => (n.id = n._id));
    this.data.noticeReceipts.forEach((r) => (r.id = r._id));
    this.data.feedbacks.forEach((f) => (f.id = f._id));
    this.data.consumptionRecords.forEach((c) => (c.id = c._id));
  }

  all(name: string): AnyDoc[] {
    return (this.data[name] || []).map((d) => ({ ...d }));
  }

  find(name: string, query: AnyDoc = {}): AnyDoc[] {
    let list = this.all(name);
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      if (typeof v === "object" && v.$in) {
        list = list.filter((d) => (v.$in as any[]).includes(d[k]));
      } else {
        list = list.filter((d) => d[k] === v);
      }
    }
    return list;
  }

  findOne(name: string, query: AnyDoc): AnyDoc | null {
    return this.find(name, query)[0] || null;
  }

  findById(name: string, id: string): AnyDoc | null {
    return this.findOne(name, { _id: id }) || this.findOne(name, { id });
  }

  create(name: string, doc: AnyDoc): AnyDoc {
    const newDoc: any = { ...doc, _id: doc._id || this.id(name.slice(0, 3)), createdAt: doc.createdAt || formatDateTime(new Date()), updatedAt: formatDateTime(new Date()) };
    if (!newDoc.id) newDoc.id = newDoc._id;
    (this.data[name] = this.data[name] || []).push(newDoc);
    return { ...newDoc };
  }

  createMany(name: string, docs: AnyDoc[]): AnyDoc[] {
    return docs.map((d) => this.create(name, d));
  }

  updateMany(name: string, filter: AnyDoc, update: AnyDoc): { modifiedCount: number } {
    const list = this.data[name] || [];
    const $set = update.$set || update;
    let count = 0;
    for (const doc of list) {
      let match = true;
      for (const [k, v] of Object.entries(filter)) {
        if (v === undefined) continue;
        if (typeof v === "object" && v.$in) {
          if (!(v.$in as any[]).includes(doc[k])) { match = false; break; }
        } else if (doc[k] !== v) { match = false; break; }
      }
      if (match) {
        Object.assign(doc, $set);
        count++;
      }
    }
    return { modifiedCount: count };
  }
}

export const demoStore = new DemoStore();

export const demoSessions = new Map<string, { id: string; username: string; name: string; role: string; avatar: string }>();
