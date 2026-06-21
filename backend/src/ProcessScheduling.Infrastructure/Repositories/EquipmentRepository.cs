using Microsoft.EntityFrameworkCore;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Enums;
using ProcessScheduling.Domain.Interfaces;
using ProcessScheduling.Infrastructure.Data;

namespace ProcessScheduling.Infrastructure.Repositories;

public class EquipmentRepository : Repository<Equipment>, IEquipmentRepository
{
    public EquipmentRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Equipment>> GetByStatusAsync(EquipmentStatus status)
    {
        return await _dbSet
            .Include(e => e.CurrentMold)
            .Include(e => e.CurrentShift)
            .Where(e => e.Status == status && !e.IsDeleted)
            .ToListAsync();
    }

    public async Task<Equipment?> GetWithHistoryAsync(Guid id)
    {
        return await _dbSet
            .Include(e => e.StatusHistories)
            .Include(e => e.CurrentMold)
            .Include(e => e.CurrentShift)
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);
    }

    public override async Task<IEnumerable<Equipment>> GetAllAsync()
    {
        return await _dbSet
            .Include(e => e.CurrentMold)
            .Include(e => e.CurrentShift)
            .Where(e => !e.IsDeleted)
            .ToListAsync();
    }

    public override async Task<Equipment?> GetByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(e => e.CurrentMold)
            .Include(e => e.CurrentShift)
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);
    }
}
