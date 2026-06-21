using Counseling.Application.DTOs;
using Counseling.Application.Interfaces;
using Counseling.Domain.Entities;
using Counseling.Domain.Enums;
using Counseling.Domain.Interfaces;

namespace Counseling.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly ICacheService _cache;

    public UserService(IUserRepository userRepository, ICacheService cache)
    {
        _userRepository = userRepository;
        _cache = cache;
    }

    public async Task<UserDto?> GetByIdAsync(int id)
    {
        var cacheKey = $"user:{id}";
        var cached = await _cache.GetAsync<UserDto>(cacheKey);
        if (cached != null) return cached;

        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return null;

        var dto = MapToDto(user);
        await _cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(30));
        return dto;
    }

    public async Task<UserDto?> GetByUsernameAsync(string username)
    {
        var user = await _userRepository.GetByUsernameAsync(username);
        return user != null ? MapToDto(user) : null;
    }

    public async Task<List<UserDto>> GetAllAsync()
    {
        var users = await _userRepository.GetAllAsync();
        return users.Select(MapToDto).ToList();
    }

    public async Task<List<UserDto>> GetByRoleAsync(UserRole role)
    {
        var cacheKey = $"users:role:{(int)role}";
        var cached = await _cache.GetListAsync<UserDto>(cacheKey);
        if (cached != null) return cached;

        var users = await _userRepository.GetByRoleAsync(role);
        var dtos = users.Select(MapToDto).ToList();
        await _cache.SetListAsync(cacheKey, dtos, TimeSpan.FromMinutes(15));
        return dtos;
    }

    public async Task<UserDto> CreateAsync(UserCreateDto dto, string createdBy)
    {
        if (await _userRepository.UsernameExistsAsync(dto.Username))
            throw new Exception($"用户名 '{dto.Username}' 已存在，请使用其他用户名");

        if (await _userRepository.PhoneExistsAsync(dto.Phone))
            throw new Exception($"手机号 '{dto.Phone}' 已被注册，请检查或使用其他手机号");

        var user = new User
        {
            Username = dto.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FullName = dto.FullName,
            Phone = dto.Phone,
            Email = dto.Email,
            Role = dto.Role,
            PrivacyLevel = dto.PrivacyLevel,
            IsActive = true,
            CreatedBy = createdBy
        };

        var created = await _userRepository.AddAsync(user);
        await _cache.RemoveAsync($"users:role:{(int)dto.Role}");
        return MapToDto(created);
    }

    public async Task UpdateAsync(int id, UserUpdateDto dto, string updatedBy)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
            throw new Exception($"用户不存在，无法更新，请检查用户ID是否正确");

        if (!string.IsNullOrWhiteSpace(dto.FullName))
            user.FullName = dto.FullName;
        if (!string.IsNullOrWhiteSpace(dto.Phone))
        {
            if (dto.Phone != user.Phone && await _userRepository.PhoneExistsAsync(dto.Phone))
                throw new Exception($"手机号 '{dto.Phone}' 已被其他用户使用，请更换手机号");
            user.Phone = dto.Phone;
        }
        if (dto.Email != null)
            user.Email = dto.Email;
        if (dto.PrivacyLevel.HasValue)
            user.PrivacyLevel = dto.PrivacyLevel.Value;
        if (dto.IsActive.HasValue)
            user.IsActive = dto.IsActive.Value;

        user.UpdatedBy = updatedBy;
        await _userRepository.UpdateAsync(user);
        await _cache.RemoveAsync($"user:{id}");
        await _cache.RemoveAsync($"users:role:{(int)user.Role}");
    }

    public async Task DeleteAsync(int id, string deletedBy)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
            throw new Exception($"用户不存在，无法删除，请检查用户ID是否正确");

        await _userRepository.DeleteAsync(id);
        await _cache.RemoveAsync($"user:{id}");
        await _cache.RemoveAsync($"users:role:{(int)user.Role}");
    }

    public async Task<bool> ValidatePasswordAsync(string username, string password)
    {
        var user = await _userRepository.GetByUsernameAsync(username);
        if (user == null) return false;
        return BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
    }

    private static UserDto MapToDto(User user) => new()
    {
        Id = user.Id,
        Username = user.Username,
        FullName = user.FullName,
        Phone = user.Phone,
        Email = user.Email,
        Role = user.Role,
        PrivacyLevel = user.PrivacyLevel,
        IsActive = user.IsActive,
        CreatedAt = user.CreatedAt
    };
}
