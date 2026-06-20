using MedicalAllocation.Application.DTOs;

namespace MedicalAllocation.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsDTO> GetDashboardStatsAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<SafetyStockDashboardDTO>> GetSafetyStockAlertsAsync(int? warehouseId = null, CancellationToken cancellationToken = default);
    Task<IEnumerable<SafetyStockDashboardDTO>> GetHighRiskMedicinesAsync(int take = 20, CancellationToken cancellationToken = default);
    Task<IEnumerable<StockoutTrendPointDTO>> GetStockoutRiskTrendAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
    Task<IEnumerable<CategoryStockDTO>> GetCategoryStockSummaryAsync(CancellationToken cancellationToken = default);
    Task GenerateStockoutRiskTrendAsync(CancellationToken cancellationToken = default);
}
