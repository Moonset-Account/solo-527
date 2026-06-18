import { Router } from "express";
import Consultant from "../models/Consultant.js";
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
    const { keyword, status, level } = req.query;

    const filter: any = {};
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { phone: { $regex: keyword, $options: "i" } },
      ];
    }
    if (status) filter.status = status;
    if (level) filter.level = level;

    const total = await Consultant.countDocuments(filter);
    const list = await Consultant.find(filter)
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
    const consultant = await Consultant.findById(req.params.id);
    if (!consultant) {
      return res.json(errorResponse("顾问不存在"));
    }
    res.json(successResponse(consultant));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, phone, level, status, baseSalary, commissionRate, hireDate, remark } =
      req.body;

    if (!name || !phone) {
      return res.json(errorResponse("姓名和手机号不能为空"));
    }

    const existing = await Consultant.findOne({ phone });
    if (existing) {
      return res.json(errorResponse("该手机号已存在"));
    }

    const consultant = new Consultant({
      name,
      phone,
      level: level || "初级顾问",
      status: status || "在职",
      baseSalary: baseSalary || 0,
      commissionRate: commissionRate || 0.05,
      hireDate: hireDate ? new Date(hireDate) : undefined,
      remark,
    });

    await consultant.save();

    await createChangeLog({
      module: "顾问",
      action: "创建",
      targetId: consultant._id,
      targetType: "Consultant",
      targetName: consultant.name,
      afterData: consultant.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: "创建顾问档案",
    });

    res.json(successResponse(consultant, "创建成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id", async (req, res) => {
  try {
    const consultant = await Consultant.findById(req.params.id);
    if (!consultant) {
      return res.json(errorResponse("顾问不存在"));
    }

    const beforeData = consultant.toObject();

    Object.assign(consultant, req.body);
    if (req.body.hireDate) {
      consultant.hireDate = new Date(req.body.hireDate);
    }
    await consultant.save();

    const changes = compareObjects(beforeData, consultant.toObject());

    await createChangeLog({
      module: "顾问",
      action: "修改",
      targetId: consultant._id,
      targetType: "Consultant",
      targetName: consultant.name,
      beforeData,
      afterData: consultant.toObject(),
      changes,
      operator: "admin",
      operatorRole: "管理员",
      remark: "修改顾问信息",
    });

    res.json(successResponse(consultant, "修改成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const consultant = await Consultant.findById(req.params.id);
    if (!consultant) {
      return res.json(errorResponse("顾问不存在"));
    }

    await consultant.deleteOne();

    await createChangeLog({
      module: "顾问",
      action: "删除",
      targetId: consultant._id,
      targetType: "Consultant",
      targetName: consultant.name,
      beforeData: consultant.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: "删除顾问",
    });

    res.json(successResponse(null, "删除成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/list/active", async (req, res) => {
  try {
    const list = await Consultant.find({ status: "在职" })
      .select("_id name phone level")
      .sort({ name: 1 });
    res.json(successResponse(list));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

export default router;
