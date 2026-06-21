namespace ProcessScheduling.Domain.Interfaces;

public interface IMoldRepository : IRepository<Entities.Mold>
{
    Task<Entities.Mold?> GetWithRecordsAsync(Guid id);
    Task<IEnumerable<Entities.Mold>> GetByStatusAsync(string status);
    Task<IEnumerable<Entities.MoldRecord>> GetRecordsAsync(Guid moldId);
}
