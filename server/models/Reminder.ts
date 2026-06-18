import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReminderRule",
    },
    ruleName: { type: String },
    type: {
      type: String,
      enum: ["技师请假", "预约提醒", "耗材库存", "排班异常", "提成结算", "系统通知"],
      required: true,
    },
    level: {
      type: String,
      enum: ["普通", "紧急", "超时升级"],
      default: "普通",
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    relatedType: { type: String },
    relatedNo: { type: String },
    recipients: [
      {
        userId: { type: String },
        userName: { type: String },
        read: { type: Boolean, default: false },
        readAt: { type: Date },
      },
    ],
    status: {
      type: String,
      enum: ["待发送", "已发送", "已读", "已处理", "已忽略"],
      default: "待发送",
    },
    priority: { type: Number, default: 0 },
    escalationCount: { type: Number, default: 0 },
    nextEscalationAt: { type: Date },
    sentAt: { type: Date },
    handledBy: { type: String },
    handledAt: { type: Date },
    handleRemark: { type: String },
    remark: { type: String },
  },
  { timestamps: true, collection: "reminders" }
);

reminderSchema.index({ status: 1, level: 1, createdAt: -1 });

export default mongoose.model("Reminder", reminderSchema);
