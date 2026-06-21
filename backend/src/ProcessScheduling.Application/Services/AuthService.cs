using ProcessScheduling.Application.DTOs;
using ProcessScheduling.Application.Interfaces;
using ProcessScheduling.Domain.Enums;
using ProcessScheduling.Domain.Interfaces;

namespace ProcessScheduling.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthService(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher, IJwtTokenService jwtTokenService)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
    {
        var user = await _unitOfWork.Users.GetByUsernameAsync(request.Username);
        if (user == null || !user.IsActive)
            return null;

        if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            return null;

        var userDto = MapToUserDto(user);
        var token = _jwtTokenService.GenerateToken(user.Id, user.Username, user.Role);

        return new LoginResponseDto
        {
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddHours(8),
            User = userDto
        };
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid id)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id);
        return user == null ? null : MapToUserDto(user);
    }

    private static UserDto MapToUserDto(Domain.Entities.User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            RealName = user.RealName,
            Role = (int)user.Role,
            RoleText = GetRoleText(user.Role),
            ShiftId = user.ShiftId,
            ShiftName = user.Shift?.Name,
            IsActive = user.IsActive
        };
    }

    private static string GetRoleText(UserRole role) => role switch
    {
        UserRole.Worker => "工人",
        UserRole.WorkshopDirector => "车间主任",
        UserRole.Admin => "管理员",
        _ => "未知"
    };
}
