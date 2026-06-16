
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using GridEventManagement.Web.Data;
using GridEventManagement.Web.DTOs;
using GridEventManagement.Web.Enums;
using GridEventManagement.Web.Models;

namespace GridEventManagement.Web.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
        if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
        {
            return null;
        }

        var token = GenerateJwtToken(user);
        var expiresInMinutes = _configuration.GetValue<int>("Jwt:ExpiresInMinutes", 60);

        return new LoginResponseDto
        {
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiresInMinutes),
            User = MapToUserDto(user)
        };
    }

    public async Task<UserDto?> RegisterAsync(CreateUserDto request)
    {
        if (await _context.Users.AnyAsync(u => u.Username == request.Username))
        {
            return null;
        }

        var user = new User
        {
            Username = request.Username,
            PasswordHash = HashPassword(request.Password),
            Role = request.Role,
            GridId = request.GridId,
            RealName = request.RealName,
            Phone = request.Phone
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return MapToUserDto(user);
    }

    public async Task<UserDto?> GetUserByIdAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        return user == null ? null : MapToUserDto(user);
    }

    public async Task<List<UserDto>> GetAllUsersAsync()
    {
        var users = await _context.Users.ToListAsync();
        return users.Select(MapToUserDto).ToList();
    }

    public async Task<UserDto?> UpdateUserAsync(int id, UpdateUserDto request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return null;

        user.Role = request.Role;
        user.GridId = request.GridId;
        user.RealName = request.RealName;
        user.Phone = request.Phone;

        await _context.SaveChangesAsync();
        return MapToUserDto(user);
    }

    public async Task<bool> DeleteUserAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }

    public string HashPassword(string password)
    {
        using var hmac = new HMACSHA256();
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        var saltBytes = hmac.Key;
        var combinedBytes = new byte[saltBytes.Length + hashBytes.Length];
        Buffer.BlockCopy(saltBytes, 0, combinedBytes, 0, saltBytes.Length);
        Buffer.BlockCopy(hashBytes, 0, combinedBytes, saltBytes.Length, hashBytes.Length);
        return Convert.ToBase64String(combinedBytes);
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        try
        {
            var combinedBytes = Convert.FromBase64String(passwordHash);
            var saltBytes = new byte[32];
            var hashBytes = new byte[combinedBytes.Length - 32];
            Buffer.BlockCopy(combinedBytes, 0, saltBytes, 0, 32);
            Buffer.BlockCopy(combinedBytes, 32, hashBytes, 0, hashBytes.Length);

            using var hmac = new HMACSHA256(saltBytes);
            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            return computedHash.SequenceEqual(hashBytes);
        }
        catch
        {
            return false;
        }
    }

    private string GenerateJwtToken(User user)
    {
        var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured.");
        var issuer = _configuration["Jwt:Issuer"];
        var audience = _configuration["Jwt:Audience"];
        var expiresInMinutes = _configuration.GetValue<int>("Jwt:ExpiresInMinutes", 60);

        var roleString = user.Role switch
        {
            UserRole.Admin => "admin",
            UserRole.Manager => "manager",
            UserRole.GridWorker => "worker",
            _ => user.Role.ToString().ToLower()
        };

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, roleString),
            new Claim("RealName", user.RealName ?? string.Empty),
            new Claim("GridId", user.GridId?.ToString() ?? string.Empty)
        };

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresInMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserDto MapToUserDto(User user)
    {
        var roleString = user.Role switch
        {
            UserRole.Admin => "admin",
            UserRole.Manager => "manager",
            UserRole.GridWorker => "worker",
            _ => user.Role.ToString().ToLower()
        };

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Role = roleString,
            GridId = user.GridId,
            RealName = user.RealName,
            Phone = user.Phone
        };
    }
}
