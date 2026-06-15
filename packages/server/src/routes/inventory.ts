import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { asyncHandler, AppError } from "../middleware/error";
import { validateRequest } from "../middleware/validate";
import {
  ScanInboundSchema,
  ScanOutboundSchema,
} from "@qinghe/shared";
import { InventoryModel, InventoryTransactionModel } from "../models/Inventory";
import { BatchModel } from "../models/Batch";
import { LocationModel } from "../models/Location";
import { SafetyStockModel } from "../models/SafetyStock";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const {
      page = "1",
      pageSize = "20",
      sku,
      batchNo,
      locationCode,
      status,
    } = req.query;

    const filter: Record<string, unknown> = {};
    if (sku) filter.sku = { $regex: sku, $options: "i" };
    if (batchNo) filter.batchNo = batchNo;
    if (locationCode) filter.locationCode = locationCode;
    if (status) filter.status = status;

    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const total = await InventoryModel.countDocuments(filter);
    const data = await InventoryModel.find(filter)
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * size)
      .limit(size);

    res.json({
      success: true,
      data: { data, total, page: pageNum, pageSize: size },
    });
  })
);

router.post(
  "/inbound",
  validateRequest(ScanInboundSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as ScanInboundSchema["_output"];

    const batch = await BatchModel.findOne({ batchNo: input.batchNo });
    if (!batch) {
      throw new AppError("批次不存在，请先创建批次信息", 404);
    }

    const location = await LocationModel.findOne({ code: input.locationCode });
    if (!location) {
      throw new AppError("库位不存在", 404);
    }
    if (location.status === "LOCKED") {
      throw new AppError("库位已锁定，无法入库", 400);
    }
    if (location.temperatureZone !== batch.temperatureZone) {
      throw new AppError(
        `温区不匹配：批次需要${batch.temperatureZone}，库位是${location.temperatureZone}`,
        400
      );
    }

    const existing = await InventoryModel.findOne({
      sku: batch.sku,
      locationCode: input.locationCode,
    });

    let inventory;
    if (existing) {
      if (existing.batchNo !== input.batchNo) {
        throw new AppError("该库位已存放不同批次，请更换库位", 400);
      }
      existing.quantity += input.quantity;
      existing.availableQuantity += input.quantity;
      inventory = await existing.save();
    } else {
      inventory = await InventoryModel.create({
        batchId: batch._id,
        batchNo: input.batchNo,
        sku: batch.sku,
        skuName: batch.skuName,
        locationId: location._id,
        locationCode: input.locationCode,
        quantity: input.quantity,
        availableQuantity: input.quantity,
        reservedQuantity: 0,
        unit: batch.unit,
        status: "NORMAL",
        temperatureZone: batch.temperatureZone,
        expiryDate: batch.expiryDate,
      });
    }

    batch.receivedQuantity += input.quantity;
    if (batch.receivedQuantity >= batch.quantity && batch.status === "RECEIVING") {
      batch.status = "QUALITY_CHECK";
    }
    await batch.save();

    location.currentCapacity += input.quantity;
    if (location.currentCapacity >= location.maxCapacity) {
      location.status = "FULL";
    }
    await location.save();

    const tx = await InventoryTransactionModel.create({
      transactionNo: `TX-IN-${Date.now()}-${uuidv4().slice(0, 6)}`,
      batchId: batch._id,
      batchNo: input.batchNo,
      sku: batch.sku,
      skuName: batch.skuName,
      operationType: "INBOUND",
      toLocationId: location._id,
      toLocationCode: input.locationCode,
      quantity: input.quantity,
      unit: batch.unit,
      operator: input.operator,
      operationTime: new Date(),
      remark: input.remark,
    });

    const safetyStock = await SafetyStockModel.findOne({ sku: batch.sku });
    if (safetyStock) {
      const total = await InventoryModel.aggregate([
        { $match: { sku: batch.sku } },
        { $group: { _id: null, total: { $sum: "$availableQuantity" } } },
      ]);
      safetyStock.currentStock = total[0]?.total || 0;
      if (safetyStock.currentStock <= safetyStock.minQuantity) {
        safetyStock.status = "CRITICAL";
      } else if (safetyStock.currentStock <= safetyStock.reorderPoint) {
        safetyStock.status = "WARNING";
      } else {
        safetyStock.status = "NORMAL";
      }
      await safetyStock.save();
    }

    res.status(201).json({
      success: true,
      data: { inventory, transaction: tx },
      message: "入库成功",
    });
  })
);

