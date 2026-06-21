using ProcessScheduling.Application.DTOs;
using ProcessScheduling.Application.Interfaces;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Enums;
using ProcessScheduling.Domain.Interfaces;

namespace ProcessScheduling.Application.Services;

public class ProcessStepService : IProcessStepService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IOperationLogService _operationLogService;

    public ProcessStepService(IUnitOfWork unitOfWork, IOperationLogService operationLogService)
    {
        _unitOfWork = unitOfWork;
        _operationLogService = operationLogService;
    }

    public async Task<ProcessStepInstanceDto?> GetByQrCodeAsync(string qrCode)
    {
        var instance = await _unitOfWork.ProcessStepInstances.GetByQrCodeAsync(qrCode);
        return instance == null ? null : MapToDto(instance);
    }

    public async Task<ProcessStepInstanceDto> ScanStartAsync(ScanCodeRequestDto request)
    {
        var instance = await _unitOfWork.ProcessStepInstances.GetByQrCodeAsync(request.QrCode);
        if (instance == null)
            throw new KeyNotFoundException($"二维码 {request.QrCode} 对应的工序不存在");

        if (instance.Status == ProcessStepStatus.InProgress)
            throw new InvalidOperationException("该工序已在进行中");

        if (instance.Status == ProcessStepStatus.Completed)
            throw new InvalidOperationException("该工序已完成");

        var previousStatus = instance.Status;
        instance.Status = ProcessStepStatus.InProgress;
        instance.EquipmentId = request.EquipmentId;
        instance.OperatorId = request.OperatorId;
        instance.StartedAt = DateTime.UtcNow;
        instance.UpdatedAt = DateTime.UtcNow;

        instance.StatusChanges.Add(new ProcessStepStatusChange
        {
            ProcessStepInstanceId = instance.Id,
            PreviousStatus = previousStatus,
            NewStatus = ProcessStepStatus.InProgress,
            Reason = "扫码开始"
        });

        var equipment = await _unitOfWork.Equipments.GetByIdAsync(request.EquipmentId);
        if (equipment != null)
        {
            var prevEquipStatus = equipment.Status;
            equipment.Status = EquipmentStatus.Processing;
            equipment.CurrentWorkOrderCode = instance.WorkOrder?.Code;
            equipment.UpdatedAt = DateTime.UtcNow;

            equipment.StatusHistories.Add(new EquipmentStatusHistory
            {
                EquipmentId = equipment.Id,
                PreviousStatus = prevEquipStatus,
                NewStatus = EquipmentStatus.Processing,
                Reason = "开始工序加工",
                CreatedAt = DateTime.UtcNow,
                CreatedBy = request.OperatorId.ToString()
            });
        }

        await _unitOfWork.SaveChangesAsync();

        await _operationLogService.LogAsync(
            "ProcessStep",
            "扫码开始工序",
            $"工序: {instance.ProcessStepTemplate?.Name}, 设备: {equipment?.Name}",
            request.OperatorId,
            null);

        return MapToDto(instance);
    }

    public async Task<ProcessStepInstanceDto> ScanCompleteAsync(string qrCode, int outputQuantity, int defectiveQuantity, string? remark = null)
    {
        var instance = await _unitOfWork.ProcessStepInstances.GetByQrCodeAsync(qrCode);
        if (instance == null)
            throw new KeyNotFoundException($"二维码 {qrCode} 对应的工序不存在");

        if (instance.Status != ProcessStepStatus.InProgress && instance.Status != ProcessStepStatus.Paused)
            throw new InvalidOperationException("该工序不在可完成状态");

        var previousStatus = instance.Status;
        instance.Status = ProcessStepStatus.Completed;
        instance.OutputQuantity = outputQuantity;
        instance.DefectiveQuantity = defectiveQuantity;
        instance.CompletedAt = DateTime.UtcNow;
        instance.UpdatedAt = DateTime.UtcNow;

        instance.StatusChanges.Add(new ProcessStepStatusChange
        {
            ProcessStepInstanceId = instance.Id,
            PreviousStatus = previousStatus,
            NewStatus = ProcessStepStatus.Completed,
            Reason = remark ?? "扫码完成"
        });

        var workOrder = instance.WorkOrder;
        if (workOrder != null)
        {
            workOrder.CompletedQuantity += outputQuantity;
            workOrder.DefectiveQuantity += defectiveQuantity;
            if (workOrder.ActualStartTime == null)
                workOrder.ActualStartTime = instance.StartedAt;
            if (workOrder.CompletedQuantity >= workOrder.PlannedQuantity)
                workOrder.ActualEndTime = DateTime.UtcNow;
        }

        var productionRecord = new ProductionRecord
        {
            WorkOrderId = instance.WorkOrderId,
            EquipmentId = instance.EquipmentId ?? Guid.Empty,
            OperatorId = instance.OperatorId ?? Guid.Empty,
            ShiftId = instance.ShiftId ?? Guid.Empty,
            Quantity = outputQuantity,
            DefectiveQuantity = defectiveQuantity,
            ProductionTime = DateTime.UtcNow,
            WorkHours = instance.StartedAt.HasValue
                ? (DateTime.UtcNow - instance.StartedAt.Value).TotalHours
                : 0,
            Remarks = remark
        };
        await _unitOfWork.ProductionRecords.AddAsync(productionRecord);

        if (instance.EquipmentId.HasValue)
        {
            var equipment = await _unitOfWork.Equipments.GetByIdAsync(instance.EquipmentId.Value);
            if (equipment != null)
            {
                var prevEquipStatus = equipment.Status;
                equipment.Status = EquipmentStatus.Running;
                equipment.UpdatedAt = DateTime.UtcNow;

                equipment.StatusHistories.Add(new EquipmentStatusHistory
                {
                    EquipmentId = equipment.Id,
                    PreviousStatus = prevEquipStatus,
                    NewStatus = EquipmentStatus.Running,
                    Reason = "工序加工完成",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = instance.OperatorId.ToString()
                });
            }
        }

        await _unitOfWork.SaveChangesAsync();

        await _operationLogService.LogAsync(
            "ProcessStep",
            "扫码完成工序",
            $"工序: {instance.ProcessStepTemplate?.Name}, 产量: {outputQuantity}, 不良: {defectiveQuantity}",
            instance.OperatorId,
            null);

        return MapToDto(instance);
    }

    public async Task<ProcessStepInstanceDto> ReportAbnormalAsync(string qrCode, string reason, Guid operatorId)
    {
        var instance = await _unitOfWork.ProcessStepInstances.GetByQrCodeAsync(qrCode);
        if (instance == null)
            throw new KeyNotFoundException($"二维码 {qrCode} 对应的工序不存在");

        var previousStatus = instance.Status;
        instance.Status = ProcessStepStatus.Abnormal;
        instance.AbnormalReason = reason;
        instance.UpdatedAt = DateTime.UtcNow;

        instance.StatusChanges.Add(new ProcessStepStatusChange
        {
            ProcessStepInstanceId = instance.Id,
            PreviousStatus = previousStatus,
            NewStatus = ProcessStepStatus.Abnormal,
            Reason = reason
        });

        if (instance.EquipmentId.HasValue)
        {
            var equipment = await _unitOfWork.Equipments.GetByIdAsync(instance.EquipmentId.Value);
            if (equipment != null)
            {
                var prevEquipStatus = equipment.Status;
                equipment.Status = EquipmentStatus.Abnormal;
                equipment.UpdatedAt = DateTime.UtcNow;

                equipment.StatusHistories.Add(new EquipmentStatusHistory
                {
                    EquipmentId = equipment.Id,
                    PreviousStatus = prevEquipStatus,
                    NewStatus = EquipmentStatus.Abnormal,
                    Reason = $"工序异常: {reason}",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = operatorId.ToString()
                });
            }
        }

        await _unitOfWork.SaveChangesAsync();

        await _operationLogService.LogAsync(
            "ProcessStep",
            "工序异常上报",
            $"工序: {instance.ProcessStepTemplate?.Name}, 原因: {reason}",
            operatorId,
            null,
            true);

        return MapToDto(instance);
    }

    public async Task<IEnumerable<ProcessStepInstanceDto>> GetByWorkOrderAsync(Guid workOrderId)
    {
        var instances = await _unitOfWork.ProcessStepInstances.GetByWorkOrderAsync(workOrderId);
        return instances.Select(MapToDto);
    }

    public async Task<ProcessStepInstanceDto?> GetByIdAsync(Guid id)
    {
        var instance = await _unitOfWork.ProcessStepInstances.GetByIdAsync(id);
        return instance == null ? null : MapToDto(instance);
    }

    private static ProcessStepInstanceDto MapToDto(ProcessStepInstance instance)
    {
        return new ProcessStepInstanceDto
        {
            Id = instance.Id,
            WorkOrderId = instance.WorkOrderId,
            WorkOrderCode = instance.WorkOrder?.Code ?? string.Empty,
            ProcessStepTemplateId = instance.ProcessStepTemplateId,
            StepName = instance.ProcessStepTemplate?.Name ?? string.Empty,
            StepCode = instance.ProcessStepTemplate?.Code ?? string.Empty,
            Sequence = instance.ProcessStepTemplate?.Sequence ?? 0,
            Status = (int)instance.Status,
            StatusText = GetStatusText(instance.Status),
            EquipmentId = instance.EquipmentId,
            EquipmentCode = instance.Equipment?.Code,
            EquipmentName = instance.Equipment?.Name,
            OperatorId = instance.OperatorId,
            OperatorName = instance.Operator?.RealName,
            ShiftId = instance.ShiftId,
            ShiftName = instance.Shift?.Name,
            StartedAt = instance.StartedAt,
            CompletedAt = instance.CompletedAt,
            OutputQuantity = instance.OutputQuantity,
            DefectiveQuantity = instance.DefectiveQuantity,
            AbnormalReason = instance.AbnormalReason,
            QrCode = instance.QrCode,
            CreatedAt = instance.CreatedAt
        };
    }

    private static string GetStatusText(ProcessStepStatus status) => status switch
    {
        ProcessStepStatus.Pending => "待开始",
        ProcessStepStatus.InProgress => "进行中",
        ProcessStepStatus.Completed => "已完成",
        ProcessStepStatus.Abnormal => "异常",
        ProcessStepStatus.Paused => "已暂停",
        _ => "未知"
    };
}
