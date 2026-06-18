using System.Text.Json;
using ArtEduScheduler.API.Data;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtEduScheduler.API.Services;

public interface IOperationLogService
{
    Task LogAsync(OperationType type, int operatorId, string entityType, int? entityId,
        object? beforeData, object? afterData, string description, string? relatedIds = null);
    Task<List<OperationLogDto>> GetLogsAsync(string? entityType = null, int? entityId = null,
        OperationType? type = null, DateTime? startDate = null, DateTime? endDate = null);
}

public class OperationLogService : IOperationLogService
{
    private readonly AppDbContext _context;

    public OperationLogService(AppDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(OperationType type, int operatorId, string entityType, int? entityId,
        object? beforeData, object? afterData, string description, string? relatedIds = null)
    {
        var log = new OperationLog
        {
            OperationType = type,
            OperatorId = operatorId,
            EntityType = entityType,
            EntityId = entityId,
            BeforeData = beforeData != null ? JsonSerializer.Serialize(beforeData) : null,
            AfterData = afterData != null ? JsonSerializer.Serialize(afterData) : null,
            ChangeDescription = description,
            RelatedIds = relatedIds,
            CreatedAt = DateTime.UtcNow
        };

        _context.OperationLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    public async Task<List<OperationLogDto>> GetLogsAsync(string? entityType = null, int? entityId = null,
        OperationType? type = null, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.OperationLogs.AsQueryable();

        if (!string.IsNullOrEmpty(entityType))
            query = query.Where(l => l.EntityType == entityType);
        if (entityId.HasValue)
            query = query.Where(l => l.EntityId == entityId.Value);
        if (type.HasValue)
            query = query.Where(l => l.OperationType == type.Value);
        if (startDate.HasValue)
            query = query.Where(l => l.CreatedAt >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(l => l.CreatedAt <= endDate.Value);

        var logs = await query
            .OrderByDescending(l => l.CreatedAt)
            .Include(l => l.Operator)
            .Take(200)
            .ToListAsync();

        return logs.Select(l => new OperationLogDto
        {
            Id = l.Id,
            OperationType = l.OperationType.ToString(),
            OperatorId = l.OperatorId,
            OperatorName = l.Operator?.RealName ?? string.Empty,
            EntityType = l.EntityType,
            EntityId = l.EntityId,
            BeforeData = l.BeforeData,
            AfterData = l.AfterData,
            ChangeDescription = l.ChangeDescription,
            CreatedAt = l.CreatedAt
        }).ToList();
    }
}
