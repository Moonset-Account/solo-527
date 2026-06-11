import { connectMongo } from "@/server/db/mongo";
import { hashPassword } from "@/server/services/authService";
import { UserModel as UM } from "@/server/models/User";
import { ClassInfoModel as CIM } from "@/server/models/ClassInfo";
import { StudentModel as SM } from "@/server/models/Student";
import { ClassScheduleModel as CSM } from "@/server/models/ClassSchedule";
import { QuestionBankModel as QBM, QuestionBankVersionModel as QBVM } from "@/server/models/QuestionBank";
import { NoticeModel as NM, NoticeReceiptModel as NRM } from "@/server/models/Notice";
import { FeedbackModel as FM } from "@/server/models/Feedback";
import { formatDate, formatDateTime, getWeekDates } from "@/shared/utils";

const UserModel: any = UM;
const ClassInfoModel: any = CIM;
const StudentModel: any = SM;
const ClassScheduleModel: any = CSM;
const QuestionBankModel: any = QBM;
const QuestionBankVersionModel: any = QBVM;
const NoticeModel: any = NM;
const NoticeReceiptModel: any = NRM;
const FeedbackModel: any = FM;

async function seed() {
  await connectMongo();
  console.log("=== Seeding database... ===");

  await Promise.all([
    UserModel.deleteMany({}),
    ClassInfoModel.deleteMany({}),
    StudentModel.deleteMany({}),
    ClassScheduleModel.deleteMany({}),
    QuestionBankModel.deleteMany({}),
    QuestionBankVersionModel.deleteMany({}),
    NoticeModel.deleteMany({}),
    NoticeReceiptModel.deleteMany({}),
    FeedbackModel.deleteMany({}),
  ]);

  const adminPw = await hashPassword("admin123");
  const teacherPw = await hashPassword("teacher123");
  const operatorPw = await hashPassword("operator123");

  const [admin, teacher1, teacher2, operator] = await UserModel.create([
    { username: "admin", name: "北桥教务长", role: "admin", passwordHash: adminPw },
    { username: "teacher1", name: "小周老师", role: "teacher", passwordHash: teacherPw },
    { username: "teacher2", name: "小林老师", role: "teacher", passwordHash: teacherPw },
    { username: "operator", name: "运营小吴", role: "operator", passwordHash: operatorPw },
  ]);
  console.log("Users created");

  const classes = await ClassInfoModel.create([
    { name: "Scratch启蒙A班", level: "L1-启蒙", teacherIds: [teacher1._id.toString()] },
    { name: "Scratch进阶B班", level: "L2-进阶", teacherIds: [teacher1._id.toString()] },
    { name: "Python入门C班", level: "L3-Python", teacherIds: [teacher2._id.toString()] },
  ]);
  console.log("Classes created");

  const studentNames = [
    "张小明", "李华", "王芳", "赵天宇", "钱乐乐", "孙悦", "周子涵", "吴星辰",
    "郑雨桐", "冯浩然", "陈梓涵", "褚皓轩", "卫欣怡", "蒋雅琪", "沈博文", "韩欣悦",
  ];
  const parents = [
    "13800138001", "13800138002", "13800138003", "13800138004", "13800138005", "13800138006",
    "13800138007", "13800138008", "13800138009", "13800138010", "13800138011", "13800138012",
    "13800138013", "13800138014", "13800138015", "13800138016",
  ];
  const remainingHours = [24, 18, 2, 36, 15, 8, 48, 30, 1, 22, 12, 6, 40, 5, 28, 20];

  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    students.push({
      name: studentNames[i],
      parentPhone: parents[i],
      remainingHours: remainingHours[i],
      classId: classes[i % 3]._id.toString(),
      alertThreshold: 3,
    });
  }
  const savedStudents = await StudentModel.create(students);
  console.log("Students created:", savedStudents.length);

  const [bank1, bank2, bank3] = await QuestionBankModel.create([
    { name: "Scratch图形化编程题库", subject: "Scratch" },
    { name: "算法思维训练题库", subject: "Algorithms" },
    { name: "Python基础题库", subject: "Python" },
  ]);

  const versions = await QuestionBankVersionModel.create([
    { bankId: bank1._id.toString(), bankName: bank1.name, version: "v2026.03", isActive: true, publishedAt: "2026-03-01 09:00:00", classIds: [classes[0]._id.toString()] },
    { bankId: bank1._id.toString(), bankName: bank1.name, version: "v2025.12", isActive: false, publishedAt: "2025-12-15 09:00:00" },
    { bankId: bank2._id.toString(), bankName: bank2.name, version: "v2026.05", isActive: true, publishedAt: "2026-05-01 09:00:00", classIds: [classes[1]._id.toString()] },
    { bankId: bank3._id.toString(), bankName: bank3.name, version: "v2026.04", isActive: true, publishedAt: "2026-04-10 09:00:00", classIds: [classes[2]._id.toString()] },
  ]);
  console.log("Question banks & versions created");

  const weekDates = getWeekDates(new Date());
  const timeSlots = [
    { start: "09:00", end: "10:30" },
    { start: "10:45", end: "12:15" },
    { start: "14:00", end: "15:30" },
    { start: "15:45", end: "17:15" },
  ];
  const schedules: any[] = [];
  for (let i = 0; i < weekDates.length; i++) {
    const date = weekDates[i];
    const dateStr = formatDate(date);
    if (i === 0 || i === 6) continue;

    classes.forEach((cls, ci) => {
      const slot = timeSlots[(i + ci) % timeSlots.length];
      const versionMap = [versions[0], versions[2], versions[3]];
      const studentsInClass = savedStudents.filter((s) => s.classId === cls._id.toString());
      schedules.push({
        classId: cls._id.toString(),
        className: cls.name,
        teacherId: (classes[ci].teacherIds[0] as any),
        teacherName: ci === 2 ? teacher2.name : teacher1.name,
        date: dateStr,
        startTime: slot.start,
        endTime: slot.end,
        questionBankVersionId: versionMap[ci]._id.toString(),
        questionBankVersionName: versionMap[ci].version + " - " + versionMap[ci].bankName,
        status: "pending",
        studentIds: studentsInClass.slice(0, 5).map((s) => s._id.toString()),
      });
    });
  }
  await ClassScheduleModel.create(schedules);
  console.log("Schedules created:", schedules.length);

  const now = formatDateTime(new Date());
  const notice = await NoticeModel.create({
    title: "【重要】2026年暑假集训班报名通知",
    content: "各位家长好，2026年暑假编程集训班现已开放报名。集训班采用小班教学，每班限8人，开设Scratch精英营、Python算法营、信息学奥赛营三大方向。请于6月20日前完成回执确认。早鸟优惠立减500元！",
    senderId: operator._id.toString(),
    senderName: operator.name,
    targetType: "all",
    targetIds: [],
    publishedAt: now,
    receiptDeadline: "2026-06-20 18:00:00",
  });

  const receipts = savedStudents.slice(0, 8).map((s, i) => ({
    noticeId: notice._id.toString(),
    studentId: s._id.toString(),
    studentName: s.name,
    parentPhone: s.parentPhone,
    isRead: i < 6,
    isConfirmed: i < 4,
    feedback: i === 0 ? "已确认报名Scratch精英营" : i === 2 ? "考虑中，周末前回复" : undefined,
    readAt: i < 6 ? now : undefined,
    confirmedAt: i < 4 ? now : undefined,
  }));
  await NoticeReceiptModel.create(receipts);
  console.log("Notice & receipts created");

  await FeedbackModel.create([
    {
      studentId: savedStudents[0]._id.toString(),
      studentName: savedStudents[0].name,
      consumptionId: undefined,
      content: "孩子这周对循环结构的理解进步很大，小周老师的讲解特别耐心！",
      rating: 5,
      createdAt: now,
      writerRole: "parent",
    },
    {
      studentId: savedStudents[2]._id.toString(),
      studentName: savedStudents[2].name,
      consumptionId: undefined,
      content: "课时即将用完，麻烦老师联系沟通续费方案。",
      rating: 4,
      createdAt: now,
      writerRole: "parent",
    },
  ]);
  console.log("Feedbacks created");

  console.log("=== Seed completed successfully! ===");
  console.log("Login accounts:");
  console.log("  admin / admin123   (管理员)");
  console.log("  teacher1 / teacher123  (教务老师)");
  console.log("  teacher2 / teacher123  (教务老师)");
  console.log("  operator / operator123 (运营)");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
