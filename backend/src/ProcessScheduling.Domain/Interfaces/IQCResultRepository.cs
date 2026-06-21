namespace ProcessScheduling.Domain.Interfaces;

public interface IQCResultRepository : IRepository<Entities.QCResult>
{
    Task<IEnumerable<Entities.QCResult>> GetByWorkOrderAsync(Guid workOrderId);
    Task<Entities.QCResult?> GetWithHistoryAsync(Guid id);
}
