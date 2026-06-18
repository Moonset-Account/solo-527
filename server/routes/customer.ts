import { Router } from "express";
import Customer from "../models/Customer.js";
import {
  successResponse,
  errorResponse,
  pagination,
  createChangeLog,
  compareObjects,
} from "../utils/index.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { skip, page, pageSize } = pagination(req.query);
    const { keyword, level, gender, source } = req.query;

    const filter: any = {};
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { phone: { $regex: keyword, $options: "i" } },
      ];
    }
    if (level) filter.level = level;
    if (gender) filter.gender = gender;
    if (source) filter.source = source;

    const total = await Customer.countDocuments(filter);
    const list = await Customer.find(filter)
      .sort({ createdAt: -1 })
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

router.get("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.json(errorResponse("客户不存在"));
    }
    res.json(successResponse(customer));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, phone, gender, birthday, level, source, remark, tags } = req.body;

    if (!name || !phone) {
      return res.json(errorResponse("姓名和手机号不能为空"));
    }

    const existing = await Customer.findOne({ phone });
    if (existing) {
      return res.json(errorResponse("该手机号已存在"));
    }

    const customer = new Customer({
      name,
      phone,
      gender: gender || "未知",
      birthday: birthday ? new Date(birthday) : undefined,
      level: level || "普通",
      source: source || "门店",
      remark,
      tags: tags || [],
    });

    await customer.save();

    await createChangeLog({
      module: "客户",
      action: "创建",
      targetId: customer._id,
      targetType: "Customer",
      targetName: customer.name,
      afterData: customer.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: "创建客户档案",
    });

    res.json(successResponse(customer, "创建成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.json(errorResponse("客户不存在"));
    }

    const beforeData = customer.toObject();

    Object.assign(customer, req.body);
    if (req.body.birthday) {
      customer.birthday = new Date(req.body.birthday);
    }
    await customer.save();

    const changes = compareObjects(beforeData, customer.toObject());

    await createChangeLog({
      module: "客户",
      action: "修改",
      targetId: customer._id,
      targetType: "Customer",
      targetName: customer.name,
      beforeData,
      afterData: customer.toObject(),
      changes,
      operator: "admin",
      operatorRole: "管理员",
      remark: "修改客户信息",
    });

    res.json(successResponse(customer, "修改成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.json(errorResponse("客户不存在"));
    }

    await customer.deleteOne();

    await createChangeLog({
      module: "客户",
      action: "删除",
      targetId: customer._id,
      targetType: "Customer",
      targetName: customer.name,
      beforeData: customer.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: "删除客户",
    });

    res.json(successResponse(null, "删除成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

export default router;
