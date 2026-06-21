namespace ProcessScheduling.Application.DTOs;

public class AuditWorkReportDto
{
    public Guid ReportId { get; set; }
    public Guid ReviewerId { get; set; }
    public bool IsApproved { get; set; }
    public string? Comment { get; set; }
}
