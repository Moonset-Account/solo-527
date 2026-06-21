namespace ProcessScheduling.Application.DTOs;

public class AnomalyReportDto
{
    public Guid Id { get; set; }
    public Guid EquipmentId { get; set; }
    public string EquipmentName { get; set; } = string.Empty;
    public Guid ReporterId { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public string AnomalyType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? ResolvedAt { get; set; }
    public string? Resolution { get; set; }
    public Guid? ShiftId { get; set; }
    public string? ShiftName { get; set; }
    public DateTime CreatedAt { get; set; }
}
