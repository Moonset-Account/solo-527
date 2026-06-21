using ProcessScheduling.Application.DTOs;
using ProcessScheduling.Application.Interfaces;
using ProcessScheduling.Domain.Interfaces;

namespace ProcessScheduling.Application.Services;

public class ReviewService : IReviewService
{
    private readonly IUnitOfWork _unitOfWork;

    public ReviewService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<AdjustmentRecordDto>> GetAdjustmentHistoryAsync(string entityType, Guid entityId)
    {
        var records = await _unitOfWork.AdjustmentRecords.GetByEntityAsync(entityType, entityId);
        var tasks = records.Select(MapToAdjustmentDto);
        return await Task.WhenAll(tasks);
    }

    public async Task<IEnumerable<MoldRecordDto>> GetMoldHistoryAsync(Guid moldId)
    {
        var records = await _unitOfWork.Molds.GetRecordsAsync(moldId);
        var tasks = records.Select(MapToMoldRecordDto);
        return await Task.WhenAll(tasks);
    }

    public async Task<IEnumerable<QCResultDto>> GetQCHistoryAsync(Guid workOrderId)
    {
        var results = await _unitOfWork.QCResults.GetByWorkOrderAsync(workOrderId);
        var tasks = results.Select(MapToQCDto);
        return await Task.WhenAll(tasks);
    }

    public async Task<IEnumerable<OperationLogDto>> GetOperationLogsAsync(DateTime startDate, DateTime endDate, string? module = null)
    {
        var logs = string.IsNullOrEmpty(module)
            ? await _unitOfWork.OperationLogs.FindAsync(l => l.CreatedAt >= startDate && l.CreatedAt <= endDate)
            : await _unitOfWork.OperationLogs.FindAsync(l => l.Module == module && l.CreatedAt >= startDate && l.CreatedAt <= endDate);

        return logs.Select(l => new OperationLogDto
        {
            Id = l.Id,
            UserId = l.UserId,
            Username = l.User?.Username,
            Action = l.Action,
            Module = l.Module,
            Detail = l.Detail,
            IpAddress = l.IpAddress,
            IsDowntimeRelated = l.IsDowntimeRelated,
            CreatedAt = l.CreatedAt
        });
    }

    private async Task<AdjustmentRecordDto> MapToAdjustmentDto(Domain.Entities.AdjustmentRecord record)
    {
        var operatorUser = record.Operator ?? await _unitOfWork.Users.GetByIdAsync(record.OperatorId);
        return new AdjustmentRecordDto
        {
            Id = record.Id,
            EntityType = record.EntityType,
            EntityId = record.EntityId,
            FieldName = record.FieldName,
            PreviousValue = record.PreviousValue,
            NewValue = record.NewValue,
            Reason = record.Reason,
            OperatorId = record.OperatorId,
            OperatorName = operatorUser?.RealName ?? string.Empty,
            CreatedAt = record.CreatedAt
        };
    }

    private async Task<MoldRecordDto> MapToMoldRecordDto(Domain.Entities.MoldRecord record)
    {
        var mold = record.Mold ?? await _unitOfWork.Molds.GetByIdAsync(record.MoldId);
        var equipment = record.Equipment ?? (record.EquipmentId.HasValue ? await _unitOfWork.Equipments.GetByIdAsync(record.EquipmentId.Value) : null);
        return new MoldRecordDto
        {
            Id = record.Id,
            MoldId = record.MoldId,
            MoldCode = mold?.Code ?? string.Empty,
            RecordType = record.RecordType,
            PreviousValue = record.PreviousValue,
            NewValue = record.NewValue,
            Description = record.Description,
            EquipmentId = record.EquipmentId,
            EquipmentName = equipment?.Name,
            CreatedAt = record.CreatedAt
        };
    }

    private async Task<QCResultDto> MapToQCDto(Domain.Entities.QCResult result)
    {
        var workOrder = result.WorkOrder ?? await _unitOfWork.WorkOrders.GetByIdAsync(result.WorkOrderId);
        var step = result.ProcessStepInstance ?? await _unitOfWork.ProcessStepInstances.GetByIdAsync(result.ProcessStepInstanceId);
        var inspector = result.Inspector ?? await _unitOfWork.Users.GetByIdAsync(result.InspectorId);
        return new QCResultDto
        {
            Id = result.Id,
            WorkOrderId = result.WorkOrderId,
            WorkOrderCode = workOrder?.Code ?? string.Empty,
            ProcessStepInstanceId = result.ProcessStepInstanceId,
            StepName = step?.ProcessStepTemplate?.Name ?? string.Empty,
            InspectorId = result.InspectorId,
            InspectorName = inspector?.RealName ?? string.Empty,
            Result = result.Result,
            SampleSize = result.SampleSize,
            PassCount = result.PassCount,
            FailCount = result.FailCount,
            DefectDescription = result.DefectDescription,
            Remarks = result.Remarks,
            CreatedAt = result.CreatedAt
        };
    }
}
