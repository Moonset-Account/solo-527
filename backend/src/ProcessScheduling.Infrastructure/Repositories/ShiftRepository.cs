using Microsoft.EntityFrameworkCore;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Interfaces;
using ProcessScheduling.Infrastructure.Data;

namespace ProcessScheduling.Infrastructure.Repositories;

public class ShiftRepository : Repository<Shift>, IShiftRepository
{
    public ShiftRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Shift>> GetActiveShiftsAsync()
    {
        return await _dbSet
            .Where(s => s.IsActive && !s.IsDeleted)
            .ToListAsync();
    }

    public async Task<Shift?> GetWithMembersAsync(Guid id)
    {
        return await _dbSet
            .Include(s => s.Members)
            .FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted);
    }

    public async Task<IEnumerable<ShiftPerformance>> GetPerformancesAsync(Guid shiftId, DateTime startDate, DateTime endDate)
    {
        return await _context.ShiftPerformances
            .Where(p => p.ShiftId == shiftId && p.Date >= startDate.Date && p.Date <= endDate.Date)
            .ToListAsync();
    }
}
