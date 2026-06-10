using CarWash.Domain.Entities;

namespace CarWash.Application.Interfaces;

public interface IAuditLogRepository : IGenericRepository<AuditLog>
{
    Task<IEnumerable<AuditLog>> GetByEntityAsync(string entityType, Guid entityId);
    Task<IEnumerable<AuditLog>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
}
