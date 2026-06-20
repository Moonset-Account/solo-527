using MedicalAllocation.Domain.Enums;

namespace MedicalAllocation.Domain.Entities;

public class ReplenishmentSuggestion
{
    public int Id { get; set; }
    public int MedicineId { get; set; }
    public Medicine? Medicine { get; set; }
    public int WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }
    public decimal CurrentStock { get; set; }
    public decimal SafetyStock { get; set; }
    public decimal SuggestedQuantity { get; set; }
    public decimal AverageDailyUsage { get; set; }
    public decimal DaysUntilStockout { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public ReplenishmentPriority Priority { get; set; }
    public int? PreferredSupplierId { get; set; }
    public Supplier? PreferredSupplier { get; set; }
    public bool IsProcessed { get; set; } = false;
    public DateTime GeneratedAt { get; set; } = DateTime.Now;
    public int? CreatedByUserId { get; set; }
}
