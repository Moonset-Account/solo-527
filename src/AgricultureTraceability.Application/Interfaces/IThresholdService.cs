using AgricultureTraceability.Domain.Entities;

namespace AgricultureTraceability.Application.Interfaces;

public interface IThresholdService
{
    Task<IEnumerable<Threshold>> GetAllAsync();
    Task<Threshold?> GetByIdAsync(Guid id);
    Task<IEnumerable<Threshold>> GetByPlotIdAsync(Guid? plotId);
    Task<Threshold> CreateAsync(Threshold threshold);
    Task UpdateAsync(Threshold threshold);
    Task DeleteAsync(Guid id);
}
