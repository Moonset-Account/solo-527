import type {
  User,
  Patient,
  MedicalRecord,
  FollowUpPlan,
  ChargeItem,
  FollowUpTask,
  FilterRule,
  PermissionException,
  Appointment,
  AppointmentReport,
  DashboardStats,
  TrendData,
  FollowUpCompletion,
} from "@/types";

export const mockUsers: User[] = [
  {
    id: "u-001",
    email: "admin@tcm.com",
    full_name: "张运营",
    role: "operation",
    department: "运营部",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "u-002",
    email: "frontdesk@tcm.com",
    full_name: "李前台",
    role: "frontdesk",
    department: "前台",
    created_at: "2026-01-02T00:00:00Z",
  },
  {
    id: "u-003",
    email: "auditor@tcm.com",
    full_name: "王审核",
    role: "auditor",
    department: "质控部",
    created_at: "2026-01-03T00:00:00Z",
  },
  {
    id: "doc-001",
    email: "drchen@tcm.com",
    full_name: "陈大夫",
    role: "operation",
    department: "内科",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "doc-002",
    email: "drliu@tcm.com",
    full_name: "刘大夫",
    role: "operation",
    department: "针灸科",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "doc-003",
    email: "drwang@tcm.com",
    full_name: "王大夫",
    role: "operation",
    department: "推拿科",
    created_at: "2026-01-01T00:00:00Z",
  },
];

const now = new Date("2026-06-21");
const daysAgo = (d: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() - d);
  return date.toISOString().split("T")[0];
};

export const mockPatients: Patient[] = [
  { id: "p-001", name: "赵建国", phone: "138****1234", birth_date: "1965-03-15", gender: "男", patient_no: "P26060001", created_at: "2026-06-01T09:00:00Z" },
  { id: "p-002", name: "钱秀兰", phone: "139****5678", birth_date: "1972-08-22", gender: "女", patient_no: "P26060002", created_at: "2026-06-02T10:30:00Z" },
  { id: "p-003", name: "孙明辉", phone: "137****9012", birth_date: "1988-11-05", gender: "男", patient_no: "P26060003", created_at: "2026-06-03T14:15:00Z" },
  { id: "p-004", name: "周美玲", phone: "136****3456", birth_date: "1995-05-18", gender: "女", patient_no: "P26060004", created_at: "2026-06-05T08:45:00Z" },
  { id: "p-005", name: "吴志强", phone: "135****7890", birth_date: "1958-12-30", gender: "男", patient_no: "P26060005", created_at: "2026-06-06T11:20:00Z" },
  { id: "p-006", name: "郑小燕", phone: "134****2345", birth_date: "1990-07-12", gender: "女", patient_no: "P26060006", created_at: "2026-06-08T15:50:00Z" },
  { id: "p-007", name: "冯大伟", phone: "133****6789", birth_date: "1975-02-28", gender: "男", patient_no: "P26060007", created_at: "2026-06-10T09:30:00Z" },
  { id: "p-008", name: "陈丽华", phone: "132****0123", birth_date: "1983-09-17", gender: "女", patient_no: "P26060008", created_at: "2026-06-12T13:40:00Z" },
  { id: "p-009", name: "褚云鹏", phone: "131****4567", birth_date: "1969-06-03", gender: "男", patient_no: "P26060009", created_at: "2026-06-14T10:10:00Z" },
  { id: "p-010", name: "卫雅琴", phone: "130****8901", birth_date: "2001-04-25", gender: "女", patient_no: "P26060010", created_at: "2026-06-15T16:00:00Z" },
  { id: "p-011", name: "蒋文博", phone: "159****1111", birth_date: "1980-10-08", gender: "男", patient_no: "P26060011", created_at: "2026-06-16T09:15:00Z" },
  { id: "p-012", name: "沈梦琪", phone: "158****2222", birth_date: "1998-01-19", gender: "女", patient_no: "P26060012", created_at: "2026-06-17T11:45:00Z" },
];

