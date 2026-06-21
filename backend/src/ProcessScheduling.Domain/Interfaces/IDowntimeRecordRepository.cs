namespace ProcessScheduling.Domain.Interfaces;

public interface IDowntimeRecordRepository : IRepository<Entities.DowntimeRecord>
{
    Task<IEnumerable<Entities.DowntimeRecord>> GetActiveDowntimeAsync(Guid equipmentId);
    Task<IEnumerable<Entities.DowntimeRecord>> GetByDateRangeAsync(DateTime start, DateTime end);
}
