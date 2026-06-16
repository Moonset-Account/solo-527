
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;

    public AppointmentsController(IAppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResultDto<PagedResultDto<AppointmentDto>>>> GetList([FromQuery] AppointmentQueryDto query)
    {
        var result = await _appointmentService.GetListAsync(query);
        return Ok(new ApiResultDto<PagedResultDto<AppointmentDto>>
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResultDto<AppointmentDto>>> GetById(int id, [FromQuery] bool includeDetails = false)
    {
        var appointment = await _appointmentService.GetByIdAsync(id, includeDetails);
        if (appointment == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "预约不存在" });

        return Ok(new ApiResultDto<AppointmentDto>
        {
            Success = true,
            Code = 200,
            Data = appointment
        });
    }

    [HttpPost]
    public async Task<ActionResult<ApiResultDto<AppointmentDto>>> Create(AppointmentCreateDto dto)
    {
        var result = await _appointmentService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, new ApiResultDto<AppointmentDto>
        {
            Success = true,
            Code = 201,
            Data = result
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResultDto<AppointmentDto>>> Update(int id, AppointmentUpdateDto dto)
    {
        var result = await _appointmentService.UpdateAsync(id, dto);
        if (result == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "预约不存在" });

        return Ok(new ApiResultDto<AppointmentDto>
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResultDto>> Delete(int id)
    {
        var result = await _appointmentService.DeleteAsync(id);
        if (!result)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "预约不存在" });

        return Ok(new ApiResultDto { Success = true, Code = 200, Message = "取消成功" });
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<ApiResultDto>> UpdateStatus(int id, [FromBody] int status)
    {
        var result = await _appointmentService.UpdateStatusAsync(id, status);
        if (!result)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "预约不存在" });

        return Ok(new ApiResultDto { Success = true, Code = 200, Message = "状态更新成功" });
    }
}
