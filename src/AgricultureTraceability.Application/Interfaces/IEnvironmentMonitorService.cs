using AgricultureTraceability.Domain.Entities;

namespace AgricultureTraceability.Application.Interfaces;

public interface IEnvironmentMonitorService
{
    Task<EnvironmentData> RecordDataAsync(EnvironmentData data);
    Task<IEnumerable<EnvironmentData>> GetRecentDataAsync(Guid plotId, int minutes = 30);
    Task<IEnumerable<EnvironmentData>> GetAllPlotsLatestDataAsync();
}
