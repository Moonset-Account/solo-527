
using GridEventManagement.Web.DTOs;

namespace GridEventManagement.Web.Services;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);
    Task<UserDto?> RegisterAsync(CreateUserDto request);
    Task<UserDto?> GetUserByIdAsync(int id);
    Task<List<UserDto>> GetAllUsersAsync();
    Task<UserDto?> UpdateUserAsync(int id, UpdateUserDto request);
    Task<bool> DeleteUserAsync(int id);
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
}
