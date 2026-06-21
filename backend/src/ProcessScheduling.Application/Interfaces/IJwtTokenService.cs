using ProcessScheduling.Domain.Enums;

namespace ProcessScheduling.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(Guid userId, string username, UserRole role);
    Guid? ValidateToken(string token);
}
