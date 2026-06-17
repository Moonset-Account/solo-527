using AgricultureTraceability.Domain.Entities;

namespace AgricultureTraceability.Domain.Interfaces;

public interface IThresholdService
{
    Task<IEnumerable<Threshold>> GetAllThresholdsAsync();
    Task<IEnumerable<Threshold>> GetThresholdsByPlotAsync(Guid? plotId);
    Task<Threshold> CreateOrUpdateThresholdAsync(Threshold threshold);
    Task DeleteThresholdAsync(Guid id);
}
