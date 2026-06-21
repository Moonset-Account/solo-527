using ProcessScheduling.Application.DTOs;
using ProcessScheduling.Application.Interfaces;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Enums;
using ProcessScheduling.Domain.Interfaces;

namespace ProcessScheduling.Application.Services;

public class DowntimeService : IDowntimeService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IOperationLogService _operationLogService;

    public DowntimeService(IUnitOfWork unitOfWork, IOperationLogService operationLogService)
    {
        _unitOfWork = unitOfWork;
        _operationLogService = operationLogService;
    }

    public async Task<DowntimeRecordDto> StartDowntimeAsync(CreateDowntimeRecordDto dto)
    {
        var equipment = await _unitOfWork.Equipments.GetByIdAsync(dto.EquipmentId);
        if (equipment == null)
            throw new KeyNotFoundException($"设备 {dto.EquipmentId} 不存在");

        var record = new DowntimeRecord
        {
            EquipmentId = dto.EquipmentId,
            Reason = (DowntimeReason)dto.Reason,
            ReasonDetail = dto.ReasonDetail,
            StartTime = DateTime.UtcNow,
            ReporterId = dto.ReporterId,
            ShiftId = dto.ShiftId,
            IsLogged = true
        };

        var previousStatus = equipment.Status;
        equipment.Status = EquipmentStatus.Stopped;
        equipment.UpdatedAt = DateTime.UtcNow;

        equipment.StatusHistories.Add(new EquipmentStatusHistory
        {
            EquipmentId = dto.EquipmentId,
            PreviousStatus = previousStatus,
            NewStatus = EquipmentStatus.Stopped,
            Reason = $"停机: {(DowntimeReason)dto.Reason}",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = dto.ReporterId.ToString()
        });

        var result = await _unitOfWork.DowntimeRecords.AddAsync(record);
        await _unitOfWork.SaveChangesAsync();

        await _operationLogService.LogAsync(
            "Downtime",
            "开始停机",
            $"设备: {equipment.Name}, 原因: {(DowntimeReason)dto.Reason}, 详情: {dto.ReasonDetail}",
            dto.ReporterId,
            null,
            true);

        return await MapToDto(result);
    }

    public async Task<DowntimeRecordDto> EndDowntimeAsync(Guid id, Guid operatorId)
    {
        var record = await _unitOfWork.DowntimeRecords.GetByIdAsync(id);
        if (record == null)
            throw new KeyNotFoundException($"停机记录 {id} 不存在");

        if (record.EndTime.HasValue)
            throw new InvalidOperationException("该停机记录已结束");

        record.EndTime = DateTime.UtcNow;
        record.DurationMinutes = (record.EndTime.Value - record.StartTime).TotalMinutes;
        record.UpdatedAt = DateTime.UtcNow;

        var equipment = await _unitOfWork.Equipments.GetByIdAsync(record.EquipmentId);
        if (equipment != null)
        {
            var previousStatus = equipment.Status;
            equipment.Status = EquipmentStatus.Running;
            equipment.UpdatedAt = DateTime.UtcNow;

            equipment.StatusHistories.Add(new EquipmentStatusHistory
            {
                EquipmentId = record.EquipmentId,
                PreviousStatus = previousStatus,
                NewStatus = EquipmentStatus.Running,
                Reason = "停机结束",
                CreatedAt = DateTime.UtcNow,
                CreatedBy = operatorId.ToString()
            });
        }

        await _unitOfWork.SaveChangesAsync();

        await _operationLogService.LogAsync(
            "Downtime",
            "结束停机",
            $"设备: {equipment?.Name}, 时长: {record.DurationMinutes:F2}分钟",
            operatorId,
            null,
            true);

        return await MapToDto(record);
    }

    public async Task<IEnumerable<DowntimeRecordDto>> GetByEquipmentAsync(Guid equipmentId, DateTime startDate, DateTime endDate)
    {
        var records = await _unitOfWork.DowntimeRecords.FindAsync(d =>
            d.EquipmentId == equipmentId && d.StartTime >= startDate && d.StartTime <= endDate);
        var tasks = records.Select(MapToDto);
        return await Task.WhenAll(tasks);
    }

    public async Task<DowntimeRecordDto?> GetByIdAsync(Guid id)
    {
        var record = await _unitOfWork.DowntimeRecords.GetByIdAsync(id);
        return record == null ? null : await MapToDto(record);
    }

    private async Task<DowntimeRecordDto> MapToDto(DowntimeRecord record)
    {
        var equipment = record.Equipment ?? await _unitOfWork.Equipments.GetByIdAsync(record.EquipmentId);
        var reporter = record.Reporter ?? await _unitOfWork.Users.GetByIdAsync(record.ReporterId);
        var shift = record.Shift ?? (record.ShiftId.HasValue ? await _unitOfWork.Shifts.GetByIdAsync(record.ShiftId.Value) : null);

        return new DowntimeRecordDto
        {
            Id = record.Id,
            EquipmentId = record.EquipmentId,
            EquipmentName = equipment?.Name ?? string.Empty,
            Reason = (int)record.Reason,
            ReasonText = GetReasonText(record.Reason),
            ReasonDetail = record.ReasonDetail,
            StartTime = record.StartTime,
            EndTime = record.EndTime,
            DurationMinutes = record.DurationMinutes,
            ReporterId = record.ReporterId,
            ReporterName = reporter?.RealName ?? string.Empty,
            ShiftId = record.ShiftId,
            ShiftName = shift?.Name,
            IsLogged = record.IsLogged
        };
    }

    private static string GetReasonText(DowntimeReason reason) => reason switch
    {
        DowntimeReason.PlannedMaintenance => "计划维护",
        DowntimeReason.MoldChange => "换模",
        DowntimeReason.MaterialShortage => "缺料",
        DowntimeReason.EquipmentFailure => "设备故障",
        DowntimeReason.QualityIssue => "质量问题",
        DowntimeReason.ScheduledBreak => "计划休息",
        DowntimeReason.Other => "其他",
        _ => "未知"
    };
}
