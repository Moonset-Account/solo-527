using Microsoft.EntityFrameworkCore;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Interfaces;
using ProcessScheduling.Infrastructure.Data;

namespace ProcessScheduling.Infrastructure.Repositories;

public class OperationLogRepository : Repository<OperationLog>, IOperationLogRepository
{
    public OperationLogRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<OperationLog>> GetDowntimeRelatedLogsAsync(DateTime start, DateTime end)
    {
        return await _dbSet
            .Include(o => o.User)
            .Where(o => o.IsDowntimeRelated && o.CreatedAt >= start && o.CreatedAt <= end && !o.IsDeleted)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<OperationLog>> GetByUserAsync(Guid userId, DateTime start, DateTime end)
    {
        return await _dbSet
            .Include(o => o.User)
            .Where(o => o.UserId == userId && o.CreatedAt >= start && o.CreatedAt <= end && !o.IsDeleted)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
    }
}
