using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string? Username { get; set; }
    public string? Name { get; set; }
    public UserRole Role { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Department { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}
