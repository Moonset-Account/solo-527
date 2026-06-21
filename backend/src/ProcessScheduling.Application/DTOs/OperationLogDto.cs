namespace ProcessScheduling.Application.DTOs;

public class OperationLogDto
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string? Username { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string? Detail { get; set; }
    public string? IpAddress { get; set; }
    public bool IsDowntimeRelated { get; set; }
    public DateTime CreatedAt { get; set; }
}
