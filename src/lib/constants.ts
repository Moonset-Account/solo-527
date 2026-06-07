export const FUNNEL_STAGES = [
  { key: "browse", label: "浏览" },
  { key: "inquiry", label: "咨询" },
  { key: "enroll", label: "报名" },
  { key: "waitlist", label: "候补" },
  { key: "converted", label: "转正" },
  { key: "refund", label: "退费" },
] as const;

export const AGE_GROUPS = ["3-6岁", "7-9岁", "10-12岁", "13-15岁"] as const;

export const CHANNELS = [
  "线下推广",
  "微信公众号",
  "朋友推荐",
  "线上广告",
  "官网注册",
] as const;

export const LOW_SAMPLE_THRESHOLD = 5;

export const COLORS = {
  primary: "#1E3A5F",
  accent: "#E8A838",
  danger: "#E74C3C",
  success: "#27AE60",
  bg: "#F5F7FA",
} as const;
