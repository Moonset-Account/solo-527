namespace ProcessScheduling.Application.DTOs;

public class UserDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string RealName { get; set; } = string.Empty;
    public int Role { get; set; }
    public string RoleText { get; set; } = string.Empty;
    public Guid? ShiftId { get; set; }
    public string? ShiftName { get; set; }
    public bool IsActive { get; set; }
}
