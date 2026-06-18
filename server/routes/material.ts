import { Router } from "express";
import Material from "../models/Material.js";
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
      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { sku: { $regex: keyword, $options: "i" } },
      ];
    }
    if (category) filter.category = category;
    if (status) filter.status = status;

    const total = await Material.countDocuments(filter);
    const list = await Material.find(filter)
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
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.json(errorResponse("耗材不存在"));
    }
    res.json(successResponse(material));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, sku, category, unit, price, cost, stock, minStock, supplier, status, image, remark } =
      req.body;

    if (!name || !unit) {
      return res.json(errorResponse("名称和单位不能为空"));
    }

    const material = new Material({
      name,
      sku,
      category: category || "其他",
      unit,
      price: price || 0,
      cost: cost || 0,
      stock: stock || 0,
      minStock: minStock || 10,
      supplier,
      status: status || "启用",
      image,
      remark,
    });

    await material.save();

    await createChangeLog({
      module: "耗材",
      action: "创建",
      targetId: material._id,
      targetType: "Material",
      targetName: material.name,
      afterData: material.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: "创建耗材",
    });

    res.json(successResponse(material, "创建成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id", async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.json(errorResponse("耗材不存在"));
    }

    const beforeData = material.toObject();

    Object.assign(material, req.body);
    await material.save();

    const changes = compareObjects(beforeData, material.toObject());

    await createChangeLog({
      module: "耗材",
      action: "修改",
      targetId: material._id,
      targetType: "Material",
      targetName: material.name,
      beforeData,
      afterData: material.toObject(),
      changes,
      operator: "admin",
      operatorRole: "管理员",
      remark: "修改耗材信息",
    });

    res.json(successResponse(material, "修改成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id/stock", async (req, res) => {
  try {
    const { change, type, remark } = req.body;
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.json(errorResponse("耗材不存在"));
    }

    const beforeData = material.toObject();
    material.stock = material.stock + change;

    await material.save();

    await createChangeLog({
      module: "耗材",
      action: "修改",
      targetId: material._id,
      targetType: "Material",
      targetName: material.name,
      beforeData,
      afterData: material.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: remark || `${type}${change}${material.unit}`,
    });

    res.json(successResponse(material, "库存更新成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.json(errorResponse("耗材不存在"));
    }

    await material.deleteOne();

    await createChangeLog({
      module: "耗材",
      action: "删除",
      targetId: material._id,
      targetType: "Material",
      targetName: material.name,
      beforeData: material.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: "删除耗材",
    });

    res.json(successResponse(null, "删除成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/list/active", async (req, res) => {
  try {
    const list = await Material.find({ status: "启用" })
      .select("_id name sku unit price cost stock")
      .sort({ name: 1 });
    res.json(successResponse(list));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

export default router;
