using CoworkingBooking.Application.Common;
using CoworkingBooking.Application.DTOs.Order;
using CoworkingBooking.Application.Interfaces;
using CoworkingBooking.Domain.Entities;
using CoworkingBooking.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using OfficeOpenXml;

namespace CoworkingBooking.Infrastructure.Services;

public class OperationLogService : IOperationLogService
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public OperationLogService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public async Task LogAsync(string module, string operation, string? targetType = null, Guid? targetId = null, string? targetName = null, string? beforeData = null, string? afterData = null, bool isSuccess = true, string? errorMessage = null)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        var userId = httpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        var userName = httpContext?.User?.FindFirstValue(ClaimTypes.Name);
        var userRole = httpContext?.User?.FindFirstValue(ClaimTypes.Role);

        var log = new OperationLog
        {
            Id = Guid.NewGuid(),
            UserId = userId != null ? Guid.Parse(userId) : null,
            UserName = userName ?? "System",
            UserRole = userRole ?? "Unknown",
            Module = module,
            Operation = operation,
            TargetType = targetType,
            TargetId = targetId,
            TargetName = targetName,
            BeforeData = beforeData,
            AfterData = afterData,
            IpAddress = httpContext?.Connection?.RemoteIpAddress?.ToString() ?? "::1",
            UserAgent = httpContext?.Request?.Headers["User-Agent"].ToString() ?? "",
            IsSuccess = isSuccess,
            ErrorMessage = errorMessage,
            OperatedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _context.OperationLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    public async Task<ApiResponse<PagedResult<OperationLogDto>>> GetListAsync(OperationLogQuery query)
    {
        var queryable = _context.OperationLogs.AsQueryable();

        if (query.UserId.HasValue)
            queryable = queryable.Where(l => l.UserId == query.UserId.Value);

        if (!string.IsNullOrEmpty(query.Module))
            queryable = queryable.Where(l => l.Module.Contains(query.Module!));

        if (!string.IsNullOrEmpty(query.Operation))
            queryable = queryable.Where(l => l.Operation.Contains(query.Operation!));

        if (query.IsSuccess.HasValue)
            queryable = queryable.Where(l => l.IsSuccess == query.IsSuccess.Value);

        if (query.StartDate.HasValue)
            queryable = queryable.Where(l => l.OperatedAt >= query.StartDate.Value);

        if (query.EndDate.HasValue)
            queryable = queryable.Where(l => l.OperatedAt <= query.EndDate.Value);

        var totalCount = await queryable.CountAsync();

        if (!string.IsNullOrEmpty(query.SortBy))
        {
            queryable = query.SortDesc
                ? queryable.OrderByDescending(l => EF.Property<object>(l, query.SortBy))
                : queryable.OrderBy(l => EF.Property<object>(l, query.SortBy));
        }
        else
        {
            queryable = queryable.OrderByDescending(l => l.OperatedAt);
        }

        var items = await queryable
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(l => new OperationLogDto
            {
                Id = l.Id,
                UserId = l.UserId,
                UserName = l.UserName,
                UserRole = l.UserRole,
                Module = l.Module,
                Operation = l.Operation,
                TargetType = l.TargetType,
                TargetId = l.TargetId,
                TargetName = l.TargetName,
                IpAddress = l.IpAddress,
                IsSuccess = l.IsSuccess,
                ErrorMessage = l.ErrorMessage,
                OperatedAt = l.OperatedAt
            })
            .ToListAsync();

        return ApiResponse<PagedResult<OperationLogDto>>.Ok(new PagedResult<OperationLogDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    public async Task<ApiResponse<byte[]>> ExportLogsAsync(OperationLogQuery query)
    {
        query.PageSize = 10000;
        var result = await GetListAsync(query);

        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("操作日志");

        worksheet.Cells[1, 1].Value = "操作时间";
        worksheet.Cells[1, 2].Value = "操作人";
        worksheet.Cells[1, 3].Value = "角色";
        worksheet.Cells[1, 4].Value = "模块";
        worksheet.Cells[1, 5].Value = "操作";
        worksheet.Cells[1, 6].Value = "目标类型";
        worksheet.Cells[1, 7].Value = "目标名称";
        worksheet.Cells[1, 8].Value = "IP地址";
        worksheet.Cells[1, 9].Value = "是否成功";
        worksheet.Cells[1, 10].Value = "错误信息";

        for (int i = 0; i < result.Data!.Items.Count; i++)
        {
            var item = result.Data.Items[i];
            worksheet.Cells[i + 2, 1].Value = item.OperatedAt.ToString("yyyy-MM-dd HH:mm:ss");
            worksheet.Cells[i + 2, 2].Value = item.UserName;
            worksheet.Cells[i + 2, 3].Value = item.UserRole;
            worksheet.Cells[i + 2, 4].Value = item.Module;
            worksheet.Cells[i + 2, 5].Value = item.Operation;
            worksheet.Cells[i + 2, 6].Value = item.TargetType ?? "";
            worksheet.Cells[i + 2, 7].Value = item.TargetName ?? "";
            worksheet.Cells[i + 2, 8].Value = item.IpAddress;
            worksheet.Cells[i + 2, 9].Value = item.IsSuccess ? "成功" : "失败";
            worksheet.Cells[i + 2, 10].Value = item.ErrorMessage ?? "";
        }

        worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();
        var bytes = await package.GetAsByteArrayAsync();

        return ApiResponse<byte[]>.Ok(bytes);
    }
}
