using CarWash.Domain.Entities;

namespace CarWash.Application.Interfaces;

public interface IPartsShortageRepository : IGenericRepository<PartsShortage>
{
    Task<IEnumerable<PartsShortage>> GetActiveShortagesAsync();
    Task<PartsShortage?> GetWithNodesAsync(Guid id);
}
