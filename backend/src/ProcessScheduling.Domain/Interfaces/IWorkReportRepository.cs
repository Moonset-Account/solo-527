using ProcessScheduling.Domain.Enums;

namespace ProcessScheduling.Domain.Interfaces;

public interface IWorkReportRepository : IRepository<Entities.WorkReport>
{
    Task<IEnumerable<Entities.WorkReport>> GetByStatusAsync(WorkReportStatus status);
    Task<Entities.WorkReport?> GetWithAuditsAsync(Guid id);
}
