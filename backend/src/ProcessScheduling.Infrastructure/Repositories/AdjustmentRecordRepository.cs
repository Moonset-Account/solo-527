using Microsoft.EntityFrameworkCore;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Interfaces;
using ProcessScheduling.Infrastructure.Data;

namespace ProcessScheduling.Infrastructure.Repositories;

public class AdjustmentRecordRepository : Repository<AdjustmentRecord>, IAdjustmentRecordRepository
{
    public AdjustmentRecordRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<AdjustmentRecord>> GetByEntityAsync(string entityType, Guid entityId)
    {
        return await _dbSet
            .Include(a => a.Operator)
            .Where(a => a.EntityType == entityType && a.EntityId == entityId && !a.IsDeleted)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }
}
