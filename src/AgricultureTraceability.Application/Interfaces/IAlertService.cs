using AgricultureTraceability.Domain.Entities;

namespace AgricultureTraceability.Application.Interfaces;

public interface IAlertService
{
    Task CheckAndGenerateAlertsAsync();
    Task AcknowledgeAlertAsync(Guid alertId, Guid userId);
    Task ResolveAlertAsync(Guid alertId, Guid userId);
    Task<IEnumerable<Alert>> GetActiveAlertsAsync();
    Task<Alert?> GetByIdAsync(Guid id);
}
