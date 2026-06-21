namespace ProcessScheduling.Domain.Interfaces;

public interface IOperationLogRepository : IRepository<Entities.OperationLog>
{
    Task<IEnumerable<Entities.OperationLog>> GetDowntimeRelatedLogsAsync(DateTime start, DateTime end);
    Task<IEnumerable<Entities.OperationLog>> GetByUserAsync(Guid userId, DateTime start, DateTime end);
}
