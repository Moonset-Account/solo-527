using MedicalAllocation.Application.DTOs;

namespace MedicalAllocation.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<UserDTO?> GetUserByIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<UserDTO?> GetUserByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<IEnumerable<UserDTO>> GetAllUsersAsync(CancellationToken cancellationToken = default);
    Task<UserDTO> CreateUserAsync(UserDTO userDto, string password, CancellationToken cancellationToken = default);
    Task<UserDTO?> UpdateUserAsync(UserDTO userDto, CancellationToken cancellationToken = default);
    Task<bool> DeleteUserAsync(int userId, CancellationToken cancellationToken = default);
    Task<bool> ChangePasswordAsync(int userId, string oldPassword, string newPassword, CancellationToken cancellationToken = default);
    Task<bool> ToggleUserActiveAsync(int userId, CancellationToken cancellationToken = default);
}
