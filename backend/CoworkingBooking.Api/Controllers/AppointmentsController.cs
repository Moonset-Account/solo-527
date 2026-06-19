using CoworkingBooking.Application.Common;
using CoworkingBooking.Application.DTOs.Appointment;
using CoworkingBooking.Application.Interfaces;
using CoworkingBooking.Domain.Enums;
using CoworkingBooking.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CoworkingBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;
    private readonly CurrentUserService _currentUser;

    public AppointmentsController(IAppointmentService appointmentService, CurrentUserService currentUser)
    {
        _appointmentService = appointmentService;
        _currentUser = currentUser;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<PagedResult<AppointmentDto>>>> GetList([FromQuery] AppointmentQuery query)
    {
        if (_currentUser.Role == UserRole.Consultant)
        {
            query.ConsultantId = _currentUser.UserId;
        }
        var result = await _appointmentService.GetListAsync(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<AppointmentDto>>> GetById(Guid id)
    {
        var result = await _appointmentService.GetByIdAsync(id);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AppointmentDto>>> Create([FromBody] CreateAppointmentRequest request)
    {
        var result = await _appointmentService.CreateAsync(request, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(result);
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id}/assign")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.ConsultantManager))]
    public async Task<ActionResult<ApiResponse>> AssignConsultant(Guid id, [FromBody] AssignConsultantRequest request)
    {
        var result = await _appointmentService.AssignConsultantAsync(id, request, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{id}/status")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> UpdateStatus(Guid id, [FromBody] UpdateAppointmentStatusRequest request)
    {
        var result = await _appointmentService.UpdateStatusAsync(id, request, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id}/followups")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.Consultant) + "," + nameof(UserRole.ConsultantManager))]
    public async Task<ActionResult<ApiResponse>> AddFollowUp(Guid id, [FromBody] AddFollowUpRequest request)
    {
        var result = await _appointmentService.AddFollowUpAsync(id, request, _currentUser.UserId!.Value);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{id}/noshow")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.ConsultantManager) + "," + nameof(UserRole.Consultant))]
    public async Task<ActionResult<ApiResponse>> MarkAsNoShow(Guid id, [FromQuery] string? reason)
    {
        var result = await _appointmentService.MarkAsNoShowAsync(id, reason, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("noshow")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.LandlordManager) + "," + nameof(UserRole.ConsultantManager))]
    public async Task<ActionResult<ApiResponse<PagedResult<NoShowRecordDto>>>> GetNoShowList([FromQuery] NoShowQuery query)
    {
        var result = await _appointmentService.GetNoShowListAsync(query);
        return Ok(result);
    }

    [HttpGet("noshow/{id}")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.LandlordManager) + "," + nameof(UserRole.ConsultantManager))]
    public async Task<ActionResult<ApiResponse<NoShowRecordDto>>> GetNoShowById(Guid id)
    {
        var result = await _appointmentService.GetNoShowByIdAsync(id);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    [HttpPut("noshow/{id}/handle")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.LandlordManager))]
    public async Task<ActionResult<ApiResponse>> HandleNoShow(Guid id, [FromBody] HandleNoShowRequest request)
    {
        var result = await _appointmentService.HandleNoShowAsync(id, request, _currentUser.UserId!.Value);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("export")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.ConsultantManager) + "," + nameof(UserRole.Finance))]
    public async Task<IActionResult> Export([FromQuery] AppointmentQuery query)
    {
        var result = await _appointmentService.ExportAppointmentsAsync(query);
        if (!result.Success)
            return BadRequest(result);

        return File(result.Data!, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"appointments_{DateTime.Now:yyyyMMdd}.xlsx");
    }
}
