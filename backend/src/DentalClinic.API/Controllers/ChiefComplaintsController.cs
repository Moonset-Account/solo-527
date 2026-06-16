
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChiefComplaintsController : ControllerBase
{
    private readonly IChiefComplaintService _chiefComplaintService;

    public ChiefComplaintsController(IChiefComplaintService chiefComplaintService)
    {
        _chiefComplaintService = chiefComplaintService;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResultDto<ChiefComplaintDto>>> GetById(int id)
    {
        var complaint = await _chiefComplaintService.GetByIdAsync(id);
        if (complaint == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "主诉记录不存在" });

        return Ok(new ApiResultDto<ChiefComplaintDto>
        {
            Success = true,
            Code = 200,
            Data = complaint
        });
    }

    [HttpPost]
    public async Task<ActionResult<ApiResultDto<ChiefComplaintDto>>> Create(ChiefComplaintCreateDto dto)
    {
        var result = await _chiefComplaintService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, new ApiResultDto<ChiefComplaintDto>
        {
            Success = true,
            Code = 201,
            Data = result
        });
    }

    [HttpGet("patient/{patientId}")]
    public async Task<ActionResult<ApiResultDto<List<ChiefComplaintDto>>>> GetByPatientId(int patientId)
    {
        var result = await _chiefComplaintService.GetByPatientIdAsync(patientId);
        return Ok(new ApiResultDto<List<ChiefComplaintDto>>
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("patient/{patientId}/latest")]
    public async Task<ActionResult<ApiResultDto<ChiefComplaintDto>>> GetLatestByPatientId(int patientId)
    {
        var result = await _chiefComplaintService.GetLatestByPatientIdAsync(patientId);
        if (result == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "暂无主诉记录" });

        return Ok(new ApiResultDto<ChiefComplaintDto>
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }
}
