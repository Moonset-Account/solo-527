using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProcessScheduling.Application.DTOs;
using ProcessScheduling.Application.Interfaces;

namespace ProcessScheduling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProcessStepController : ControllerBase
{
    private readonly IProcessStepService _processStepService;

    public ProcessStepController(IProcessStepService processStepService)
    {
        _processStepService = processStepService;
    }

    [HttpGet("qrcode/{qrCode}")]
    public async Task<ActionResult<ProcessStepInstanceDto>> GetByQrCode(string qrCode)
    {
        var instance = await _processStepService.GetByQrCodeAsync(qrCode);
        if (instance == null)
            return NotFound();
        return Ok(instance);
    }

    [HttpGet("workorder/{workOrderId}")]
    public async Task<ActionResult<IEnumerable<ProcessStepInstanceDto>>> GetByWorkOrder(Guid workOrderId)
    {
        var instances = await _processStepService.GetByWorkOrderAsync(workOrderId);
        return Ok(instances);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProcessStepInstanceDto>> GetById(Guid id)
    {
        var instance = await _processStepService.GetByIdAsync(id);
        if (instance == null)
            return NotFound();
        return Ok(instance);
    }

    [HttpPost("scan/start")]
    public async Task<ActionResult<ProcessStepInstanceDto>> ScanStart([FromBody] ScanCodeRequestDto request)
    {
        try
        {
            var result = await _processStepService.ScanStartAsync(request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("scan/complete")]
    public async Task<ActionResult<ProcessStepInstanceDto>> ScanComplete([FromBody] ScanCompleteRequestDto request)
    {
        try
        {
            var result = await _processStepService.ScanCompleteAsync(
                request.QrCode,
                request.OutputQuantity,
                request.DefectiveQuantity,
                request.Remark);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("abnormal")]
    public async Task<ActionResult<ProcessStepInstanceDto>> ReportAbnormal([FromBody] ReportAbnormalDto dto)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null)
            return Unauthorized();

        try
        {
            var result = await _processStepService.ReportAbnormalAsync(dto.QrCode, dto.Reason, Guid.Parse(userIdClaim));
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

public class ScanCompleteRequestDto
{
    public string QrCode { get; set; } = string.Empty;
    public int OutputQuantity { get; set; }
    public int DefectiveQuantity { get; set; }
    public string? Remark { get; set; }
}

public class ReportAbnormalDto
{
    public string QrCode { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}
