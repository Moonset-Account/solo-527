using ProcessScheduling.Application.DTOs;

namespace ProcessScheduling.Application.Interfaces;

public interface IStatisticsService
{
    Task<ProductionStatisticsDto> GetProductionStatisticsAsync(DateTime startDate, DateTime endDate, Guid? shiftId = null);
    Task<IEnumerable<EquipmentStatisticsDto>> GetEquipmentUtilizationAsync(DateTime startDate, DateTime endDate);
    Task<IEnumerable<ShiftPerformanceDto>> GetShiftPerformanceAsync(DateTime startDate, DateTime endDate);
    Task<Dictionary<int, int>> GetDowntimeReasonDistributionAsync(DateTime startDate, DateTime endDate);
}
