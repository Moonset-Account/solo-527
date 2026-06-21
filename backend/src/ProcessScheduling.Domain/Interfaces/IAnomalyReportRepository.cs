namespace ProcessScheduling.Domain.Interfaces;

public interface IAnomalyReportRepository : IRepository<Entities.AnomalyReport>
{
    Task<IEnumerable<Entities.AnomalyReport>> GetUnresolvedAsync();
    Task<IEnumerable<Entities.AnomalyReport>> GetByEquipmentAsync(Guid equipmentId);
}
