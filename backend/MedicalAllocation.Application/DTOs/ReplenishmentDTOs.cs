using MedicalAllocation.Domain.Enums;

namespace MedicalAllocation.Application.DTOs;

public class ReplenishmentSuggestionDTO
{
    public int Id { get; set; }
    public int MedicineId { get; set; }
    public string? MedicineName { get; set; }
    public string? MedicineCode { get; set; }
    public int WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public decimal CurrentStock { get; set; }
    public decimal SafetyStock { get; set; }
    public decimal SuggestedQuantity { get; set; }
    public decimal AverageDailyUsage { get; set; }
    public decimal DaysUntilStockout { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public ReplenishmentPriority Priority { get; set; }
    public int? PreferredSupplierId { get; set; }
    public string? PreferredSupplierName { get; set; }
    public bool IsProcessed { get; set; }
    public DateTime GeneratedAt { get; set; }
    public int? CreatedByUserId { get; set; }
}

public class ReplenishmentQueryDTO
{
    public string? Keyword { get; set; }
    public int? WarehouseId { get; set; }
    public RiskLevel? RiskLevel { get; set; }
    public ReplenishmentPriority? Priority { get; set; }
    public bool? IsProcessed { get; set; }
}

public class CreateReplenishmentDTO
{
    public int MedicineId { get; set; }
    public int WarehouseId { get; set; }
    public decimal SuggestedQuantity { get; set; }
    public ReplenishmentPriority Priority { get; set; }
    public int? PreferredSupplierId { get; set; }
    public int? SourceWarehouseId { get; set; }
    public int? TargetWarehouseId { get; set; }
    public decimal? AllocationQuantity { get; set; }
    public string? Reason { get; set; }
    public int CreatedByUserId { get; set; }
}
