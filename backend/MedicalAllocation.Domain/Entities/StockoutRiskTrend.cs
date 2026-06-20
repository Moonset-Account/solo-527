using MedicalAllocation.Domain.Enums;

namespace MedicalAllocation.Domain.Entities;

public class StockoutRiskTrend
{
    public int Id { get; set; }
    public int MedicineId { get; set; }
    public Medicine? Medicine { get; set; }
    public int WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }
    public DateTime RecordDate { get; set; }
    public decimal CurrentStock { get; set; }
    public decimal SafetyStock { get; set; }
    public decimal AverageDailyUsage { get; set; }
    public decimal DaysUntilStockout { get; set; }
    public decimal ProjectedStockLevel { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public bool AlertTriggered { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
