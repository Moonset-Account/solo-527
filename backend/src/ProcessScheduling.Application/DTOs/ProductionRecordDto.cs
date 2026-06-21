namespace ProcessScheduling.Application.DTOs;

public class ProductionRecordDto
{
    public Guid Id { get; set; }
    public Guid WorkOrderId { get; set; }
    public string WorkOrderCode { get; set; } = string.Empty;
    public Guid EquipmentId { get; set; }
    public string EquipmentName { get; set; } = string.Empty;
    public Guid OperatorId { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public Guid ShiftId { get; set; }
    public string ShiftName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int DefectiveQuantity { get; set; }
    public DateTime ProductionTime { get; set; }
    public double WorkHours { get; set; }
    public string? Remarks { get; set; }
}
