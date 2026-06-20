using MedicalAllocation.Domain.Enums;

namespace MedicalAllocation.Domain.Entities;

public class StockAlert
{
    public int Id { get; set; }
    public string AlertNumber { get; set; } = string.Empty;
    public int MedicineId { get; set; }
    public Medicine? Medicine { get; set; }
    public int WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public string Message { get; set; } = string.Empty;
    public decimal CurrentStock { get; set; }
    public decimal SafetyStock { get; set; }
    public decimal DaysUntilStockout { get; set; }
    public bool IsAcknowledged { get; set; } = false;
    public DateTime? AcknowledgedAt { get; set; }
    public int? AcknowledgedByUserId { get; set; }
    public User? AcknowledgedByUser { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
