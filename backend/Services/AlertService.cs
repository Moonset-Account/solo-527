using Microsoft.EntityFrameworkCore;
using OpsWorkOrder.Data;
using OpsWorkOrder.Dtos;
using OpsWorkOrder.Enums;
using OpsWorkOrder.Models;
using OpsWorkOrder.Common;
using Newtonsoft.Json;

namespace OpsWorkOrder.Services;

public interface IAlertService
{
    Task<ApiResult<PagedResultDto<AlertDto>>> GetListAsync(AlertQueryDto query, int userId, UserRole role);
    Task<ApiResult<AlertDto>> GetByIdAsync(int id, int userId, UserRole role);
    Task<ApiResult<AlertDto>> CreateAsync(CreateAlertDto dto, int userId, string ipAddress);
    Task<ApiResult<AlertDto>> UpdateAsync(int id, UpdateAlertDto dto, int userId, UserRole role, string ipAddress);
    Task<ApiResult<AlertDto>> AssignAsync(int id, AssignAlertDto dto, int userId, string ipAddress);
    Task<ApiResult<AlertDto>> ProcessAsync(int id, ProcessAlertDto dto, int userId, UserRole role, string ipAddress);
    Task<ApiResult<List<AlertProcessLogDto>>> GetProcessLogsAsync(int alertId);
    Task<ApiResult<int>> GetCountByStatusAsync(AlertStatus? status, int userId, UserRole role);
}

public class AlertService : IAlertService
{
    private readonly AppDbContext _context;
    private readonly IAuditLogService _auditLogService;
    private readonly INotificationService _notificationService;

    public AlertService(AppDbContext context, IAuditLogService auditLogService, INotificationService notificationService)
    {
        _context = context;
        _auditLogService = auditLogService;
        _notificationService = notificationService;
    }

