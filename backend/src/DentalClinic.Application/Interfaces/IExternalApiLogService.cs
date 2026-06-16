
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IExternalApiLogService
{
    Task&lt;PagedResultDto&lt;ExternalApiLogDto&gt;&gt; GetListAsync(ExternalApiLogQueryDto query);
    Task&lt;ExternalApiLogDto?&gt; GetByIdAsync(int id);
    Task&lt;ExternalApiLogDto&gt; CreateAsync(ExternalApiLogDto dto);
    Task&lt;List&lt;ApiFailureSummaryDto&gt;&gt; GetFailureSummaryAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task&lt;List&lt;ExternalApiLogDto&gt;&gt; GetFailedLogsAsync(string? apiName = null, int? top = 50);
}
