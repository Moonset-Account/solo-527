
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PrescriptionsController : ControllerBase
{
    private readonly IPrescriptionService _prescriptionService;

    public PrescriptionsController(IPrescriptionService prescriptionService)
    {
        _prescriptionService = prescriptionService;
    }

    [HttpGet("{id}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;PrescriptionDto&gt;&gt;&gt; GetById(int id)
    {
        var prescription = await _prescriptionService.GetByIdAsync(id);
        if (prescription == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "处方不存在" });

        return Ok(new ApiResultDto&lt;PrescriptionDto&gt;
        {
            Success = true,
            Code = 200,
            Data = prescription
        });
    }

    [HttpPost]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;PrescriptionDto&gt;&gt;&gt; Create(PrescriptionCreateDto dto)
    {
        var result = await _prescriptionService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, new ApiResultDto&lt;PrescriptionDto&gt;
        {
            Success = true,
            Code = 201,
            Data = result
        });
    }

    [HttpGet("patient/{patientId}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;List&lt;PrescriptionDto&gt;&gt;&gt;&gt; GetByPatientId(int patientId)
    {
        var result = await _prescriptionService.GetByPatientIdAsync(patientId);
        return Ok(new ApiResultDto&lt;List&lt;PrescriptionDto&gt;&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("appointment/{appointmentId}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;List&lt;PrescriptionDto&gt;&gt;&gt;&gt; GetByAppointmentId(int appointmentId)
    {
        var result = await _prescriptionService.GetByAppointmentIdAsync(appointmentId);
        return Ok(new ApiResultDto&lt;List&lt;PrescriptionDto&gt;&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }
}
