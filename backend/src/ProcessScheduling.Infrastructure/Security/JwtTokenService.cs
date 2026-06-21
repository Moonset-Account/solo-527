using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ProcessScheduling.Application.Interfaces;
using ProcessScheduling.Domain.Enums;

namespace ProcessScheduling.Infrastructure.Security;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(Guid userId, string username, UserRole role)
    {
        var key = _configuration["Jwt:Key"] ?? "ProcessSchedulingSecretKeyForJwtToken2024";
        var issuer = _configuration["Jwt:Issuer"] ?? "ProcessScheduling";
        var audience = _configuration["Jwt:Audience"] ?? "ProcessSchedulingUsers";
        var expireHours = int.Parse(_configuration["Jwt:ExpireHours"] ?? "8");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expireHours),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public Guid? ValidateToken(string token)
    {
        try
        {
            var key = _configuration["Jwt:Key"] ?? "ProcessSchedulingSecretKeyForJwtToken2024";
            var issuer = _configuration["Jwt:Issuer"] ?? "ProcessScheduling";
            var audience = _configuration["Jwt:Audience"] ?? "ProcessSchedulingUsers";

            var tokenHandler = new JwtSecurityTokenHandler();
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));

            var parameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = issuer,
                ValidAudience = audience,
                IssuerSigningKey = securityKey
            };

            var principal = tokenHandler.ValidateToken(token, parameters, out _);
            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return null;
            return Guid.Parse(userIdClaim.Value);
        }
        catch
        {
            return null;
        }
    }
}
