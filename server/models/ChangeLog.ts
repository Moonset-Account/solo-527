import mongoose from "mongoose";

const changeLogSchema = new mongoose.Schema(
  {
    logNo: { type: String, required: true, unique: true },
    module: {
      type: String,
      enum: [
        "技师",
        "疗程",
        "排班",
        "预约",
        "客户",
        "耗材",
        "耗材消耗",
        "提成",
        "提醒规则",
        "顾问",
      ],
      required: true,
    },
    action: {
      type: String,
      enum: ["创建", "修改", "删除", "状态变更", "审批", "导出"],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    targetType: { type: String, required: true },
    targetNo: { type: String },
    targetName: { type: String },
    relatedDocId: { type: mongoose.Schema.Types.ObjectId },
    relatedDocType: { type: String },
    relatedDocNo: { type: String },
    beforeData: { type: mongoose.Schema.Types.Mixed },
    afterData: { type: mongoose.Schema.Types.Mixed },
    changes: [
      {
        field: { type: String, required: true },
        fieldLabel: { type: String },
        before: { type: mongoose.Schema.Types.Mixed },
        after: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    operator: { type: String, required: true },
    operatorRole: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    remark: { type: String },
  },
  { timestamps: true, collection: "change_logs" }
);

changeLogSchema.index({ module: 1, targetId: 1, createdAt: -1 });
changeLogSchema.index({ relatedDocId: 1, relatedDocType: 1 });

export default mongoose.model("ChangeLog", changeLogSchema);
