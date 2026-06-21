namespace ProcessScheduling.Application.DTOs;

public class DowntimeRecordDto
{
    public Guid Id { get; set; }
    public Guid EquipmentId { get; set; }
    public string EquipmentName { get; set; } = string.Empty;
    public int Reason { get; set; }
    public string ReasonText { get; set; } = string.Empty;
    public string? ReasonDetail { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public double? DurationMinutes { get; set; }
    public Guid ReporterId { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public Guid? ShiftId { get; set; }
    public string? ShiftName { get; set; }
    public bool IsLogged { get; set; }
}
