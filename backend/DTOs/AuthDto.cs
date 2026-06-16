
using GridEventManagement.Web.Enums;

namespace GridEventManagement.Web.DTOs;

public class LoginRequestDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserDto User { get; set; } = null!;
}

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int? GridId { get; set; }
    public string? RealName { get; set; }
    public string? Phone { get; set; }
}

public class CreateUserDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public int? GridId { get; set; }
    public string? RealName { get; set; }
    public string? Phone { get; set; }
}

public class UpdateUserDto
{
    public UserRole Role { get; set; }
    public int? GridId { get; set; }
    public string? RealName { get; set; }
    public string? Phone { get; set; }
}
