using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using MedicalAllocation.Domain.Entities;
using MedicalAllocation.Domain.Enums;
using MedicalAllocation.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MedicalAllocation.Infrastructure.Repositories;

public class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _unitOfWork;

    public DashboardService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DashboardStatsDTO> GetDashboardStatsAsync(CancellationToken cancellationToken = default)
    {
        var inventories = await _unitOfWork.Inventories.GetAllAsync();
        var allocations = await _unitOfWork.AllocationRequests.GetAllAsync();
        var suggestions = await _unitOfWork.ReplenishmentSuggestions.GetAllAsync();
        var discrepancies = await _unitOfWork.DiscrepancyRecords.GetAllAsync();
        var exceptions = await _unitOfWork.ExceptionRecords.GetAllAsync();
        var medicines = await _unitOfWork.Medicines.GetAllAsync();

        var belowSafety = inventories.Count(i => i.Medicine != null && i.Quantity < i.Medicine.SafetyStock);
        var highRisk = inventories.Count(i => i.Medicine != null && i.Quantity < i.Medicine.SafetyStock * 0.3m);

        return new DashboardStatsDTO
        {
            TotalMedicines = medicines.Count(),
            BelowSafetyCount = belowSafety,
            HighRiskCount = highRisk,
            PendingAllocations = allocations.Count(a => a.Status == AllocationStatus.Pending),
            PendingSupplierReplies = suggestions.Count(s => !s.IsProcessed),
            OpenDiscrepancies = discrepancies.Count(d => d.Status != DiscrepancyStatus.Resolved),
            OpenExceptions = exceptions.Count(e => e.Status != ExceptionStatus.Resolved)
        };
    }

    public async Task<IEnumerable<SafetyStockDashboardDTO>> GetSafetyStockAlertsAsync(int? warehouseId = null, CancellationToken cancellationToken = default)
    {
        var inventories = await _unitOfWork.Inventories.GetAllAsync();
        var result = new List<SafetyStockDashboardDTO>();

        foreach (var inv in inventories)
        {
            if (warehouseId.HasValue && inv.WarehouseId != warehouseId.Value)
                continue;

            if (inv.Medicine != null && inv.Quantity < inv.Medicine.SafetyStock)
            {
                var ratio = inv.Medicine.SafetyStock > 0 ? inv.Quantity / inv.Medicine.SafetyStock : 0;
                var status = ratio < 0.3m ? "严重短缺" : ratio < 0.6m ? "短缺" : "接近安全库存";
                var daysUntil = inv.Quantity > 0 ? (int)Math.Floor(inv.Quantity / 10m) : 0;

                result.Add(new SafetyStockDashboardDTO
                {
                    MedicineId = inv.MedicineId,
                    MedicineCode = inv.Medicine?.Code ?? "",
                    MedicineName = inv.Medicine?.Name ?? "",
                    WarehouseId = inv.WarehouseId,
                    WarehouseName = inv.Warehouse?.Name ?? "",
                    CurrentQuantity = inv.Quantity,
                    SafetyStock = inv.Medicine?.SafetyStock ?? 0,
                    StockRatio = ratio,
                    Status = status,
                    RiskLevel = CalculateRiskLevel(inv.Quantity, inv.Medicine?.SafetyStock ?? 0, inv.Medicine?.MaxStock ?? 0),
                    DaysUntilStockout = daysUntil
                });
            }
        }

        return result;
    }

    public async Task<IEnumerable<SafetyStockDashboardDTO>> GetHighRiskMedicinesAsync(int take = 20, CancellationToken cancellationToken = default)
    {
        var alerts = await GetSafetyStockAlertsAsync(null, cancellationToken);
        return alerts
            .OrderByDescending(a => a.RiskLevel)
            .ThenBy(a => a.DaysUntilStockout)
            .Take(take);
    }

    public async Task<IEnumerable<StockoutTrendPointDTO>> GetStockoutRiskTrendAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        var trends = await _unitOfWork.StockoutRiskTrends.FindAsync(
            t => t.RecordDate >= startDate && t.RecordDate <= endDate);

        return trends.GroupBy(t => t.RecordDate.Date)
            .Select(g => new StockoutTrendPointDTO
            {
                Date = g.Key,
                RiskCountLow = g.Count(t => t.RiskLevel == RiskLevel.Low),
                RiskCountMedium = g.Count(t => t.RiskLevel == RiskLevel.Medium),
                RiskCountHigh = g.Count(t => t.RiskLevel == RiskLevel.High),
                RiskCountCritical = g.Count(t => t.RiskLevel == RiskLevel.Critical)
            })
            .OrderBy(t => t.Date);
    }

    public async Task<IEnumerable<CategoryStockDTO>> GetCategoryStockSummaryAsync(CancellationToken cancellationToken = default)
    {
        var inventories = await _unitOfWork.Inventories.GetAllAsync();
        return inventories
            .Where(i => i.Medicine != null)
            .GroupBy(i => i.Medicine!.Category)
            .Select(g => new CategoryStockDTO
            {
                Category = g.Key ?? "未分类",
                TotalStock = g.Sum(i => i.Quantity),
                BelowSafetyCount = g.Count(i => i.Medicine != null && i.Quantity < i.Medicine.SafetyStock)
            });
    }

    public async Task GenerateStockoutRiskTrendAsync(CancellationToken cancellationToken = default)
    {
        var inventories = await _unitOfWork.Inventories.GetAllAsync();
        var today = DateTime.Today;

        foreach (var inv in inventories)
        {
            if (inv.Medicine == null) continue;

            var riskLevel = CalculateRiskLevel(inv.Quantity, inv.Medicine.SafetyStock, inv.Medicine.MaxStock);
            var existing = await _unitOfWork.StockoutRiskTrends
                .FindAsync(t => t.MedicineId == inv.MedicineId && t.WarehouseId == inv.WarehouseId && t.RecordDate == today);

            var trend = existing.FirstOrDefault();
            if (trend == null)
            {
                await _unitOfWork.StockoutRiskTrends.AddAsync(new StockoutRiskTrend
                {
                    MedicineId = inv.MedicineId,
                    WarehouseId = inv.WarehouseId,
                    RecordDate = today,
                    CurrentStock = inv.Quantity,
                    SafetyStock = inv.Medicine.SafetyStock,
                    MaxStock = inv.Medicine.MaxStock,
                    RiskLevel = riskLevel,
                    CreatedAt = DateTime.Now
                });
            }
            else
            {
                trend.CurrentStock = inv.Quantity;
                trend.SafetyStock = inv.Medicine.SafetyStock;
                trend.MaxStock = inv.Medicine.MaxStock;
                trend.RiskLevel = riskLevel;
                await _unitOfWork.StockoutRiskTrends.UpdateAsync(trend);
            }
        }

        await _unitOfWork.SaveChangesAsync();
    }

    private static RiskLevel CalculateRiskLevel(decimal currentStock, decimal safetyStock, decimal maxStock)
    {
        if (currentStock <= 0) return RiskLevel.Critical;
        if (currentStock < safetyStock * 0.3m) return RiskLevel.Critical;
        if (currentStock < safetyStock * 0.6m) return RiskLevel.High;
        if (currentStock < safetyStock) return RiskLevel.Medium;
        return RiskLevel.Low;
    }
}
