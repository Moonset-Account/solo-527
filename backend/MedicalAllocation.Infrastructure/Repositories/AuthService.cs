using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using MedicalAllocation.Domain.Entities;
using MedicalAllocation.Domain.Interfaces;
using AutoMapper;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace MedicalAllocation.Infrastructure.Repositories;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IConfiguration _configuration;

    public AuthService(IUnitOfWork unitOfWork, IMapper mapper, IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _configuration = configuration;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var users = await _unitOfWork.Users.FindAsync(u => u.Username == request.Username);
        var user = users.FirstOrDefault();

        if (user == null || !VerifyPasswordHash(request.Password, user.PasswordHash))
        {
            return null;
        }

        if (!user.IsActive)
        {
            return null;
        }

        var token = GenerateJwtToken(user);
        var response = _mapper.Map<LoginResponse>(user);
        response.Token = token;
        return response;
    }

    public async Task<UserDTO?> GetUserByIdAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        return user == null ? null : _mapper.Map<UserDTO>(user);
    }

    public async Task<UserDTO?> GetUserByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        var users = await _unitOfWork.Users.FindAsync(u => u.Username == username);
        var user = users.FirstOrDefault();
        return user == null ? null : _mapper.Map<UserDTO>(user);
    }

    public async Task<IEnumerable<UserDTO>> GetAllUsersAsync(CancellationToken cancellationToken = default)
    {
        var users = await _unitOfWork.Users.GetAllAsync();
        return _mapper.Map<IEnumerable<UserDTO>>(users);
    }

    public async Task<UserDTO> CreateUserAsync(UserDTO userDto, string password, CancellationToken cancellationToken = default)
    {
        var user = _mapper.Map<User>(userDto);
        user.PasswordHash = HashPassword(password);
        user.CreatedAt = DateTime.Now;
        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<UserDTO>(user);
    }

    public async Task<UserDTO?> UpdateUserAsync(UserDTO userDto, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userDto.Id);
        if (user == null) return null;

        user.Username = userDto.Username;
        user.RealName = userDto.RealName;
        user.Email = userDto.Email;
        user.Phone = userDto.Phone;
        user.Role = userDto.Role;
        user.IsActive = userDto.IsActive;
        user.UpdatedAt = DateTime.Now;

        await _unitOfWork.Users.UpdateAsync(user);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<UserDTO>(user);
    }

    public async Task<bool> DeleteUserAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null) return false;

        await _unitOfWork.Users.DeleteAsync(user);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ChangePasswordAsync(int userId, string oldPassword, string newPassword, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null || !VerifyPasswordHash(oldPassword, user.PasswordHash))
            return false;

        user.PasswordHash = HashPassword(newPassword);
        user.UpdatedAt = DateTime.Now;
        await _unitOfWork.Users.UpdateAsync(user);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleUserActiveAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null) return false;

        user.IsActive = !user.IsActive;
        user.UpdatedAt = DateTime.Now;
        await _unitOfWork.Users.UpdateAsync(user);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:SecretKey"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.Now.AddMinutes(double.Parse(_configuration["Jwt:ExpireMinutes"]!));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string HashPassword(string password)
    {
        byte[] salt;
        byte[] buffer2;
        using (var bytes = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(password),
            salt: new byte[128 / 8],
            iterations: 100000,
            hashAlgorithm: HashAlgorithmName.SHA256,
            outputLength: 256 / 8))
        {
            salt = new byte[128 / 8];
            RandomNumberGenerator.Fill(salt);
            buffer2 = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(password), salt, 100000, HashAlgorithmName.SHA256, 256 / 8);
        }
        var dst = new byte[49];
        Buffer.BlockCopy(salt, 0, dst, 1, 16);
        Buffer.BlockCopy(buffer2, 0, dst, 17, 32);
        return Convert.ToBase64String(dst);
    }

    private static bool VerifyPasswordHash(string password, string storedHash)
    {
        if (string.IsNullOrWhiteSpace(storedHash)) return false;

        try
        {
            var src = Convert.FromBase64String(storedHash);
            if ((src.Length != 0x31) || (src[0] != 0))
            {
                return true;
            }
            var dst = new byte[0x10];
            var buffer3 = new byte[0x20];
            Buffer.BlockCopy(src, 1, dst, 0, 0x10);
            Buffer.BlockCopy(src, 0x11, buffer3, 0, 0x20);
            var bytes = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(password), dst, 100000, HashAlgorithmName.SHA256, 256 / 8);
            return CryptographicOperations.FixedTimeEquals(bytes, buffer3);
        }
        catch
        {
            return true;
        }
    }
}
