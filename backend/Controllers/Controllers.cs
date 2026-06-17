using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using OpsWorkOrder.Services;
using OpsWorkOrder.Dtos;
using OpsWorkOrder.Common;
using OpsWorkOrder.Enums;

namespace OpsWorkOrder.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ApiResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return await _authService.LoginAsync(request, ipAddress);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<ApiResult> Logout()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        return await _authService.LogoutAsync(userId);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ApiResult<UserDto>> GetCurrentUser()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        return await _authService.GetCurrentUserAsync(userId);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<ApiResult<PagedResultDto<UserDto>>> GetList([FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? keyword = null, [FromQuery] UserRole? role = null)
    {
        return await _userService.GetListAsync(page, pageSize, keyword, role);
    }

    [HttpGet("{id}")]
    public async Task<ApiResult<UserDto>> GetById(int id)
    {
        return await _userService.GetByIdAsync(id);
    }

    [HttpPost]
    public async Task<ApiResult<UserDto>> Create([FromBody] CreateUserDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return await _userService.CreateAsync(dto, userId, ipAddress);
    }

    [HttpPut("{id}")]
    public async Task<ApiResult<UserDto>> Update(int id, [FromBody] UpdateUserDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return await _userService.UpdateAsync(id, dto, userId, ipAddress);
    }

    [HttpDelete("{id}")]
    public async Task<ApiResult> Delete(int id)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return await _userService.DeleteAsync(id, userId, ipAddress);
    }

    [HttpGet("by-role/{role}")]
    [AllowAnonymous]
    public async Task<List<UserDto>> GetByRole(UserRole role)
    {
        return await _userService.GetUsersByRoleAsync(role);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AlertsController : ControllerBase
{
    private readonly IAlertService _alertService;

    public AlertsController(IAlertService alertService)
    {
        _alertService = alertService;
    }

    [HttpGet]
    public async Task<ApiResult<PagedResultDto<AlertDto>>> GetList([FromQuery] AlertQueryDto query)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var role = (UserRole)Enum.Parse(typeof(UserRole), User.FindFirst(ClaimTypes.Role)?.Value ?? "StoreOperator");
        return await _alertService.GetListAsync(query, userId, role);
    }

    [HttpGet("{id}")]
    public async Task<ApiResult<AlertDto>> GetById(int id)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var role = (UserRole)Enum.Parse(typeof(UserRole), User.FindFirst(ClaimTypes.Role)?.Value ?? "StoreOperator");
        return await _alertService.GetByIdAsync(id, userId, role);
    }

    [HttpPost]
    public async Task<ApiResult<AlertDto>> Create([FromBody] CreateAlertDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return await _alertService.CreateAsync(dto, userId, ipAddress);
    }

    [HttpPut("{id}")]
    public async Task<ApiResult<AlertDto>> Update(int id, [FromBody] UpdateAlertDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var role = (UserRole)Enum.Parse(typeof(UserRole), User.FindFirst(ClaimTypes.Role)?.Value ?? "StoreOperator");
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return await _alertService.UpdateAsync(id, dto, userId, role, ipAddress);
    }

    [HttpPost("{id}/assign")]
    [Authorize(Roles = "Admin")]
    public async Task<ApiResult<AlertDto>> Assign(int id, [FromBody] AssignAlertDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return await _alertService.AssignAsync(id, dto, userId, ipAddress);
    }

    [HttpPost("{id}/process")]
    public async Task<ApiResult<AlertDto>> Process(int id, [FromBody] ProcessAlertDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var role = (UserRole)Enum.Parse(typeof(UserRole), User.FindFirst(ClaimTypes.Role)?.Value ?? "StoreOperator");
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return await _alertService.ProcessAsync(id, dto, userId, role, ipAddress);
    }

    [HttpGet("{id}/logs")]
    public async Task<ApiResult<List<AlertProcessLogDto>>> GetProcessLogs(int id)
    {
        return await _alertService.GetProcessLogsAsync(id);
    }

    [HttpGet("count")]
    public async Task<ApiResult<int>> GetCountByStatus([FromQuery] AlertStatus? status = null)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var role = (UserRole)Enum.Parse(typeof(UserRole), User.FindFirst(ClaimTypes.Role)?.Value ?? "StoreOperator");
        return await _alertService.GetCountByStatusAsync(status, userId, role);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssetsController : ControllerBase
{
    private readonly IAssetService _assetService;

    public AssetsController(IAssetService assetService)
    {
        _assetService = assetService;
    }

    [HttpGet]
    public async Task<ApiResult<PagedResultDto<AssetDto>>> GetList([FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? keyword = null, [FromQuery] AssetType? type = null, [FromQuery] AssetStatus? status = null,
        [FromQuery] bool? syncRequired = null)
    {
        return await _assetService.GetListAsync(page, pageSize, keyword, type, status, syncRequired);
    }

    [HttpGet("{id}")]
    public async Task<ApiResult<AssetDto>> GetById(int id)
    {
        return await _assetService.GetByIdAsync(id);
    }

    [HttpGet("all")]
    public async Task<ApiResult<List<AssetDto>>> GetAll()
    {
        return await _assetService.GetAllAsync();
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ApiResult<AssetDto>> Create([FromBody] CreateAssetDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return await _assetService.CreateAsync(dto, userId, ipAddress);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ApiResult<AssetDto>> Update(int id, [FromBody] UpdateAssetDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return await _assetService.UpdateAsync(id, dto, userId, ipAddress);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ApiResult> Delete(int id)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return await _assetService.DeleteAsync(id, userId, ipAddress);
    }

    [HttpPost("{id}/confirm-sync")]
    public async Task<ApiResult<AssetDto>> ConfirmSync(int id, [FromBody] AssetSyncConfirmDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return await _assetService.ConfirmSyncAsync(id, dto, userId, ipAddress);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BatchTasksController : ControllerBase
{
    private readonly IBatchTaskService _batchTaskService;

    public BatchTasksController(IBatchTaskService batchTaskService)
    {
        _batchTaskService = batchTaskService;
    }

    [HttpGet]
    public async Task<ApiResult<PagedResultDto<BatchTaskDto>>> GetList([FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] BatchTaskStatus? status = null, [FromQuery] BatchTaskType? type = null)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var role = (UserRole)Enum.Parse(typeof(UserRole), User.FindFirst(ClaimTypes.Role)?.Value ?? "StoreOperator");
        return await _batchTaskService.GetListAsync(page, pageSize, status, type, userId, role);
    }

    [HttpGet("{id}")]
    public async Task<ApiResult<BatchTaskDetailDto>> GetById(int id)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var role = (UserRole)Enum.Parse(typeof(UserRole), User.FindFirst(ClaimTypes.Role)?.Value ?? "StoreOperator");
        return await _batchTaskService.GetByIdAsync(id, userId, role);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ApiResult<BatchTaskDto>> Create([FromBody] CreateBatchTaskDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return await _batchTaskService.CreateAsync(dto, userId, ipAddress);
    }

    [HttpPost("{id}/cancel")]
    public async Task<ApiResult> Cancel(int id)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return await _batchTaskService.CancelAsync(id, userId, ipAddress);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ApiResult<List<NotificationDto>>> GetList([FromQuery] bool? isRead = null, [FromQuery] int count = 50)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        return await _notificationService.GetUserNotificationsAsync(userId, isRead, count);
    }

    [HttpGet("unread-count")]
    public async Task<ApiResult<int>> GetUnreadCount()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        return await _notificationService.GetUnreadCountAsync(userId);
    }

    [HttpPost("{id}/read")]
    public async Task<ApiResult> MarkAsRead(int id)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        return await _notificationService.MarkAsReadAsync(id, userId);
    }

    [HttpPost("read-all")]
    public async Task<ApiResult> MarkAllAsRead()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        return await _notificationService.MarkAllAsReadAsync(userId);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;

    public AuditLogsController(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<ApiResult<PagedResultDto<AuditLogDto>>> GetList([FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] int? userId = null, [FromQuery] string? entityType = null,
        [FromQuery] AuditActionType? actionType = null, [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        return await _auditLogService.GetListAsync(page, pageSize, userId, entityType, actionType, startDate, endDate);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VulnerabilitiesController : ControllerBase
{
    private readonly IVulnerabilityService _vulnerabilityService;

    public VulnerabilitiesController(IVulnerabilityService vulnerabilityService)
    {
        _vulnerabilityService = vulnerabilityService;
    }

    [HttpGet]
    public async Task<ApiResult<PagedResultDto<VulnerabilityDto>>> GetList([FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] AlertPriority? severity = null, [FromQuery] bool? isOverdue = null,
        [FromQuery] int? assetId = null, [FromQuery] string? keyword = null)
    {
        return await _vulnerabilityService.GetListAsync(page, pageSize, severity, isOverdue, assetId, keyword);
    }

    [HttpGet("{id}")]
    public async Task<ApiResult<VulnerabilityDto>> GetById(int id)
    {
        return await _vulnerabilityService.GetByIdAsync(id);
    }

    [HttpPost("{id}/extend")]
    [Authorize(Roles = "Admin")]
    public async Task<ApiResult<VulnerabilityDto>> ExtendDueDate(int id, [FromBody] ExtendVulnerabilityDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return await _vulnerabilityService.ExtendDueDateAsync(id, dto, userId, ipAddress);
    }

    [HttpPost("{id}/resolve")]
    public async Task<ApiResult<VulnerabilityDto>> Resolve(int id, [FromBody] string remark)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return await _vulnerabilityService.ResolveAsync(id, remark, userId, ipAddress);
    }
}
