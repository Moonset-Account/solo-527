namespace CoworkingBooking.Domain.Entities;

public class OperationLog : EntityBase
{
    public Guid? UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string Operation { get; set; } = string.Empty;
    public string? TargetType { get; set; }
    public Guid? TargetId { get; set; }
    public string? TargetName { get; set; }
    public string? BeforeData { get; set; }
    public string? AfterData { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public bool IsSuccess { get; set; } = true;
    public string? ErrorMessage { get; set; }
    public DateTime OperatedAt { get; set; } = DateTime.UtcNow;
}
