using Microsoft.EntityFrameworkCore;
using OpsWorkOrder.Data;
using OpsWorkOrder.Dtos;
using OpsWorkOrder.Enums;
using OpsWorkOrder.Models;
using OpsWorkOrder.Common;
using Newtonsoft.Json;

namespace OpsWorkOrder.Services;

public interface IBatchTaskService
{
    Task<ApiResult<PagedResultDto<BatchTaskDto>>> GetListAsync(int page, int pageSize, BatchTaskStatus? status, BatchTaskType? type, int userId, UserRole role);
    Task<ApiResult<BatchTaskDetailDto>> GetByIdAsync(int id, int userId, UserRole role);
    Task<ApiResult<BatchTaskDto>> CreateAsync(CreateBatchTaskDto dto, int userId, string ipAddress);
    Task<ApiResult> CancelAsync(int id, int userId, string ipAddress);
    Task ExecuteTaskAsync(int taskId);
}

public class BatchTaskService : IBatchTaskService
{
    private readonly AppDbContext _context;
    private readonly IAuditLogService _auditLogService;
    private readonly IServiceProvider _serviceProvider;

    public BatchTaskService(AppDbContext context, IAuditLogService auditLogService, IServiceProvider serviceProvider)
    {
        _context = context;
        _auditLogService = auditLogService;
        _serviceProvider = serviceProvider;
    }

    public async Task<ApiResult<PagedResultDto<BatchTaskDto>>> GetListAsync(int page, int pageSize,
        BatchTaskStatus? status, BatchTaskType? type, int userId, UserRole role)
    {
        var query = _context.BatchTasks.AsQueryable();

        if (role == UserRole.StoreOperator)
            query = query.Where(t => t.CreatorId == userId);

        if (status.HasValue)
            query = query.Where(t => t.Status == status.Value);
        if (type.HasValue)
            query = query.Where(t => t.TaskType == type.Value);

        var totalCount = await query.CountAsync();
        var tasks = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new BatchTaskDto
            {
                Id = t.Id,
                TaskName = t.TaskName,
                TaskType = t.TaskType,
                Status = t.Status,
                CreatorId = t.CreatorId,
                CreatorName = t.Creator.FullName,
                TotalCount = t.TotalCount,
                SuccessCount = t.SuccessCount,
                FailedCount = t.FailedCount,
                CurrentIndex = t.CurrentIndex,
                ProgressPercent = t.TotalCount > 0 ? (double)t.CurrentIndex / t.TotalCount * 100 : 0,
                ResultSummary = t.ResultSummary,
                CreatedAt = t.CreatedAt,
                StartedAt = t.StartedAt,
                CompletedAt = t.CompletedAt
            })
            .ToListAsync();

        return ApiResult<PagedResultDto<BatchTaskDto>>.Ok(new PagedResultDto<BatchTaskDto>
        {
            Items = tasks,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<ApiResult<BatchTaskDetailDto>> GetByIdAsync(int id, int userId, UserRole role)
    {
        var task = await _context.BatchTasks
            .Include(t => t.Creator)
            .Include(t => t.Items)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task == null)
            return ApiResult<BatchTaskDetailDto>.Fail("任务不存在");

        if (role == UserRole.StoreOperator && task.CreatorId != userId)
            return ApiResult<BatchTaskDetailDto>.Fail("无权限查看");

        var detail = new BatchTaskDetailDto
        {
            Id = task.Id,
            TaskName = task.TaskName,
            TaskType = task.TaskType,
            Status = task.Status,
            CreatorId = task.CreatorId,
            CreatorName = task.Creator.FullName,
            TotalCount = task.TotalCount,
            SuccessCount = task.SuccessCount,
            FailedCount = task.FailedCount,
            CurrentIndex = task.CurrentIndex,
            ProgressPercent = task.TotalCount > 0 ? (double)task.CurrentIndex / task.TotalCount * 100 : 0,
            ResultSummary = task.ResultSummary,
            CreatedAt = task.CreatedAt,
            StartedAt = task.StartedAt,
            CompletedAt = task.CompletedAt,
            Items = task.Items.Select(i => new BatchTaskItemDto
            {
                Id = i.Id,
                ItemIndex = i.ItemIndex,
                ItemKey = i.ItemKey,
                ItemData = i.ItemData,
                Success = i.Success,
                ErrorMessage = i.ErrorMessage,
                ResultData = i.ResultData,
                StartedAt = i.StartedAt,
                CompletedAt = i.CompletedAt
            }).ToList()
        };

        return ApiResult<BatchTaskDetailDto>.Ok(detail);
    }

    public async Task<ApiResult<BatchTaskDto>> CreateAsync(CreateBatchTaskDto dto, int userId, string ipAddress)
    {
        if (dto.ItemIds == null || dto.ItemIds.Count == 0)
            return ApiResult<BatchTaskDto>.Fail("请选择要处理的项目");

        var task = new BatchTask
        {
            TaskName = dto.TaskName,
            TaskType = dto.TaskType,
            Status = BatchTaskStatus.Pending,
            CreatorId = userId,
            TotalCount = dto.ItemIds.Count,
            SuccessCount = 0,
            FailedCount = 0,
            CurrentIndex = 0,
            Parameters = dto.Parameters,
            CreatedAt = DateTime.UtcNow,
            Items = dto.ItemIds.Select((id, index) => new BatchTaskItem
            {
                ItemIndex = index + 1,
                ItemKey = id.ToString(),
                Success = false
            }).ToList()
        };

        _context.BatchTasks.Add(task);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(userId, string.Empty, UserRole.Admin,
            AuditActionType.Create, "BatchTask", task.Id.ToString(), null,
            JsonConvert.SerializeObject(dto), "创建批量任务", ipAddress);

        _ = Task.Run(() => ExecuteTaskAsync(task.Id));

        var resultDto = new BatchTaskDto
        {
            Id = task.Id,
            TaskName = task.TaskName,
            TaskType = task.TaskType,
            Status = task.Status,
            CreatorId = task.CreatorId,
            TotalCount = task.TotalCount,
            SuccessCount = task.SuccessCount,
            FailedCount = task.FailedCount,
            CurrentIndex = task.CurrentIndex,
            ProgressPercent = 0,
            CreatedAt = task.CreatedAt
        };

        return ApiResult<BatchTaskDto>.Ok(resultDto, "批量任务已创建");
    }

    public async Task<ApiResult> CancelAsync(int id, int userId, string ipAddress)
    {
        var task = await _context.BatchTasks.FindAsync(id);
        if (task == null)
            return ApiResult.Fail("任务不存在");

        if (task.Status == BatchTaskStatus.Completed || task.Status == BatchTaskStatus.Failed ||
            task.Status == BatchTaskStatus.Cancelled)
            return ApiResult.Fail("任务已完成或已取消");

        task.Status = BatchTaskStatus.Cancelled;
        task.ResultSummary = "用户取消";
        task.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(userId, string.Empty, UserRole.Admin,
            AuditActionType.Update, "BatchTask", task.Id.ToString(), null, null,
            "取消批量任务", ipAddress);

        return ApiResult.Ok("取消成功");
    }

    public async Task ExecuteTaskAsync(int taskId)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        var task = await context.BatchTasks
            .Include(t => t.Items)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null || task.Status != BatchTaskStatus.Pending)
            return;

