using CoworkingBooking.Application.Common;
using CoworkingBooking.Application.DTOs.Auth;

namespace CoworkingBooking.Application.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request);
    Task<ApiResponse> RegisterAsync(RegisterRequest request);
    Task<ApiResponse<UserInfo>> GetCurrentUserInfoAsync(Guid userId);
}
