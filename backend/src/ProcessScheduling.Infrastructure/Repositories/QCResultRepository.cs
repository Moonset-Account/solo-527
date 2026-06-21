using Microsoft.EntityFrameworkCore;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Interfaces;
using ProcessScheduling.Infrastructure.Data;

namespace ProcessScheduling.Infrastructure.Repositories;

public class QCResultRepository : Repository<QCResult>, IQCResultRepository
{
    public QCResultRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<QCResult>> GetByWorkOrderAsync(Guid workOrderId)
    {
        return await _dbSet
            .Include(q => q.WorkOrder)
            .Include(q => q.ProcessStepInstance)
                .ThenInclude(p => p.ProcessStepTemplate)
            .Include(q => q.Inspector)
            .Where(q => q.WorkOrderId == workOrderId && !q.IsDeleted)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();
    }

    public async Task<QCResult?> GetWithHistoryAsync(Guid id)
    {
        return await _dbSet
            .Include(q => q.Histories)
            .Include(q => q.WorkOrder)
            .Include(q => q.ProcessStepInstance)
            .Include(q => q.Inspector)
            .FirstOrDefaultAsync(q => q.Id == id && !q.IsDeleted);
    }
}
