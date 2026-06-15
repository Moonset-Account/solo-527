
namespace PrintingFactory.Domain.Entities;

public class EquipmentAssignment
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order? Order { get; set; }
    public int EquipmentId { get; set; }
    public Equipment? Equipment { get; set; }
    public int? ProductionNodeId { get; set; }
    public ProductionNode? ProductionNode { get; set; }
    public DateTime AssignTime { get; set; } = DateTime.UtcNow;
    public DateTime? ReleaseTime { get; set; }
    public string? Operator { get; set; }
    public string? Remarks { get; set; }
}
