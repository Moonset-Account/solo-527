using Microsoft.AspNetCore.Mvc;
using QualityControl.API.DTOs;
using QualityControl.API.Services;

namespace QualityControl.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SessionsController : ControllerBase
{
    private readonly ISessionService _sessionService;

    public SessionsController(ISessionService sessionService)
    {
        _sessionService = sessionService;
    }

    [HttpGet]
    public async Task<ApiResponse<PagedResult<SessionDTO>>> GetSessions([FromQuery] SessionQueryDTO query)
    {
        var result = await _sessionService.GetSessionsAsync(query);
        return ApiResponse<PagedResult<SessionDTO>>.Ok(result, "获取会话列表成功");
    }

    [HttpGet("{id}")]
    public async Task<ApiResponse<SessionDTO>> GetSession(int id)
    {
        var session = await _sessionService.GetSessionByIdAsync(id);
        if (session == null)
        {
            return ApiResponse<SessionDTO>.Fail("会话不存在", 404, new ErrorDetails
            {
                ErrorCode = "SESSION_NOT_FOUND",
                ErrorMessage = "会话不存在或已被删除",
                NextStep = "请检查会话ID是否正确，或返回列表页重新选择。",
                DetailedDescription = "请求的会话ID在系统中不存在。",
                SupportUrl = "/help/sessions"
            });
        }
        return ApiResponse<SessionDTO>.Ok(session!, "获取会话详情成功");
    }

    [HttpPost]
    public async Task<ApiResponse<SessionDTO>> CreateSession([FromBody] CreateSessionDTO dto)
    {
        if (dto.CustomerId <= 0 || dto.AgentId <= 0 || string.IsNullOrWhiteSpace(dto.Title))
        {
            return ApiResponse<SessionDTO>.Fail("缺少必要参数", 400, new ErrorDetails
            {
                ErrorCode = "INVALID_PARAMS",
                ErrorMessage = "创建会话缺少必要参数",
                NextStep = "请确保填写了客户ID、客服ID和会话标题后重试。",
                DetailedDescription = "创建会话需要提供客户ID、客服ID和标题等必要信息。"
            });
        }

        var session = await _sessionService.CreateSessionAsync(dto);
        return ApiResponse<SessionDTO>.Ok(session, "会话创建成功");
    }

    [HttpPost("message")]
    public async Task<ApiResponse<SessionDTO>> AddMessage([FromBody] AddMessageDTO dto)
    {
        if (dto.SessionId <= 0 || string.IsNullOrWhiteSpace(dto.Content))
        {
            return ApiResponse<SessionDTO>.Fail("缺少必要参数", 400, new ErrorDetails
            {
                ErrorCode = "INVALID_PARAMS",
                ErrorMessage = "添加消息缺少必要参数",
                NextStep = "请确保填写了会话ID和消息内容后重试。",
                DetailedDescription = "添加消息需要提供会话ID和消息内容。"
            });
        }

        var session = await _sessionService.AddMessageAsync(dto);
        if (session == null)
        {
            return ApiResponse<SessionDTO>.Fail("会话不存在", 404, new ErrorDetails
            {
                ErrorCode = "SESSION_NOT_FOUND",
                ErrorMessage = "会话不存在，无法添加消息",
                NextStep = "请检查会话ID是否正确，或返回列表页重新选择。",
                DetailedDescription = "目标会话在系统中不存在，无法添加消息。"
            });
        }
        return ApiResponse<SessionDTO>.Ok(session!, "消息添加成功");
    }

    [HttpGet("statistics")]
    public async Task<ApiResponse<SessionStatisticsDTO>> GetStatistics([FromQuery] int? agentId, [FromQuery] int? departmentId)
    {
        var stats = await _sessionService.GetStatisticsAsync(agentId, departmentId);
        return ApiResponse<SessionStatisticsDTO>.Ok(stats, "获取统计数据成功");
    }

    [HttpPost("random-inspection")]
    public async Task<ApiResponse<List<SessionDTO>>> GetRandomForInspection([FromBody] RandomInspectionDTO dto)
    {
        if (dto.Count <= 0 || dto.Count > 100)
        {
            dto.Count = 5;
        }

        var sessions = await _sessionService.GetRandomSessionsForInspectionAsync(dto);
        return ApiResponse<List<SessionDTO>>.Ok(sessions, "获取抽检会话成功");
    }

    [HttpPost("export")]
    public async Task<IActionResult> ExportSessions([FromBody] ExportSessionDTO dto)
    {
        var data = await _sessionService.ExportSessionsAsync(dto);
        var fileName = $"sessions_{DateTime.Now:yyyyMMddHHmmss}.csv";
        return File(data, "text/csv", fileName);
    }
}
