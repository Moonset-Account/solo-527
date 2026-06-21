namespace ProcessScheduling.Application.DTOs;

public class CreateDowntimeRecordDto
{
    public Guid EquipmentId { get; set; }
    public int Reason { get; set; }
    public string? ReasonDetail { get; set; }
    public Guid ReporterId { get; set; }
    public Guid? ShiftId { get; set; }
}