export const mockMedicalRecords: MedicalRecord[] = [
  {
    id: "r-001", patient_id: "p-001", doctor_id: "doc-001",
    chief_complaint: "反复胃脘胀痛3年，加重1周。伴嗳气反酸，纳差，大便溏薄。",
    diagnosis: "胃脘痛（脾胃虚寒证）；慢性胃炎",
    prescription: "黄芪建中汤加减：黄芪30g 桂枝10g 白芍20g 炙甘草6g 生姜3片 大枣5枚 饴糖30g 陈皮10g 半夏10g 茯苓15g，7剂，水煎服，日1剂。",
    visit_date: daysAgo(20), department: "内科", total_fee: "486.50", status: "active",
    created_at: `${daysAgo(20)}T09:00:00Z`,
  },
  {
    id: "r-002", patient_id: "p-002", doctor_id: "doc-002",
    chief_complaint: "颈肩部酸痛半年，伴右上肢麻木，劳累后加重。",
    diagnosis: "项痹（气滞血瘀证）；神经根型颈椎病",
    prescription: "针灸+推拿治疗，配合桃红四物汤加减。取穴：风池、天柱、大椎、肩井、曲池、合谷，隔日1次，共10次。",
    visit_date: daysAgo(18), department: "针灸科", total_fee: "1280.00", status: "active",
    created_at: `${daysAgo(18)}T10:30:00Z`,
  },
  {
    id: "r-003", patient_id: "p-003", doctor_id: "doc-001",
    chief_complaint: "失眠多梦2月余，伴心烦易怒，口干口苦，头胀头痛。",
    diagnosis: "不寐（肝郁化火证）",
    prescription: "龙胆泻肝汤合酸枣仁汤加减：龙胆草6g 黄芩10g 栀子10g 泽泻12g 柴胡10g 生地15g 酸枣仁30g 茯神15g 知母10g 川芎10g，7剂。",
    visit_date: daysAgo(15), department: "内科", total_fee: "358.00", status: "active",
    created_at: `${daysAgo(15)}T14:00:00Z`,
  },
  {
    id: "r-004", patient_id: "p-004", doctor_id: "doc-003",
    chief_complaint: "腰部扭伤3天，活动受限，咳嗽时疼痛加重。",
    diagnosis: "急性腰扭伤（瘀血阻络证）",
    prescription: "推拿理筋+腰部拔罐，配合身痛逐瘀汤内服。卧床休息，避风寒。",
    visit_date: daysAgo(12), department: "推拿科", total_fee: "320.00", status: "active",
    created_at: `${daysAgo(12)}T09:15:00Z`,
  },
  {
    id: "r-005", patient_id: "p-005", doctor_id: "doc-001",
    chief_complaint: "胸闷气短伴心慌1月，活动后加重，伴乏力自汗。",
    diagnosis: "胸痹（气阴两虚证）；冠心病待排查",
    prescription: "生脉饮合炙甘草汤加减：西洋参10g 麦冬15g 五味子10g 炙甘草12g 桂枝6g 生地15g 阿胶10g 丹参20g，7剂。建议完善心电图检查。",
    visit_date: daysAgo(10), department: "内科", total_fee: "678.00", status: "exception",
    created_at: `${daysAgo(10)}T11:00:00Z`,
  },
  {
    id: "r-006", patient_id: "p-006", doctor_id: "doc-002",
    chief_complaint: "经期腹痛3年，经色暗有血块，伴乳房胀痛。",
    diagnosis: "痛经（气滞血瘀证）",
    prescription: "膈下逐瘀汤加减，配合艾灸关元、气海、三阴交。经前1周开始服药，连续3个周期。",
    visit_date: daysAgo(8), department: "针灸科", total_fee: "420.00", status: "active",
    created_at: `${daysAgo(8)}T15:30:00Z`,
  },
  {
    id: "r-007", patient_id: "p-007", doctor_id: "doc-001",
    chief_complaint: "咳嗽咳痰2周，痰黄稠，伴咽痛，微恶寒。",
    diagnosis: "咳嗽（风热犯肺证）；急性支气管炎",
    prescription: "桑菊饮合清气化痰丸加减：桑叶10g 菊花10g 杏仁10g 连翘12g 黄芩10g 瓜蒌15g 浙贝10g 桔梗6g 甘草6g，5剂。",
    visit_date: daysAgo(6), department: "内科", total_fee: "268.00", status: "active",
    created_at: `${daysAgo(6)}T08:50:00Z`,
  },
  {
    id: "r-008", patient_id: "p-008", doctor_id: "doc-003",
    chief_complaint: "左侧面瘫2天，口角歪斜，闭目不全，耳后疼痛。",
    diagnosis: "面瘫（风寒袭络证）；周围性面神经麻痹",
    prescription: "针灸治疗（急性期取远端穴位为主），配合牵正散加减内服。取穴：合谷、太冲、翳风、风池，每日1次。",
    visit_date: daysAgo(4), department: "推拿科", total_fee: "560.00", status: "active",
    created_at: `${daysAgo(4)}T10:20:00Z`,
  },
  {
    id: "r-009", patient_id: "p-009", doctor_id: "doc-001",
    chief_complaint: "糖尿病史10年，近1月血糖控制不佳，伴口干多饮，视物模糊。",
    diagnosis: "消渴（气阴两虚证）；2型糖尿病",
    prescription: "玉泉丸合六味地黄丸加减，配合西药降糖。定期监测血糖，建议眼科会诊。",
    visit_date: daysAgo(3), department: "内科", total_fee: "398.00", status: "active",
    created_at: `${daysAgo(3)}T09:40:00Z`,
  },
  {
    id: "r-010", patient_id: "p-010", doctor_id: "doc-002",
    chief_complaint: "反复荨麻疹1月，风团瘙痒，遇热加重，伴心烦。",
    diagnosis: "瘾疹（风热犯表证）；慢性荨麻疹",
    prescription: "消风散加减：荆芥10g 防风10g 蝉蜕6g 牛蒡子10g 苦参10g 石膏20g 知母10g 生地15g 当归10g 甘草6g，7剂。",
    visit_date: daysAgo(2), department: "针灸科", total_fee: "312.00", status: "active",
    created_at: `${daysAgo(2)}T14:30:00Z`,
  },
  {
    id: "r-011", patient_id: "p-011", doctor_id: "doc-001",
    chief_complaint: "体检发现血压偏高，平素头晕头胀，面红目赤，急躁易怒。",
    diagnosis: "眩晕（肝阳上亢证）；高血压病1级",
    prescription: "天麻钩藤饮加减：天麻10g 钩藤15g 石决明30g 栀子10g 黄芩10g 川牛膝15g 杜仲10g 桑寄生15g 夜交藤30g，7剂。监测血压。",
    visit_date: daysAgo(1), department: "内科", total_fee: "298.00", status: "active",
    created_at: `${daysAgo(1)}T10:00:00Z`,
  },
  {
    id: "r-012", patient_id: "p-012", doctor_id: "doc-002",
    chief_complaint: "过敏性鼻炎史5年，近期发作，鼻痒喷嚏，流清涕，遇风冷加重。",
    diagnosis: "鼻鼽（肺气亏虚证）；过敏性鼻炎",
    prescription: "温肺止流丹合玉屏风散加减，配合三伏贴治疗。取穴艾灸：肺俞、风门、足三里。",
    visit_date: daysAgo(0), department: "针灸科", total_fee: "456.00", status: "active",
    created_at: `${daysAgo(0)}T09:00:00Z`,
  },
];

