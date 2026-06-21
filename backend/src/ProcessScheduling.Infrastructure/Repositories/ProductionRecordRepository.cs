using Microsoft.EntityFrameworkCore;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Interfaces;
using ProcessScheduling.Infrastructure.Data;

namespace ProcessScheduling.Infrastructure.Repositories;

public class ProductionRecordRepository : Repository<ProductionRecord>, IProductionRecordRepository
{
    public ProductionRecordRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ProductionRecord>> GetByDateRangeAsync(DateTime start, DateTime end)
    {
        return await _dbSet
            .Include(p => p.WorkOrder)
            .Include(p => p.Equipment)
            .Include(p => p.Operator)
            .Include(p => p.Shift)
            .Where(p => p.ProductionTime >= start && p.ProductionTime <= end && !p.IsDeleted)
            .OrderByDescending(p => p.ProductionTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<ProductionRecord>> GetByEquipmentAsync(Guid equipmentId, DateTime start, DateTime end)
    {
        return await _dbSet
            .Include(p => p.WorkOrder)
            .Include(p => p.Operator)
            .Include(p => p.Shift)
            .Where(p => p.EquipmentId == equipmentId && p.ProductionTime >= start && p.ProductionTime <= end && !p.IsDeleted)
            .OrderByDescending(p => p.ProductionTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<ProductionRecord>> GetByShiftAsync(Guid shiftId, DateTime date)
    {
        var startOfDay = date.Date;
        var endOfDay = startOfDay.AddDays(1);
        return await _dbSet
            .Include(p => p.WorkOrder)
            .Include(p => p.Equipment)
            .Include(p => p.Operator)
            .Where(p => p.ShiftId == shiftId && p.ProductionTime >= startOfDay && p.ProductionTime < endOfDay && !p.IsDeleted)
            .OrderByDescending(p => p.ProductionTime)
            .ToListAsync();
    }
}
