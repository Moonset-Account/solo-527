namespace ProcessScheduling.Domain.Interfaces;

public interface IProductionRecordRepository : IRepository<Entities.ProductionRecord>
{
    Task<IEnumerable<Entities.ProductionRecord>> GetByDateRangeAsync(DateTime start, DateTime end);
    Task<IEnumerable<Entities.ProductionRecord>> GetByEquipmentAsync(Guid equipmentId, DateTime start, DateTime end);
    Task<IEnumerable<Entities.ProductionRecord>> GetByShiftAsync(Guid shiftId, DateTime date);
}
