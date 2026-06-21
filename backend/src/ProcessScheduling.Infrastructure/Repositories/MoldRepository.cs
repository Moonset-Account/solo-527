using Microsoft.EntityFrameworkCore;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Interfaces;
using ProcessScheduling.Infrastructure.Data;

namespace ProcessScheduling.Infrastructure.Repositories;

public class MoldRepository : Repository<Mold>, IMoldRepository
{
    public MoldRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Mold?> GetWithRecordsAsync(Guid id)
    {
        return await _dbSet
            .Include(m => m.MoldRecords)
                .ThenInclude(r => r.Equipment)
            .Include(m => m.CurrentEquipment)
            .FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);
    }

    public async Task<IEnumerable<Mold>> GetByStatusAsync(string status)
    {
        return await _dbSet
            .Include(m => m.CurrentEquipment)
            .Where(m => m.Status == status && !m.IsDeleted)
            .ToListAsync();
    }

    public async Task<IEnumerable<MoldRecord>> GetRecordsAsync(Guid moldId)
    {
        return await _context.MoldRecords
            .Include(r => r.Equipment)
            .Where(r => r.MoldId == moldId && !r.IsDeleted)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public override async Task<IEnumerable<Mold>> GetAllAsync()
    {
        return await _dbSet
            .Include(m => m.CurrentEquipment)
            .Where(m => !m.IsDeleted)
            .ToListAsync();
    }

    public override async Task<Mold?> GetByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(m => m.CurrentEquipment)
            .FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);
    }
}
