using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;
using CarWash.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CarWash.Infrastructure.Repositories;

public class ServicePackageRepository : GenericRepository<ServicePackage>, IServicePackageRepository
{
    public ServicePackageRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ServicePackage>> GetActivePackagesAsync()
    {
        return await _dbSet
            .Where(sp => sp.IsActive)
            .OrderBy(sp => sp.Price)
            .ToListAsync();
    }

    public async Task<IEnumerable<ServicePackage>> GetByTypeAsync(string type)
    {
        return await _dbSet
            .Where(sp => sp.Type == type && sp.IsActive)
            .OrderBy(sp => sp.Price)
            .ToListAsync();
    }
}
