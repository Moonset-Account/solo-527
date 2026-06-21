namespace ProcessScheduling.Application.DTOs;

public class CreateWorkReportDto
{
    public Guid WorkOrderId { get; set; }
    public Guid OperatorId { get; set; }
    public Guid EquipmentId { get; set; }
    public Guid ShiftId { get; set; }
    public int CompletedQuantity { get; set; }
    public int DefectiveQuantity { get; set; }
    public double WorkHours { get; set; }
    public string? Remarks { get; set; }
}
