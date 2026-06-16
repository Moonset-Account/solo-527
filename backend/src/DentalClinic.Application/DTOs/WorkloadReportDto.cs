
namespace DentalClinic.Application.DTOs;

public class WorkloadReportDto
{
    public int Id { get; set; }
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public int ClinicId { get; set; }
    public string ClinicName { get; set; } = string.Empty;
    public DateTime ReportDate { get; set; }
    public string? ReportDateText { get; set; }
    public int TotalAppointments { get; set; }
    public int CompletedAppointments { get; set; }
    public int CancelledAppointments { get; set; }
    public int FollowUpCount { get; set; }
    public int CompletedFollowUps { get; set; }
    public int OverdueFollowUps { get; set; }
    public int NoShowAppointments { get; set; }
    public string? SyncSource { get; set; }
    public DateTime? SyncedAt { get; set; }
    public string? SyncedAtText { get; set; }
    public decimal TotalRevenue { get; set; }
    public double WorkloadScore { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class WorkloadReportQueryDto
{
    public int? ClinicId { get; set; }
    public int? DoctorId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
