using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using OpsWorkOrder.Enums;

namespace OpsWorkOrder.Common;

public class JwtSettings
{
    public string SecretKey { get; set; } = "OpsWorkOrder_Secret_Key_2024_ShouldBeLongEnough";
    public string Issuer { get; set; } = "OpsWorkOrder";
    public string Audience { get; set; } = "OpsWorkOrder";
    public int ExpireMinutes { get; set; } = 1440;
}

public class JwtHelper
{
    private readonly JwtSettings _settings;

    public JwtHelper(JwtSettings settings)
    {
        _settings = settings;
    }

    public string GenerateToken(int userId, string userName, UserRole role)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, userName),
            new Claim(ClaimTypes.Role, role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_settings.ExpireMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public DateTime GetExpireTime()
    {
        return DateTime.UtcNow.AddMinutes(_settings.ExpireMinutes);
    }
}

public static class PasswordHelper
{
    public static string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public static bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}

public static class EnumHelper
{
    public static string GetStatusText(AlertStatus status)
    {
        return status switch
        {
            AlertStatus.Pending => "待处理",
            AlertStatus.Assigned => "已分派",
            AlertStatus.Processing => "处理中",
            AlertStatus.Resolved => "已解决",
            AlertStatus.Closed => "已关闭",
            AlertStatus.Rollback => "回滚中",
            _ => status.ToString()
        };
    }

    public static string GetPriorityText(AlertPriority priority)
    {
        return priority switch
        {
            AlertPriority.Low => "低",
            AlertPriority.Medium => "中",
            AlertPriority.High => "高",
            AlertPriority.Critical => "紧急",
            _ => priority.ToString()
        };
    }

    public static string GetPriorityColor(AlertPriority priority)
    {
        return priority switch
        {
            AlertPriority.Low => "success",
            AlertPriority.Medium => "default",
            AlertPriority.High => "warning",
            AlertPriority.Critical => "error",
            _ => "default"
        };
    }

    public static string GetStatusColor(AlertStatus status)
    {
        return status switch
        {
            AlertStatus.Pending => "default",
            AlertStatus.Assigned => "processing",
            AlertStatus.Processing => "processing",
            AlertStatus.Resolved => "success",
            AlertStatus.Closed => "success",
            AlertStatus.Rollback => "warning",
            _ => "default"
        };
    }
}

public class ApiResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int Code { get; set; }

    public static ApiResult Ok(string message = "操作成功")
    {
        return new ApiResult { Success = true, Message = message, Code = 200 };
    }

    public static ApiResult Fail(string message = "操作失败", int code = 400)
    {
        return new ApiResult { Success = false, Message = message, Code = code };
    }
}

public class ApiResult<T> : ApiResult
{
    public T? Data { get; set; }

    public static ApiResult<T> Ok(T data, string message = "操作成功")
    {
        return new ApiResult<T> { Success = true, Message = message, Code = 200, Data = data };
    }

    public new static ApiResult<T> Fail(string message = "操作失败", int code = 400)
    {
        return new ApiResult<T> { Success = false, Message = message, Code = code };
    }
}
