using Microsoft.EntityFrameworkCore;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Enums;
using ProcessScheduling.Domain.Interfaces;
using ProcessScheduling.Infrastructure.Data;

namespace ProcessScheduling.Infrastructure.Repositories;

public class DowntimeRecordRepository : Repository<DowntimeRecord>, IDowntimeRecordRepository
{
    public DowntimeRecordRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<DowntimeRecord>> GetActiveDowntimeAsync(Guid equipmentId)
    {
        return await _dbSet
            .Include(d => d.Equipment)
            .Include(d => d.Reporter)
            .Include(d => d.Shift)
            .Where(d => d.EquipmentId == equipmentId && d.EndTime == null && !d.IsDeleted)
            .OrderByDescending(d => d.StartTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<DowntimeRecord>> GetByDateRangeAsync(DateTime start, DateTime end)
    {
        return await _dbSet
            .Include(d => d.Equipment)
            .Include(d => d.Reporter)
            .Include(d => d.Shift)
            .Where(d => d.StartTime >= start && d.StartTime <= end && !d.IsDeleted)
            .OrderByDescending(d => d.StartTime)
            .ToListAsync();
    }

    public override async Task<DowntimeRecord?> GetByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(d => d.Equipment)
            .Include(d => d.Reporter)
            .Include(d => d.Shift)
            .FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted);
    }
}
