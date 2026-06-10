using CarWash.Application.DTOs;

namespace CarWash.Application.Interfaces;

public interface IAuditLogService
{
    Task<AuditLogDto> CreateAsync(CreateAuditLogRequest request, CancellationToken cancellationToken = default);
    Task<AuditLogDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<AuditLogDto>> GetListAsync(AuditLogQueryRequest request, CancellationToken cancellationToken = default);
    Task LogAsync(string entityType, Guid entityId, string action, string? oldValue, string? newValue,
        Guid operatorId, string operatorName, string? notes = null, CancellationToken cancellationToken = default);
}
