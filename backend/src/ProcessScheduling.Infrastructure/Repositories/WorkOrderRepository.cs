using Microsoft.EntityFrameworkCore;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Interfaces;
using ProcessScheduling.Infrastructure.Data;

namespace ProcessScheduling.Infrastructure.Repositories;

public class WorkOrderRepository : Repository<WorkOrder>, IWorkOrderRepository
{
    public WorkOrderRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<WorkOrder?> GetWithStepsAsync(Guid id)
    {
        return await _dbSet
            .Include(w => w.AssignedEquipment)
            .Include(w => w.AssignedShift)
            .Include(w => w.ProcessStepInstances)
                .ThenInclude(p => p.ProcessStepTemplate)
            .FirstOrDefaultAsync(w => w.Id == id && !w.IsDeleted);
    }

    public async Task<IEnumerable<WorkOrder>> GetActiveOrdersAsync()
    {
        return await _dbSet
            .Include(w => w.AssignedEquipment)
            .Include(w => w.AssignedShift)
            .Where(w => !w.IsDeleted && w.ActualEndTime == null)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();
    }

    public override async Task<IEnumerable<WorkOrder>> GetAllAsync()
    {
        return await _dbSet
            .Include(w => w.AssignedEquipment)
            .Include(w => w.AssignedShift)
            .Where(w => !w.IsDeleted)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();
    }

    public override async Task<WorkOrder?> GetByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(w => w.AssignedEquipment)
            .Include(w => w.AssignedShift)
            .FirstOrDefaultAsync(w => w.Id == id && !w.IsDeleted);
    }
}
