using Counseling.Application.DTOs;
using Counseling.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Counseling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RemindersController : ControllerBase
{
    private readonly IReminderService _reminderService;

    public RemindersController(IReminderService reminderService)
    {
        _reminderService = reminderService;
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<ApiResponse<List<ReminderDto>>>> GetByUser(int userId, [FromQuery] bool onlyUnread = false)
    {
        var result = await _reminderService.GetByUserIdAsync(userId, onlyUnread);
        return Ok(new ApiResponse<List<ReminderDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("user/{userId}/unread-count")]
    public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount(int userId)
    {
        var count = await _reminderService.GetUnreadCountAsync(userId);
        return Ok(new ApiResponse<int>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = count
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ReminderDto>>> GetById(int id)
    {
        var result = await _reminderService.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(new ApiResponse<ReminderDto>
            {
                Success = false,
                Message = $"找不到ID为 {id} 的提醒消息",
                Code = 404
            });
        }
        return Ok(new ApiResponse<ReminderDto>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpPost("{id}/read")]
    public async Task<ActionResult<ApiResponse>> MarkAsRead(int id)
    {
        await _reminderService.MarkAsReadAsync(id);
        return Ok(new ApiResponse
        {
            Success = true,
            Message = "已标记为已读",
            Code = 200
        });
    }

    [HttpPost("user/{userId}/read-all")]
    public async Task<ActionResult<ApiResponse>> MarkAllAsRead(int userId)
    {
        await _reminderService.MarkAllAsReadAsync(userId);
        return Ok(new ApiResponse
        {
            Success = true,
            Message = "所有消息已标记为已读",
            Code = 200
        });
    }

    [HttpPost("send-pending")]
    public async Task<ActionResult<ApiResponse>> SendPending()
    {
        await _reminderService.SendPendingRemindersAsync();
        return Ok(new ApiResponse
        {
            Success = true,
            Message = "待发送提醒已处理",
            Code = 200
        });
    }
}