export const mockFollowUpPlans: FollowUpPlan[] = [
  { id: "fp-001", record_id: "r-001", planned_follow_up_date: daysAgo(13), follow_up_type: "电话", notes: "服药7天后随访症状改善情况", status: "completed", created_at: `${daysAgo(20)}T09:00:00Z` },
  { id: "fp-002", record_id: "r-002", planned_follow_up_date: daysAgo(11), follow_up_type: "到店", notes: "针灸第5次后评估疗效", status: "completed", created_at: `${daysAgo(18)}T10:30:00Z` },
  { id: "fp-003", record_id: "r-003", planned_follow_up_date: daysAgo(8), follow_up_type: "微信", notes: "了解睡眠改善情况", status: "completed", created_at: `${daysAgo(15)}T14:00:00Z` },
  { id: "fp-004", record_id: "r-005", planned_follow_up_date: daysAgo(3), follow_up_type: "电话", notes: "提醒完善心电图检查，评估胸闷情况", status: "pending", created_at: `${daysAgo(10)}T11:00:00Z` },
  { id: "fp-005", record_id: "r-006", planned_follow_up_date: daysAgo(1), follow_up_type: "短信", notes: "经前随访，提醒服药", status: "pending", created_at: `${daysAgo(8)}T15:30:00Z` },
  { id: "fp-006", record_id: "r-008", planned_follow_up_date: daysAgo(0), follow_up_type: "电话", notes: "面瘫针灸治疗第3天随访", status: "pending", created_at: `${daysAgo(4)}T10:20:00Z` },
  { id: "fp-007", record_id: "r-009", planned_follow_up_date: daysAgo(4), follow_up_type: "电话", notes: "血糖监测结果随访", status: "pending", created_at: `${daysAgo(3)}T09:40:00Z` },
  { id: "fp-008", record_id: "r-011", planned_follow_up_date: daysAgo(6), follow_up_type: "微信", notes: "血压监测随访", status: "pending", created_at: `${daysAgo(1)}T10:00:00Z` },
  { id: "fp-009", record_id: "r-001", planned_follow_up_date: daysAgo(6), follow_up_type: "到店", notes: "二复诊，调整方剂", status: "completed", created_at: `${daysAgo(20)}T09:00:00Z` },
  { id: "fp-010", record_id: "r-002", planned_follow_up_date: daysAgo(3), follow_up_type: "到店", notes: "疗程结束评估", status: "pending", created_at: `${daysAgo(18)}T10:30:00Z` },
];

