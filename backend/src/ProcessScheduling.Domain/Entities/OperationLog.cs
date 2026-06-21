namespace ProcessScheduling.Domain.Entities;

public class OperationLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string? Detail { get; set; }
    public string? IpAddress { get; set; }
    public bool IsDowntimeRelated { get; set; }
    public User? User { get; set; }
}
