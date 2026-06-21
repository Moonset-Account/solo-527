using Counseling.Application.DTOs;
using Counseling.Application.Interfaces;
using Counseling.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Counseling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;

    public AppointmentsController(IAppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<AppointmentDto>>> GetById(int id)
    {
        var result = await _appointmentService.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(new ApiResponse<AppointmentDto>
            {
                Success = false,
                Message = $"找不到ID为 {id} 的预约记录，请检查预约ID是否正确",
                Code = 404
            });
        }
        return Ok(new ApiResponse<AppointmentDto>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("no/{appointmentNo}")]
    public async Task<ActionResult<ApiResponse<AppointmentDto>>> GetByNo(string appointmentNo)
    {
        var result = await _appointmentService.GetByAppointmentNoAsync(appointmentNo);
        if (result == null)
        {
            return NotFound(new ApiResponse<AppointmentDto>
            {
                Success = false,
                Message = $"找不到预约号 '{appointmentNo}' 对应的预约记录，请检查预约号是否正确",
                Code = 404
            });
        }
        return Ok(new ApiResponse<AppointmentDto>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("client/{clientId}")]
    public async Task<ActionResult<ApiResponse<List<AppointmentDto>>>> GetByClient(int clientId)
    {
        var result = await _appointmentService.GetByClientIdAsync(clientId);
        return Ok(new ApiResponse<List<AppointmentDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("counselor/{counselorId}")]
    public async Task<ActionResult<ApiResponse<List<AppointmentDto>>>> GetByCounselor(int counselorId, [FromQuery] DateTime? date)
    {
        var queryDate = date ?? DateTime.Today;
        var result = await _appointmentService.GetByCounselorIdAsync(counselorId, queryDate);
        return Ok(new ApiResponse<List<AppointmentDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<PagedResult<AppointmentDto>>>> GetPaged(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? clientId = null,
        [FromQuery] int? counselorId = null,
        [FromQuery] int? serviceItemId = null,
        [FromQuery] AppointmentStatus? status = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string? keyword = null)
    {
        var queryParams = new AppointmentQueryParams
        {
            PageIndex = pageIndex,
            PageSize = pageSize,
            ClientId = clientId,
            CounselorId = counselorId,
            ServiceItemId = serviceItemId,
            Status = status,
            StartDate = startDate,
            EndDate = endDate,
            Keyword = keyword
        };
        var result = await _appointmentService.GetPagedAsync(queryParams);
        return Ok(new ApiResponse<PagedResult<AppointmentDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<AppointmentDto>>> Create([FromBody] AppointmentCreateDto dto)
    {
        if (dto.ClientId <= 0)
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "请选择来访者，客户ID不能为空",
                Code = 400
            });

        if (dto.CounselorId <= 0)
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "请选择咨询师，咨询师ID不能为空",
                Code = 400
            });

        if (dto.ServiceItemId <= 0)
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "请选择服务项目，服务项目ID不能为空",
                Code = 400
            });

        if (string.IsNullOrWhiteSpace(dto.Reason))
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "请填写咨询原因，这有助于咨询师提前了解您的情况",
                Code = 400
            });

        var result = await _appointmentService.CreateAsync(dto, "system");
        return Ok(new ApiResponse<AppointmentDto>
        {
            Success = true,
            Message = $"预约成功！您的预约号是 {result.AppointmentNo}，请准时到店",
            Code = 200,
            Data = result
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse>> Update(int id, [FromBody] AppointmentUpdateDto dto)
    {
        await _appointmentService.UpdateAsync(id, dto, "system");
        return Ok(new ApiResponse
        {
            Success = true,
            Message = "预约信息已更新成功",
            Code = 200
        });
    }

    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<ApiResponse>> Cancel(int id, [FromBody] string? reason)
    {
        await _appointmentService.CancelAsync(id, "system", reason);
        return Ok(new ApiResponse
        {
            Success = true,
            Message = "预约已取消成功。如需重新预约，请选择其他时间",
            Code = 200
        });
    }

    [HttpGet("check-availability")]
    public async Task<ActionResult<ApiResponse<bool>>> CheckAvailability(
        [FromQuery] int counselorId,
        [FromQuery] DateTime date,
        [FromQuery] TimeSpan startTime,
        [FromQuery] int durationMinutes = 60)
    {
        var endTime = startTime.Add(TimeSpan.FromMinutes(durationMinutes));
        var available = await _appointmentService.IsTimeSlotAvailableAsync(counselorId, date, startTime, endTime);
        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Message = available ? "该时段可以预约" : "该时段已被占用，请选择其他时间",
            Code = 200,
            Data = available
        });
    }
}
