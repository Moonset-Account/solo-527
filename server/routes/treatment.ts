import { Router } from "express";
import Treatment from "../models/Treatment.js";
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
    const { keyword, category, status } = req.query;

    const filter: any = {};
    if (keyword) {
      filter.name = { $regex: keyword, $options: "i" };
    }
    if (category) filter.category = category;
    if (status) filter.status = status;

    const total = await Treatment.countDocuments(filter);
    const list = await Treatment.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
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
    const treatment = await Treatment.findById(req.params.id);
    if (!treatment) {
      return res.json(errorResponse("疗程不存在"));
    }
    res.json(successResponse(treatment));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, category, duration, price, cost, description, materials, suitableFor, status, sortOrder, image } =
      req.body;

    if (!name || !duration || !price) {
      return res.json(errorResponse("名称、时长和价格不能为空"));
    }

    const treatment = new Treatment({
      name,
      category: category || "其他",
      duration,
      price,
      cost: cost || 0,
      description,
      materials: materials || [],
      suitableFor: suitableFor || [],
      status: status || "上架",
      sortOrder: sortOrder || 0,
      image,
    });

    await treatment.save();

    await createChangeLog({
      module: "疗程",
      action: "创建",
      targetId: treatment._id,
      targetType: "Treatment",
      targetName: treatment.name,
      afterData: treatment.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: "创建疗程项目",
    });

    res.json(successResponse(treatment, "创建成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id", async (req, res) => {
  try {
    const treatment = await Treatment.findById(req.params.id);
    if (!treatment) {
      return res.json(errorResponse("疗程不存在"));
    }

    const beforeData = treatment.toObject();

    Object.assign(treatment, req.body);
    await treatment.save();

    const changes = compareObjects(beforeData, treatment.toObject());

    await createChangeLog({
      module: "疗程",
      action: "修改",
      targetId: treatment._id,
      targetType: "Treatment",
      targetName: treatment.name,
      beforeData,
      afterData: treatment.toObject(),
      changes,
      operator: "admin",
      operatorRole: "管理员",
      remark: "修改疗程信息",
    });

    res.json(successResponse(treatment, "修改成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const treatment = await Treatment.findById(req.params.id);
    if (!treatment) {
      return res.json(errorResponse("疗程不存在"));
    }

    await treatment.deleteOne();

    await createChangeLog({
      module: "疗程",
      action: "删除",
      targetId: treatment._id,
      targetType: "Treatment",
      targetName: treatment.name,
      beforeData: treatment.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: "删除疗程项目",
    });

    res.json(successResponse(null, "删除成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/list/active", async (req, res) => {
  try {
    const list = await Treatment.find({ status: "上架" })
      .select("_id name category duration price")
      .sort({ sortOrder: 1, name: 1 });
    res.json(successResponse(list));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

export default router;
