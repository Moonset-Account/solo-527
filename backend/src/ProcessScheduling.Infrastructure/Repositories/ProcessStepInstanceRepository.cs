using Microsoft.EntityFrameworkCore;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Enums;
using ProcessScheduling.Domain.Interfaces;
using ProcessScheduling.Infrastructure.Data;

namespace ProcessScheduling.Infrastructure.Repositories;

public class ProcessStepInstanceRepository : Repository<ProcessStepInstance>, IProcessStepInstanceRepository
{
    public ProcessStepInstanceRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<ProcessStepInstance?> GetByQrCodeAsync(string qrCode)
    {
        return await _dbSet
            .Include(p => p.WorkOrder)
            .Include(p => p.ProcessStepTemplate)
            .Include(p => p.Equipment)
            .Include(p => p.Operator)
            .Include(p => p.Shift)
            .Include(p => p.StatusChanges)
            .FirstOrDefaultAsync(p => p.QrCode == qrCode && !p.IsDeleted);
    }

    public async Task<IEnumerable<ProcessStepInstance>> GetByWorkOrderAsync(Guid workOrderId)
    {
        return await _dbSet
            .Include(p => p.ProcessStepTemplate)
            .Include(p => p.Equipment)
            .Include(p => p.Operator)
            .Include(p => p.Shift)
            .Where(p => p.WorkOrderId == workOrderId && !p.IsDeleted)
            .OrderBy(p => p.ProcessStepTemplate.Sequence)
            .ToListAsync();
    }

    public async Task<IEnumerable<ProcessStepInstance>> GetByStatusAsync(ProcessStepStatus status)
    {
        return await _dbSet
            .Include(p => p.WorkOrder)
            .Include(p => p.ProcessStepTemplate)
            .Include(p => p.Equipment)
            .Where(p => p.Status == status && !p.IsDeleted)
            .ToListAsync();
    }

    public override async Task<ProcessStepInstance?> GetByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(p => p.WorkOrder)
            .Include(p => p.ProcessStepTemplate)
            .Include(p => p.Equipment)
            .Include(p => p.Operator)
            .Include(p => p.Shift)
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
    }
}
