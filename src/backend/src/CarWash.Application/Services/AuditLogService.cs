using CarWash.Application.DTOs;
using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;

namespace CarWash.Application.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IRepository<AuditLog> _auditLogRepository;

    public AuditLogService(IRepository<AuditLog> auditLogRepository)
    {
        _auditLogRepository = auditLogRepository;
    }

    public async Task<AuditLogDto> CreateAsync(CreateAuditLogRequest request, CancellationToken cancellationToken = default)
    {
        var auditLog = new AuditLog
        {
            Id = Guid.NewGuid(),
            EntityType = request.EntityType,
            EntityId = request.EntityId,
            Action = request.Action,
            OldValue = request.OldValue,
            NewValue = request.NewValue,
            OperatorId = request.OperatorId,
            OperatorName = request.OperatorName,
            Timestamp = DateTime.UtcNow,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _auditLogRepository.AddAsync(auditLog, cancellationToken);

        return MapToDto(created);
    }

    public async Task<AuditLogDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var auditLog = await _auditLogRepository.GetByIdAsync(id, cancellationToken);
        if (auditLog == null) return null;

        return MapToDto(auditLog);
    }

    public async Task<PagedResult<AuditLogDto>> GetListAsync(AuditLogQueryRequest request, CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await _auditLogRepository.GetPagedAsync(
            a =>
                (string.IsNullOrEmpty(request.EntityType) || a.EntityType == request.EntityType) &&
                (!request.EntityId.HasValue || a.EntityId == request.EntityId.Value) &&
                (!request.OperatorId.HasValue || a.OperatorId == request.OperatorId.Value) &&
                (!request.StartTime.HasValue || a.Timestamp >= request.StartTime.Value) &&
                (!request.EndTime.HasValue || a.Timestamp <= request.EndTime.Value),
            q => q.OrderByDescending(a => a.Timestamp),
            request.PageIndex,
            request.PageSize,
            cancellationToken);

        var dtos = items.Select(MapToDto).ToList();

        return new PagedResult<AuditLogDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageIndex = request.PageIndex,
            PageSize = request.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / request.PageSize)
        };
    }

    public async Task LogAsync(string entityType, Guid entityId, string action, string? oldValue, string? newValue,
        Guid operatorId, string operatorName, string? notes = null, CancellationToken cancellationToken = default)
    {
        var auditLog = new AuditLog
        {
            Id = Guid.NewGuid(),
            EntityType = entityType,
            EntityId = entityId,
            Action = action,
            OldValue = oldValue,
            NewValue = newValue,
            OperatorId = operatorId,
            OperatorName = operatorName,
            Timestamp = DateTime.UtcNow,
            Notes = notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _auditLogRepository.AddAsync(auditLog, cancellationToken);
    }

    private static AuditLogDto MapToDto(AuditLog auditLog)
    {
        return new AuditLogDto
        {
            Id = auditLog.Id,
            EntityType = auditLog.EntityType,
            EntityId = auditLog.EntityId,
            Action = auditLog.Action,
            OldValue = auditLog.OldValue,
            NewValue = auditLog.NewValue,
            OperatorId = auditLog.OperatorId,
            OperatorName = auditLog.OperatorName,
            Timestamp = auditLog.Timestamp,
            Notes = auditLog.Notes
        };
    }
}
