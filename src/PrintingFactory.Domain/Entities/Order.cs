
namespace PrintingFactory.Domain.Entities;

public class Order
{
    public int Id { get; set; }
    public string OrderNo { get; set; } = string.Empty;
    public int StoreId { get; set; }
    public Store? Store { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Specifications { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal TotalAmount { get; set; }
    public string MaterialRequirements { get; set; } = string.Empty;
    public string SpecialRequirements { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public DateTime DeliveryDate { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public ICollection<ProductionProgress> ProductionProgresses { get; set; } = new List<ProductionProgress>();
    public ICollection<QualityInspection> QualityInspections { get; set; } = new List<QualityInspection>();
    public ICollection<DeliveryTracking> DeliveryTrackings { get; set; } = new List<DeliveryTracking>();
    public ICollection<EquipmentAssignment> EquipmentAssignments { get; set; } = new List<EquipmentAssignment>();
}

public enum OrderStatus
{
    Pending,
    InProduction,
    QualityInspecting,
    QualityFailed,
    Completed,
    Delivered,
    Cancelled
}
