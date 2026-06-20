using MedicalAllocation.Domain.Enums;

namespace MedicalAllocation.Application.DTOs;

public class SafetyStockDashboardDTO
{
    public int MedicineId { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string MedicineCode { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public decimal CurrentStock { get; set; }
    public decimal SafetyStock { get; set; }
    public decimal StockRatio { get; set; }
    public string Status { get; set; } = string.Empty;
    public RiskLevel RiskLevel { get; set; }
    public decimal DaysUntilStockout { get; set; }
}

public class DashboardStatsDTO
{
    public int TotalMedicines { get; set; }
    public int BelowSafetyCount { get; set; }
    public int HighRiskCount { get; set; }
    public int PendingAllocations { get; set; }
    public int PendingSupplierReplies { get; set; }
    public int OpenDiscrepancies { get; set; }
    public int OpenExceptions { get; set; }
}

public class StockoutTrendPointDTO
{
    public DateTime Date { get; set; }
    public int RiskCountLow { get; set; }
    public int RiskCountMedium { get; set; }
    public int RiskCountHigh { get; set; }
    public int RiskCountCritical { get; set; }
}

public class CategoryStockDTO
{
    public string Category { get; set; } = string.Empty;
    public decimal TotalStock { get; set; }
    public int BelowSafetyCount { get; set; }
}
