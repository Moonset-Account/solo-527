using ProcessScheduling.Domain.Enums;

namespace ProcessScheduling.Domain.Entities;

public class User : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string RealName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public Guid? ShiftId { get; set; }
    public bool IsActive { get; set; } = true;
    public Shift? Shift { get; set; }
    public ICollection<OperationLog> OperationLogs { get; set; } = new List<OperationLog>();
}