export const mockChargeItems: ChargeItem[] = [
  { id: "c-001", record_id: "r-001", item_name: "中医辨证论治", item_category: "诊费", quantity: "1", unit_price: "80.00", subtotal: "80.00", created_at: `${daysAgo(20)}T09:00:00Z` },
  { id: "c-002", record_id: "r-001", item_name: "中药饮片（7剂）", item_category: "中药", quantity: "7", unit_price: "58.07", subtotal: "406.50", created_at: `${daysAgo(20)}T09:00:00Z` },
  { id: "c-003", record_id: "r-002", item_name: "针灸治疗", item_category: "理疗", quantity: "10", unit_price: "80.00", subtotal: "800.00", created_at: `${daysAgo(18)}T10:30:00Z` },
  { id: "c-004", record_id: "r-002", item_name: "推拿治疗", item_category: "理疗", quantity: "5", unit_price: "80.00", subtotal: "400.00", created_at: `${daysAgo(18)}T10:30:00Z` },
  { id: "c-005", record_id: "r-002", item_name: "中药饮片", item_category: "中药", quantity: "7", unit_price: "11.43", subtotal: "80.00", created_at: `${daysAgo(18)}T10:30:00Z` },
  { id: "c-006", record_id: "r-003", item_name: "中医辨证论治", item_category: "诊费", quantity: "1", unit_price: "80.00", subtotal: "80.00", created_at: `${daysAgo(15)}T14:00:00Z` },
  { id: "c-007", record_id: "r-003", item_name: "中药饮片（7剂）", item_category: "中药", quantity: "7", unit_price: "39.71", subtotal: "278.00", created_at: `${daysAgo(15)}T14:00:00Z` },
  { id: "c-008", record_id: "r-004", item_name: "推拿治疗", item_category: "理疗", quantity: "3", unit_price: "80.00", subtotal: "240.00", created_at: `${daysAgo(12)}T09:15:00Z` },
  { id: "c-009", record_id: "r-004", item_name: "拔罐疗法", item_category: "理疗", quantity: "2", unit_price: "40.00", subtotal: "80.00", created_at: `${daysAgo(12)}T09:15:00Z` },
  { id: "c-010", record_id: "r-005", item_name: "中医辨证论治", item_category: "诊费", quantity: "1", unit_price: "100.00", subtotal: "100.00", created_at: `${daysAgo(10)}T11:00:00Z` },
  { id: "c-011", record_id: "r-005", item_name: "中药饮片（7剂）", item_category: "中药", quantity: "7", unit_price: "74.00", subtotal: "518.00", created_at: `${daysAgo(10)}T11:00:00Z` },
  { id: "c-012", record_id: "r-005", item_name: "常规心电图", item_category: "检查", quantity: "1", unit_price: "60.00", subtotal: "60.00", created_at: `${daysAgo(10)}T11:00:00Z` },
  { id: "c-013", record_id: "r-008", item_name: "针灸治疗", item_category: "理疗", quantity: "5", unit_price: "80.00", subtotal: "400.00", created_at: `${daysAgo(4)}T10:20:00Z` },
  { id: "c-014", record_id: "r-008", item_name: "中药饮片（7剂）", item_category: "中药", quantity: "7", unit_price: "22.86", subtotal: "160.00", created_at: `${daysAgo(4)}T10:20:00Z` },
  { id: "c-015", record_id: "r-012", item_name: "三伏贴治疗", item_category: "理疗", quantity: "3", unit_price: "80.00", subtotal: "240.00", created_at: `${daysAgo(0)}T09:00:00Z` },
  { id: "c-016", record_id: "r-012", item_name: "艾灸治疗", item_category: "理疗", quantity: "5", unit_price: "30.00", subtotal: "150.00", created_at: `${daysAgo(0)}T09:00:00Z` },
  { id: "c-017", record_id: "r-012", item_name: "中药饮片", item_category: "中药", quantity: "7", unit_price: "9.43", subtotal: "66.00", created_at: `${daysAgo(0)}T09:00:00Z` },
];

