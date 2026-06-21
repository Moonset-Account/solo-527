using ProcessScheduling.Application.DTOs;
using ProcessScheduling.Domain.Enums;

namespace ProcessScheduling.Application.Interfaces;

public interface IWorkReportService
{
    Task<WorkReportDto> CreateAsync(CreateWorkReportDto dto);
    Task<WorkReportDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<WorkReportDto>> GetByStatusAsync(WorkReportStatus status);
    Task<IEnumerable<WorkReportDto>> GetByShiftAsync(Guid shiftId, DateTime date);
    Task<WorkReportDto> AuditAsync(AuditWorkReportDto dto);
    Task<PagedResultDto<WorkReportDto>> GetPagedAsync(int pageIndex, int pageSize, WorkReportStatus? status = null);
}
