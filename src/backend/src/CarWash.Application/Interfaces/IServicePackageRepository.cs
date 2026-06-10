using CarWash.Domain.Entities;

namespace CarWash.Application.Interfaces;

public interface IServicePackageRepository : IGenericRepository<ServicePackage>
{
    Task<IEnumerable<ServicePackage>> GetActivePackagesAsync();
    Task<IEnumerable<ServicePackage>> GetByTypeAsync(string type);
}
