using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ArtEduScheduler.API.Data;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace ArtEduScheduler.API.Services;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginDto dto);
    Task<UserDto> RegisterAsync(CreateUserDto dto);
    Task<UserDto?> GetUserByIdAsync(int id);
    Task<List<UserDto>> GetUsersByRoleAsync(UserRole role);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == dto.UserName && u.IsActive);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return null;

        var token = GenerateJwtToken(user);
        var userDto = MapToUserDto(user);

        return new LoginResponseDto { Token = token, User = userDto };
    }

    public async Task<UserDto> RegisterAsync(CreateUserDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.UserName == dto.UserName))
            throw new InvalidOperationException("用户名已存在");

        User user;
        if (dto.Role == UserRole.Student)
        {
            user = new Student
            {
                UserName = dto.UserName,
                RealName = dto.RealName,
                Phone = dto.Phone,
                Email = dto.Email,
                Role = dto.Role,
                TotalHours = dto.TotalHours ?? 0,
                ArtMajor = dto.ArtMajor,
                ParentName = dto.ParentName,
                ParentPhone = dto.ParentPhone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
            };
        }
        else
        {
            user = new User
            {
                UserName = dto.UserName,
                RealName = dto.RealName,
                Phone = dto.Phone,
                Email = dto.Email,
                Role = dto.Role,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
            };
        }

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return MapToUserDto(user);
    }

    public async Task<UserDto?> GetUserByIdAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        return user == null ? null : MapToUserDto(user);
    }

    public async Task<List<UserDto>> GetUsersByRoleAsync(UserRole role)
    {
        var users = await _context.Users.Where(u => u.Role == role && u.IsActive).ToListAsync();
        return users.Select(MapToUserDto).ToList();
    }

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("RealName", user.RealName)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(double.Parse(_config["Jwt:ExpireMinutes"]!)),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserDto MapToUserDto(User user)
    {
        var dto = new UserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            RealName = user.RealName,
            Phone = user.Phone,
            Email = user.Email,
            Role = user.Role
        };

        if (user is Student student)
        {
            dto.RemainingHours = student.RemainingHours;
            dto.TotalHours = student.TotalHours;
            dto.ArtMajor = student.ArtMajor;
            dto.ParentName = student.ParentName;
            dto.ParentPhone = student.ParentPhone;
        }

        return dto;
    }
}
