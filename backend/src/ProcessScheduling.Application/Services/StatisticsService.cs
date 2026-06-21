using ProcessScheduling.Application.DTOs;
using ProcessScheduling.Application.Interfaces;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Enums;
using ProcessScheduling.Domain.Interfaces;

namespace ProcessScheduling.Application.Services;

public class StatisticsService : IStatisticsService
{
    private readonly IUnitOfWork _unitOfWork;

    public StatisticsService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ProductionStatisticsDto> GetProductionStatisticsAsync(DateTime startDate, DateTime endDate, Guid? shiftId = null)
    {
        var productionRecords = (await _unitOfWork.ProductionRecords.FindAsync(p =>
            p.ProductionTime >= startDate && p.ProductionTime <= endDate &&
            (!shiftId.HasValue || p.ShiftId == shiftId.Value))).ToList();

        var workOrders = await _unitOfWork.WorkOrders.GetAllAsync();
        var woInRange = workOrders.Where(w => w.ActualStartTime.HasValue && w.ActualStartTime >= startDate && w.ActualStartTime <= endDate).ToList();

        int totalOutput = productionRecords.Sum(p => p.Quantity);
        int totalDefective = productionRecords.Sum(p => p.DefectiveQuantity);
        double passRate = totalOutput > 0 ? (double)(totalOutput - totalDefective) / totalOutput * 100 : 0;
        double totalWorkHours = productionRecords.Sum(p => p.WorkHours);

        return new ProductionStatisticsDto
        {
            Date = startDate.Date,
            TotalOutput = totalOutput,
            TotalDefective = totalDefective,
            PassRate = Math.Round(passRate, 2),
            TotalWorkHours = Math.Round(totalWorkHours, 2),
            WorkOrderCount = woInRange.Count
        };
    }

    public async Task<IEnumerable<EquipmentStatisticsDto>> GetEquipmentUtilizationAsync(DateTime startDate, DateTime endDate)
    {
        var equipments = await _unitOfWork.Equipments.GetAllAsync();
        var result = new List<EquipmentStatisticsDto>();

        double totalPeriodHours = (endDate - startDate).TotalHours;

        foreach (var equipment in equipments)
        {
            var downtimeRecords = (await _unitOfWork.DowntimeRecords.FindAsync(d =>
                d.EquipmentId == equipment.Id && d.StartTime >= startDate && d.StartTime <= endDate)).ToList();

            var productionRecords = (await _unitOfWork.ProductionRecords.FindAsync(p =>
                p.EquipmentId == equipment.Id && p.ProductionTime >= startDate && p.ProductionTime <= endDate)).ToList();

            double downtimeHours = downtimeRecords.Sum(d => d.DurationMinutes ?? 0) / 60.0;
            double runningHours = productionRecords.Sum(p => p.WorkHours);
            double utilizationRate = totalPeriodHours > 0 ? runningHours / totalPeriodHours * 100 : 0;

            result.Add(new EquipmentStatisticsDto
            {
                EquipmentId = equipment.Id,
                EquipmentName = equipment.Name,
                RunningHours = Math.Round(runningHours, 2),
                DowntimeHours = Math.Round(downtimeHours, 2),
                UtilizationRate = Math.Round(utilizationRate, 2),
                DowntimeCount = downtimeRecords.Count
            });
        }

        return result;
    }

    public async Task<IEnumerable<ShiftPerformanceDto>> GetShiftPerformanceAsync(DateTime startDate, DateTime endDate)
    {
        var shifts = await _unitOfWork.Shifts.GetAllAsync();
        var result = new List<ShiftPerformanceDto>();

        foreach (var shift in shifts)
        {
            var performances = (await _unitOfWork.Shifts.GetPerformancesAsync(shift.Id, startDate, endDate)).ToList();

            if (performances.Any())
            {
                foreach (var perf in performances)
                {
                    result.Add(new ShiftPerformanceDto
                    {
                        Id = perf.Id,
                        ShiftId = perf.ShiftId,
                        ShiftName = shift.Name,
                        Date = perf.Date,
                        TotalOutput = perf.TotalOutput,
                        TotalDefective = perf.TotalDefective,
                        TotalWorkHours = perf.TotalWorkHours,
                        EquipmentUtilizationRate = perf.EquipmentUtilizationRate,
                        PassRate = perf.PassRate
                    });
                }
            }
            else
            {
                var productionRecords = (await _unitOfWork.ProductionRecords.FindAsync(p =>
                    p.ShiftId == shift.Id && p.ProductionTime >= startDate && p.ProductionTime <= endDate)).ToList();

                var equipments = await _unitOfWork.Equipments.GetAllAsync();
                var totalPeriodHours = (endDate - startDate).TotalHours;
                var totalRunningHours = productionRecords.Sum(p => p.WorkHours);
                var utilizationRate = equipments.Any() && totalPeriodHours > 0
                    ? totalRunningHours / (equipments.Count() * totalPeriodHours) * 100
                    : 0;

                var totalOutput = productionRecords.Sum(p => p.Quantity);
                var totalDefective = productionRecords.Sum(p => p.DefectiveQuantity);
                var passRate = totalOutput > 0 ? (double)(totalOutput - totalDefective) / totalOutput * 100 : 0;

                result.Add(new ShiftPerformanceDto
                {
                    ShiftId = shift.Id,
                    ShiftName = shift.Name,
                    Date = startDate.Date,
                    TotalOutput = totalOutput,
                    TotalDefective = totalDefective,
                    TotalWorkHours = Math.Round(totalRunningHours, 2),
                    EquipmentUtilizationRate = Math.Round(utilizationRate, 2),
                    PassRate = Math.Round(passRate, 2)
                });
            }
        }

        return result;
    }

    public async Task<Dictionary<int, int>> GetDowntimeReasonDistributionAsync(DateTime startDate, DateTime endDate)
    {
        var records = (await _unitOfWork.DowntimeRecords.FindAsync(d =>
            d.StartTime >= startDate && d.StartTime <= endDate)).ToList();

        return records
            .GroupBy(d => (int)d.Reason)
            .ToDictionary(g => g.Key, g => g.Count());
    }
}