        task.Status = BatchTaskStatus.Running;
        task.StartedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        int successCount = 0;
        int failedCount = 0;
        int currentIndex = 0;

        foreach (var item in task.Items)
        {
            if (task.Status == BatchTaskStatus.Cancelled)
                break;

            currentIndex++;
            task.CurrentIndex = currentIndex;
            item.StartedAt = DateTime.UtcNow;

            try
            {
                await ProcessTaskItemAsync(context, task.TaskType, item);
                item.Success = true;
                successCount++;
                task.SuccessCount = successCount;
            }
            catch (Exception ex)
            {
                item.Success = false;
                item.ErrorMessage = ex.Message;
                failedCount++;
                task.FailedCount = failedCount;
            }

            item.CompletedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();

            await Task.Delay(100);
        }

        if (task.Status != BatchTaskStatus.Cancelled)
        {
            if (failedCount == 0)
                task.Status = BatchTaskStatus.Completed;
            else if (successCount == 0)
                task.Status = BatchTaskStatus.Failed;
            else
                task.Status = BatchTaskStatus.PartiallyFailed;
        }

        task.CompletedAt = DateTime.UtcNow;
        task.ResultSummary = $"共{task.TotalCount}项，成功{successCount}项，失败{failedCount}项";
        await context.SaveChangesAsync();

        await notificationService.CreateAsync(task.CreatorId, NotificationType.BatchTaskCompleted,
            "批量任务完成", $"任务【{task.TaskName}】已完成：{task.ResultSummary}",
            task.Id.ToString(), "BatchTask");
    }

    private async Task ProcessTaskItemAsync(AppDbContext context, BatchTaskType taskType, BatchTaskItem item)
    {
        switch (taskType)
        {
            case BatchTaskType.BulkAssignAlert:
                await BulkAssignAlertAsync(context, item);
                break;
            case BatchTaskType.BulkCloseAlert:
                await BulkCloseAlertAsync(context, item);
                break;
            case BatchTaskType.BulkAssetSync:
                await BulkAssetSyncAsync(context, item);
                break;
            default:
                throw new NotImplementedException($"任务类型 {taskType} 未实现");
        }
    }

    private async Task BulkAssignAlertAsync(AppDbContext context, BatchTaskItem item)
    {
        if (!int.TryParse(item.ItemKey, out var alertId))
            throw new ArgumentException("无效的告警ID");

        var alert = await context.Alerts.FindAsync(alertId);
        if (alert == null)
            throw new ArgumentException("告警不存在");

        var parameters = JsonConvert.DeserializeObject<dynamic>(item.ItemData ?? "{}");
        if (parameters?.assignedToId == null)
            throw new ArgumentException("缺少处理人参数");

        alert.AssignedToId = (int)parameters.assignedToId;
        alert.AssignedAt = DateTime.UtcNow;
        if (alert.Status == AlertStatus.Pending)
            alert.Status = AlertStatus.Assigned;

        item.ResultData = $"告警 {alertId} 已分派给处理人 {(int)parameters.assignedToId}";
    }

    private async Task BulkCloseAlertAsync(AppDbContext context, BatchTaskItem item)
    {
        if (!int.TryParse(item.ItemKey, out var alertId))
            throw new ArgumentException("无效的告警ID");

        var alert = await context.Alerts.FindAsync(alertId);
        if (alert == null)
            throw new ArgumentException("告警不存在");

        alert.Status = AlertStatus.Closed;
        alert.ClosedAt = DateTime.UtcNow;

        item.ResultData = $"告警 {alertId} 已关闭";
    }

    private async Task BulkAssetSyncAsync(AppDbContext context, BatchTaskItem item)
    {
        if (!int.TryParse(item.ItemKey, out var assetId))
            throw new ArgumentException("无效的资产ID");

        var asset = await context.Assets.FindAsync(assetId);
        if (asset == null)
            throw new ArgumentException("资产不存在");

        asset.LastSyncAt = DateTime.UtcNow;
        asset.SyncRequired = false;

        item.ResultData = $"资产 {assetId} 已同步";
    }
}
