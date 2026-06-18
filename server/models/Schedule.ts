import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Technician",
      required: true,
    },
    technicianName: { type: String, required: true },
    date: { type: Date, required: true },
    shiftType: {
      type: String,
      enum: ["早班", "中班", "晚班", "全天", "休息", "请假"],
      required: true,
    },
    startTime: { type: String },
    endTime: { type: String },
    breakStartTime: { type: String },
    breakEndTime: { type: String },
    leaveType: {
      type: String,
      enum: ["事假", "病假", "年假", "调休", null],
    },
    leaveReason: { type: String },
    leaveStatus: {
      type: String,
      enum: ["待审批", "已批准", "已拒绝", null],
    },
    status: {
      type: String,
      enum: ["正常", "调整", "取消"],
      default: "正常",
    },
    remark: { type: String },
    createdBy: { type: String },
  },
  { timestamps: true, collection: "schedules" }
);

scheduleSchema.index({ technicianId: 1, date: 1 }, { unique: true });

export default mongoose.model("Schedule", scheduleSchema);
