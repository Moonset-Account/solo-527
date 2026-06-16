
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IWorkloadReportService
{
    Task<List<WorkloadReportDto>> GetListAsync(WorkloadReportQueryDto query);
    Task<WorkloadReportDto?> GetByIdAsync(int id);
    Task<WorkloadReportDto> GenerateAsync(int doctorId, DateTime reportDate);
    Task<WorkloadReportDto?> SyncFromFollowUpCompletionAsync(int doctorId, DateTime reportDate);
    Task GenerateDailyReportsAsync(DateTime reportDate);
}