router.post(
  "/outbound",
  validateRequest(ScanOutboundSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as ScanOutboundSchema["_output"];

    const batch = await BatchModel.findOne({ batchNo: input.batchNo });
    if (!batch) {
      throw new AppError("批次不存在", 404);
    }

    const location = await LocationModel.findOne({ code: input.locationCode });
    if (!location) {
      throw new AppError("库位不存在", 404);
    }

    const inventory = await InventoryModel.findOne({
      sku: batch.sku,
      locationCode: input.locationCode,
      batchNo: input.batchNo,
    });
    if (!inventory) {
      throw new AppError("该库位无此批次库存", 404);
    }
    if (inventory.status === "LOCKED") {
      throw new AppError("库存已锁定，无法出库", 400);
    }
    if (inventory.availableQuantity < input.quantity) {
      throw new AppError(
        `可用库存不足：当前可用 ${inventory.availableQuantity}${inventory.unit}`,
        400
      );
    }

    inventory.quantity -= input.quantity;
    inventory.availableQuantity -= input.quantity;
    if (inventory.quantity <= 0) {
      await inventory.deleteOne();
    } else {
      await inventory.save();
    }

    batch.receivedQuantity = Math.max(0, batch.receivedQuantity - input.quantity);
    if (batch.status === "STORED" && batch.receivedQuantity < batch.quantity) {
      batch.status = "PARTIAL_OUT";
    }
    if (batch.receivedQuantity === 0) {
      batch.status = "EMPTY";
    }
    await batch.save();

    location.currentCapacity = Math.max(0, location.currentCapacity - input.quantity);
    if (location.status === "FULL" && location.currentCapacity < location.maxCapacity) {
      location.status = "ACTIVE";
    }
    await location.save();

    const tx = await InventoryTransactionModel.create({
      transactionNo: `TX-OUT-${Date.now()}-${uuidv4().slice(0, 6)}`,
      batchId: batch._id,
      batchNo: input.batchNo,
      sku: batch.sku,
      skuName: batch.skuName,
      operationType: "OUTBOUND",
      fromLocationId: location._id,
      fromLocationCode: input.locationCode,
      quantity: input.quantity,
      unit: batch.unit,
      referenceNo: input.outboundOrderNo,
      operator: input.operator,
      operationTime: new Date(),
      remark: input.remark,
    });

    const safetyStock = await SafetyStockModel.findOne({ sku: batch.sku });
    if (safetyStock) {
      const total = await InventoryModel.aggregate([
        { $match: { sku: batch.sku } },
        { $group: { _id: null, total: { $sum: "$availableQuantity" } } },
      ]);
      safetyStock.currentStock = total[0]?.total || 0;
      if (safetyStock.currentStock <= safetyStock.minQuantity) {
        safetyStock.status = "CRITICAL";
      } else if (safetyStock.currentStock <= safetyStock.reorderPoint) {
        safetyStock.status = "WARNING";
      }
      await safetyStock.save();
    }

    res.status(201).json({
      success: true,
      data: { inventory: inventory.quantity > 0 ? inventory : null, transaction: tx },
      message: "出库成功",
    });
  })
);

router.get(
  "/transactions",
  asyncHandler(async (req, res) => {
    const {
      page = "1",
      pageSize = "20",
      sku,
      batchNo,
      operationType,
      startDate,
      endDate,
    } = req.query;

    const filter: Record<string, unknown> = {};
    if (sku) filter.sku = { $regex: sku, $options: "i" };
    if (batchNo) filter.batchNo = batchNo;
    if (operationType) filter.operationType = operationType;
    if (startDate || endDate) {
      filter.operationTime = {};
      if (startDate) filter.operationTime.$gte = new Date(startDate as string);
      if (endDate) filter.operationTime.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const total = await InventoryTransactionModel.countDocuments(filter);
    const data = await InventoryTransactionModel.find(filter)
      .sort({ operationTime: -1 })
      .skip((pageNum - 1) * size)
      .limit(size);

    res.json({
      success: true,
      data: { data, total, page: pageNum, pageSize: size },
    });
  })
);

export default router;
