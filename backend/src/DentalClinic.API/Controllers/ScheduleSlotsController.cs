
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
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;List&lt;ScheduleSlotDto&gt;&gt;&gt;&gt; GetList([FromQuery] ScheduleSlotQueryDto query)
    {
        var result = await _scheduleSlotService.GetListAsync(query);
        return Ok(new ApiResultDto&lt;List&lt;ScheduleSlotDto&gt;&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("{id}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;ScheduleSlotDto&gt;&gt;&gt; GetById(int id)
    {
        var slot = await _scheduleSlotService.GetByIdAsync(id);
        if (slot == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "号源不存在" });

        return Ok(new ApiResultDto&lt;ScheduleSlotDto&gt;
        {
            Success = true,
            Code = 200,
            Data = slot
        });
    }

    [HttpPost]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;ScheduleSlotDto&gt;&gt;&gt; Create(ScheduleSlotCreateDto dto)
    {
        var result = await _scheduleSlotService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, new ApiResultDto&lt;ScheduleSlotDto&gt;
        {
            Success = true,
            Code = 201,
            Data = result
        });
    }

    [HttpDelete("{id}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&gt;&gt; Delete(int id)
    {
        var result = await _scheduleSlotService.DeleteAsync(id);
        if (!result)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "号源不存在" });

        return Ok(new ApiResultDto { Success = true, Code = 200, Message = "关闭成功" });
    }

    [HttpGet("available/{doctorId}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;List&lt;ScheduleSlotDto&gt;&gt;&gt;&gt; GetAvailableSlots(int doctorId, [FromQuery] DateTime date)
    {
        var result = await _scheduleSlotService.GetAvailableSlotsAsync(doctorId, date);
        return Ok(new ApiResultDto&lt;List&lt;ScheduleSlotDto&gt;&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("range")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;List&lt;ScheduleSlotDto&gt;&gt;&gt;&gt; GetSlotsByDateRange(
        [FromQuery] int? clinicId, 
        [FromQuery] int? doctorId, 
        [FromQuery] DateTime startDate, 
        [FromQuery] DateTime endDate)
    {
        var result = await _scheduleSlotService.GetSlotsByDateRangeAsync(clinicId, doctorId, startDate, endDate);
        return Ok(new ApiResultDto&lt;List&lt;ScheduleSlotDto&gt;&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }
}
