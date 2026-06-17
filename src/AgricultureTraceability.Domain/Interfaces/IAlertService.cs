using AgricultureTraceability.Domain.Entities;

namespace AgricultureTraceability.Domain.Interfaces;

public interface IAlertService
{
    Task CheckAndGenerateAlertsAsync();
    Task<IEnumerable<Alert>> GetActiveAlertsAsync();
    Task<IEnumerable<Alert>> GetAlertsByPlotAsync(Guid plotId);
    Task<IEnumerable<Alert>> GetAlertsByDateRangeAsync(DateTime start, DateTime end);
    Task<Alert?> AcknowledgeAlertAsync(Guid alertId, Guid userId);
    Task<Alert?> ResolveAlertAsync(Guid alertId, Guid userId);
}
