using Counseling.Application.DTOs;
using Counseling.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Counseling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CheckInController : ControllerBase
{
    private readonly ICheckInService _checkInService;
    private readonly INoShowService _noShowService;

    public CheckInController(ICheckInService checkInService, INoShowService noShowService)
    {
        _checkInService = checkInService;
        _noShowService = noShowService;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CheckInRecordDto>>> CheckIn([FromBody] CheckInCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.AppointmentNo))
        {
            return BadRequest(new ApiResponse<CheckInRecordDto>
            {
                Success = false,
                Message = "请输入预约单号，这是核销的必要凭证",
                Code = 400
            });
        }

        var result = await _checkInService.CheckInAsync(dto, "system");
        return Ok(new ApiResponse<CheckInRecordDto>
        {
            Success = true,
            Message = "到店核销成功！请引导来访者到休息区等候",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<CheckInRecordDto>>> GetById(int id)
    {
        var result = await _checkInService.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(new ApiResponse<CheckInRecordDto>
            {
                Success = false,
                Message = $"找不到ID为 {id} 的核销记录",
                Code = 404
            });
        }
        return Ok(new ApiResponse<CheckInRecordDto>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("appointment/{appointmentId}")]
    public async Task<ActionResult<ApiResponse<CheckInRecordDto>>> GetByAppointment(int appointmentId)
    {
        var result = await _checkInService.GetByAppointmentIdAsync(appointmentId);
        if (result == null)
        {
            return NotFound(new ApiResponse<CheckInRecordDto>
            {
                Success = false,
                Message = "该预约暂无核销记录",
                Code = 404
            });
        }
        return Ok(new ApiResponse<CheckInRecordDto>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("by-date")]
    public async Task<ActionResult<ApiResponse<List<CheckInRecordDto>>>> GetByDate([FromQuery] DateTime? date)
    {
        var queryDate = date ?? DateTime.Today;
        var result = await _checkInService.GetByDateAsync(queryDate);
        return Ok(new ApiResponse<List<CheckInRecordDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpPost("{id}/confirm")]
    public async Task<ActionResult<ApiResponse>> Confirm(int id, [FromBody] CheckInConfirmDto dto)
    {
        await _checkInService.ConfirmAsync(id, dto, "system");
        var msg = dto.IsConfirmed ? "服务已确认完成，已同步到到店率统计" : "核销确认已取消";
        return Ok(new ApiResponse
        {
            Success = true,
            Message = msg,
            Code = 200
        });
    }

    [HttpPost("no-show")]
    public async Task<ActionResult<ApiResponse<NoShowRecordDto>>> MarkNoShow([FromBody] NoShowCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Reason))
        {
            return BadRequest(new ApiResponse<NoShowRecordDto>
            {
                Success = false,
                Message = "请填写爽约原因，这对后续服务改进和信用评估很重要",
                Code = 400
            });
        }

        var result = await _noShowService.CreateAsync(dto, "system");
        return Ok(new ApiResponse<NoShowRecordDto>
        {
            Success = true,
            Message = "已标记为爽约，系统会自动发送提醒通知来访者",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("no-show/{id}")]
    public async Task<ActionResult<ApiResponse<NoShowRecordDto>>> GetNoShowById(int id)
    {
        var result = await _noShowService.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(new ApiResponse<NoShowRecordDto>
            {
                Success = false,
                Message = $"找不到ID为 {id} 的爽约记录",
                Code = 404
            });
        }
        return Ok(new ApiResponse<NoShowRecordDto>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpPost("no-show/{id}/waive")]
    public async Task<ActionResult<ApiResponse>> WaiveNoShow(int id, [FromBody] NoShowWaiveDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.WaivedReason))
        {
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "请填写豁免原因，这是管理审核的必要信息",
                Code = 400
            });
        }

        await _noShowService.WaiveAsync(id, dto, "system");
        return Ok(new ApiResponse
        {
            Success = true,
            Message = "爽约记录已豁免，不会影响来访者的预约信用",
            Code = 200
        });
    }

    [HttpGet("no-show/client/{clientId}")]
    public async Task<ActionResult<ApiResponse<List<NoShowRecordDto>>>> GetNoShowsByClient(int clientId)
    {
        var result = await _noShowService.GetByClientIdAsync(clientId);
        return Ok(new ApiResponse<List<NoShowRecordDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }
}
