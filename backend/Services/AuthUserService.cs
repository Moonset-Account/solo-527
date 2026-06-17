using Microsoft.EntityFrameworkCore;
using OpsWorkOrder.Data;
using OpsWorkOrder.Dtos;
using OpsWorkOrder.Enums;
using OpsWorkOrder.Models;
using OpsWorkOrder.Common;

namespace OpsWorkOrder.Services;

public interface IAuthService
{
    Task<ApiResult<LoginResponseDto>> LoginAsync(LoginRequestDto request, string ipAddress);
    Task<ApiResult> LogoutAsync(int userId);
    Task<ApiResult<UserDto>> GetCurrentUserAsync(int userId);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly JwtHelper _jwtHelper;
    private readonly IAuditLogService _auditLogService;

    public AuthService(AppDbContext context, JwtHelper jwtHelper, IAuditLogService auditLogService)
    {
        _context = context;
        _jwtHelper = jwtHelper;
        _auditLogService = auditLogService;
    }

    public async Task<ApiResult<LoginResponseDto>> LoginAsync(LoginRequestDto request, string ipAddress)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == request.UserName && u.IsActive);
        if (user == null)
        {
            return ApiResult<LoginResponseDto>.Fail("用户名或密码错误");
        }

        if (!PasswordHelper.VerifyPassword(request.Password, user.PasswordHash))
        {
            return ApiResult<LoginResponseDto>.Fail("用户名或密码错误");
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(user.Id, user.UserName, user.Role,
            AuditActionType.Login, "User", user.Id.ToString(), null, null,
            "用户登录", ipAddress);

        var token = _jwtHelper.GenerateToken(user.Id, user.UserName, user.Role);
        var expiresAt = _jwtHelper.GetExpireTime();

        var userDto = new UserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };

        return ApiResult<LoginResponseDto>.Ok(new LoginResponseDto
        {
            Token = token,
            User = userDto,
            ExpiresAt = expiresAt
        }, "登录成功");
    }

    public async Task<ApiResult> LogoutAsync(int userId)
    {
        return ApiResult.Ok("登出成功");
    }

    public async Task<ApiResult<UserDto>> GetCurrentUserAsync(int userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            return ApiResult<UserDto>.Fail("用户不存在");
        }

        var userDto = new UserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };

        return ApiResult<UserDto>.Ok(userDto);
    }
}

public interface IUserService
{
    Task<ApiResult<PagedResultDto<UserDto>>> GetListAsync(int page, int pageSize, string? keyword, UserRole? role);
    Task<ApiResult<UserDto>> GetByIdAsync(int id);
    Task<ApiResult<UserDto>> CreateAsync(CreateUserDto dto, int operatorId, string ipAddress);
    Task<ApiResult<UserDto>> UpdateAsync(int id, UpdateUserDto dto, int operatorId, string ipAddress);
    Task<ApiResult> DeleteAsync(int id, int operatorId, string ipAddress);
    Task<List<UserDto>> GetUsersByRoleAsync(UserRole role);
}

public class UserService : IUserService
{
    private readonly AppDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public UserService(AppDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    public async Task<ApiResult<PagedResultDto<UserDto>>> GetListAsync(int page, int pageSize, string? keyword, UserRole? role)
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrEmpty(keyword))
        {
            query = query.Where(u => u.UserName.Contains(keyword) || u.FullName.Contains(keyword));
        }

        if (role.HasValue)
        {
            query = query.Where(u => u.Role == role.Value);
        }

        var totalCount = await query.CountAsync();
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserDto
            {
                Id = u.Id,
                UserName = u.UserName,
                FullName = u.FullName,
                Email = u.Email,
                Phone = u.Phone,
                Role = u.Role,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return ApiResult<PagedResultDto<UserDto>>.Ok(new PagedResultDto<UserDto>
        {
            Items = users,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<ApiResult<UserDto>> GetByIdAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return ApiResult<UserDto>.Fail("用户不存在");
        }

        return ApiResult<UserDto>.Ok(new UserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        });
    }

    public async Task<ApiResult<UserDto>> CreateAsync(CreateUserDto dto, int operatorId, string ipAddress)
    {
        if (await _context.Users.AnyAsync(u => u.UserName == dto.UserName))
        {
            return ApiResult<UserDto>.Fail("用户名已存在");
        }

        var user = new User
        {
            UserName = dto.UserName,
            PasswordHash = PasswordHelper.HashPassword(dto.Password),
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            Role = dto.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(operatorId, string.Empty, UserRole.Admin,
            AuditActionType.Create, "User", user.Id.ToString(), null,
            Newtonsoft.Json.JsonConvert.SerializeObject(dto), "创建用户", ipAddress);

        return ApiResult<UserDto>.Ok(new UserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        }, "创建成功");
    }

    public async Task<ApiResult<UserDto>> UpdateAsync(int id, UpdateUserDto dto, int operatorId, string ipAddress)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return ApiResult<UserDto>.Fail("用户不存在");
        }

        var oldValue = Newtonsoft.Json.JsonConvert.SerializeObject(user);

        if (!string.IsNullOrEmpty(dto.FullName))
            user.FullName = dto.FullName;
        if (!string.IsNullOrEmpty(dto.Email))
            user.Email = dto.Email;
        if (!string.IsNullOrEmpty(dto.Phone))
            user.Phone = dto.Phone;
        if (dto.Role.HasValue)
            user.Role = dto.Role.Value;
        if (dto.IsActive.HasValue)
            user.IsActive = dto.IsActive.Value;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(operatorId, string.Empty, UserRole.Admin,
            AuditActionType.Update, "User", user.Id.ToString(), oldValue,
            Newtonsoft.Json.JsonConvert.SerializeObject(dto), "更新用户", ipAddress);

        return ApiResult<UserDto>.Ok(new UserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        }, "更新成功");
    }

    public async Task<ApiResult> DeleteAsync(int id, int operatorId, string ipAddress)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return ApiResult.Fail("用户不存在");
        }

        user.IsActive = false;
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(operatorId, string.Empty, UserRole.Admin,
            AuditActionType.Delete, "User", user.Id.ToString(), null, null, "删除用户", ipAddress);

        return ApiResult.Ok("删除成功");
    }

    public async Task<List<UserDto>> GetUsersByRoleAsync(UserRole role)
    {
        return await _context.Users
            .Where(u => u.Role == role && u.IsActive)
            .Select(u => new UserDto
            {
                Id = u.Id,
                UserName = u.UserName,
                FullName = u.FullName,
                Email = u.Email,
                Phone = u.Phone,
                Role = u.Role,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();
    }
}
