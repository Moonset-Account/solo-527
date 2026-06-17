using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.Domain.Interfaces;

public interface IUserService
{
    Task<IEnumerable<User>> GetAllUsersAsync();
    Task<User?> GetUserByIdAsync(Guid id);
    Task<User?> GetUserByUsernameAsync(string username);
    Task<IEnumerable<User>> GetUsersByRoleAsync(UserRole role);
}
