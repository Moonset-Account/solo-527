import { Router } from "express";
import ExcelJS from "exceljs";
import { asyncHandler, AppError } from "../middleware/error";
import { InventoryTransactionModel } from "../models/Inventory";
import { BatchModel } from "../models/Batch";
import { TransferModel } from "../models/Transfer";
import { ReceiptDiffModel } from "../models/ReceiptDiff";
import { SafetyStockModel } from "../models/SafetyStock";

const router = Router();

router.get(
  "/transactions",
  asyncHandler(async (req, res) => {
    const { startDate, endDate, operationType, format = "xlsx" } = req.query;

    const filter: Record<string, unknown> = {};
    if (startDate || endDate) {
      filter.operationTime = {};
      if (startDate) filter.operationTime.$gte = new Date(startDate as string);
      if (endDate) filter.operationTime.$lte = new Date(endDate as string);
    }
    if (operationType) filter.operationType = operationType;

    const transactions = await InventoryTransactionModel.find(filter).sort({
      operationTime: -1,
    });

    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("库存流水");

      worksheet.columns = [
        { header: "流水号", key: "transactionNo", width: 25 },
        { header: "操作类型", key: "operationType", width: 12 },
        { header: "批次号", key: "batchNo", width: 20 },
        { header: "SKU", key: "sku", width: 15 },
        { header: "商品名称", key: "skuName", width: 20 },
        { header: "来源库位", key: "fromLocationCode", width: 15 },
        { header: "目标库位", key: "toLocationCode", width: 15 },
        { header: "数量", key: "quantity", width: 10 },
        { header: "单位", key: "unit", width: 8 },
        { header: "关联单号", key: "referenceNo", width: 20 },
        { header: "操作人", key: "operator", width: 12 },
        { header: "操作时间", key: "operationTime", width: 22 },
        { header: "备注", key: "remark", width: 30 },
      ];

      worksheet.getRow(1).font = { bold: true };

      transactions.forEach((tx) => {
        worksheet.addRow({
          transactionNo: tx.transactionNo,
          operationType: tx.operationType,
          batchNo: tx.batchNo,
          sku: tx.sku,
          skuName: tx.skuName,
          fromLocationCode: tx.fromLocationCode || "",
          toLocationCode: tx.toLocationCode || "",
          quantity: tx.quantity,
          unit: tx.unit,
          referenceNo: tx.referenceNo || "",
          operator: tx.operator,
          operationTime: new Date(tx.operationTime).toLocaleString("zh-CN"),
          remark: tx.remark || "",
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=inventory-transactions-${Date.now()}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.json({ success: true, data: transactions });
    }
  })
);

router.get(
  "/batches",
  asyncHandler(async (req, res) => {
    const { status, supplier, format = "xlsx" } = req.query;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (supplier) filter.supplier = supplier;

    const batches = await BatchModel.find(filter).sort({ createdAt: -1 });

    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("批次报表");

      worksheet.columns = [
        { header: "批次号", key: "batchNo", width: 22 },
        { header: "SKU", key: "sku", width: 15 },
        { header: "商品名称", key: "skuName", width: 22 },
        { header: "供应商", key: "supplier", width: 18 },
        { header: "供应商批次号", key: "supplierBatchNo", width: 20 },
        { header: "生产日期", key: "productionDate", width: 15 },
        { header: "有效期", key: "expiryDate", width: 15 },
        { header: "应收数量", key: "quantity", width: 12 },
        { header: "实收数量", key: "receivedQuantity", width: 12 },
        { header: "单位", key: "unit", width: 8 },
        { header: "温区", key: "temperatureZone", width: 10 },
        { header: "状态", key: "status", width: 14 },
        { header: "操作人", key: "operator", width: 12 },
        { header: "创建时间", key: "createdAt", width: 22 },
      ];

      worksheet.getRow(1).font = { bold: true };

      batches.forEach((b) => {
        worksheet.addRow({
          batchNo: b.batchNo,
          sku: b.sku,
          skuName: b.skuName,
          supplier: b.supplier,
          supplierBatchNo: b.supplierBatchNo || "",
          productionDate: new Date(b.productionDate).toLocaleDateString("zh-CN"),
          expiryDate: new Date(b.expiryDate).toLocaleDateString("zh-CN"),
          quantity: b.quantity,
          receivedQuantity: b.receivedQuantity,
          unit: b.unit,
          temperatureZone: b.temperatureZone,
          status: b.status,
          operator: b.operator,
          createdAt: new Date(b.createdAt).toLocaleString("zh-CN"),
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=batch-report-${Date.now()}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.json({ success: true, data: batches });
    }
  })
);

router.get(
  "/safety-stock",
  asyncHandler(async (req, res) => {
    const { status, format = "xlsx" } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const items = await SafetyStockModel.find(filter).sort({
      status: 1,
      nextReviewDate: 1,
    });

    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("安全库存报表");

      worksheet.columns = [
        { header: "SKU", key: "sku", width: 15 },
        { header: "商品名称", key: "skuName", width: 22 },
        { header: "分类", key: "category", width: 12 },
        { header: "当前库存", key: "currentStock", width: 12 },
        { header: "最小库存", key: "minQuantity", width: 12 },
        { header: "再订货点", key: "reorderPoint", width: 12 },
        { header: "补货量", key: "reorderQuantity", width: 12 },
        { header: "单位", key: "unit", width: 8 },
        { header: "状态", key: "status", width: 12 },
        { header: "交期(天)", key: "leadTimeDays", width: 12 },
        { header: "责任人", key: "responsiblePerson", width: 12 },
        { header: "上次补货日期", key: "lastRestockDate", width: 15 },
        { header: "下次检查日期", key: "nextReviewDate", width: 15 },
      ];

      worksheet.getRow(1).font = { bold: true };

      items.forEach((s) => {
        worksheet.addRow({
          sku: s.sku,
          skuName: s.skuName,
          category: s.category || "",
          currentStock: s.currentStock,
          minQuantity: s.minQuantity,
          reorderPoint: s.reorderPoint,
          reorderQuantity: s.reorderQuantity,
          unit: s.unit,
          status: s.status,
          leadTimeDays: s.leadTimeDays,
          responsiblePerson: s.responsiblePerson,
          lastRestockDate: s.lastRestockDate
            ? new Date(s.lastRestockDate).toLocaleDateString("zh-CN")
            : "",
          nextReviewDate: new Date(s.nextReviewDate).toLocaleDateString("zh-CN"),
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=safety-stock-report-${Date.now()}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.json({ success: true, data: items });
    }
  })
);

router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekLater = new Date(today);
    weekLater.setDate(weekLater.getDate() + 7);

    const [
      totalBatches,
      expiringBatches,
      totalInventory,
      safetyStockStats,
      pendingTransfers,
      delayedTransfers,
      pendingDiffs,
      todayTxCount,
    ] = await Promise.all([
      BatchModel.countDocuments({
        status: { $in: ["RECEIVING", "QUALITY_CHECK", "STORED", "PARTIAL_OUT"] },
      }),
      BatchModel.countDocuments({
        status: { $in: ["RECEIVING", "QUALITY_CHECK", "STORED", "PARTIAL_OUT"] },
        expiryDate: { $lte: weekLater },
      }),
      InventoryModel.aggregate([
        { $group: { _id: null, totalQty: { $sum: "$quantity" } } },
      ]),
      SafetyStockModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      TransferModel.countDocuments({ status: { $in: ["PENDING", "APPROVED"] } }),
      TransferModel.countDocuments({
        status: { $in: ["PENDING", "APPROVED"] },
        expectedDate: { $lt: now },
      }),
      ReceiptDiffModel.countDocuments({ status: "PENDING" }),
      InventoryTransactionModel.countDocuments({
        operationTime: { $gte: today },
      }),
    ]);

    const safetyMap: Record<string, number> = { NORMAL: 0, WARNING: 0, CRITICAL: 0 };
    safetyStockStats.forEach((s) => {
      safetyMap[s._id as string] = s.count;
    });

    res.json({
      success: true,
      data: {
        totalBatches,
        expiringBatches,
        totalInventory: totalInventory[0]?.totalQty || 0,
        safetyStock: safetyMap,
        pendingTransfers,
        delayedTransfers,
        pendingDiffs,
        todayTransactionCount: todayTxCount,
      },
    });
  })
);

export default router;
