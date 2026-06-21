namespace ProcessScheduling.Domain.Interfaces;

public interface IAdjustmentRecordRepository : IRepository<Entities.AdjustmentRecord>
{
    Task<IEnumerable<Entities.AdjustmentRecord>> GetByEntityAsync(string entityType, Guid entityId);
}
