using ProcessScheduling.Domain.Enums;

namespace ProcessScheduling.Domain.Interfaces;

public interface IEquipmentRepository : IRepository<Entities.Equipment>
{
    Task<IEnumerable<Entities.Equipment>> GetByStatusAsync(EquipmentStatus status);
    Task<Entities.Equipment?> GetWithHistoryAsync(Guid id);
}
