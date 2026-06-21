using ProcessScheduling.Application.DTOs;
using ProcessScheduling.Application.Interfaces;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Enums;
using ProcessScheduling.Domain.Interfaces;

namespace ProcessScheduling.Application.Services;

public class WorkReportService : IWorkReportService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IOperationLogService _operationLogService;

    public WorkReportService(IUnitOfWork unitOfWork, IOperationLogService operationLogService)
    {
        _unitOfWork = unitOfWork;
        _operationLogService = operationLogService;
    }

    public async Task<WorkReportDto> CreateAsync(CreateWorkReportDto dto)
    {
        var report = new WorkReport
        {
            WorkOrderId = dto.WorkOrderId,
            OperatorId = dto.OperatorId,
            EquipmentId = dto.EquipmentId,
            ShiftId = dto.ShiftId,
            CompletedQuantity = dto.CompletedQuantity,
            DefectiveQuantity = dto.DefectiveQuantity,
            WorkHours = dto.WorkHours,
            Status = WorkReportStatus.Pending,
            Remarks = dto.Remarks
        };

        report.Audits.Add(new WorkReportAudit
        {
            WorkReportId = report.Id,
            PreviousStatus = WorkReportStatus.Pending,
            NewStatus = WorkReportStatus.Pending,
            ReviewerId = dto.OperatorId
        });

        var result = await _unitOfWork.WorkReports.AddAsync(report);
        await _unitOfWork.SaveChangesAsync();

        await _operationLogService.LogAsync(
            "WorkReport",
            "提交报工",
            $"工单: {report.WorkOrder?.Code}, 数量: {dto.CompletedQuantity}",
            dto.OperatorId,
            null);

        return await MapToDto(result);
    }

    public async Task<WorkReportDto?> GetByIdAsync(Guid id)
    {
        var report = await _unitOfWork.WorkReports.GetByIdAsync(id);
        return report == null ? null : await MapToDto(report);
    }

    public async Task<IEnumerable<WorkReportDto>> GetByStatusAsync(WorkReportStatus status)
    {
        var reports = await _unitOfWork.WorkReports.FindAsync(r => r.Status == status);
        var tasks = reports.Select(MapToDto);
        return await Task.WhenAll(tasks);
    }

    public async Task<IEnumerable<WorkReportDto>> GetByShiftAsync(Guid shiftId, DateTime date)
    {
        var startOfDay = date.Date;
        var endOfDay = startOfDay.AddDays(1);
        var reports = await _unitOfWork.WorkReports.FindAsync(r =>
            r.ShiftId == shiftId && r.CreatedAt >= startOfDay && r.CreatedAt < endOfDay);
        var tasks = reports.Select(MapToDto);
        return await Task.WhenAll(tasks);
    }

    public async Task<WorkReportDto> AuditAsync(AuditWorkReportDto dto)
    {
        var report = await _unitOfWork.WorkReports.GetByIdAsync(dto.ReportId);
        if (report == null)
            throw new KeyNotFoundException($"报工单 {dto.ReportId} 不存在");

        if (report.Status != WorkReportStatus.Pending && report.Status != WorkReportStatus.UnderReview)
            throw new InvalidOperationException("该报工状态不允许审核");

        var previousStatus = report.Status;
        report.Status = dto.IsApproved ? WorkReportStatus.Approved : WorkReportStatus.Rejected;
        report.ReviewerId = dto.ReviewerId;
        report.ReviewedAt = DateTime.UtcNow;
        report.ReviewComment = dto.Comment;
        report.UpdatedAt = DateTime.UtcNow;

        report.Audits.Add(new WorkReportAudit
        {
            WorkReportId = report.Id,
            PreviousStatus = previousStatus,
            NewStatus = report.Status,
            ReviewerId = dto.ReviewerId,
            Comment = dto.Comment
        });

        await _unitOfWork.SaveChangesAsync();

        await _operationLogService.LogAsync(
            "WorkReport",
            $"审核报工: {(dto.IsApproved ? "通过" : "驳回")}",
            $"报工ID: {dto.ReportId}, 备注: {dto.Comment}",
            dto.ReviewerId,
            null);

        return await MapToDto(report);
    }

    public async Task<PagedResultDto<WorkReportDto>> GetPagedAsync(int pageIndex, int pageSize, WorkReportStatus? status = null)
    {
        var allReports = status.HasValue
            ? await _unitOfWork.WorkReports.FindAsync(r => r.Status == status.Value)
            : await _unitOfWork.WorkReports.GetAllAsync();

        var totalCount = allReports.Count();
        var paged = allReports
            .OrderByDescending(r => r.CreatedAt)
            .Skip(pageIndex * pageSize)
            .Take(pageSize)
            .ToList();

        var tasks = paged.Select(MapToDto);
        var items = await Task.WhenAll(tasks);

        return new PagedResultDto<WorkReportDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = pageIndex,
            PageSize = pageSize
        };
    }

    private async Task<WorkReportDto> MapToDto(WorkReport report)
    {
        var workOrder = report.WorkOrder ?? await _unitOfWork.WorkOrders.GetByIdAsync(report.WorkOrderId);
        var operatorUser = report.Operator ?? await _unitOfWork.Users.GetByIdAsync(report.OperatorId);
        var equipment = report.Equipment ?? await _unitOfWork.Equipments.GetByIdAsync(report.EquipmentId);
        var shift = report.Shift ?? (report.ShiftId != Guid.Empty ? await _unitOfWork.Shifts.GetByIdAsync(report.ShiftId) : null);
        var reviewer = report.Reviewer ?? (report.ReviewerId.HasValue ? await _unitOfWork.Users.GetByIdAsync(report.ReviewerId.Value) : null);

        return new WorkReportDto
        {
            Id = report.Id,
            WorkOrderId = report.WorkOrderId,
            WorkOrderCode = workOrder?.Code ?? string.Empty,
            OperatorId = report.OperatorId,
            OperatorName = operatorUser?.RealName ?? string.Empty,
            EquipmentId = report.EquipmentId,
            EquipmentName = equipment?.Name ?? string.Empty,
            ShiftId = report.ShiftId,
            ShiftName = shift?.Name ?? string.Empty,
            CompletedQuantity = report.CompletedQuantity,
            DefectiveQuantity = report.DefectiveQuantity,
            WorkHours = report.WorkHours,
            Status = (int)report.Status,
            StatusText = GetStatusText(report.Status),
            Remarks = report.Remarks,
            ReviewerId = report.ReviewerId,
            ReviewerName = reviewer?.RealName,
            ReviewedAt = report.ReviewedAt,
            ReviewComment = report.ReviewComment,
            CreatedAt = report.CreatedAt
        };
    }

    private static string GetStatusText(WorkReportStatus status) => status switch
    {
        WorkReportStatus.Pending => "待审核",
        WorkReportStatus.UnderReview => "审核中",
        WorkReportStatus.Approved => "已通过",
        WorkReportStatus.Rejected => "已驳回",
        _ => "未知"
    };
}
