using Microsoft.EntityFrameworkCore;
using OpsWorkOrder.Data;
using OpsWorkOrder.Dtos;
using OpsWorkOrder.Enums;
using OpsWorkOrder.Models;
using OpsWorkOrder.Common;
using Newtonsoft.Json;

namespace OpsWorkOrder.Services;

public interface IAssetService
{
    Task<ApiResult<PagedResultDto<AssetDto>>> GetListAsync(int page, int pageSize, string? keyword, AssetType? type, AssetStatus? status, bool? syncRequired);
    Task<ApiResult<AssetDto>> GetByIdAsync(int id);
    Task<ApiResult<AssetDto>> CreateAsync(CreateAssetDto dto, int userId, string ipAddress);
    Task<ApiResult<AssetDto>> UpdateAsync(int id, UpdateAssetDto dto, int userId, string ipAddress);
    Task<ApiResult> DeleteAsync(int id, int userId, string ipAddress);
    Task<ApiResult<AssetDto>> ConfirmSyncAsync(int id, AssetSyncConfirmDto dto, int userId, string ipAddress);
    Task<ApiResult<List<AssetDto>>> GetAllAsync();
}

public class AssetService : IAssetService
{
    private readonly AppDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public AssetService(AppDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    public async Task<ApiResult<PagedResultDto<AssetDto>>> GetListAsync(int page, int pageSize, string? keyword,
        AssetType? type, AssetStatus? status, bool? syncRequired)
    {
        var query = _context.Assets.AsQueryable();

        if (!string.IsNullOrEmpty(keyword))
            query = query.Where(a => a.Name.Contains(keyword) || a.AssetCode.Contains(keyword) || a.IpAddress.Contains(keyword));
        if (type.HasValue)
            query = query.Where(a => a.Type == type.Value);
        if (status.HasValue)
            query = query.Where(a => a.Status == status.Value);
        if (syncRequired.HasValue)
            query = query.Where(a => a.SyncRequired == syncRequired.Value);

        var totalCount = await query.CountAsync();
        var assets = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AssetDto
            {
                Id = a.Id,
                AssetCode = a.AssetCode,
                Name = a.Name,
                Type = a.Type,
                Status = a.Status,
                IpAddress = a.IpAddress,
                Location = a.Location,
                Description = a.Description,
                Configuration = a.Configuration,
                ResponsibleId = a.ResponsibleId,
                ResponsibleName = a.Responsible != null ? a.Responsible.FullName : null,
                CreatedAt = a.CreatedAt,
                LastSyncAt = a.LastSyncAt,
                SyncRequired = a.SyncRequired
            })
            .ToListAsync();

        return ApiResult<PagedResultDto<AssetDto>>.Ok(new PagedResultDto<AssetDto>
        {
            Items = assets,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<ApiResult<AssetDto>> GetByIdAsync(int id)
    {
        var asset = await _context.Assets
            .Include(a => a.Responsible)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (asset == null)
            return ApiResult<AssetDto>.Fail("资产不存在");

        return ApiResult<AssetDto>.Ok(MapToDto(asset));
    }

    public async Task<ApiResult<AssetDto>> CreateAsync(CreateAssetDto dto, int userId, string ipAddress)
    {
        if (await _context.Assets.AnyAsync(a => a.AssetCode == dto.AssetCode))
            return ApiResult<AssetDto>.Fail("资产编号已存在");

        var asset = new Asset
        {
            AssetCode = dto.AssetCode,
            Name = dto.Name,
            Type = dto.Type,
            Status = dto.Status,
            IpAddress = dto.IpAddress,
            Location = dto.Location,
            Description = dto.Description,
            Configuration = dto.Configuration,
            ResponsibleId = dto.ResponsibleId,
            CreatedAt = DateTime.UtcNow,
            SyncRequired = false
        };

        _context.Assets.Add(asset);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(userId, string.Empty, UserRole.Admin,
            AuditActionType.Create, "Asset", asset.Id.ToString(), null,
            JsonConvert.SerializeObject(dto), "创建资产", ipAddress);

        return ApiResult<AssetDto>.Ok(MapToDto(asset), "创建成功");
    }

    public async Task<ApiResult<AssetDto>> UpdateAsync(int id, UpdateAssetDto dto, int userId, string ipAddress)
    {
        var asset = await _context.Assets.FindAsync(id);
        if (asset == null)
            return ApiResult<AssetDto>.Fail("资产不存在");

        var oldValue = JsonConvert.SerializeObject(asset);

        if (!string.IsNullOrEmpty(dto.Name))
            asset.Name = dto.Name;
        if (dto.Type.HasValue)
            asset.Type = dto.Type.Value;
        if (dto.Status.HasValue)
            asset.Status = dto.Status.Value;
        if (!string.IsNullOrEmpty(dto.IpAddress))
            asset.IpAddress = dto.IpAddress;
        if (!string.IsNullOrEmpty(dto.Location))
            asset.Location = dto.Location;
        if (!string.IsNullOrEmpty(dto.Description))
            asset.Description = dto.Description;
        if (!string.IsNullOrEmpty(dto.Configuration))
            asset.Configuration = dto.Configuration;
        if (dto.ResponsibleId.HasValue)
            asset.ResponsibleId = dto.ResponsibleId.Value;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(userId, string.Empty, UserRole.Admin,
            AuditActionType.Update, "Asset", asset.Id.ToString(), oldValue,
            JsonConvert.SerializeObject(dto), "更新资产", ipAddress);

        return ApiResult<AssetDto>.Ok(MapToDto(asset), "更新成功");
    }

    public async Task<ApiResult> DeleteAsync(int id, int userId, string ipAddress)
    {
        var asset = await _context.Assets.FindAsync(id);
        if (asset == null)
            return ApiResult.Fail("资产不存在");

        _context.Assets.Remove(asset);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(userId, string.Empty, UserRole.Admin,
            AuditActionType.Delete, "Asset", asset.Id.ToString(), null, null,
            "删除资产", ipAddress);

        return ApiResult.Ok("删除成功");
    }

    public async Task<ApiResult<AssetDto>> ConfirmSyncAsync(int id, AssetSyncConfirmDto dto, int userId, string ipAddress)
    {
        var asset = await _context.Assets.FindAsync(id);
        if (asset == null)
            return ApiResult<AssetDto>.Fail("资产不存在");

        var oldValue = JsonConvert.SerializeObject(asset);

        asset.Configuration = dto.Configuration;
        asset.LastSyncAt = DateTime.UtcNow;
        asset.SyncRequired = false;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(userId, string.Empty, UserRole.Admin,
            AuditActionType.AssetSync, "Asset", asset.Id.ToString(), oldValue,
            JsonConvert.SerializeObject(dto), "资产同步确认", ipAddress);

        return ApiResult<AssetDto>.Ok(MapToDto(asset), "同步确认成功");
    }

    public async Task<ApiResult<List<AssetDto>>> GetAllAsync()
    {
        var assets = await _context.Assets
            .Where(a => a.Status == AssetStatus.Active)
            .OrderBy(a => a.Name)
            .Select(a => new AssetDto
            {
                Id = a.Id,
                AssetCode = a.AssetCode,
                Name = a.Name,
                Type = a.Type,
                Status = a.Status,
                IpAddress = a.IpAddress
            })
            .ToListAsync();

        return ApiResult<List<AssetDto>>.Ok(assets);
    }

    private AssetDto MapToDto(Asset asset)
    {
        return new AssetDto
        {
            Id = asset.Id,
            AssetCode = asset.AssetCode,
            Name = asset.Name,
            Type = asset.Type,
            Status = asset.Status,
            IpAddress = asset.IpAddress,
            Location = asset.Location,
            Description = asset.Description,
            Configuration = asset.Configuration,
            ResponsibleId = asset.ResponsibleId,
            ResponsibleName = asset.Responsible?.FullName,
            CreatedAt = asset.CreatedAt,
            LastSyncAt = asset.LastSyncAt,
            SyncRequired = asset.SyncRequired
        };
    }
}
