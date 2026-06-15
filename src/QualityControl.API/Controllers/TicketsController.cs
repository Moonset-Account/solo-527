using Microsoft.AspNetCore.Mvc;
using QualityControl.API.DTOs;
using QualityControl.API.Services;

namespace QualityControl.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    [HttpGet]
    public async Task<ApiResponse<PagedResult<TicketDTO>>> GetTickets([FromQuery] TicketQueryDTO query)
    {
        var result = await _ticketService.GetTicketsAsync(query);
        return ApiResponse<PagedResult<TicketDTO>>.Ok(result, "获取工单列表成功");
    }

    [HttpGet("{id}")]
    public async Task<ApiResponse<TicketDTO>> GetTicket(int id)
    {
        var ticket = await _ticketService.GetTicketByIdAsync(id);
        if (ticket == null)
        {
            return ApiResponse<TicketDTO>.Fail("工单不存在", 404, new ErrorDetails
            {
                ErrorCode = "TICKET_NOT_FOUND",
                ErrorMessage = "工单不存在或已被删除",
                NextStep = "请检查工单ID是否正确，或返回列表页重新选择。",
                DetailedDescription = "请求的工单ID在系统中不存在。",
                SupportUrl = "/help/tickets"
            });
        }
        return ApiResponse<TicketDTO>.Ok(ticket!, "获取工单详情成功");
    }

    [HttpPost]
    public async Task<ApiResponse<TicketDTO>> CreateTicket([FromBody] CreateTicketDTO dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Description) || dto.AssigneeDepartmentId <= 0)
        {
            return ApiResponse<TicketDTO>.Fail("缺少必要参数", 400, new ErrorDetails
            {
                ErrorCode = "INVALID_PARAMS",
                ErrorMessage = "创建工单缺少必要参数",
                NextStep = "请确保填写了标题、描述，并选择了处理部门后重试。",
                DetailedDescription = "创建工单需要提供标题、描述和处理部门等必要信息。"
            });
        }

        var ticket = await _ticketService.CreateTicketAsync(dto);
        return ApiResponse<TicketDTO>.Ok(ticket, "工单创建成功");
    }

    [HttpPost("status")]
    public async Task<ApiResponse<TicketDTO>> UpdateStatus([FromBody] UpdateTicketStatusDTO dto)
    {
        if (dto.Id <= 0 || dto.OperatorId <= 0)
        {
            return ApiResponse<TicketDTO>.Fail("缺少必要参数", 400, new ErrorDetails
            {
                ErrorCode = "INVALID_PARAMS",
                ErrorMessage = "更新工单状态缺少必要参数",
                NextStep = "请确保提供了工单ID和操作人ID后重试。",
                DetailedDescription = "更新工单状态需要提供工单ID和操作人ID。"
            });
        }

        var ticket = await _ticketService.UpdateTicketStatusAsync(dto);
        if (ticket == null)
        {
            return ApiResponse<TicketDTO>.Fail("工单不存在", 404, new ErrorDetails
            {
                ErrorCode = "TICKET_NOT_FOUND",
                ErrorMessage = "工单不存在，无法更新状态",
                NextStep = "请检查工单ID是否正确，或返回列表页重新选择。",
                DetailedDescription = "要更新的工单在系统中不存在。"
            });
        }
        return ApiResponse<TicketDTO>.Ok(ticket!, "工单状态更新成功");
    }

    [HttpPost("comment")]
    public async Task<ApiResponse<TicketCommentDTO>> AddComment([FromBody] AddTicketCommentDTO dto)
    {
        if (dto.TicketId <= 0 || dto.CommenterId <= 0 || string.IsNullOrWhiteSpace(dto.Content))
        {
            return ApiResponse<TicketCommentDTO>.Fail("缺少必要参数", 400, new ErrorDetails
            {
                ErrorCode = "INVALID_PARAMS",
                ErrorMessage = "添加工单评论缺少必要参数",
                NextStep = "请确保填写了评论内容，并选择了评论人后重试。",
                DetailedDescription = "添加工单评论需要提供工单ID、评论人ID和评论内容。"
            });
        }

        var comment = await _ticketService.AddCommentAsync(dto);
        return ApiResponse<TicketCommentDTO>.Ok(comment, "评论添加成功");
    }

    [HttpGet("{ticketId}/comments")]
    public async Task<ApiResponse<List<TicketCommentDTO>>> GetComments(int ticketId)
    {
        var comments = await _ticketService.GetTicketCommentsAsync(ticketId);
        return ApiResponse<List<TicketCommentDTO>>.Ok(comments, "获取评论列表成功");
    }

    [HttpGet("pending-count")]
    public async Task<ApiResponse<int>> GetPendingCount([FromQuery] int? departmentId)
    {
        var count = await _ticketService.GetPendingTicketCountAsync(departmentId);
        return ApiResponse<int>.Ok(count, "获取待处理工单数成功");
    }
}
