using ProcessScheduling.Application.DTOs;
using ProcessScheduling.Application.Interfaces;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Enums;
using ProcessScheduling.Domain.Interfaces;

namespace ProcessScheduling.Application.Services;

public class EquipmentService : IEquipmentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IOperationLogService _operationLogService;

    public EquipmentService(IUnitOfWork unitOfWork, IOperationLogService operationLogService)
    {
        _unitOfWork = unitOfWork;
        _operationLogService = operationLogService;
    }

    public async Task<IEnumerable<EquipmentDto>> GetAllAsync()
    {
        var equipments = await _unitOfWork.Equipments.GetAllAsync();
        return equipments.Select(MapToDto);
    }

    public async Task<EquipmentDto?> GetByIdAsync(Guid id)
    {
        var equipment = await _unitOfWork.Equipments.GetByIdAsync(id);
        return equipment == null ? null : MapToDto(equipment);
    }

    public async Task<EquipmentDto> CreateAsync(CreateEquipmentDto dto)
    {
        var equipment = new Equipment
        {
            Code = dto.Code,
            Name = dto.Name,
            Model = dto.Model,
            Location = dto.Location,
            Status = EquipmentStatus.Stopped
        };

        var result = await _unitOfWork.Equipments.AddAsync(equipment);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(result);
    }

    public async Task UpdateStatusAsync(Guid id, EquipmentStatus status, Guid operatorId, string? reason = null)
    {
        var equipment = await _unitOfWork.Equipments.GetByIdAsync(id);
        if (equipment == null)
            throw new KeyNotFoundException($"设备 {id} 不存在");

        var previousStatus = equipment.Status;
        equipment.Status = status;
        equipment.UpdatedAt = DateTime.UtcNow;

        equipment.StatusHistories.Add(new EquipmentStatusHistory
        {
            EquipmentId = id,
            PreviousStatus = previousStatus,
            NewStatus = status,
            Reason = reason,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = operatorId.ToString()
        });

        await _unitOfWork.SaveChangesAsync();

        var isDowntimeRelated = status == EquipmentStatus.Stopped || status == EquipmentStatus.Maintenance || status == EquipmentStatus.Abnormal;
        await _operationLogService.LogAsync(
            "Equipment",
            $"状态变更: {previousStatus} -> {status}",
            reason,
            operatorId,
            null,
            isDowntimeRelated);
    }

    public async Task<IEnumerable<EquipmentDto>> GetByStatusAsync(EquipmentStatus status)
    {
        var equipments = await _unitOfWork.Equipments.GetByStatusAsync(status);
        return equipments.Select(MapToDto);
    }

    public async Task<EquipmentStatisticsDto> GetStatisticsAsync(Guid id, DateTime startDate, DateTime endDate)
    {
        var equipment = await _unitOfWork.Equipments.GetByIdAsync(id);
        if (equipment == null)
            throw new KeyNotFoundException($"设备 {id} 不存在");

        var downtimeRecords = (await _unitOfWork.DowntimeRecords.FindAsync(d =>
            d.EquipmentId == id && d.StartTime >= startDate && d.StartTime <= endDate)).ToList();

        var productionRecords = (await _unitOfWork.ProductionRecords.FindAsync(p =>
            p.EquipmentId == id && p.ProductionTime >= startDate && p.ProductionTime <= endDate)).ToList();

        double totalHours = (endDate - startDate).TotalHours;
        double downtimeHours = downtimeRecords.Sum(d => d.DurationMinutes ?? 0) / 60.0;
        double runningHours = productionRecords.Sum(p => p.WorkHours);
        double utilizationRate = totalHours > 0 ? runningHours / totalHours * 100 : 0;

        return new EquipmentStatisticsDto
        {
            EquipmentId = id,
            EquipmentName = equipment.Name,
            RunningHours = Math.Round(runningHours, 2),
            DowntimeHours = Math.Round(downtimeHours, 2),
            UtilizationRate = Math.Round(utilizationRate, 2),
            DowntimeCount = downtimeRecords.Count
        };
    }

    private static EquipmentDto MapToDto(Equipment equipment)
    {
        return new EquipmentDto
        {
            Id = equipment.Id,
            Code = equipment.Code,
            Name = equipment.Name,
            Model = equipment.Model,
            Status = (int)equipment.Status,
            StatusText = GetStatusText(equipment.Status),
            CurrentWorkOrderCode = equipment.CurrentWorkOrderCode,
            CurrentMoldId = equipment.CurrentMoldId,
            MoldCode = equipment.CurrentMold?.Code,
            CurrentShiftId = equipment.CurrentShiftId,
            ShiftName = equipment.CurrentShift?.Name,
            Location = equipment.Location
        };
    }

    private static string GetStatusText(EquipmentStatus status) => status switch
    {
        EquipmentStatus.Running => "运行中",
        EquipmentStatus.Processing => "加工中",
        EquipmentStatus.Abnormal => "异常",
        EquipmentStatus.Stopped => "停机",
        EquipmentStatus.Maintenance => "维护中",
        _ => "未知"
    };
}
