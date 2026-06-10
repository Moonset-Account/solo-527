using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;
using CarWash.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CarWash.Infrastructure.Repositories;

public class PartsShortageRepository : GenericRepository<PartsShortage>, IPartsShortageRepository
{
    public PartsShortageRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<PartsShortage>> GetActiveShortagesAsync()
    {
        var activeStatuses = new[] { "reported", "ordered", "in_transit", "arrived" };
        return await _dbSet
            .Where(ps => activeStatuses.Contains(ps.Status))
            .OrderBy(ps => ps.ReportedAt)
            .ToListAsync();
    }

    public async Task<PartsShortage?> GetWithNodesAsync(Guid id)
    {
        return await _dbSet
            .Include(ps => ps.Nodes)
            .FirstOrDefaultAsync(ps => ps.Id == id);
    }
}
