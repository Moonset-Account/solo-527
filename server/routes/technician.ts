import { Router } from "express";
import Technician from "../models/Technician.js";
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
    const { keyword, status, level, specialty } = req.query;

    const filter: any = {};
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { phone: { $regex: keyword, $options: "i" } },
      ];
    }
    if (status) filter.status = status;
    if (level) filter.level = level;
    if (specialty) filter.specialties = specialty;

    const total = await Technician.countDocuments(filter);
    const list = await Technician.find(filter)
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
    const technician = await Technician.findById(req.params.id);
    if (!technician) {
      return res.json(errorResponse("技师不存在"));
    }
    res.json(successResponse(technician));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, phone, idCard, level, specialties, status, baseSalary, commissionRate, remark } =
      req.body;

    if (!name || !phone) {
      return res.json(errorResponse("姓名和手机号不能为空"));
    }

    const existing = await Technician.findOne({ phone });
    if (existing) {
      return res.json(errorResponse("该手机号已存在"));
    }

    const technician = new Technician({
      name,
      phone,
      idCard,
      level: level || "初级",
      specialties: specialties || [],
      status: status || "在职",
      baseSalary: baseSalary || 0,
      commissionRate: commissionRate || 0.1,
      remark,
    });

    await technician.save();

    await createChangeLog({
      module: "技师",
      action: "创建",
      targetId: technician._id,
      targetType: "Technician",
      targetName: technician.name,
      afterData: technician.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: "创建技师档案",
    });

    res.json(successResponse(technician, "创建成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id", async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id);
    if (!technician) {
      return res.json(errorResponse("技师不存在"));
    }

    const beforeData = technician.toObject();
    const updateData = req.body;

    Object.assign(technician, updateData);
    await technician.save();

    const changes = compareObjects(beforeData, technician.toObject());

    await createChangeLog({
      module: "技师",
      action: "修改",
      targetId: technician._id,
      targetType: "Technician",
      targetName: technician.name,
      beforeData,
      afterData: technician.toObject(),
      changes,
      operator: "admin",
      operatorRole: "管理员",
      remark: "修改技师信息",
    });

    res.json(successResponse(technician, "修改成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id);
    if (!technician) {
      return res.json(errorResponse("技师不存在"));
    }

    await technician.deleteOne();

    await createChangeLog({
      module: "技师",
      action: "删除",
      targetId: technician._id,
      targetType: "Technician",
      targetName: technician.name,
      beforeData: technician.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: "删除技师档案",
    });

    res.json(successResponse(null, "删除成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/list/active", async (req, res) => {
  try {
    const list = await Technician.find({ status: "在职" })
      .select("_id name phone level specialties")
      .sort({ name: 1 });
    res.json(successResponse(list));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

export default router;
