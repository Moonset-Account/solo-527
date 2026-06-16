
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using DentalClinic.Domain.Entities;
using DentalClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.Infrastructure.Services;

public class ExternalApiLogService : IExternalApiLogService
{
    private readonly AppDbContext _context;

    public ExternalApiLogService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResultDto<ExternalApiLogDto>> GetListAsync(ExternalApiLogQueryDto query)
    {
        var queryable = _context.ExternalApiLogs.Include(e => e.BatchItems).AsQueryable();

        if (!string.IsNullOrEmpty(query.ApiName))
            queryable = queryable.Where(e => e.ApiName.Contains(query.ApiName));
        if (!string.IsNullOrEmpty(query.BatchId))
            queryable = queryable.Where(e => e.BatchId == query.BatchId);
        if (query.IsSuccess.HasValue)
            queryable = queryable.Where(e => e.IsSuccess == query.IsSuccess.Value);
        if (query.StartTime.HasValue)
            queryable = queryable.Where(e => e.RequestTime >= query.StartTime.Value);
        if (query.EndTime.HasValue)
            queryable = queryable.Where(e => e.RequestTime <= query.EndTime.Value);

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderByDescending(e => e.RequestTime)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(e => MapToDto(e))
            .ToListAsync();

        return new PagedResultDto<ExternalApiLogDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task<ExternalApiLogDto?> GetByIdAsync(int id)
    {
        var log = await _context.ExternalApiLogs
            .Include(e => e.BatchItems)
            .FirstOrDefaultAsync(e => e.Id == id);
        return log == null ? null : MapToDto(log);
    }

    public async Task<ExternalApiLogDto> CreateAsync(ExternalApiLogDto dto)
    {
        var log = new ExternalApiLog
        {
            ApiName = dto.ApiName,
            BatchId = dto.BatchId,
            RequestUrl = dto.RequestUrl,
            RequestBody = dto.RequestBody,
            ResponseBody = dto.ResponseBody,
            StatusCode = dto.StatusCode,
            IsSuccess = dto.IsSuccess,
            ErrorMessage = dto.ErrorMessage,
            ErrorType = dto.ErrorType,
            Suggestion = dto.Suggestion,
            RetryCount = dto.RetryCount,
            CanRetry = dto.CanRetry,
            RequestTime = dto.RequestTime,
            ResponseTime = dto.ResponseTime,
            DurationMs = dto.DurationMs
        };

        _context.ExternalApiLogs.Add(log);
        await _context.SaveChangesAsync();
        return MapToDto(log);
    }

    public async Task<List<ApiFailureSummaryDto>> GetFailureSummaryAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        startDate ??= DateTime.Today.AddDays(-7);
        endDate ??= DateTime.Today;

        var logs = await _context.ExternalApiLogs
            .Where(e => e.RequestTime >= startDate.Value && e.RequestTime <= endDate.Value)
            .ToListAsync();

        var apiGroups = logs.GroupBy(e => e.ApiName);

        var result = new List<ApiFailureSummaryDto>();

        foreach (var group in apiGroups)
        {
            var totalCount = group.Count();
            var failureCount = group.Count(e => !e.IsSuccess);
            var failureRate = totalCount > 0 ? (decimal)failureCount / totalCount * 100 : 0;

            var failureTypes = group
                .Where(e => !e.IsSuccess && !string.IsNullOrEmpty(e.ErrorType))
                .GroupBy(e => e.ErrorType)
                .Select(g => new FailureTypeGroupDto
                {
                    ErrorType = g.Key ?? "Unknown",
                    Count = g.Count(),
                    MostCommonSuggestion = g
                        .GroupBy(x => x.Suggestion)
                        .OrderByDescending(sg => sg.Count())
                        .FirstOrDefault()?.Key
                })
                .OrderByDescending(f => f.Count)
                .ToList();

            result.Add(new ApiFailureSummaryDto
            {
                ApiName = group.Key,
                TotalCount = totalCount,
                FailureCount = failureCount,
                FailureRate = Math.Round(failureRate, 2),
                FailureTypes = failureTypes
            });
        }

        return result.OrderByDescending(r => r.FailureCount).ToList();
    }

    public async Task<List<ExternalApiLogDto>> GetFailedLogsAsync(string? apiName = null, int? top = 50)
    {
        var query = _context.ExternalApiLogs
            .Include(e => e.BatchItems)
            .Where(e => !e.IsSuccess)
            .OrderByDescending(e => e.RequestTime)
            .AsQueryable();

        if (!string.IsNullOrEmpty(apiName))
            query = query.Where(e => e.ApiName == apiName);

        if (top.HasValue)
            query = query.Take(top.Value);

        return await query
            .Select(e => MapToDto(e))
            .ToListAsync();
    }

    private static ExternalApiLogDto MapToDto(ExternalApiLog log)
    {
        return new ExternalApiLogDto
        {
            Id = log.Id,
            ApiName = log.ApiName,
            BatchId = log.BatchId,
            RequestUrl = log.RequestUrl,
            RequestBody = log.RequestBody,
            ResponseBody = log.ResponseBody,
            StatusCode = log.StatusCode,
            IsSuccess = log.IsSuccess,
            ErrorMessage = log.ErrorMessage,
            ErrorType = log.ErrorType,
            Suggestion = log.Suggestion,
            RetryCount = log.RetryCount,
            CanRetry = log.CanRetry,
            RequestTime = log.RequestTime,
            RequestTimeText = log.RequestTime.ToString("yyyy-MM-dd HH:mm:ss"),
            ResponseTime = log.ResponseTime,
            DurationMs = log.DurationMs,
            BatchItems = log.BatchItems?.Select(bi => new ExternalApiBatchItemDto
            {
                Id = bi.Id,
                PatientName = bi.PatientName,
                Phone = bi.Phone,
                ItemType = bi.ItemType,
                Amount = bi.Amount,
                Status = bi.Status,
                Error = bi.Error
            }).ToList()
        };
    }
}
