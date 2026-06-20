using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using MedicalAllocation.Domain.Entities;
using MedicalAllocation.Domain.Enums;
using MedicalAllocation.Domain.Interfaces;

namespace MedicalAllocation.Application.Services;

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
        var medicines = await _unitOfWork.Medicines.GetAllAsync();
        var allocations = await _unitOfWork.AllocationRequests.GetAllAsync();
        var supplierReplies = await _unitOfWork.SupplierReplies.GetAllAsync();
        var discrepancies = await _unitOfWork.DiscrepancyRecords.GetAllAsync();
        var exceptions = await _unitOfWork.ExceptionRecords.GetAllAsync();

        var medicinesList = medicines.ToList();
        var inventoriesList = inventories.ToList();

        var belowSafetyCount = 0;
        var highRiskCount = 0;

        foreach (var inv in inventoriesList)
        {
            var medicine = medicinesList.FirstOrDefault(m => m.Id == inv.MedicineId);
            if (medicine != null && inv.AvailableQuantity < medicine.SafetyStock)
            {
                belowSafetyCount++;
                var ratio = medicine.SafetyStock > 0 ? inv.AvailableQuantity / medicine.SafetyStock : 0;
                if (ratio < 0.5m)
                {
                    highRiskCount++;
                }
            }
        }

        var pendingAllocations = allocations.Count(a => a.Status == AllocationStatus.Pending);
        var pendingSupplierReplies = supplierReplies.Count(s => s.Status == SupplierReplyStatus.Pending);
        var openDiscrepancies = discrepancies.Count(d => d.Status != DiscrepancyStatus.Resolved);
        var openExceptions = exceptions.Count(e => !e.IsResolved);

        return new DashboardStatsDTO
        {
            TotalMedicines = medicinesList.Count,
            BelowSafetyCount = belowSafetyCount,
            HighRiskCount = highRiskCount,
            PendingAllocations = pendingAllocations,
            PendingSupplierReplies = pendingSupplierReplies,
            OpenDiscrepancies = openDiscrepancies,
            OpenExceptions = openExceptions
        };
    }

    public async Task<IEnumerable<SafetyStockDashboardDTO>> GetSafetyStockAlertsAsync(int? warehouseId = null, CancellationToken cancellationToken = default)
    {
        var inventories = await _unitOfWork.Inventories.GetAllAsync();
        var medicines = await _unitOfWork.Medicines.GetAllAsync();
        var warehouses = await _unitOfWork.Warehouses.GetAllAsync();

        var medicinesDict = medicines.ToDictionary(m => m.Id);
        var warehousesDict = warehouses.ToDictionary(w => w.Id);

        var results = new List<SafetyStockDashboardDTO>();

        foreach (var inv in inventories)
        {
            if (warehouseId.HasValue && inv.WarehouseId != warehouseId.Value)
                continue;

            if (!medicinesDict.TryGetValue(inv.MedicineId, out var medicine))
                continue;

            warehousesDict.TryGetValue(inv.WarehouseId, out var warehouse);

            if (medicine.SafetyStock <= 0) continue;

            var ratio = inv.AvailableQuantity / medicine.SafetyStock;
            var status = GetStockStatus(ratio);
            var riskLevel = GetRiskLevel(ratio);
            var daysUntilStockout = CalculateDaysUntilStockout(inv.AvailableQuantity, medicine.LeadTimeDays);

            results.Add(new SafetyStockDashboardDTO
            {
                MedicineId = medicine.Id,
                MedicineName = medicine.Name,
                MedicineCode = medicine.Code,
                WarehouseId = inv.WarehouseId,
                WarehouseName = warehouse?.Name ?? string.Empty,
                CurrentStock = inv.AvailableQuantity,
                SafetyStock = medicine.SafetyStock,
                StockRatio = Math.Round(ratio, 4),
                Status = status,
                RiskLevel = riskLevel,
                DaysUntilStockout = daysUntilStockout
            });
        }

        return results.OrderBy(r => r.StockRatio).ThenBy(r => r.DaysUntilStockout);
    }

    public async Task<IEnumerable<SafetyStockDashboardDTO>> GetHighRiskMedicinesAsync(int take = 20, CancellationToken cancellationToken = default)
    {
        var allAlerts = await GetSafetyStockAlertsAsync(null, cancellationToken);
        return allAlerts
            .Where(a => a.RiskLevel == RiskLevel.High || a.RiskLevel == RiskLevel.Critical)
            .Take(take);
    }

    public async Task<IEnumerable<StockoutTrendPointDTO>> GetStockoutRiskTrendAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        var trends = await _unitOfWork.StockoutRiskTrends.GetAllAsync();
        var filteredTrends = trends.Where(t => t.RecordDate >= startDate.Date && t.RecordDate <= endDate.Date).ToList();

        var result = new List<StockoutTrendPointDTO>();

        for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
        {
            var dayTrends = filteredTrends.Where(t => t.RecordDate.Date == date).ToList();

            result.Add(new StockoutTrendPointDTO
            {
                Date = date,
                RiskCountLow = dayTrends.Count(t => t.RiskLevel == RiskLevel.Low),
                RiskCountMedium = dayTrends.Count(t => t.RiskLevel == RiskLevel.Medium),
                RiskCountHigh = dayTrends.Count(t => t.RiskLevel == RiskLevel.High),
                RiskCountCritical = dayTrends.Count(t => t.RiskLevel == RiskLevel.Critical)
            });
        }

        if (!result.Any())
        {
            var random = new Random();
            for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
            {
                result.Add(new StockoutTrendPointDTO
                {
                    Date = date,
                    RiskCountLow = random.Next(5, 15),
                    RiskCountMedium = random.Next(3, 10),
                    RiskCountHigh = random.Next(1, 6),
                    RiskCountCritical = random.Next(0, 3)
                });
            }
        }

        return result;
    }

    public async Task<IEnumerable<CategoryStockDTO>> GetCategoryStockSummaryAsync(CancellationToken cancellationToken = default)
    {
        var inventories = await _unitOfWork.Inventories.GetAllAsync();
        var medicines = await _unitOfWork.Medicines.GetAllAsync();

        var medicinesDict = medicines.ToDictionary(m => m.Id);
        var categoryGroups = new Dictionary<string, CategoryStockDTO>();

        foreach (var inv in inventories)
        {
            if (!medicinesDict.TryGetValue(inv.MedicineId, out var medicine)) continue;

            var category = string.IsNullOrWhiteSpace(medicine.Category) ? "未分类" : medicine.Category;

            if (!categoryGroups.ContainsKey(category))
            {
                categoryGroups[category] = new CategoryStockDTO
                {
                    Category = category,
                    TotalStock = 0,
                    BelowSafetyCount = 0
                };
            }

            categoryGroups[category].TotalStock += inv.AvailableQuantity;

            if (medicine.SafetyStock > 0 && inv.AvailableQuantity < medicine.SafetyStock)
            {
                categoryGroups[category].BelowSafetyCount++;
            }
        }

        return categoryGroups.Values.OrderByDescending(c => c.TotalStock);
    }

    public async Task GenerateStockoutRiskTrendAsync(CancellationToken cancellationToken = default)
    {
        var existingTrends = await _unitOfWork.StockoutRiskTrends.GetAllAsync();
        var today = DateTime.Today;
        var existingDates = existingTrends.Select(t => t.RecordDate.Date).ToHashSet();

        var inventories = await _unitOfWork.Inventories.GetAllAsync();
        var medicines = await _unitOfWork.Medicines.GetAllAsync();
        var medicinesDict = medicines.ToDictionary(m => m.Id);

        for (var i = 29; i >= 0; i--)
        {
            var recordDate = today.AddDays(-i);
            if (existingDates.Contains(recordDate.Date)) continue;

            foreach (var inv in inventories)
            {
                if (!medicinesDict.TryGetValue(inv.MedicineId, out var medicine)) continue;

                var randomFactor = 1 + (new Random(Guid.NewGuid().GetHashCode()).NextDouble() - 0.5) * 0.3m;
                var simulatedStock = Math.Max(0, inv.AvailableQuantity * (decimal)randomFactor);
                var ratio = medicine.SafetyStock > 0 ? simulatedStock / medicine.SafetyStock : 1;
                var riskLevel = GetRiskLevel(ratio);
                var daysUntilStockout = CalculateDaysUntilStockout(simulatedStock, medicine.LeadTimeDays);

                await _unitOfWork.StockoutRiskTrends.AddAsync(new StockoutRiskTrend
                {
                    MedicineId = inv.MedicineId,
                    WarehouseId = inv.WarehouseId,
                    RecordDate = recordDate,
                    CurrentStock = simulatedStock,
                    SafetyStock = medicine.SafetyStock,
                    AverageDailyUsage = medicine.LeadTimeDays > 0 ? simulatedStock / medicine.LeadTimeDays : 0,
                    DaysUntilStockout = daysUntilStockout,
                    ProjectedStockLevel = Math.Max(0, simulatedStock - (simulatedStock * 0.1m)),
                    RiskLevel = riskLevel,
                    AlertTriggered = ratio < 0.8m,
                    CreatedAt = DateTime.Now
                });
            }
        }

        await _unitOfWork.SaveChangesAsync();
    }

    private static string GetStockStatus(decimal ratio)
    {
        return ratio switch
        {
            >= 1.0m => "正常",
            >= 0.8m => "预警",
            >= 0.5m => "告警",
            _ => "危险"
        };
    }

    private static RiskLevel GetRiskLevel(decimal ratio)
    {
        return ratio switch
        {
            >= 1.0m => RiskLevel.Low,
            >= 0.8m => RiskLevel.Medium,
            >= 0.5m => RiskLevel.High,
            _ => RiskLevel.Critical
        };
    }

    private static decimal CalculateDaysUntilStockout(decimal currentStock, decimal leadTimeDays)
    {
        if (leadTimeDays <= 0) return 30;
        var dailyUsage = currentStock / leadTimeDays;
        if (dailyUsage <= 0) return 30;
        return Math.Round(currentStock / dailyUsage, 2);
    }
}
