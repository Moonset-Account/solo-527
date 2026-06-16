
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IStatisticsService
{
    Task&lt;DashboardStatsDto&gt; GetDashboardStatsAsync(int? clinicId = null);
    Task&lt;RecheckStatsDto&gt; GetRecheckStatsAsync(int? clinicId = null, DateTime? startDate = null, DateTime? endDate = null);
    Task&lt;LostPatientStatsDto&gt; GetLostPatientStatsAsync(int? clinicId = null, DateTime? startDate = null, DateTime? endDate = null);
    Task&lt;ScheduleUtilizationStatsDto&gt; GetScheduleUtilizationStatsAsync(int? clinicId = null, int? doctorId = null, DateTime? startDate = null, DateTime? endDate = null);
}
