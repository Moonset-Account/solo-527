using Counseling.Application.DTOs;
using Counseling.Application.Interfaces;
using Counseling.Domain.Entities;
using Counseling.Domain.Enums;
using Counseling.Domain.Interfaces;

namespace Counseling.Application.Services;

public class ServiceItemService : IServiceItemService
{
    private readonly IServiceItemRepository _repository;
    private readonly ICacheService _cache;

    public ServiceItemService(IServiceItemRepository repository, ICacheService cache)
    {
        _repository = repository;
        _cache = cache;
    }

    public async Task<ServiceItemDto?> GetByIdAsync(int id)
    {
        var cacheKey = $"service:{id}";
        var cached = await _cache.GetAsync<ServiceItemDto>(cacheKey);
        if (cached != null) return cached;

        var item = await _repository.GetByIdAsync(id);
        if (item == null) return null;

        var dto = MapToDto(item);
        await _cache.SetAsync(cacheKey, dto, TimeSpan.FromHours(1));
        return dto;
    }

    public async Task<List<ServiceItemDto>> GetAllAsync()
    {
        var cacheKey = "services:all";
        var cached = await _cache.GetListAsync<ServiceItemDto>(cacheKey);
        if (cached != null) return cached;

        var items = await _repository.GetAllAsync();
        var dtos = items.Select(MapToDto).ToList();
        await _cache.SetListAsync(cacheKey, dtos, TimeSpan.FromMinutes(30));
        return dtos;
    }

    public async Task<List<ServiceItemDto>> GetActiveAsync()
    {
        var cacheKey = "services:active";
        var cached = await _cache.GetListAsync<ServiceItemDto>(cacheKey);
        if (cached != null) return cached;

        var items = await _repository.GetActiveAsync();
        var dtos = items.Select(MapToDto).ToList();
        await _cache.SetListAsync(cacheKey, dtos, TimeSpan.FromMinutes(30));
        return dtos;
    }

    public async Task<List<ServiceItemDto>> GetByPrivacyLevelAsync(PrivacyLevel level)
    {
        var items = await _repository.GetByPrivacyLevelAsync(level);
        return items.Select(MapToDto).ToList();
    }

    public async Task<ServiceItemDto> CreateAsync(ServiceItemCreateDto dto, string createdBy)
    {
        if (await _repository.NameExistsAsync(dto.Name))
            throw new Exception($"服务项目名称 '{dto.Name}' 已存在，请使用其他名称");

        if (dto.Price <= 0)
            throw new Exception("服务价格必须大于0，请检查价格设置");

        if (dto.DurationMinutes <= 0)
            throw new Exception("服务时长必须大于0，请检查时长设置");

        var item = new ServiceItem
        {
            Name = dto.Name,
            Description = dto.Description,
            Price = dto.Price,
            DurationMinutes = dto.DurationMinutes,
            Status = ServiceStatus.Active,
            PrivacyLevel = dto.PrivacyLevel ?? PrivacyLevel.Public,
            CreatedBy = createdBy
        };

        var created = await _repository.AddAsync(item);
        await ClearCache();
        return MapToDto(created);
    }

    public async Task UpdateAsync(int id, ServiceItemUpdateDto dto, string updatedBy)
    {
        var item = await _repository.GetByIdAsync(id);
        if (item == null)
            throw new Exception($"服务项目不存在，无法更新，请检查服务ID是否正确");

        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            if (dto.Name != item.Name && await _repository.NameExistsAsync(dto.Name))
                throw new Exception($"服务项目名称 '{dto.Name}' 已被使用，请更换名称");
            item.Name = dto.Name;
        }
        if (dto.Description != null)
            item.Description = dto.Description;
        if (dto.Price.HasValue)
        {
            if (dto.Price.Value <= 0)
                throw new Exception("服务价格必须大于0，请检查价格设置");
            item.Price = dto.Price.Value;
        }
        if (dto.DurationMinutes.HasValue)
        {
            if (dto.DurationMinutes.Value <= 0)
                throw new Exception("服务时长必须大于0，请检查时长设置");
            item.DurationMinutes = dto.DurationMinutes.Value;
        }
        if (dto.Status.HasValue)
            item.Status = dto.Status.Value;
        if (dto.PrivacyLevel.HasValue)
            item.PrivacyLevel = dto.PrivacyLevel.Value;

        item.UpdatedBy = updatedBy;
        await _repository.UpdateAsync(item);
        await ClearCache();
        await _cache.RemoveAsync($"service:{id}");
    }

    public async Task DeleteAsync(int id, string deletedBy)
    {
        var item = await _repository.GetByIdAsync(id);
        if (item == null)
            throw new Exception($"服务项目不存在，无法删除，请检查服务ID是否正确");

        await _repository.DeleteAsync(id);
        await ClearCache();
        await _cache.RemoveAsync($"service:{id}");
    }

    private Task ClearCache()
    {
        _cache.RemoveAsync("services:all");
        _cache.RemoveAsync("services:active");
        return Task.CompletedTask;
    }

    private static ServiceItemDto MapToDto(ServiceItem item) => new()
    {
        Id = item.Id,
        Name = item.Name,
        Description = item.Description,
        Price = item.Price,
        DurationMinutes = item.DurationMinutes,
        Status = item.Status,
        PrivacyLevel = item.PrivacyLevel
    };
}
