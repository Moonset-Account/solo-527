
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScheduleSlotsController : ControllerBase
{
    private readonly IScheduleSlotService _scheduleSlotService;

    public ScheduleSlotsController(IScheduleSlotService scheduleSlotService)
    {
        _scheduleSlotService = scheduleSlotService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResultDto<List<ScheduleSlotDto>>>> GetList([FromQuery] ScheduleSlotQueryDto query)
    {
        var result = await _scheduleSlotService.GetListAsync(query);
        return Ok(new ApiResultDto<List<ScheduleSlotDto>>
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResultDto<ScheduleSlotDto>>> GetById(int id)
    {
        var slot = await _scheduleSlotService.GetByIdAsync(id);
        if (slot == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "号源不存在" });

        return Ok(new ApiResultDto<ScheduleSlotDto>
        {
            Success = true,
            Code = 200,
            Data = slot
        });
    }

    [HttpPost]
    public async Task<ActionResult<ApiResultDto<ScheduleSlotDto>>> Create(ScheduleSlotCreateDto dto)
    {
        var result = await _scheduleSlotService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, new ApiResultDto<ScheduleSlotDto>
        {
            Success = true,
            Code = 201,
            Data = result
        });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResultDto>> Delete(int id)
    {
        var result = await _scheduleSlotService.DeleteAsync(id);
        if (!result)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "号源不存在" });

        return Ok(new ApiResultDto { Success = true, Code = 200, Message = "关闭成功" });
    }

    [HttpGet("available/{doctorId}")]
    public async Task<ActionResult<ApiResultDto<List<ScheduleSlotDto>>>> GetAvailableSlots(int doctorId, [FromQuery] DateTime date)
    {
        var result = await _scheduleSlotService.GetAvailableSlotsAsync(doctorId, date);
        return Ok(new ApiResultDto<List<ScheduleSlotDto>>
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("range")]
    public async Task<ActionResult<ApiResultDto<List<ScheduleSlotDto>>>> GetSlotsByDateRange(
        [FromQuery] int? clinicId, 
        [FromQuery] int? doctorId, 
        [FromQuery] DateTime startDate, 
        [FromQuery] DateTime endDate)
    {
        var result = await _scheduleSlotService.GetSlotsByDateRangeAsync(clinicId, doctorId, startDate, endDate);
        return Ok(new ApiResultDto<List<ScheduleSlotDto>>
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }
}
