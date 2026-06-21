namespace ProcessScheduling.Domain.Interfaces;

public interface IWorkOrderRepository : IRepository<Entities.WorkOrder>
{
    Task<Entities.WorkOrder?> GetWithStepsAsync(Guid id);
    Task<IEnumerable<Entities.WorkOrder>> GetActiveOrdersAsync();
}
