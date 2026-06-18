import mongoose from "mongoose";

const reminderRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["技师请假", "预约提醒", "耗材库存", "排班异常", "提成结算"],
      required: true,
    },
    enabled: { type: Boolean, default: true },
    levels: [
      {
        level: {
          type: String,
          enum: ["普通", "紧急", "超时升级"],
          required: true,
        },
        triggerCondition: { type: String, required: true },
        triggerValue: { type: Number, required: true },
        triggerUnit: { type: String, default: "小时" },
        notifyChannels: [{ type: String, enum: ["系统消息", "短信", "微信", "邮件"] }],
        notifyRoles: [{ type: String }],
        repeatInterval: { type: Number, default: 0 },
        maxRepeats: { type: Number, default: 1 },
      },
    ],
    config: { type: mongoose.Schema.Types.Mixed },
    description: { type: String },
    createdBy: { type: String },
  },
  { timestamps: true, collection: "reminder_rules" }
);

export default mongoose.model("ReminderRule", reminderRuleSchema);
