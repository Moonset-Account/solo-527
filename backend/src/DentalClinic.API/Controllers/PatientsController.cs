
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PatientsController : ControllerBase
{
    private readonly IPatientService _patientService;

    public PatientsController(IPatientService patientService)
    {
        _patientService = patientService;
    }

    [HttpGet]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;PagedResultDto&lt;PatientDto&gt;&gt;&gt; GetList([FromQuery] PatientQueryDto query)
    {
        var result = await _patientService.GetListAsync(query);
        return Ok(new ApiResultDto&lt;PagedResultDto&lt;PatientDto&gt;&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("{id}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;PatientDto&gt;&gt;&gt; GetById(int id)
    {
        var patient = await _patientService.GetByIdAsync(id);
        if (patient == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "患者不存在" });

        return Ok(new ApiResultDto&lt;PatientDto&gt;
        {
            Success = true,
            Code = 200,
            Data = patient
        });
    }

    [HttpPost]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;PatientDto&gt;&gt;&gt; Create(PatientCreateDto dto)
    {
        var result = await _patientService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, new ApiResultDto&lt;PatientDto&gt;
        {
            Success = true,
            Code = 201,
            Data = result
        });
    }

    [HttpPut("{id}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;PatientDto&gt;&gt;&gt; Update(int id, PatientUpdateDto dto)
    {
        var result = await _patientService.UpdateAsync(id, dto);
        if (result == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "患者不存在" });

        return Ok(new ApiResultDto&lt;PatientDto&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpDelete("{id}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&gt;&gt; Delete(int id)
    {
        var result = await _patientService.DeleteAsync(id);
        if (!result)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "患者不存在" });

        return Ok(new ApiResultDto { Success = true, Code = 200, Message = "删除成功" });
    }

    [HttpGet("phone/{phone}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;PatientDto&gt;&gt;&gt; GetByPhone(string phone)
    {
        var patient = await _patientService.GetByPhoneAsync(phone);
        if (patient == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "患者不存在" });

        return Ok(new ApiResultDto&lt;PatientDto&gt;
        {
            Success = true,
            Code = 200,
            Data = patient
        });
    }
}