export const mockFollowUpTasks: FollowUpTask[] = [
  { id: "t-001", patient_id: "p-001", record_id: "r-001", assigned_to: "u-001", planned_date: daysAgo(13), actual_date: daysAgo(13), status: "completed", quality_score: 92, follow_up_method: "电话", result_notes: "患者述胃脘胀痛明显减轻，嗳气反酸缓解，食欲好转，大便正常。嘱按时复诊。", created_at: `${daysAgo(20)}T09:00:00Z` },
  { id: "t-002", patient_id: "p-002", record_id: "r-002", assigned_to: "u-001", planned_date: daysAgo(11), actual_date: daysAgo(11), status: "completed", quality_score: 88, follow_up_method: "到店", result_notes: "患者已完成5次针灸治疗，颈肩酸痛缓解，右上肢麻木减轻。", created_at: `${daysAgo(18)}T10:30:00Z` },
  { id: "t-003", patient_id: "p-003", record_id: "r-003", assigned_to: "u-001", planned_date: daysAgo(8), actual_date: daysAgo(8), status: "completed", quality_score: 85, follow_up_method: "微信", result_notes: "服药后睡眠质量改善，每晚可睡6-7小时，烦躁减轻。", created_at: `${daysAgo(15)}T14:00:00Z` },
  { id: "t-004", patient_id: "p-005", record_id: "r-005", assigned_to: "u-002", planned_date: daysAgo(3), actual_date: null, status: "overdue", quality_score: null, follow_up_method: null, result_notes: null, created_at: `${daysAgo(10)}T11:00:00Z` },
  { id: "t-005", patient_id: "p-006", record_id: "r-006", assigned_to: "u-002", planned_date: daysAgo(1), actual_date: null, status: "pending", quality_score: null, follow_up_method: null, result_notes: null, created_at: `${daysAgo(8)}T15:30:00Z` },
  { "id": "t-006", "patient_id": "p-008", "record_id": "r-008", "assigned_to": "u-001", "planned_date": daysAgo(0), "actual_date": null, "status": "in_progress", "quality_score": null, "follow_up_method": "电话", "result_notes": "正在跟进中，患者表示耳后疼痛减轻...", "created_at": `${daysAgo(4)}T10:20:00Z` },
  { id: "t-007", patient_id: "p-009", record_id: "r-009", assigned_to: "u-001", planned_date: daysAgo(4), actual_date: daysAgo(4), status: "completed", quality_score: 95, follow_up_method: "电话", result_notes: "空腹血糖7.2mmol/L，较前下降。嘱继续控制饮食，按时服药。", created_at: `${daysAgo(3)}T09:40:00Z` },
  { id: "t-008", patient_id: "p-011", record_id: "r-011", assigned_to: "u-002", planned_date: daysAgo(6), actual_date: null, status: "overdue", quality_score: null, follow_up_method: null, result_notes: null, created_at: `${daysAgo(1)}T10:00:00Z` },
  { id: "t-009", patient_id: "p-001", record_id: "r-001", assigned_to: "u-001", planned_date: daysAgo(6), actual_date: daysAgo(6), status: "completed", quality_score: 90, follow_up_method: "到店", result_notes: "患者复诊，症状基本消失，予以调整方药巩固治疗。", created_at: `${daysAgo(20)}T09:00:00Z` },
  { id: "t-010", patient_id: "p-002", record_id: "r-002", assigned_to: "u-002", planned_date: daysAgo(3), actual_date: null, status: "pending", quality_score: null, follow_up_method: null, result_notes: null, created_at: `${daysAgo(18)}T10:30:00Z` },
  { id: "t-011", patient_id: "p-004", record_id: "r-004", assigned_to: "u-001", planned_date: daysAgo(5), actual_date: daysAgo(5), status: "completed", quality_score: 87, follow_up_method: "电话", result_notes: "腰部活动基本正常，无明显疼痛。嘱避免久坐，适当锻炼。", created_at: `${daysAgo(12)}T09:15:00Z` },
  { id: "t-012", patient_id: "p-007", record_id: "r-007", assigned_to: "u-002", planned_date: daysAgo(1), actual_date: daysAgo(1), status: "completed", quality_score: 82, follow_up_method: "电话", result_notes: "咳嗽咳痰基本消失，咽痛缓解。嘱多饮水，避风寒。", created_at: `${daysAgo(6)}T08:50:00Z` },
  { id: "t-013", patient_id: "p-010", record_id: "r-010", assigned_to: "u-001", planned_date: daysAgo(0), actual_date: null, status: "pending", quality_score: null, follow_up_method: null, result_notes: null, created_at: `${daysAgo(2)}T14:30:00Z` },
  { id: "t-014", patient_id: "p-012", record_id: "r-012", assigned_to: "u-001", planned_date: daysAgo(0), actual_date: null, status: "pending", quality_score: null, follow_up_method: null, result_notes: null, created_at: `${daysAgo(0)}T09:00:00Z` },
];

