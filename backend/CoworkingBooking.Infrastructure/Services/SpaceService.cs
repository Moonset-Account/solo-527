using CoworkingBooking.Application.Common;
using CoworkingBooking.Application.DTOs.Space;
using CoworkingBooking.Application.Interfaces;
using CoworkingBooking.Domain.Entities;
using CoworkingBooking.Domain.Enums;
using CoworkingBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace CoworkingBooking.Infrastructure.Services;

public class SpaceService : ISpaceService
{
    private readonly ApplicationDbContext _context;
    private readonly IOperationLogService _logService;
    private readonly ICacheService _cacheService;

    public SpaceService(ApplicationDbContext context, IOperationLogService logService, ICacheService cacheService)
    {
        _context = context;
        _logService = logService;
        _cacheService = cacheService;
    }

    public async Task<ApiResponse<PagedResult<SpaceDto>>> GetListAsync(SpaceQuery query)
    {
        var cacheKey = $"spaces:list:{JsonSerializer.Serialize(query)}";
        return await _cacheService.GetOrCreateAsync(cacheKey, async () =>
        {
            var queryable = _context.CoworkingSpaces.Include(s => s.Prices).AsQueryable();

            if (!string.IsNullOrEmpty(query.Keyword))
                queryable = queryable.Where(s => s.Name.Contains(query.Keyword!) || s.Code.Contains(query.Keyword!) || s.Address.Contains(query.Keyword!));

            if (query.Type.HasValue)
                queryable = queryable.Where(s => s.Type == query.Type.Value);

            if (query.Status.HasValue)
                queryable = queryable.Where(s => s.Status == query.Status.Value);

            if (query.MinArea.HasValue)
                queryable = queryable.Where(s => s.Area >= query.MinArea.Value);

            if (query.MaxArea.HasValue)
                queryable = queryable.Where(s => s.Area <= query.MaxArea.Value);

            var totalCount = await queryable.CountAsync();

            if (!string.IsNullOrEmpty(query.SortBy))
            {
                queryable = query.SortDesc
                    ? queryable.OrderByDescending(s => EF.Property<object>(s, query.SortBy))
                    : queryable.OrderBy(s => EF.Property<object>(s, query.SortBy));
            }
            else
            {
                queryable = queryable.OrderByDescending(s => s.CreatedAt);
            }

            var items = await queryable
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(s => MapToDto(s))
                .ToListAsync();

            return ApiResponse<PagedResult<SpaceDto>>.Ok(new PagedResult<SpaceDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = query.Page,
                PageSize = query.PageSize
            });
        }, TimeSpan.FromMinutes(5));
    }

    public async Task<ApiResponse<SpaceDto>> GetByIdAsync(Guid id)
    {
        var cacheKey = $"space:{id}";
        return await _cacheService.GetOrCreateAsync(cacheKey, async () =>
        {
            var space = await _context.CoworkingSpaces
                .Include(s => s.Prices)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (space == null)
                return ApiResponse<SpaceDto>.Fail("房源不存在", 404);

            return ApiResponse<SpaceDto>.Ok(MapToDto(space));
        }, TimeSpan.FromMinutes(10));
    }

    public async Task<ApiResponse<SpaceDto>> CreateAsync(CreateSpaceRequest request, Guid? operatorId)
    {
        var code = $"SP{DateTime.Now:yyyyMMdd}{new Random().Next(1000, 9999)}";
        while (await _context.CoworkingSpaces.AnyAsync(s => s.Code == code))
        {
            code = $"SP{DateTime.Now:yyyyMMdd}{new Random().Next(1000, 9999)}";
        }

        var space = new CoworkingSpace
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Code = code,
            Type = request.Type,
            Status = SpaceStatus.Available,
            Address = request.Address,
            Building = request.Building,
            Floor = request.Floor,
            Area = request.Area,
            Capacity = request.Capacity,
            Description = request.Description,
            Facilities = request.Facilities,
            Images = request.Images,
            LandlordName = request.LandlordName,
            LandlordPhone = request.LandlordPhone,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = operatorId
        };

        foreach (var priceReq in request.Prices)
        {
            space.Prices.Add(new SpacePrice
            {
                Id = Guid.NewGuid(),
                PriceType = priceReq.PriceType,
                UnitPrice = priceReq.UnitPrice,
                Unit = priceReq.Unit,
                MinimumCharge = priceReq.MinimumCharge,
                DepositAmount = priceReq.DepositAmount,
                EffectiveDate = priceReq.EffectiveDate,
                ExpireDate = priceReq.ExpireDate,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        _context.CoworkingSpaces.Add(space);
        await _context.SaveChangesAsync();
        await _cacheService.RemoveByPrefixAsync("spaces:");
        await _logService.LogAsync("房源管理", "创建房源", "Space", space.Id, space.Name, afterData: JsonSerializer.Serialize(request));

        return ApiResponse<SpaceDto>.Ok(MapToDto(space), "房源创建成功");
    }

    public async Task<ApiResponse> UpdateAsync(Guid id, UpdateSpaceRequest request, Guid? operatorId)
    {
        var space = await _context.CoworkingSpaces.FindAsync(id);
        if (space == null)
            return ApiResponse.Fail("房源不存在", 404);

        var beforeData = JsonSerializer.Serialize(new { space.Name, space.Type, space.Status, space.Area });

        space.Name = request.Name;
        space.Type = request.Type;
        space.Status = request.Status;
        space.Address = request.Address;
        space.Building = request.Building;
        space.Floor = request.Floor;
        space.Area = request.Area;
        space.Capacity = request.Capacity;
        space.Description = request.Description;
        space.Facilities = request.Facilities;
        space.Images = request.Images;
        space.LandlordName = request.LandlordName;
        space.LandlordPhone = request.LandlordPhone;
        space.UpdatedAt = DateTime.UtcNow;
        space.UpdatedBy = operatorId;

        await _context.SaveChangesAsync();
        await _cacheService.RemoveAsync($"space:{id}");
        await _cacheService.RemoveByPrefixAsync("spaces:");
        await _logService.LogAsync("房源管理", "更新房源", "Space", space.Id, space.Name, beforeData, JsonSerializer.Serialize(request));

        return ApiResponse.Ok("房源更新成功");
    }

    public async Task<ApiResponse> DeleteAsync(Guid id, Guid? operatorId)
    {
        var space = await _context.CoworkingSpaces.FindAsync(id);
        if (space == null)
            return ApiResponse.Fail("房源不存在", 404);

        var hasActiveContracts = await _context.LeaseContracts.AnyAsync(c => c.SpaceId == id && c.Status == ContractStatus.Active);
        if (hasActiveContracts)
            return ApiResponse.Fail("该房源存在生效中的租约，无法删除");

        space.IsDeleted = true;
        space.UpdatedAt = DateTime.UtcNow;
        space.UpdatedBy = operatorId;

        await _context.SaveChangesAsync();
        await _cacheService.RemoveAsync($"space:{id}");
        await _cacheService.RemoveByPrefixAsync("spaces:");
        await _logService.LogAsync("房源管理", "删除房源", "Space", space.Id, space.Name);

        return ApiResponse.Ok("房源删除成功");
    }

    public async Task<ApiResponse> AddPriceAsync(Guid spaceId, CreateSpacePriceRequest request, Guid? operatorId)
    {
        var space = await _context.CoworkingSpaces.FindAsync(spaceId);
        if (space == null)
            return ApiResponse.Fail("房源不存在", 404);

        var price = new SpacePrice
        {
            Id = Guid.NewGuid(),
            SpaceId = spaceId,
            PriceType = request.PriceType,
            UnitPrice = request.UnitPrice,
            Unit = request.Unit,
            MinimumCharge = request.MinimumCharge,
            DepositAmount = request.DepositAmount,
            EffectiveDate = request.EffectiveDate,
            ExpireDate = request.ExpireDate,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = operatorId
        };

        _context.SpacePrices.Add(price);
        await _context.SaveChangesAsync();
        await _cacheService.RemoveAsync($"space:{spaceId}");
        await _logService.LogAsync("房源管理", "添加价格", "Space", spaceId, space.Name, afterData: JsonSerializer.Serialize(request));

        return ApiResponse.Ok("价格添加成功");
    }

    public async Task<ApiResponse> UpdatePriceStatusAsync(Guid priceId, bool isActive, Guid? operatorId)
    {
        var price = await _context.SpacePrices.FindAsync(priceId);
        if (price == null)
            return ApiResponse.Fail("价格记录不存在", 404);

        price.IsActive = isActive;
        price.UpdatedAt = DateTime.UtcNow;
        price.UpdatedBy = operatorId;

        await _context.SaveChangesAsync();
        await _cacheService.RemoveAsync($"space:{price.SpaceId}");
        await _logService.LogAsync("房源管理", isActive ? "启用价格" : "停用价格", "SpacePrice", priceId);

        return ApiResponse.Ok("价格状态更新成功");
    }

    private static SpaceDto MapToDto(CoworkingSpace space)
    {
        return new SpaceDto
        {
            Id = space.Id,
            Name = space.Name,
            Code = space.Code,
            Type = space.Type,
            Status = space.Status,
            Address = space.Address,
            Building = space.Building,
            Floor = space.Floor,
            Area = space.Area,
            Capacity = space.Capacity,
            Description = space.Description,
            Facilities = space.Facilities,
            Images = space.Images,
            LandlordName = space.LandlordName,
            LandlordPhone = space.LandlordPhone,
            Prices = space.Prices.Select(p => new SpacePriceDto
            {
                Id = p.Id,
                PriceType = p.PriceType,
                UnitPrice = p.UnitPrice,
                Unit = p.Unit,
                MinimumCharge = p.MinimumCharge,
                DepositAmount = p.DepositAmount,
                EffectiveDate = p.EffectiveDate,
                ExpireDate = p.ExpireDate,
                IsActive = p.IsActive
            }).ToList(),
            CreatedAt = space.CreatedAt
        };
    }
}
