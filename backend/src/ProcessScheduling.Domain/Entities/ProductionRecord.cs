namespace ProcessScheduling.Domain.Entities;

public class ProductionRecord : BaseEntity
{
    public Guid WorkOrderId { get; set; }
    public Guid EquipmentId { get; set; }
    public Guid OperatorId { get; set; }
    public Guid ShiftId { get; set; }
    public int Quantity { get; set; }
    public int DefectiveQuantity { get; set; }
    public DateTime ProductionTime { get; set; }
    public double WorkHours { get; set; }
    public string? Remarks { get; set; }
    public WorkOrder WorkOrder { get; set; } = null!;
    public Equipment Equipment { get; set; } = null!;
    public User Operator { get; set; } = null!;
    public Shift Shift { get; set; } = null!;
}
