using AgricultureTraceability.Domain.Entities;

namespace AgricultureTraceability.Domain.Interfaces;

public interface IEnvironmentMonitorService
{
    Task<EnvironmentData> RecordDataAsync(Guid plotId, decimal temperature, decimal humidity, decimal soilMoisture, decimal lightIntensity, decimal co2Level);
    Task<IEnumerable<EnvironmentData>> GetRecentDataAsync(Guid plotId, int minutes = 60);
    Task<IEnumerable<EnvironmentData>> GetDataByDateRangeAsync(Guid plotId, DateTime start, DateTime end);
    Task<Dictionary<Guid, EnvironmentData>> GetAllPlotsLatestDataAsync();
}
