using ProcessScheduling.Application.DTOs;

namespace ProcessScheduling.Application.Interfaces;

public interface IOperationLogService
{
    Task LogAsync(string module, string action, string? detail, Guid? userId, string? ipAddress, bool isDowntimeRelated = false);
    Task<IEnumerable<OperationLogDto>> GetByUserAsync(Guid userId, DateTime startDate, DateTime endDate);
    Task<IEnumerable<OperationLogDto>> GetDowntimeRelatedAsync(DateTime startDate, DateTime endDate);
}
