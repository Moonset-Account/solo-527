using CoworkingBooking.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace CoworkingBooking.Domain.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    public string RealName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string? Department { get; set; }
    public string? Avatar { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    public ICollection<ViewingAppointment> AppointmentsAsConsultant { get; set; } = new List<ViewingAppointment>();
    public ICollection<FollowUpRecord> FollowUpRecords { get; set; } = new List<FollowUpRecord>();
    public ICollection<OperationLog> OperationLogs { get; set; } = new List<OperationLog>();
}
