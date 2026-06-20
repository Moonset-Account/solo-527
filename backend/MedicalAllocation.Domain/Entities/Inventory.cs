namespace MedicalAllocation.Domain.Entities;

public class Inventory
{
    public int Id { get; set; }
    public int MedicineId { get; set; }
    public Medicine? Medicine { get; set; }
    public int WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }
    public decimal AvailableQuantity { get; set; }
    public decimal ReservedQuantity { get; set; }
    public decimal TotalQuantity { get; set; }
    public decimal AverageUnitCost { get; set; }
    public DateTime LastStockInDate { get; set; }
    public DateTime? LastStockOutDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
