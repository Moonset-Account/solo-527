
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IStatisticsService
{
    Task<DashboardStatsDto> GetDashboardStatsAsync(int? clinicId = null);
    Task<RecheckStatsDto> GetRecheckStatsAsync(int? clinicId = null, DateTime? startDate = null, DateTime? endDate = null);
    Task<LostPatientStatsDto> GetLostPatientStatsAsync(int? clinicId = null, DateTime? startDate = null, DateTime? endDate = null);
    Task<ScheduleUtilizationStatsDto> GetScheduleUtilizationStatsAsync(int? clinicId = null, int? doctorId = null, DateTime? startDate = null, DateTime? endDate = null);
}
