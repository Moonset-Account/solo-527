using ProcessScheduling.Domain.Enums;

namespace ProcessScheduling.Domain.Interfaces;

public interface IProcessStepInstanceRepository : IRepository<Entities.ProcessStepInstance>
{
    Task<Entities.ProcessStepInstance?> GetByQrCodeAsync(string qrCode);
    Task<IEnumerable<Entities.ProcessStepInstance>> GetByWorkOrderAsync(Guid workOrderId);
    Task<IEnumerable<Entities.ProcessStepInstance>> GetByStatusAsync(ProcessStepStatus status);
}
