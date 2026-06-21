using Counseling.Application.DTOs;
using Counseling.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Counseling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WaitlistController : ControllerBase
{
    private readonly IWaitlistService _waitlistService;

    public WaitlistController(IWaitlistService waitlistService)
    {
        _waitlistService = waitlistService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<WaitlistItemDto>>>> GetByService([FromQuery] int serviceItemId)
    {
        var result = await _waitlistService.GetActiveByServiceItemIdAsync(serviceItemId);
        return Ok(new ApiResponse<List<WaitlistItemDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("date")]
    public async Task<ActionResult<ApiResponse<List<WaitlistItemDto>>>> GetByDate([FromQuery] DateTime? date)
    {
        var queryDate = date ?? DateTime.Today;
        var result = await _waitlistService.GetActiveByDateAsync(queryDate);
        return Ok(new ApiResponse<List<WaitlistItemDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("client/{clientId}")]
    public async Task<ActionResult<ApiResponse<List<WaitlistItemDto>>>> GetByClient(int clientId)
    {
        var result = await _waitlistService.GetByClientIdAsync(clientId);
        return Ok(new ApiResponse<List<WaitlistItemDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<WaitlistItemDto>>> GetById(int id)
    {
        var result = await _waitlistService.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(new ApiResponse<WaitlistItemDto>
            {
                Success = false,
                Message = $"找不到ID为 {id} 的候补记录",
                Code = 404
            });
        }
        return Ok(new ApiResponse<WaitlistItemDto>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<WaitlistItemDto>>> Create([FromBody] WaitlistCreateDto dto)
    {
        if (dto.ClientId <= 0)
            return BadRequest(new ApiResponse<WaitlistItemDto>
            {
                Success = false,
                Message = "请选择来访者，客户ID不能为空",
                Code = 400
            });

        if (dto.ServiceItemId <= 0)
            return BadRequest(new ApiResponse<WaitlistItemDto>
            {
                Success = false,
                Message = "请选择服务项目",
                Code = 400
            });

        if (string.IsNullOrWhiteSpace(dto.Reason))
            return BadRequest(new ApiResponse<WaitlistItemDto>>
            {
                Success = false,
                Message = "请填写加入候补的原因，方便我们优先安排",
                Code = 400
            });

        var result = await _waitlistService.CreateAsync(dto, "system");
        return Ok(new ApiResponse<WaitlistItemDto>>
        {
            Success = true,
            Message = "已成功加入候补队列，有空位时我们会第一时间通知您",
            Code = 200,
            Data = result
        });
    }

    [HttpPost("{id}/notify")]
    public async Task<ActionResult<ApiResponse>> MarkNotified(int id)
    {
        await _waitlistService.MarkNotifiedAsync(id, "system");
        return Ok(new ApiResponse
        {
            Success = true,
            Message = "已发送候补通知，系统会自动提醒来访者",
            Code = 200
        });
    }

    [HttpPost("{id}/deactivate")]
    public async Task<ActionResult<ApiResponse>> Deactivate(int id)
    {
        await _waitlistService.DeactivateAsync(id, "system");
        return Ok(new ApiResponse
        {
            Success = true,
            Message = "候补记录已失效",
            Code = 200
        });
    }
}
