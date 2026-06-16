
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeeItemsController : ControllerBase
{
    private readonly IFeeItemService _feeItemService;

    public FeeItemsController(IFeeItemService feeItemService)
    {
        _feeItemService = feeItemService;
    }

    [HttpGet("appointment/{appointmentId}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;List&lt;FeeItemDto&gt;&gt;&gt;&gt; GetByAppointmentId(int appointmentId)
    {
        var result = await _feeItemService.GetByAppointmentIdAsync(appointmentId);
        return Ok(new ApiResultDto&lt;List&lt;FeeItemDto&gt;&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpPost]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;FeeItemDto&gt;&gt;&gt; Create(FeeItemCreateDto dto)
    {
        var result = await _feeItemService.CreateAsync(dto);
        return Ok(new ApiResultDto&lt;FeeItemDto&gt;
        {
            Success = true,
            Code = 201,
            Data = result
        });
    }

    [HttpPatch("{id}/status")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;FeeItemDto&gt;&gt;&gt; UpdateStatus(int id, [FromBody] int status)
    {
        var result = await _feeItemService.UpdateStatusAsync(id, status);
        if (result == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "收费项目不存在" });

        return Ok(new ApiResultDto&lt;FeeItemDto&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("appointment/{appointmentId}/total")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;decimal&gt;&gt;&gt; GetTotalAmount(int appointmentId)
    {
        var result = await _feeItemService.GetTotalAmountByAppointmentIdAsync(appointmentId);
        return Ok(new ApiResultDto&lt;decimal&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }
}
