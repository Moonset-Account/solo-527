using Microsoft.EntityFrameworkCore;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Interfaces;
using ProcessScheduling.Infrastructure.Data;

namespace ProcessScheduling.Infrastructure.Repositories;

public class AnomalyReportRepository : Repository<AnomalyReport>, IAnomalyReportRepository
{
    public AnomalyReportRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<AnomalyReport>> GetUnresolvedAsync()
    {
        return await _dbSet
            .Include(a => a.Equipment)
            .Include(a => a.Reporter)
            .Include(a => a.Shift)
            .Where(a => a.ResolvedAt == null && !a.IsDeleted)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<AnomalyReport>> GetByEquipmentAsync(Guid equipmentId)
    {
        return await _dbSet
            .Include(a => a.Reporter)
            .Include(a => a.Shift)
            .Where(a => a.EquipmentId == equipmentId && !a.IsDeleted)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public override async Task<IEnumerable<AnomalyReport>> GetAllAsync()
    {
        return await _dbSet
            .Include(a => a.Equipment)
            .Include(a => a.Reporter)
            .Include(a => a.Shift)
            .Where(a => !a.IsDeleted)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }
}
