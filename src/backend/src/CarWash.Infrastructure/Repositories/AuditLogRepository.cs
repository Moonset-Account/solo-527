using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;
using CarWash.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CarWash.Infrastructure.Repositories;

public class AuditLogRepository : GenericRepository<AuditLog>, IAuditLogRepository
{
    public AuditLogRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<AuditLog>> GetByEntityAsync(string entityType, Guid entityId)
    {
        return await _dbSet
            .Where(al => al.EntityType == entityType && al.EntityId == entityId)
            .OrderByDescending(al => al.Timestamp)
            .ToListAsync();
    }

    public async Task<IEnumerable<AuditLog>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        return await _dbSet
            .Where(al => al.Timestamp >= startDate && al.Timestamp <= endDate)
            .OrderByDescending(al => al.Timestamp)
            .ToListAsync();
    }
}
