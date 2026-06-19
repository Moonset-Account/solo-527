using CoworkingBooking.Application.Common;
using CoworkingBooking.Application.DTOs.Auth;
using CoworkingBooking.Application.Interfaces;
using CoworkingBooking.Domain.Entities;
using CoworkingBooking.Domain.Enums;
using CoworkingBooking.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CoworkingBooking.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;
    private readonly IOperationLogService _logService;

    public AuthService(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, IConfiguration configuration, ApplicationDbContext context, IOperationLogService logService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _context = context;
        _logService = logService;
    }

    public async Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request)
    {
        try
        {
            var user = await _userManager.FindByNameAsync(request.UserName);
            if (user == null)
            {
                await _logService.LogAsync("认证", "登录失败", "User", null, request.UserName, isSuccess: false, errorMessage: "用户不存在");
                return ApiResponse<LoginResponse>.Fail("用户名或密码错误", 401);
            }

            if (!user.IsActive)
            {
                await _logService.LogAsync("认证", "登录失败", "User", user.Id, user.RealName, isSuccess: false, errorMessage: "账号已禁用");
                return ApiResponse<LoginResponse>.Fail("账号已被禁用，请联系管理员", 403);
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            if (!result.Succeeded)
            {
                await _logService.LogAsync("认证", "登录失败", "User", user.Id, user.RealName, isSuccess: false, errorMessage: "密码错误");
                return ApiResponse<LoginResponse>.Fail("用户名或密码错误", 401);
            }

            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            var token = await GenerateJwtToken(user);
            var expiresAt = DateTime.UtcNow.AddHours(double.Parse(_configuration["Jwt:ExpireHours"] ?? "24"));

            await _logService.LogAsync("认证", "登录成功", "User", user.Id, user.RealName);

            return ApiResponse<LoginResponse>.Ok(new LoginResponse
            {
                Token = token,
                ExpiresAt = expiresAt,
                User = new UserInfo
                {
                    Id = user.Id,
                    UserName = user.UserName!,
                    RealName = user.RealName,
                    Email = user.Email ?? "",
                    Role = user.Role,
                    Department = user.Department,
                    Avatar = user.Avatar
                }
            });
        }
        catch (Exception ex)
        {
            await _logService.LogAsync("认证", "登录异常", isSuccess: false, errorMessage: ex.Message);
            throw;
        }
    }

    public async Task<ApiResponse> RegisterAsync(RegisterRequest request)
    {
        var existing = await _userManager.FindByNameAsync(request.UserName);
        if (existing != null)
            return ApiResponse.Fail("用户名已存在");

        var user = new ApplicationUser
        {
            UserName = request.UserName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            RealName = request.RealName,
            Role = request.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return ApiResponse.Fail(string.Join(", ", result.Errors.Select(e => e.Description)));

        await _userManager.AddToRoleAsync(user, request.Role.ToString());
        await _logService.LogAsync("认证", "注册用户", "User", user.Id, user.RealName);

        return ApiResponse.Ok("注册成功");
    }

    public async Task<ApiResponse<UserInfo>> GetCurrentUserInfoAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return ApiResponse<UserInfo>.Fail("用户不存在", 404);

        return ApiResponse<UserInfo>.Ok(new UserInfo
        {
            Id = user.Id,
            UserName = user.UserName!,
            RealName = user.RealName,
            Email = user.Email ?? "",
            Role = user.Role,
            Department = user.Department,
            Avatar = user.Avatar
        });
    }

    public async Task<ApiResponse<List<ConsultantDto>>> GetConsultantsAsync()
    {
        var consultants = await _userManager.GetUsersInRoleAsync(UserRole.Consultant.ToString());
        var managers = await _userManager.GetUsersInRoleAsync(UserRole.ConsultantManager.ToString());

        var result = consultants.Concat(managers)
            .Where(u => u.IsActive)
            .Select(u => new ConsultantDto
            {
                Id = u.Id,
                UserName = u.UserName!,
                RealName = u.RealName,
                Department = u.Department,
                Role = u.Role
            })
            .ToList();

        return ApiResponse<List<ConsultantDto>>.Ok(result);
    }

    private async Task<string> GenerateJwtToken(ApplicationUser user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.UserName!),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("RealName", user.RealName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var roles = await _userManager.GetRolesAsync(user);
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(double.Parse(_configuration["Jwt:ExpireHours"] ?? "24")),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