export const mockFilterRules: FilterRule[] = [
  { id: "fr-001", user_id: "u-001", name: "本月待办随访", module: "follow_up_tasks", filter_conditions: { status: ["pending", "in_progress"], dateRange: "thisMonth" }, created_at: "2026-06-01T00:00:00Z" },
  { id: "fr-002", user_id: "u-001", name: "我的逾期任务", module: "follow_up_tasks", filter_conditions: { status: ["overdue"], assignee: "u-001" }, created_at: "2026-06-05T00:00:00Z" },
  { id: "fr-003", user_id: "u-001", name: "内科本月病历", module: "medical_records", filter_conditions: { department: "内科", dateRange: "thisMonth" }, created_at: "2026-06-10T00:00:00Z" },
];

export const mockPermissionExceptions: PermissionException[] = [
  { id: "e-001", record_id: "r-005", handled_by: null, exception_type: "处方用药超常规剂量", severity: "high", status: "pending", handling_conclusion: null, handled_at: null, created_at: `${daysAgo(9)}T11:00:00Z` },
  { id: "e-002", record_id: "r-001", handled_by: "u-003", exception_type: "病历诊断缺失ICD编码", severity: "low", status: "resolved", handling_conclusion: "已补充ICD编码：K29.501，确认无误。", handled_at: `${daysAgo(18)}T15:00:00Z`, created_at: `${daysAgo(19)}T09:00:00Z` },
  { id: "e-003", record_id: "r-003", handled_by: "u-003", exception_type: "收费项目与诊断不符", severity: "medium", status: "resolved", handling_conclusion: "经核实属合理用药范围，已确认通过。", handled_at: `${daysAgo(12)}T10:30:00Z`, created_at: `${daysAgo(13)}T14:00:00Z` },
  { id: "e-004", record_id: "r-008", handled_by: null, exception_type: "随访人员非授权科室", severity: "medium", status: "processing", handling_conclusion: null, handled_at: null, created_at: `${daysAgo(3)}T10:20:00Z` },
  { id: "e-005", record_id: "r-009", handled_by: null, exception_type: "处方含十八反配伍", severity: "critical", status: "pending", handling_conclusion: null, handled_at: null, created_at: `${daysAgo(2)}T09:40:00Z` },
];

