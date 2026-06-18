import { Router } from "express";
import Reminder from "../models/Reminder.js";
import ReminderRule from "../models/ReminderRule.js";
import {
  successResponse,
  errorResponse,
  pagination,
  createChangeLog,
} from "../utils/index.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { skip, page, pageSize } = pagination(req.query);
    const { type, level, status, keyword } = req.query;

    const filter: any = {};
    if (type) filter.type = type;
    if (level) filter.level = level;
    if (status) filter.status = status;
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { content: { $regex: keyword, $options: "i" } },
      ];
    }

    const total = await Reminder.countDocuments(filter);
    const list = await Reminder.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    res.json(
      successResponse({
        list,
        total,
        page,
        pageSize,
      })
    );
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/unread/count", async (req, res) => {
  try {
    const normalCount = await Reminder.countDocuments({
      level: "普通",
      status: { $in: ["待发送", "已发送"] },
    });
    const urgentCount = await Reminder.countDocuments({
      level: "紧急",
      status: { $in: ["待发送", "已发送"] },
    });
    const escalatedCount = await Reminder.countDocuments({
      level: "超时升级",
      status: { $in: ["待发送", "已发送"] },
    });
    const total = normalCount + urgentCount + escalatedCount;

    res.json(
      successResponse({
        total,
        normal: normalCount,
        urgent: urgentCount,
        escalated: escalatedCount,
      })
    );
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/:id", async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) {
      return res.json(errorResponse("提醒不存在"));
    }
    res.json(successResponse(reminder));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id/read", async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) {
      return res.json(errorResponse("提醒不存在"));
    }

    reminder.status = "已读";
    await reminder.save();

    res.json(successResponse(reminder, "已标为已读"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id/handle", async (req, res) => {
  try {
    const { handleRemark } = req.body;
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) {
      return res.json(errorResponse("提醒不存在"));
    }

    reminder.status = "已处理";
    reminder.handledBy = "admin";
    reminder.handledAt = new Date();
    reminder.handleRemark = handleRemark;

    await reminder.save();

    res.json(successResponse(reminder, "处理成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.post("/create", async (req, res) => {
  try {
    const {
      ruleId,
      ruleName,
      type,
      level,
      title,
      content,
      relatedId,
      relatedType,
      relatedNo,
      priority,
    } = req.body;

    if (!title || !content || !type) {
      return res.json(errorResponse("标题、内容和类型不能为空"));
    }

    const reminder = new Reminder({
      ruleId,
      ruleName,
      type,
      level: level || "普通",
      title,
      content,
      relatedId,
      relatedType,
      relatedNo,
      priority: priority || 0,
      status: "已发送",
      sentAt: new Date(),
    });

    await reminder.save();

    res.json(successResponse(reminder, "创建成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/rules/list", async (req, res) => {
  try {
    const list = await ReminderRule.find().sort({ createdAt: -1 });
    res.json(successResponse(list));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.post("/rules", async (req, res) => {
  try {
    const { name, type, enabled, levels, config, description } = req.body;

    if (!name || !type) {
      return res.json(errorResponse("名称和类型不能为空"));
    }

    const rule = new ReminderRule({
      name,
      type,
      enabled: enabled !== false,
      levels: levels || [],
      config,
      description,
      createdBy: "admin",
    });

    await rule.save();

    await createChangeLog({
      module: "提醒规则",
      action: "创建",
      targetId: rule._id,
      targetType: "ReminderRule",
      targetName: rule.name,
      afterData: rule.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: "创建提醒规则",
    });

    res.json(successResponse(rule, "创建成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/rules/:id", async (req, res) => {
  try {
    const rule = await ReminderRule.findById(req.params.id);
    if (!rule) {
      return res.json(errorResponse("规则不存在"));
    }

    const beforeData = rule.toObject();
    Object.assign(rule, req.body);
    await rule.save();

    await createChangeLog({
      module: "提醒规则",
      action: "修改",
      targetId: rule._id,
      targetType: "ReminderRule",
      targetName: rule.name,
      beforeData,
      afterData: rule.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: "修改提醒规则",
    });

    res.json(successResponse(rule, "修改成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

export default router;
