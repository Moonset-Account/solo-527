
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IExternalApiLogService
{
    Task<PagedResultDto<ExternalApiLogDto>> GetListAsync(ExternalApiLogQueryDto query);
    Task<ExternalApiLogDto?> GetByIdAsync(int id);
    Task<ExternalApiLogDto> CreateAsync(ExternalApiLogDto dto);
    Task<List<ApiFailureSummaryDto>> GetFailureSummaryAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task<List<ExternalApiLogDto>> GetFailedLogsAsync(string? apiName = null, int? top = 50);
}
