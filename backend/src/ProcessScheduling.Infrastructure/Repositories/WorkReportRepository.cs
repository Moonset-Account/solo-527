using Microsoft.EntityFrameworkCore;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Enums;
using ProcessScheduling.Domain.Interfaces;
using ProcessScheduling.Infrastructure.Data;

namespace ProcessScheduling.Infrastructure.Repositories;

public class WorkReportRepository : Repository<WorkReport>, IWorkReportRepository
{
    public WorkReportRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<WorkReport>> GetByStatusAsync(WorkReportStatus status)
    {
        return await _dbSet
            .Include(w => w.WorkOrder)
            .Include(w => w.Operator)
            .Include(w => w.Equipment)
            .Include(w => w.Shift)
            .Include(w => w.Reviewer)
            .Where(w => w.Status == status && !w.IsDeleted)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();
    }

    public async Task<WorkReport?> GetWithAuditsAsync(Guid id)
    {
        return await _dbSet
            .Include(w => w.WorkOrder)
            .Include(w => w.Operator)
            .Include(w => w.Equipment)
            .Include(w => w.Shift)
            .Include(w => w.Reviewer)
            .Include(w => w.Audits)
            .FirstOrDefaultAsync(w => w.Id == id && !w.IsDeleted);
    }

    public override async Task<WorkReport?> GetByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(w => w.WorkOrder)
            .Include(w => w.Operator)
            .Include(w => w.Equipment)
            .Include(w => w.Shift)
            .Include(w => w.Reviewer)
            .FirstOrDefaultAsync(w => w.Id == id && !w.IsDeleted);
    }
}
