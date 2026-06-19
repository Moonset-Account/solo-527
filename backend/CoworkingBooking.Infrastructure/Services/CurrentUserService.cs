using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using CoworkingBooking.Domain.Enums;
using CoworkingBooking.Application.Interfaces;

namespace CoworkingBooking.Infrastructure.Services;

public class CurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var id = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            return id != null ? Guid.Parse(id) : null;
        }
    }

    public string? UserName => _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Name);

    public UserRole? Role
    {
        get
        {
            var role = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Role);
            return role != null ? (UserRole)Enum.Parse(typeof(UserRole), role) : null;
        }
    }

    public string? RealName => _httpContextAccessor.HttpContext?.User?.FindFirstValue("RealName");

    public bool IsInRole(UserRole role)
    {
        return _httpContextAccessor.HttpContext?.User?.IsInRole(role.ToString()) ?? false;
    }
}
