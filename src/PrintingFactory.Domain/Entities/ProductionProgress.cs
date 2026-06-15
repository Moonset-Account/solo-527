
namespace PrintingFactory.Domain.Entities;

public class ProductionProgress
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order? Order { get; set; }
    public int ProductionNodeId { get; set; }
    public ProductionNode? ProductionNode { get; set; }
    public ProductionStatus Status { get; set; } = ProductionStatus.NotStarted;
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Operator { get; set; }
    public string? Remarks { get; set; }
    public int? EquipmentId { get; set; }
    public Equipment? Equipment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public enum ProductionStatus
{
    NotStarted,
    InProgress,
    Paused,
    Completed,
    Skipped
}