export const mockAppointments: Appointment[] = [];
for (let i = 20; i >= 0; i--) {
  const date = daysAgo(i);
  for (let j = 0; j < 12; j++) {
    const slot = `${(8 + Math.floor(j / 2)).toString().padStart(2, "0")}:${j % 2 === 0 ? "00" : "30"}`;
    const statusRoll = Math.random();
    let status: Appointment["status"] = "booked";
    if (i >= 1) {
      if (statusRoll < 0.65) status = "attended";
      else if (statusRoll < 0.8) status = "cancelled";
      else if (statusRoll < 0.92) status = "no_show";
    }
    mockAppointments.push({
      id: `a-${i}-${j}`,
      patient_id: j < 8 ? `p-00${(j % 12) + 1}` : null,
      appointment_date: date,
      time_slot: slot,
      doctor_id: ["doc-001", "doc-002", "doc-003"][j % 3],
      status,
      is_no_show: status === "no_show",
      created_at: `${date}T${slot}:00Z`,
    });
  }
}

export const mockAppointmentReports: AppointmentReport[] = [
  {
    id: "ar-001", report_date: daysAgo(0), department: "内科",
    total_slots: 16, booked_slots: 12, attended_slots: 10, utilization_rate: "0.6250",
    exception_impact: {}, generated_at: `${daysAgo(0)}T18:00:00Z`,
  },
  {
    id: "ar-002", report_date: daysAgo(0), department: "针灸科",
    total_slots: 12, booked_slots: 11, attended_slots: 9, utilization_rate: "0.7500",
    exception_impact: {}, generated_at: `${daysAgo(0)}T18:00:00Z`,
  },
  {
    id: "ar-003", report_date: daysAgo(0), department: "推拿科",
    total_slots: 12, booked_slots: 8, attended_slots: 7, utilization_rate: "0.5833",
    exception_impact: {
      exception_id: "e-004",
      record_id: "r-008",
      conclusion: "随访人员权限调整中，处理完毕",
      severity: "medium",
      synced_at: daysAgo(2),
    },
    generated_at: `${daysAgo(0)}T18:00:00Z`,
  },
  {
    id: "ar-004", report_date: daysAgo(1), department: "内科",
    total_slots: 16, booked_slots: 14, attended_slots: 11, utilization_rate: "0.6875",
    exception_impact: {}, generated_at: `${daysAgo(1)}T18:00:00Z`,
  },
  {
    id: "ar-005", report_date: daysAgo(1), department: "针灸科",
    total_slots: 12, booked_slots: 10, attended_slots: 9, utilization_rate: "0.7500",
    exception_impact: {}, generated_at: `${daysAgo(1)}T18:00:00Z`,
  },
];

export const mockDashboardStats: DashboardStats = {
  todayRecords: 2,
  pendingFollowUps: 6,
  revisitRate: 0.685,
  churnRate: 0.158,
  todayRecordsDelta: 0.15,
  pendingFollowUpsDelta: -0.08,
  revisitRateDelta: 0.032,
  churnRateDelta: -0.021,
};

export const mockTrendData: TrendData = {
  revisit: Array.from({ length: 30 }, (_, i) => ({
    date: daysAgo(29 - i),
    value: 0.58 + Math.sin(i / 5) * 0.08 + Math.random() * 0.08,
  })),
  churn: Array.from({ length: 30 }, (_, i) => ({
    date: daysAgo(29 - i),
    value: 0.22 - Math.sin(i / 6) * 0.04 + (Math.random() - 0.5) * 0.04,
  })),
};

export const mockFollowUpCompletion: FollowUpCompletion = {
  completed: 6,
  pending: 4,
  inProgress: 1,
  overdue: 2,
};
