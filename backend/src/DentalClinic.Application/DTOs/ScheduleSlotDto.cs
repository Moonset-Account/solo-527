
namespace DentalClinic.Application.DTOs;

public class ScheduleSlotDto
{
    public int Id { get; set; }
    public int DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public string? DoctorTitle { get; set; }
    public int ClinicId { get; set; }
    public string? ClinicName { get; set; }
    public DateTime Date { get; set; }
    public string? DateText { get; set; }
    public TimeSpan StartTime { get; set; }
    public string? StartTimeText { get; set; }
    public TimeSpan EndTime { get; set; }
    public string? EndTimeText { get; set; }
    public int TotalSlots { get; set; }
    public int BookedSlots { get; set; }
    public int AvailableSlots { get; set; }
    public int Status { get; set; }
    public string? StatusText { get; set; }
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ScheduleSlotCreateDto
{
    public int DoctorId { get; set; }
    public int ClinicId { get; set; }
    public DateTime Date { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int TotalSlots { get; set; }
    public string? Remark { get; set; }
}

public class ScheduleSlotQueryDto
{
    public int? ClinicId { get; set; }
    public int? DoctorId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? Status { get; set; }
}