    public async Task<ApiResult<PagedResultDto<AlertDto>>> GetListAsync(AlertQueryDto query, int userId, UserRole role)
    {
        var q = _context.Alerts.AsQueryable();

        if (role == UserRole.StoreOperator)
        {
            q = q.Where(a => a.AssignedToId == userId || a.CreatedById == userId);
        }

        if (query.Status.HasValue)
            q = q.Where(a => a.Status == query.Status.Value);
        if (query.Priority.HasValue)
            q = q.Where(a => a.Priority == query.Priority.Value);
        if (query.Type.HasValue)
            q = q.Where(a => a.Type == query.Type.Value);
        if (query.AssignedToId.HasValue)
            q = q.Where(a => a.AssignedToId == query.AssignedToId.Value);
        if (query.AssetId.HasValue)
            q = q.Where(a => a.AssetId == query.AssetId.Value);
        if (!string.IsNullOrEmpty(query.Keyword))
            q = q.Where(a => a.Title.Contains(query.Keyword) || a.Description.Contains(query.Keyword));
        if (query.IsOverdue.HasValue)
            q = q.Where(a => a.IsOverdue == query.IsOverdue.Value);
        if (query.StartDate.HasValue)
            q = q.Where(a => a.CreatedAt >= query.StartDate.Value);
        if (query.EndDate.HasValue)
            q = q.Where(a => a.CreatedAt <= query.EndDate.Value);

        var totalCount = await q.CountAsync();
        var alerts = await q
            .OrderByDescending(a => a.Priority)
            .ThenByDescending(a => a.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(a => new AlertDto
            {
                Id = a.Id,
                Title = a.Title,
                Description = a.Description,
                Type = a.Type,
                Priority = a.Priority,
                Status = a.Status,
                AssetId = a.AssetId,
                AssetName = a.Asset != null ? a.Asset.Name : null,
                AssignedToId = a.AssignedToId,
                AssignedToName = a.AssignedTo != null ? a.AssignedTo.FullName : null,
                CreatedById = a.CreatedById,
                CreatedByName = a.CreatedBy.FullName,
                CreatedAt = a.CreatedAt,
                AssignedAt = a.AssignedAt,
                StartedAt = a.StartedAt,
                ResolvedAt = a.ResolvedAt,
                ClosedAt = a.ClosedAt,
                DueDate = a.DueDate,
                IsOverdue = a.IsOverdue,
                RollbackPlan = a.RollbackPlan
            })
            .ToListAsync();

        return ApiResult<PagedResultDto<AlertDto>>.Ok(new PagedResultDto<AlertDto>
        {
            Items = alerts,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    public async Task<ApiResult<AlertDto>> GetByIdAsync(int id, int userId, UserRole role)
    {
        var alert = await _context.Alerts
            .Include(a => a.Asset)
            .Include(a => a.AssignedTo)
            .Include(a => a.CreatedBy)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (alert == null)
            return ApiResult<AlertDto>.Fail("告警不存在");

        if (role == UserRole.StoreOperator && alert.AssignedToId != userId && alert.CreatedById != userId)
            return ApiResult<AlertDto>.Fail("无权限查看");

        return ApiResult<AlertDto>.Ok(new AlertDto
        {
            Id = alert.Id,
            Title = alert.Title,
            Description = alert.Description,
            Type = alert.Type,
            Priority = alert.Priority,
            Status = alert.Status,
            AssetId = alert.AssetId,
            AssetName = alert.Asset?.Name,
            AssignedToId = alert.AssignedToId,
            AssignedToName = alert.AssignedTo?.FullName,
            CreatedById = alert.CreatedById,
            CreatedByName = alert.CreatedBy.FullName,
            CreatedAt = alert.CreatedAt,
            AssignedAt = alert.AssignedAt,
            StartedAt = alert.StartedAt,
            ResolvedAt = alert.ResolvedAt,
            ClosedAt = alert.ClosedAt,
            DueDate = alert.DueDate,
            IsOverdue = alert.IsOverdue,
            RollbackPlan = alert.RollbackPlan
        });
    }

    public async Task<ApiResult<AlertDto>> CreateAsync(CreateAlertDto dto, int userId, string ipAddress)
    {
        var alert = new Alert
        {
            Title = dto.Title,
            Description = dto.Description,
            Type = dto.Type,
            Priority = dto.Priority,
            Status = AlertStatus.Pending,
            AssetId = dto.AssetId,
            CreatedById = userId,
            DueDate = dto.DueDate,
            IsOverdue = false
        };

        _context.Alerts.Add(alert);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(userId, string.Empty, UserRole.StoreOperator,
            AuditActionType.Create, "Alert", alert.Id.ToString(), null,
            JsonConvert.SerializeObject(dto), "创建告警", ipAddress);

        var admins = await _context.Users.Where(u => u.Role == UserRole.Admin && u.IsActive).ToListAsync();
        foreach (var admin in admins)
        {
            await _notificationService.CreateAsync(admin.Id, NotificationType.AlertCreated,
                "新告警通知", $"有新的告警需要处理：{alert.Title}",
                alert.Id.ToString(), "Alert");
        }

        return ApiResult<AlertDto>.Ok(MapToDto(alert), "创建成功");
    }

    public async Task<ApiResult<AlertDto>> UpdateAsync(int id, UpdateAlertDto dto, int userId, UserRole role, string ipAddress)
    {
        var alert = await _context.Alerts.FindAsync(id);
        if (alert == null)
            return ApiResult<AlertDto>.Fail("告警不存在");

        if (role != UserRole.Admin && alert.CreatedById != userId)
            return ApiResult<AlertDto>.Fail("无权限修改");

        var oldValue = JsonConvert.SerializeObject(alert);

        if (!string.IsNullOrEmpty(dto.Title))
            alert.Title = dto.Title;
        if (!string.IsNullOrEmpty(dto.Description))
            alert.Description = dto.Description;
        if (dto.Priority.HasValue && role == UserRole.Admin)
            alert.Priority = dto.Priority.Value;
        if (dto.DueDate.HasValue)
            alert.DueDate = dto.DueDate.Value;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(userId, string.Empty, role,
            AuditActionType.Update, "Alert", alert.Id.ToString(), oldValue,
            JsonConvert.SerializeObject(dto), "更新告警", ipAddress);

        return ApiResult<AlertDto>.Ok(MapToDto(alert), "更新成功");
    }

    public async Task<ApiResult<AlertDto>> AssignAsync(int id, AssignAlertDto dto, int userId, string ipAddress)
    {
        var alert = await _context.Alerts.FindAsync(id);
        if (alert == null)
            return ApiResult<AlertDto>.Fail("告警不存在");

        var assignee = await _context.Users.FindAsync(dto.AssignedToId);
        if (assignee == null || !assignee.IsActive)
            return ApiResult<AlertDto>.Fail("处理人不存在或已禁用");

        var fromStatus = alert.Status;
        var oldValue = JsonConvert.SerializeObject(alert);

        alert.AssignedToId = dto.AssignedToId;
        alert.AssignedAt = DateTime.UtcNow;
        alert.Priority = dto.Priority;
        if (alert.Status == AlertStatus.Pending)
        {
            alert.Status = AlertStatus.Assigned;
        }

        await _context.SaveChangesAsync();

        var processLog = new AlertProcessLog
        {
            AlertId = alert.Id,
            OperatorId = userId,
            FromStatus = fromStatus,
            ToStatus = alert.Status,
            ActionDescription = $"分派给 {assignee.FullName}，优先级：{EnumHelper.GetPriorityText(dto.Priority)}",
            Remark = dto.Remark
        };
        _context.AlertProcessLogs.Add(processLog);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(userId, string.Empty, UserRole.Admin,
            AuditActionType.Assign, "Alert", alert.Id.ToString(), oldValue,
            JsonConvert.SerializeObject(dto), "分派告警", ipAddress);

        await _notificationService.CreateAsync(dto.AssignedToId, NotificationType.AlertAssigned,
            "告警分派通知", $"您有新的告警需要处理：{alert.Title}",
            alert.Id.ToString(), "Alert");

        return ApiResult<AlertDto>.Ok(MapToDto(alert), "分派成功");
    }

    public async Task<ApiResult<AlertDto>> ProcessAsync(int id, ProcessAlertDto dto, int userId, UserRole role, string ipAddress)
    {
        var alert = await _context.Alerts.FindAsync(id);
        if (alert == null)
            return ApiResult<AlertDto>.Fail("告警不存在");

        if (role == UserRole.StoreOperator && alert.AssignedToId != userId)
            return ApiResult<AlertDto>.Fail("无权限处理此告警");

        if (!IsValidStatusTransition(alert.Status, dto.ToStatus, role))
            return ApiResult<AlertDto>.Fail("无效的状态转换");

        var fromStatus = alert.Status;
        var oldValue = JsonConvert.SerializeObject(alert);

        alert.Status = dto.ToStatus;

        switch (dto.ToStatus)
        {
            case AlertStatus.Processing:
                alert.StartedAt = DateTime.UtcNow;
                break;
            case AlertStatus.Resolved:
                alert.ResolvedAt = DateTime.UtcNow;
                break;
            case AlertStatus.Closed:
                alert.ClosedAt = DateTime.UtcNow;
                break;
        }

        if (!string.IsNullOrEmpty(dto.RollbackPlan))
        {
            alert.RollbackPlan = dto.RollbackPlan;
        }

        if (alert.DueDate.HasValue && DateTime.UtcNow > alert.DueDate.Value)
        {
            alert.IsOverdue = true;
        }

        await _context.SaveChangesAsync();

        var processLog = new AlertProcessLog
        {
            AlertId = alert.Id,
            OperatorId = userId,
            FromStatus = fromStatus,
            ToStatus = dto.ToStatus,
            ActionDescription = $"状态变更：{EnumHelper.GetStatusText(fromStatus)} → {EnumHelper.GetStatusText(dto.ToStatus)}",
            Remark = dto.Remark
        };
        _context.AlertProcessLogs.Add(processLog);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(userId, string.Empty, role,
            AuditActionType.StatusChange, "Alert", alert.Id.ToString(), oldValue,
            JsonConvert.SerializeObject(dto), $"处理告警：{dto.ToStatus}", ipAddress);

        if (dto.ToStatus == AlertStatus.Resolved || dto.ToStatus == AlertStatus.Closed)
        {
            if (alert.AssetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(alert.AssetId.Value);
                if (asset != null)
                {
                    asset.SyncRequired = true;
                    await _context.SaveChangesAsync();

                    if (asset.ResponsibleId.HasValue)
                    {
                        await _notificationService.CreateAsync(asset.ResponsibleId.Value,
                            NotificationType.AssetSyncRequired,
                            "资产同步提醒",
                            $"资产 {asset.Name} 有告警处理完成，需要确认同步配置",
                            asset.Id.ToString(), "Asset");
                    }
                }
            }
        }

        return ApiResult<AlertDto>.Ok(MapToDto(alert), "处理成功");
    }

    private bool IsValidStatusTransition(AlertStatus from, AlertStatus to, UserRole role)
    {
        var validTransitions = new Dictionary<(AlertStatus, AlertStatus), UserRole?>
        {
            {(AlertStatus.Pending, AlertStatus.Assigned), UserRole.Admin},
            {(AlertStatus.Assigned, AlertStatus.Processing), null},
            {(AlertStatus.Processing, AlertStatus.Resolved), null},
            {(AlertStatus.Resolved, AlertStatus.Closed), UserRole.Admin},
            {(AlertStatus.Processing, AlertStatus.Rollback), null},
            {(AlertStatus.Rollback, AlertStatus.Processing), null},
            {(AlertStatus.Pending, AlertStatus.Processing), null},
        };

        if (!validTransitions.TryGetValue((from, to), out var requiredRole))
            return false;

        if (requiredRole.HasValue && role != requiredRole.Value)
            return false;

        return true;
    }

    public async Task<ApiResult<List<AlertProcessLogDto>>> GetProcessLogsAsync(int alertId)
    {
        var logs = await _context.AlertProcessLogs
            .Where(l => l.AlertId == alertId)
            .OrderBy(l => l.CreatedAt)
            .Select(l => new AlertProcessLogDto
            {
                Id = l.Id,
                AlertId = l.AlertId,
                OperatorId = l.OperatorId,
                OperatorName = l.Operator.FullName,
                FromStatus = l.FromStatus,
                ToStatus = l.ToStatus,
                ActionDescription = l.ActionDescription,
                Remark = l.Remark,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync();

        return ApiResult<List<AlertProcessLogDto>>.Ok(logs);
    }

    public async Task<ApiResult<int>> GetCountByStatusAsync(AlertStatus? status, int userId, UserRole role)
    {
        var query = _context.Alerts.AsQueryable();

        if (role == UserRole.StoreOperator)
            query = query.Where(a => a.AssignedToId == userId);

        if (status.HasValue)
            query = query.Where(a => a.Status == status.Value);

        var count = await query.CountAsync();
        return ApiResult<int>.Ok(count);
    }

    private AlertDto MapToDto(Alert alert)
    {
        return new AlertDto
        {
            Id = alert.Id,
            Title = alert.Title,
            Description = alert.Description,
            Type = alert.Type,
            Priority = alert.Priority,
            Status = alert.Status,
            AssetId = alert.AssetId,
            AssignedToId = alert.AssignedToId,
            CreatedById = alert.CreatedById,
            CreatedAt = alert.CreatedAt,
            AssignedAt = alert.AssignedAt,
            StartedAt = alert.StartedAt,
            ResolvedAt = alert.ResolvedAt,
            ClosedAt = alert.ClosedAt,
            DueDate = alert.DueDate,
            IsOverdue = alert.IsOverdue,
            RollbackPlan = alert.RollbackPlan
        };
    }
}
